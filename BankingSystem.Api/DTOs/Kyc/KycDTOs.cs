using System;

namespace BankingSystem.Api.DTOs.Kyc
{
    public sealed class VerifyKycRequest
    {
        public Guid UserId { get; set; }
        public string Status { get; set; } = null!; // Approve, Rejected
        public string? RejectReason { get; set; }
    }
}
