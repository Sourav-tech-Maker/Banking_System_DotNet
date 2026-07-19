using System.Text.Json.Serialization;

namespace BankingSystem.Api.DTOs.Auth;

public sealed record RegisterResponse(string Message, RegisteredUserResponse User);

public sealed record RegisteredUserResponse(
    [property: JsonPropertyName("_id")] Guid Id,
    [property: JsonPropertyName("username")] string Username,
    string Email,
    string Role);
