using System.Data;
using BankingSystem.Api.Data;
using BankingSystem.Api.Models.Integration;
using BankingSystem.Api.Options;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace BankingSystem.Api.Services;

public sealed class OutboxEmailDispatcher(
    IServiceScopeFactory serviceScopeFactory,
    IOptionsMonitor<EmailOptions> emailOptions,
    TimeProvider timeProvider,
    ILogger<OutboxEmailDispatcher> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var reportedDisabled = false;

        while (!stoppingToken.IsCancellationRequested)
        {
            var options = emailOptions.CurrentValue;
            if (!options.Enabled)
            {
                if (!reportedDisabled)
                {
                    logger.LogWarning(
                        "Email delivery is disabled. Pending OTP emails will remain in the outbox.");
                    reportedDisabled = true;
                }

                await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
                continue;
            }

            reportedDisabled = false;

            try
            {
                var foundMessage = await ProcessNextMessageAsync(stoppingToken);
                if (!foundMessage)
                {
                    await Task.Delay(
                        TimeSpan.FromSeconds(options.PollingIntervalSeconds),
                        stoppingToken);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "The email outbox dispatcher failed unexpectedly.");
                await Task.Delay(
                    TimeSpan.FromSeconds(options.PollingIntervalSeconds),
                    stoppingToken);
            }
        }
    }

    private async Task<bool> ProcessNextMessageAsync(CancellationToken cancellationToken)
    {
        using var scope = serviceScopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var emailSender = scope.ServiceProvider.GetRequiredService<IEmailSender>();
        var now = timeProvider.GetUtcNow().UtcDateTime;
        OutboxMessage? message;

        await using (var transaction = await context.Database.BeginTransactionAsync(
            IsolationLevel.ReadCommitted,
            cancellationToken))
        {
            var messages = await context.OutboxMessages
                .FromSqlInterpolated($$"""
                    SELECT TOP (1) *
                    FROM [Integration].[OutboxMessages] WITH (UPDLOCK, READPAST, ROWLOCK)
                    WHERE [ProcessedAtUtc] IS NULL
                      AND ([NextAttemptAtUtc] IS NULL OR [NextAttemptAtUtc] <= {{now}})
                      AND [EventType] IN
                          (N'EmailVerificationRequested',
                           N'BeneficiaryVerificationRequested',
                           N'RegistrationWelcomeRequested',
                           N'NewDeviceLoginDetected')
                    ORDER BY [OccurredAtUtc], [OutboxMessageId]
                    """)
                .ToListAsync(cancellationToken);

            message = messages.SingleOrDefault();
            if (message is null)
            {
                await transaction.CommitAsync(cancellationToken);
                return false;
            }

            message.AttemptCount += 1;
            message.NextAttemptAtUtc = now.AddMinutes(5);
            message.LastError = null;
            await context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }

        try
        {
            var emailMessage = EmailMessageFactory.Create(
                message.EventType,
                message.PayloadJson,
                now);
            if (emailMessage is not null)
            {
                await emailSender.SendAsync(emailMessage, cancellationToken);
            }
            else
            {
                logger.LogWarning(
                    "Skipped expired OTP email outbox message {OutboxMessageId}.",
                    message.OutboxMessageId);
            }

            message.ProcessedAtUtc = timeProvider.GetUtcNow().UtcDateTime;
            message.NextAttemptAtUtc = null;
            message.LastError = null;
            await context.SaveChangesAsync(cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            var retryDelayMinutes = Math.Min(
                Math.Pow(2, Math.Min(message.AttemptCount - 1, 6)),
                60);
            message.NextAttemptAtUtc = timeProvider
                .GetUtcNow()
                .UtcDateTime
                .AddMinutes(retryDelayMinutes);
            message.LastError = Truncate(exception.Message, 2000);
            await context.SaveChangesAsync(cancellationToken);

            logger.LogError(
                exception,
                "Failed to send email outbox message {OutboxMessageId}. Attempt {AttemptCount}; retry scheduled for {NextAttemptAtUtc}.",
                message.OutboxMessageId,
                message.AttemptCount,
                message.NextAttemptAtUtc);
        }

        return true;
    }

    private static string Truncate(string value, int maximumLength) =>
        value.Length <= maximumLength ? value : value[..maximumLength];
}
