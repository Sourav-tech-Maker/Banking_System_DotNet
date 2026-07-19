using System;

namespace BankingSystem.Api.Models.Banking
{
    public class LedgerEntry
    {
        public long LedgerEntryId { get; set; }
        public string? LegacyObjectId { get; set; }
        public Guid TransferId { get; set; }
        public Guid AccountId { get; set; }
        public byte EntrySequence { get; set; }
        public string EntryType { get; set; } = null!; // CREDIT, DEBIT
        public decimal Amount { get; set; }
        public decimal SignedAmount { get; private set; } // Database computed column
        public DateTime CreatedAtUtc { get; set; }

        // Navigation properties
        public virtual Transfer Transfer { get; set; } = null!;
        public virtual BankAccount Account { get; set; } = null!;
    }
}
