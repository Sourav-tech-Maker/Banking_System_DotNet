namespace BankingSystem.Api.DTOs.Auth;

public sealed class ResendOtpRequest
{
    public string Email { get; init; } = string.Empty;
}
