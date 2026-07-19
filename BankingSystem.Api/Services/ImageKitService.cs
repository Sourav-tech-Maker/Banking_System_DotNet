using System;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using BankingSystem.Api.Options;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;

namespace BankingSystem.Api.Services
{
    public sealed class ImageKitService(
        HttpClient httpClient,
        IOptions<ImageKitOptions> options) : IImageKitService
    {
        private const string UploadUrl = "https://upload.imagekit.io/api/v1/files/upload";

        public async Task<string> UploadKycDocumentAsync(
            IFormFile file,
            string userId,
            CancellationToken cancellationToken)
        {
            var imageKitConfig = options.Value;

            using var content = new MultipartFormDataContent();

            // Read file stream
            using var fileStream = file.OpenReadStream();
            var fileContent = new StreamContent(fileStream);
            fileContent.Headers.ContentType = new MediaTypeHeaderValue(file.ContentType);

            var safeFileName = file.FileName.Replace(" ", "_");
            var uploadFileName = $"kyc-{userId}-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}-{safeFileName}";

            content.Add(fileContent, "file", file.FileName);
            content.Add(new StringContent(uploadFileName), "fileName");
            content.Add(new StringContent(imageKitConfig.Folder), "folder");
            content.Add(new StringContent("true"), "useUniqueFileName");

            var authBytes = Encoding.UTF8.GetBytes($"{imageKitConfig.PrivateKey}:");
            var authHeader = Convert.ToBase64String(authBytes);

            using var request = new HttpRequestMessage(HttpMethod.Post, UploadUrl)
            {
                Content = content
            };
            request.Headers.Authorization = new AuthenticationHeaderValue("Basic", authHeader);

            var response = await httpClient.SendAsync(request, cancellationToken);
            var responseString = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                throw new HttpRequestException($"ImageKit upload failed: {responseString}");
            }

            using var document = JsonDocument.Parse(responseString);
            if (document.RootElement.TryGetProperty("url", out var urlElement))
            {
                return urlElement.GetString() ?? throw new InvalidOperationException("ImageKit response missing url value.");
            }

            throw new InvalidOperationException("ImageKit response missing url property.");
        }
    }
}
