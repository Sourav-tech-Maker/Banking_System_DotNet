namespace BankingSystem.Api.Models.Auth;

public sealed class RevokedAccessToken
{
    public long RevokedTokenId { get; set; }
    public byte[] TokenHash { get; set; } = [];
    public string? JwtId { get; set; }
    public Guid? UserId { get; set; }
    public DateTime ExpiresAtUtc { get; set; }
    public DateTime RevokedAtUtc { get; set; }
}
