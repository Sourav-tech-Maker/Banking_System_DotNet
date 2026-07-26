using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using BankingSystem.Api.Models.Auth;
using BankingSystem.Api.Options;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace BankingSystem.Api.Services;

public sealed class TokenService : ITokenService
{
    private readonly JwtOptions _options;
    private readonly TimeProvider _timeProvider;
    private readonly JwtSecurityTokenHandler _handler = new();
    private readonly TokenValidationParameters _validationParameters;

    public TokenService(IOptions<JwtOptions> options, TimeProvider timeProvider)
    {
        _options = options.Value;
        _timeProvider = timeProvider;
        _validationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = _options.Issuer,
            ValidateAudience = true,
            ValidAudience = _options.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = CreateSigningKey(),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero,
            NameClaimType = "userid",
            RoleClaimType = "role"
        };
    }

    public AccessTokenResult CreateAccessToken(User user, string role)
    {
        var now = _timeProvider.GetUtcNow().UtcDateTime;
        var expiresAtUtc = now.AddMinutes(_options.AccessTokenMinutes);
        var jwtId = Guid.NewGuid().ToString("N");
        var userId = user.UserId.ToString();

        var token = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: _options.Audience,
            claims:
            [
                new Claim(JwtRegisteredClaimNames.Sub, userId),
                new Claim(JwtRegisteredClaimNames.Jti, jwtId),
                new Claim("userid", userId),
                new Claim("role", role),
                new Claim(ClaimTypes.Role, role)
            ],
            notBefore: now,
            expires: expiresAtUtc,
            signingCredentials: new SigningCredentials(CreateSigningKey(), SecurityAlgorithms.HmacSha256));

        return new AccessTokenResult(_handler.WriteToken(token), expiresAtUtc);
    }

    public RefreshTokenResult CreateRefreshToken()
    {
        var token = WebEncoders.Base64UrlEncode(RandomNumberGenerator.GetBytes(64));
        var expiresAtUtc = _timeProvider.GetUtcNow().UtcDateTime
            .AddDays(_options.RefreshTokenDays);

        return new RefreshTokenResult(token, HashToken(token), expiresAtUtc);
    }

    public byte[] HashToken(string token) =>
        SHA256.HashData(Encoding.UTF8.GetBytes(token));

    public bool TryValidateAccessToken(string token, out AccessTokenMetadata? metadata)
    {
        metadata = null;

        try
        {
            var principal = _handler.ValidateToken(token, _validationParameters, out var validatedToken);
            var userIdValue = principal.FindFirstValue("userid");
            var jwtId = principal.FindFirstValue(JwtRegisteredClaimNames.Jti);

            if (validatedToken is not JwtSecurityToken jwt
                || !Guid.TryParse(userIdValue, out var userId)
                || string.IsNullOrWhiteSpace(jwtId))
            {
                return false;
            }

            metadata = new AccessTokenMetadata(userId, jwtId, jwt.ValidTo);
            return true;
        }
        catch (SecurityTokenException)
        {
            return false;
        }
        catch (ArgumentException)
        {
            return false;
        }
    }

    private SymmetricSecurityKey CreateSigningKey() =>
        new(Encoding.UTF8.GetBytes(_options.SigningKey));
}
