using BankingSystem.Api.Models.Auth;

namespace BankingSystem.Api.Services;

public interface ITokenService
{
    AccessTokenResult CreateAccessToken(User user, string role);
    RefreshTokenResult CreateRefreshToken();
    byte[] HashToken(string token);
    bool TryValidateAccessToken(string token, out AccessTokenMetadata? metadata);
}

public sealed record AccessTokenResult(string Token, DateTime ExpiresAtUtc);
public sealed record RefreshTokenResult(string Token, byte[] Hash, DateTime ExpiresAtUtc);
public sealed record AccessTokenMetadata(Guid UserId, string JwtId, DateTime ExpiresAtUtc);
