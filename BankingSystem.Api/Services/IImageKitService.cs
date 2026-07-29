

namespace BankingSystem.Api.Services
{
    public interface IImageKitService
    {
        Task<string> UploadKycDocumentAsync(
            IFormFile file,
            string userId,
            CancellationToken cancellationToken);
    }
}
