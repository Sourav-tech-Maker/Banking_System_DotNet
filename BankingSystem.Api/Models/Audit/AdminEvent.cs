using System;
using BankingSystem.Api.Models.Auth;

namespace BankingSystem.Api.Models.Audit
{
    public class AdminEvent
    {
        public long AdminEventId { get; set; }
        public Guid? ActorUserId { get; set; }
        public string EventType { get; set; } = null!;
        public string EntityType { get; set; } = null!;
        public Guid? EntityId { get; set; }
        public string? EventDataJson { get; set; }
        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }
        public DateTime CreatedAtUtc { get; set; }

        // Navigation properties
        public virtual User? Actor { get; set; }
    }
}
