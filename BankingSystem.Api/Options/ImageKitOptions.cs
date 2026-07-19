namespace BankingSystem.Api.Options
{
    public sealed class ImageKitOptions
    {
        public const string SectionName = "ImageKit";

        public string PrivateKey { get; set; } = string.Empty;
        public string Folder { get; set; } = "/kyc-documents";
    }
}
