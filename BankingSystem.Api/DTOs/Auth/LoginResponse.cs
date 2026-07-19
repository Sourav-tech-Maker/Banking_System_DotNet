using System.Text.Json.Serialization;

namespace BankingSystem.Api.DTOs.Auth;

public sealed record LoginResponse(
    string Message,
    LoginUserResponse User,
    string AccessToken);

public sealed record LoginUserResponse(
    Guid Id,
    [property: JsonPropertyName("username")] string Username,
    string Email,
    string Role);
