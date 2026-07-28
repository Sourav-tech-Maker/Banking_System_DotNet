using System;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using BankingSystem.Api.Data;
using BankingSystem.Api.Models.Integration;
using Microsoft.EntityFrameworkCore;

namespace BankingSystem.Api.Services;

public static class TransferEmailHelper
{
    public static async Task QueueTransferNotificationsAsync(
        AppDbContext context,
        Guid fromAccountId,
        Guid toAccountId,
        decimal amount,
        string transactionRef,
        DateTime now,
        CancellationToken cancellationToken = default)
    {
        var fromAccount = await context.BankAccounts
            .Include(a => a.User)
            .FirstOrDefaultAsync(a => a.AccountId == fromAccountId, cancellationToken);

        var toAccount = await context.BankAccounts
            .Include(a => a.User)
            .FirstOrDefaultAsync(a => a.AccountId == toAccountId, cancellationToken);

        var fromBalanceView = await context.BankAccountBalanceViews
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.AccountId == fromAccountId, cancellationToken);

        var toBalanceView = await context.BankAccountBalanceViews
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.AccountId == toAccountId, cancellationToken);

        var fromBalance = fromBalanceView?.CurrentBalance ?? 0m;
        var toBalance = toBalanceView?.CurrentBalance ?? 0m;

        // Queue Sender Debit Email Notification
        if (fromAccount?.User != null && !string.IsNullOrWhiteSpace(fromAccount.User.Email))
        {
            var debitPayload = new
            {
                to = fromAccount.User.Email,
                username = fromAccount.User.UserName,
                accountNumber = fromAccount.AccountNumber.ToString(),
                amount = amount,
                recipientAccount = toAccount != null ? toAccount.AccountNumber.ToString() : "External Account",
                recipientName = toAccount?.User?.UserName ?? "Beneficiary",
                transactionRef = transactionRef,
                currentBalance = fromBalance,
                occurredAtUtc = now
            };

            context.OutboxMessages.Add(new OutboxMessage
            {
                EventType = "TransferDebitNotification",
                AggregateType = "Transfer",
                AggregateId = fromAccountId,
                PayloadJson = JsonSerializer.Serialize(debitPayload),
                OccurredAtUtc = now
            });
        }

        // Queue Receiver Credit Email Notification
        if (toAccount?.User != null && !string.IsNullOrWhiteSpace(toAccount.User.Email))
        {
            var creditPayload = new
            {
                to = toAccount.User.Email,
                username = toAccount.User.UserName,
                accountNumber = toAccount.AccountNumber.ToString(),
                amount = amount,
                senderAccount = fromAccount != null ? fromAccount.AccountNumber.ToString() : "System Account",
                senderName = fromAccount?.User?.UserName ?? "Sender / System",
                transactionRef = transactionRef,
                currentBalance = toBalance,
                occurredAtUtc = now
            };

            context.OutboxMessages.Add(new OutboxMessage
            {
                EventType = "TransferCreditNotification",
                AggregateType = "Transfer",
                AggregateId = toAccountId,
                PayloadJson = JsonSerializer.Serialize(creditPayload),
                OccurredAtUtc = now
            });
        }

        await context.SaveChangesAsync(cancellationToken);
    }
}
