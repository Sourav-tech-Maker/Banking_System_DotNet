using System;

namespace BankingSystem.Api.Models.Banking
{
    public class BankAccountBalanceView
    {
        public Guid AccountId { get; set; }
        public long AccountNumber { get; set; }
        public Guid UserId { get; set; }
        public string AccountType { get; set; } = null!;
        public string AccountStatus { get; set; } = null!;
        public string AccountPurpose { get; set; } = null!;
        public string CurrencyCode { get; set; } = null!;
        public decimal CurrentBalance { get; set; }
    }
}
