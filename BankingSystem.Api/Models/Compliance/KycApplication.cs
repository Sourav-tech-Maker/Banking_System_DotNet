using System;
using System.Collections.Generic;
using BankingSystem.Api.Models.Auth;

namespace BankingSystem.Api.Models.Compliance
{
    public class KycApplication
    {
        public Guid KycApplicationId { get; set; }
        public string? LegacyObjectId { get; set; }
        public Guid UserId { get; set; }
        public string FullName { get; set; } = null!;
        public DateTime DateOfBirth { get; set; } // Map to DateOfBirth in DB (stored as Date/DateTime)
        public string Gender { get; set; } = null!;
        public string KycStatus { get; set; } = "PENDING";
        public string? RejectionReason { get; set; }
        public Guid? ReviewedByUserId { get; set; }
        public DateTime? ReviewedAtUtc { get; set; }
        public DateTime SubmittedAtUtc { get; set; }
        public DateTime UpdatedAtUtc { get; set; }
        public byte[] RowVersion { get; set; } = [];

        // Navigation properties
        public virtual User User { get; set; } = null!;
        public virtual User? Reviewer { get; set; }
        public virtual KycAddress? KycAddress { get; set; }
        public virtual ICollection<KycDocument> KycDocuments { get; set; } = new List<KycDocument>();
    }
}
