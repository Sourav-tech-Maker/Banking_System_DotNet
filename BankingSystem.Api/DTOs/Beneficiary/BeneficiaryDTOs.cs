using System;

namespace BankingSystem.Api.DTOs.Beneficiary
{
    public sealed class AddBeneficiaryRequest
    {
        public string FullName { get; set; } = null!;
        public string NickName { get; set; } = null!;
        public Guid AccountId { get; set; }
    }

    public sealed class VerifyBeneficiaryRequest
    {
        public Guid BeneficiaryId { get; set; }
        public string Otp { get; set; } = null!;
    }
}
