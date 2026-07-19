using System;
using System.Collections.Generic;
using BankingSystem.Api.Models.Auth;

namespace BankingSystem.Api.Models.Banking
{
    public class Transfer
    {
        public Guid TransferId { get; set; }
        public string? LegacyObjectId { get; set; }
        public long TransferNumber { get; set; }
        public string TransferReference { get; private set; } = null!; // Database computed column
        public string IdempotencyKey { get; set; } = null!;
        public Guid FromAccountId { get; set; }
        public Guid ToAccountId { get; set; }
        public decimal Amount { get; set; }
        public string CurrencyCode { get; set; } = "INR";
        public string TransferType { get; set; } = "CUSTOMER_TRANSFER";
        public string TransferStatus { get; set; } = "PENDING";
        public string? PaymentMethod { get; set; }
        public string? Category { get; set; }
        public string? Narration { get; set; }
        public Guid? InitiatedByUserId { get; set; }
        public string? ClientIpAddress { get; set; }
        public string? UserAgent { get; set; }
        public Guid? ReversalOfTransferId { get; set; }
        public Guid? ReversedByUserId { get; set; }
        public string? ReversalReason { get; set; }
        public DateTime CreatedAtUtc { get; set; }
        public DateTime UpdatedAtUtc { get; set; }
        public DateTime? CompletedAtUtc { get; set; }
        public DateTime? ReversedAtUtc { get; set; }
        public byte[] RowVersion { get; set; } = [];

        // Navigation properties
        public virtual BankAccount FromAccount { get; set; } = null!;
        public virtual BankAccount ToAccount { get; set; } = null!;
        public virtual User? Initiator { get; set; }
        public virtual Transfer? ReversalOf { get; set; }
        public virtual User? Reverser { get; set; }
        public virtual ICollection<LedgerEntry> LedgerEntries { get; set; } = new List<LedgerEntry>();
    }
}
