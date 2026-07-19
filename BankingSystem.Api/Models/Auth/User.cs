using System;
using System.Collections.Generic;

namespace BankingSystem.Api.Models.Auth
{
    public class User
    {
        public Guid UserId { get; set; }
        public string? LegacyObjectId { get; set; }
        public string UserName { get; set; } = null!;
        public string NormalizedUserName { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string NormalizedEmail { get; set; } = null!;
        public string PasswordHash { get; set; } = null!;
        public bool EmailVerified { get; set; }
        public string UserStatus { get; set; } = "ACTIVE";
        public int LoginAttempts { get; set; }
        public DateTime? LockoutEndUtc { get; set; }
        public DateTime CreatedAtUtc { get; set; }
        public DateTime UpdatedAtUtc { get; set; }
        public byte[] RowVersion { get; set; } = [];

        // Navigation properties
        public virtual ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
        public virtual ICollection<RefreshSession> RefreshSessions { get; set; } = new List<RefreshSession>();
        public virtual ICollection<VerificationChallenge> VerificationChallenges { get; set; } = new List<VerificationChallenge>();
    }
}
