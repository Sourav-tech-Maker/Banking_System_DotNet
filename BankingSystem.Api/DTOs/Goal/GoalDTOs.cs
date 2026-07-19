using System;

namespace BankingSystem.Api.DTOs.Goal
{
    public sealed class CreateGoalRequest
    {
        public string Title { get; set; } = null!;
        public string Category { get; set; } = null!;
        public decimal TargetAmount { get; set; }
        public decimal? CurrentAmount { get; set; }
        public DateTime TargetDate { get; set; }
    }

    public sealed class AddAmountRequest
    {
        public Guid GoalId { get; set; }
        public decimal Amount { get; set; }
        public string? Type { get; set; } // manual, auto_debit, round_up
    }
}
