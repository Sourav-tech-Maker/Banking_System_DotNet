using System;

namespace BankingSystem.Api.Models.Compliance
{
    public class KycDocument
    {
        public Guid KycDocumentId { get; set; }
        public Guid KycApplicationId { get; set; }
        public string DocumentType { get; set; } = null!;
        public string DocumentNumber { get; set; } = null!;
        public string DocumentImageUrl { get; set; } = null!;
        public string? ExternalFileId { get; set; }
        public DateTime UploadedAtUtc { get; set; }

        // Navigation properties
        public virtual KycApplication KycApplication { get; set; } = null!;
    }
}
