using System;
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
}
