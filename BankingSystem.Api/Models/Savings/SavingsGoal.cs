using System;
using System.Collections.Generic;
using BankingSystem.Api.Models.Auth;

namespace BankingSystem.Api.Models.Savings
{
    public class SavingsGoal
    {
        public Guid SavingsGoalId { get; set; }
        public string? LegacyObjectId { get; set; }
        public Guid UserId { get; set; }
        public string Title { get; set; } = null!;
        public string Category { get; set; } = null!;
        public decimal TargetAmount { get; set; }
        public DateTime TargetDateUtc { get; set; }
        public bool IsArchived { get; set; }
        public DateTime CreatedAtUtc { get; set; }
        public DateTime UpdatedAtUtc { get; set; }
        public byte[] RowVersion { get; set; } = [];

        // Navigation properties
        public virtual User User { get; set; } = null!;
        public virtual ICollection<SavingsContribution> SavingsContributions { get; set; } = new List<SavingsContribution>();
    }
}
