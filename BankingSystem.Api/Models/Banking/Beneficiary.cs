using System;
using BankingSystem.Api.Models.Auth;

namespace BankingSystem.Api.Models.Banking
{
    public class Beneficiary
    {
        public Guid BeneficiaryId { get; set; }
        public string? LegacyObjectId { get; set; }
        public Guid OwnerUserId { get; set; }
        public Guid BeneficiaryAccountId { get; set; }
        public string DisplayName { get; set; } = null!;
        public string NickName { get; set; } = null!;
        public string BeneficiaryStatus { get; set; } = "PENDING";
        public DateTime? VerifiedAtUtc { get; set; }
        public DateTime CreatedAtUtc { get; set; }
        public DateTime UpdatedAtUtc { get; set; }
        public byte[] RowVersion { get; set; } = [];

        // Navigation properties
        public virtual User Owner { get; set; } = null!;
        public virtual BankAccount BeneficiaryAccount { get; set; } = null!;
    }
}
