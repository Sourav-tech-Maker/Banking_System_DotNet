namespace BankingSystem.Api.DTOs.Auth;

public sealed class LoginRequest
{
    public string Email { get; init; } = string.Empty;
    public string Password { get; init; } = string.Empty;
    public string Role { get; init; } = "user";
    public string? RoleAccessKey { get; init; }
}
