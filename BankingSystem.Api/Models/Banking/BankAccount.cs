using System;
using System.Collections.Generic;
using BankingSystem.Api.Models.Auth;

namespace BankingSystem.Api.Models.Banking
{
    public class BankAccount
    {
        public Guid AccountId { get; set; }
        public string? LegacyObjectId { get; set; }
        public long AccountNumber { get; set; }
        public Guid UserId { get; set; }
        public string AccountType { get; set; } = "SAVINGS";
        public string AccountStatus { get; set; } = "ACTIVE";
        public string AccountPurpose { get; set; } = "CUSTOMER";
        public string CurrencyCode { get; set; } = "INR";
        public DateTime OpenedAtUtc { get; set; }
        public DateTime? ClosedAtUtc { get; set; }
        public DateTime CreatedAtUtc { get; set; }
        public DateTime UpdatedAtUtc { get; set; }
        public byte[] RowVersion { get; set; } = [];

        // Navigation properties
        public virtual User User { get; set; } = null!;
        public virtual ICollection<LedgerEntry> LedgerEntries { get; set; } = new List<LedgerEntry>();
    }
}
