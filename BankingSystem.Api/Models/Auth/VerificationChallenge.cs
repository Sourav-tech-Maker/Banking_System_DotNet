using System;

namespace BankingSystem.Api.Models.Auth
{
    public class VerificationChallenge
    {
        public Guid ChallengeId { get; set; }
        public string? LegacyObjectId { get; set; }
        public Guid? UserId { get; set; }
        public Guid? BeneficiaryId { get; set; }
        public string? SubjectEmail { get; set; }
        public string Purpose { get; set; } = null!;
        public byte[] CodeHash { get; set; } = null!;
        public int AttemptCount { get; set; }
        public int MaximumAttempts { get; set; }
        public DateTime ExpiresAtUtc { get; set; }
        public DateTime? ConsumedAtUtc { get; set; }
        public DateTime CreatedAtUtc { get; set; }

        // Navigation properties
        public virtual User? User { get; set; }
    }
}
