using System;
using BankingSystem.Api.Models.Banking;

namespace BankingSystem.Api.Models.Savings
{
    public class SavingsContribution
    {
        public long SavingsContributionId { get; set; }
        public string? LegacyObjectId { get; set; }
        public Guid SavingsGoalId { get; set; }
        public Guid? TransferId { get; set; }
        public decimal Amount { get; set; }
        public string ContributionType { get; set; } = "MANUAL";
        public DateTime CreatedAtUtc { get; set; }

        // Navigation properties
        public virtual SavingsGoal SavingsGoal { get; set; } = null!;
        public virtual Transfer? Transfer { get; set; }
    }
}
