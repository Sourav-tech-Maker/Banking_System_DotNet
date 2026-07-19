using System;

namespace BankingSystem.Api.Models.Savings
{
    public class SavingsGoalProgressView
    {
        public Guid SavingsGoalId { get; set; }
        public Guid UserId { get; set; }
        public string Title { get; set; } = null!;
        public string Category { get; set; } = null!;
        public decimal TargetAmount { get; set; }
        public decimal CurrentAmount { get; set; }
        public decimal RemainingAmount { get; set; }
        public decimal ProgressPercentage { get; set; }
        public string GoalStatus { get; set; } = null!;
        public DateTime TargetDateUtc { get; set; }
        public DateTime CreatedAtUtc { get; set; }
        public DateTime UpdatedAtUtc { get; set; }
    }
}
