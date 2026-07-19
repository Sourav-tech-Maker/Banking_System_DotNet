using BankingSystem.Api.DTOs.Auth;

namespace BankingSystem.Api.Services;

public interface IAuthService
{
    Task<RegisterResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken);
    Task VerifyOtpAsync(VerifyOtpRequest request, CancellationToken cancellationToken);
    Task ResendOtpAsync(ResendOtpRequest request, CancellationToken cancellationToken);
    Task<LoginResult> LoginAsync(
        LoginRequest request,
        string ipAddress,
        string userAgent,
        CancellationToken cancellationToken);
    Task<RefreshResult> RefreshTokenAsync(string refreshToken, CancellationToken cancellationToken);
    Task LogoutAsync(
        string refreshToken,
        string? accessToken,
        CancellationToken cancellationToken);
}

public sealed record LoginResult(
    LoginResponse Response,
    string RefreshToken,
    DateTime AccessTokenExpiresAtUtc,
    DateTime RefreshTokenExpiresAtUtc);

public sealed record RefreshResult(
    string AccessToken,
    string RefreshToken,
    DateTime AccessTokenExpiresAtUtc,
    DateTime RefreshTokenExpiresAtUtc);
