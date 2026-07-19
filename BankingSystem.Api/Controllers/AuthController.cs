using BankingSystem.Api.DTOs.Auth;
using BankingSystem.Api.Services;
using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace BankingSystem.Api.Controllers;

[ApiController]
[Route("api/auth")]
[EnableRateLimiting("Auth")]
public sealed class AuthController(
    IAuthService authService,
    IValidator<RegisterRequest> registerValidator,
    IValidator<LoginRequest> loginValidator,
    IValidator<VerifyOtpRequest> verifyOtpValidator,
    IValidator<ResendOtpRequest> resendOtpValidator,
    IHostEnvironment environment) : ControllerBase
{
    [HttpPost("register")]
    [ProducesResponseType<RegisterResponse>(StatusCodes.Status201Created)]
    public async Task<IActionResult> Register(
        [FromBody] RegisterRequest request,
        CancellationToken cancellationToken)
    {
        var validation = await registerValidator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            var firstError = validation.Errors[0];
            if (firstError.ErrorCode == "StrongPassword")
            {
                return UnprocessableEntity(new
                {
                    error = "Validation Error",
                    message = firstError.ErrorMessage
                });
            }

            return BadRequest(new { message = firstError.ErrorMessage });
        }

        var response = await authService.RegisterAsync(request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, response);
    }

    [HttpPost("verify-otp")]
    public async Task<IActionResult> VerifyOtp(
        [FromBody] VerifyOtpRequest request,
        CancellationToken cancellationToken)
    {
        var validation = await verifyOtpValidator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return BadRequest(new { message = validation.Errors[0].ErrorMessage });
        }

        await authService.VerifyOtpAsync(request, cancellationToken);
        return Ok(new { message = "Email verified successfully" });
    }

    [HttpPost("resend-otp")]
    [EnableRateLimiting("OtpResend")]
    public async Task<IActionResult> ResendOtp(
        [FromBody] ResendOtpRequest request,
        CancellationToken cancellationToken)
    {
        var validation = await resendOtpValidator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return BadRequest(new { message = validation.Errors[0].ErrorMessage });
        }

        await authService.ResendOtpAsync(request, cancellationToken);
        return Ok(new
        {
            message = "If an unverified account exists, a new OTP has been generated."
        });
    }

    [HttpPost("login")]
    [ProducesResponseType<LoginResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Login(
        [FromBody] LoginRequest request,
        CancellationToken cancellationToken)
    {
        var validation = await loginValidator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return BadRequest(new { message = validation.Errors[0].ErrorMessage });
        }

        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        var userAgent = Request.Headers.UserAgent.ToString();
        var result = await authService.LoginAsync(
            request,
            ipAddress,
            userAgent,
            cancellationToken);

        SetAuthenticationCookies(
            result.Response.AccessToken,
            result.AccessTokenExpiresAtUtc,
            result.RefreshToken,
            result.RefreshTokenExpiresAtUtc);

        return Ok(result.Response);
    }

    [HttpPost("refresh-token")]
    public async Task<IActionResult> RefreshToken(CancellationToken cancellationToken)
    {
        if (!Request.Cookies.TryGetValue("refreshToken", out var refreshToken)
            || string.IsNullOrWhiteSpace(refreshToken))
        {
            return Unauthorized(new { message = "Refresh token is missing" });
        }

        var result = await authService.RefreshTokenAsync(refreshToken, cancellationToken);
        SetAuthenticationCookies(
            result.AccessToken,
            result.AccessTokenExpiresAtUtc,
            result.RefreshToken,
            result.RefreshTokenExpiresAtUtc);

        return Ok(new
        {
            message = "Token rotated successfully",
            accessToken = result.AccessToken
        });
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout(CancellationToken cancellationToken)
    {
        if (!Request.Cookies.TryGetValue("refreshToken", out var refreshToken)
            || string.IsNullOrWhiteSpace(refreshToken))
        {
            return BadRequest(new { message = "Token Not Found" });
        }

        var accessToken = GetAccessToken();
        await authService.LogoutAsync(refreshToken, accessToken, cancellationToken);

        var deleteOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = UseSecureCookies(),
            SameSite = SameSiteMode.Strict,
            Path = "/"
        };
        Response.Cookies.Delete("token", deleteOptions);
        Response.Cookies.Delete("refreshToken", deleteOptions);

        return Ok(new { message = "User logged out successfully" });
    }

    private void SetAuthenticationCookies(
        string accessToken,
        DateTime accessTokenExpiresAtUtc,
        string refreshToken,
        DateTime refreshTokenExpiresAtUtc)
    {
        Response.Cookies.Append("token", accessToken, CreateCookieOptions(accessTokenExpiresAtUtc));
        Response.Cookies.Append(
            "refreshToken",
            refreshToken,
            CreateCookieOptions(refreshTokenExpiresAtUtc));
    }

    private CookieOptions CreateCookieOptions(DateTime expiresAtUtc) =>
        new()
        {
            HttpOnly = true,
            Secure = UseSecureCookies(),
            SameSite = SameSiteMode.Strict,
            Path = "/",
            Expires = new DateTimeOffset(DateTime.SpecifyKind(expiresAtUtc, DateTimeKind.Utc))
        };

    private bool UseSecureCookies() => environment.IsProduction() || Request.IsHttps;

    private string? GetAccessToken()
    {
        if (Request.Cookies.TryGetValue("token", out var cookieToken)
            && !string.IsNullOrWhiteSpace(cookieToken))
        {
            return cookieToken;
        }

        var authorization = Request.Headers.Authorization.ToString();
        return authorization.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
            ? authorization["Bearer ".Length..].Trim()
            : null;
    }
}
