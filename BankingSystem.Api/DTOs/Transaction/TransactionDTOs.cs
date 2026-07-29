
using System.Text.Json.Serialization;

namespace BankingSystem.Api.DTOs.Transaction
{
    public sealed class CreateTransactionRequest
    {
        [JsonPropertyName("FromAccount")]
        public Guid FromAccount { get; set; }

        [JsonPropertyName("toAccount")]
        public Guid ToAccount { get; set; }

        [JsonPropertyName("amount")]
        public decimal Amount { get; set; }

        [JsonPropertyName("idempotencyKey")]
        public string IdempotencyKey { get; set; } = null!;
    }

    public sealed class CreateInitialFundsRequest
    {
        [JsonPropertyName("toAccount")]
        public Guid ToAccount { get; set; }

        [JsonPropertyName("amount")]
        public decimal Amount { get; set; }

        [JsonPropertyName("idempotencyKey")]
        public string IdempotencyKey { get; set; } = null!;
    }

    public sealed class InitiateTransferRequest
    {
        [JsonPropertyName("fromAccount")]
        public Guid FromAccount { get; set; }

        [JsonPropertyName("toAccount")]
        public Guid ToAccount { get; set; }

        [JsonPropertyName("amount")]
        public decimal Amount { get; set; }

        [JsonPropertyName("idempotencyKey")]
        public string IdempotencyKey { get; set; } = null!;
    }

    public sealed class InitiateTransferResponse
    {
        [JsonPropertyName("sessionId")]
        public Guid SessionId { get; set; }

        [JsonPropertyName("expiresAtUtc")]
        public DateTime ExpiresAtUtc { get; set; }

        [JsonPropertyName("maskedEmail")]
        public string MaskedEmail { get; set; } = null!;

        [JsonPropertyName("message")]
        public string Message { get; set; } = null!;
    }

    public sealed class ConfirmTransferRequest
    {
        [JsonPropertyName("sessionId")]
        public Guid SessionId { get; set; }

        [JsonPropertyName("otpCode")]
        public string OtpCode { get; set; } = null!;
    }

    public sealed class ResendTransferOtpRequest
    {
        [JsonPropertyName("sessionId")]
        public Guid SessionId { get; set; }
    }
}
