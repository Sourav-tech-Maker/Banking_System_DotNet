using System.Text.Json;
using BankingSystem.Api.Options;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;

namespace BankingSystem.Api.Services;

public sealed class SmtpEmailSender(
    IOptionsMonitor<EmailOptions> emailOptions,
    IHttpClientFactory httpClientFactory,
    ILogger<SmtpEmailSender> logger) : IEmailSender
{
    public async Task SendAsync(EmailMessage message, CancellationToken cancellationToken)
    {
        var options = emailOptions.CurrentValue;
        if (!options.Enabled)
        {
            throw new InvalidOperationException("Email delivery is disabled.");
        }

        if (!Enum.TryParse<SecureSocketOptions>(
                options.SocketSecurity,
                ignoreCase: true,
                out var socketSecurity))
        {
            throw new InvalidOperationException(
                $"Unsupported email socket security mode '{options.SocketSecurity}'.");
        }

        var mimeMessage = new MimeMessage();
        mimeMessage.From.Add(new MailboxAddress(options.FromName, options.FromEmail));
        mimeMessage.To.Add(MailboxAddress.Parse(message.To));
        mimeMessage.Subject = message.Subject;
        mimeMessage.Body = new BodyBuilder
        {
            TextBody = message.TextBody,
            HtmlBody = message.HtmlBody
        }.ToMessageBody();

        using var smtpClient = new SmtpClient
        {
            Timeout = checked(options.TimeoutSeconds * 1000)
        };

        await smtpClient.ConnectAsync(
            options.Host,
            options.Port,
            socketSecurity,
            cancellationToken);

        if (options.OAuth2.IsConfigured)
        {
            var accessToken = await GetOAuthAccessTokenAsync(options, cancellationToken);
            await smtpClient.AuthenticateAsync(
                new SaslMechanismOAuth2(options.Username, accessToken),
                cancellationToken);
        }
        else
        {
            // Google displays app passwords in groups. Accept pasted values with spaces.
            var password = options.UsesGmail
                ? options.Password.Replace(" ", string.Empty, StringComparison.Ordinal)
                : options.Password;
            await smtpClient.AuthenticateAsync(
                options.Username,
                password,
                cancellationToken);
        }

        var serverMessageId = await smtpClient.SendAsync(mimeMessage, cancellationToken);
        await smtpClient.DisconnectAsync(quit: true, cancellationToken);

        logger.LogInformation(
            "Sent email {Subject} to {Recipient}. ServerMessageId: {ServerMessageId}",
            message.Subject,
            message.To,
            serverMessageId);
    }

    private async Task<string> GetOAuthAccessTokenAsync(
        EmailOptions options,
        CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, options.OAuth2.TokenEndpoint)
        {
            Content = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["client_id"] = options.OAuth2.ClientId,
                ["client_secret"] = options.OAuth2.ClientSecret,
                ["refresh_token"] = options.OAuth2.RefreshToken,
                ["grant_type"] = "refresh_token"
            })
        };

        var httpClient = httpClientFactory.CreateClient(nameof(SmtpEmailSender));
        using var response = await httpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();

        await using var responseStream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var document = await JsonDocument.ParseAsync(
            responseStream,
            cancellationToken: cancellationToken);

        if (!document.RootElement.TryGetProperty("access_token", out var accessTokenElement)
            || string.IsNullOrWhiteSpace(accessTokenElement.GetString()))
        {
            throw new InvalidOperationException(
                "The OAuth token endpoint did not return an access token.");
        }

        return accessTokenElement.GetString()!;
    }
}
