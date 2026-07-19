using System;

namespace BankingSystem.Api.Models.Auth
{
    public class RefreshSession
    {
        public Guid SessionId { get; set; }
        public string? LegacyObjectId { get; set; }
        public Guid UserId { get; set; }
        public byte[] RefreshTokenHash { get; set; } = null!;
        public string IpAddress { get; set; } = null!;
        public string UserAgent { get; set; } = null!;
        public bool IsRevoked { get; set; }
        public DateTime? RevokedAtUtc { get; set; }
        public string? RevocationReason { get; set; }
        public Guid? ReplacedBySessionId { get; set; }
        public DateTime ExpiresAtUtc { get; set; }
        public DateTime CreatedAtUtc { get; set; }
        public DateTime UpdatedAtUtc { get; set; }

        // Navigation properties
        public virtual User User { get; set; } = null!;
        public virtual RefreshSession? ReplacedBy { get; set; }
    }
}
