namespace BankingSystem.Api.DTOs.Auth;

public sealed class VerifyOtpRequest
{
    public string Email { get; init; } = string.Empty;
    public string Otp { get; init; } = string.Empty;
}
