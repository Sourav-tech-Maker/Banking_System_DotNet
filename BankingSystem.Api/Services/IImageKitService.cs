using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

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
