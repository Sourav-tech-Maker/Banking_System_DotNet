
namespace BankingSystem.Api.DTOs.SystemUser
{
    public sealed class CreateSystemAccountRequest
    {
        public string AccountType { get; set; } = "SAVINGS";
        public string CurrencyCode { get; set; } = "INR";
    }

    public sealed class InternalTransferRequest
    {
        public Guid FromAccount { get; set; }
        public Guid ToAccount { get; set; }
        public decimal Amount { get; set; }
        public string IdempotencyKey { get; set; } = string.Empty;
        public string? Narration { get; set; }
    }

    public sealed class OperationalTransferRequest
    {
        public Guid SourceAccount { get; set; }
        public Guid DestinationAccount { get; set; }
        public decimal Amount { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string OperationType { get; set; } = "OPERATIONAL_ADJUSTMENT"; // FEE_COLLECTION, REVERSAL_ADJUSTMENT, OPERATIONAL_ADJUSTMENT
        public Guid? AffectedCustomerId { get; set; }
        public string IdempotencyKey { get; set; } = string.Empty;
        public string CorrelationId { get; set; } = Guid.NewGuid().ToString("N");
        public string? Narration { get; set; }
    }

    public sealed class UpdateSystemSettingsRequest
    {
        public decimal? DailyTransferLimit { get; set; }
        public decimal? OperationalThreshold { get; set; }
        public bool? MaintenanceMode { get; set; }
        public bool? EnableFraudDetection { get; set; }
        public int? OtpExpirationMinutes { get; set; }
        public int? SessionTimeoutMinutes { get; set; }
    }

    public sealed class SystemHealthResponse
    {
        public string Status { get; set; } = "HEALTHY";
        public DateTime TimestampUtc { get; set; }
        public long TotalUsers { get; set; }
        public long TotalAccounts { get; set; }
        public long TotalTransactions { get; set; }
        public decimal SystemBalanceSum { get; set; }
        public bool LedgerIntegrity { get; set; }
        public int ActiveSessionsCount { get; set; }
        public int UnhandledFailedTransactions { get; set; }
    }

    public sealed class LedgerReconciliationResponse
    {
        public bool IsBalanced { get; set; }
        public decimal TotalDebitAmount { get; set; }
        public decimal TotalCreditAmount { get; set; }
        public decimal NetDifference { get; set; }
        public int TotalLedgerEntries { get; set; }
        public List<string> InconsistencyDetails { get; set; } = new();
    }
}
