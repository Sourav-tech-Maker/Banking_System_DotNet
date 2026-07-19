namespace BankingSystem.Api.Services;

public interface IEmailSender
{
    Task SendAsync(EmailMessage message, CancellationToken cancellationToken);
}

public sealed record EmailMessage(
    string To,
    string Subject,
    string TextBody,
    string HtmlBody);
