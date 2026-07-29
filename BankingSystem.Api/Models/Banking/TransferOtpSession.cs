

namespace BankingSystem.Api.Models.Banking
{
    public class TransferOtpSession
    {
        public Guid SessionId { get; set; }
        public Guid UserId { get; set; }
        public Guid FromAccountId { get; set; }
        public Guid ToAccountId { get; set; }
        public decimal Amount { get; set; }
        public string IdempotencyKey { get; set; } = null!;
        public byte[] CodeHash { get; set; } = null!;
        public int AttemptCount { get; set; }
        public int MaxAttempts { get; set; } = 3;
        public DateTime ExpiresAtUtc { get; set; }
        public bool IsConsumed { get; set; }
        public DateTime CreatedAtUtc { get; set; }
    }
}
