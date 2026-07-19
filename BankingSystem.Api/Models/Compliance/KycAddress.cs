using System;

namespace BankingSystem.Api.Models.Compliance
{
    public class KycAddress
    {
        public Guid KycApplicationId { get; set; }
        public string Street { get; set; } = null!;
        public string City { get; set; } = null!;
        public string StateOrProvince { get; set; } = null!;
        public string Country { get; set; } = null!;
        public string PostalCode { get; set; } = null!;

        // Navigation properties
        public virtual KycApplication KycApplication { get; set; } = null!;
    }
}
