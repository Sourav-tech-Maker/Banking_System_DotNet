namespace BankingSystem.Api.Models.Integration;

public sealed class OutboxMessage
{
    public long OutboxMessageId { get; set; }
    public string EventType { get; set; } = string.Empty;
    public string AggregateType { get; set; } = string.Empty;
    public Guid? AggregateId { get; set; }
    public string PayloadJson { get; set; } = string.Empty;
    public DateTime OccurredAtUtc { get; set; }
    public DateTime? ProcessedAtUtc { get; set; }
    public int AttemptCount { get; set; }
    public DateTime? NextAttemptAtUtc { get; set; }
    public string? LastError { get; set; }
}
