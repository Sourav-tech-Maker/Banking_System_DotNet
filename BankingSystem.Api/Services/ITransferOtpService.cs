using BankingSystem.Api.DTOs.Transaction;
using BankingSystem.Api.Models.Banking;

namespace BankingSystem.Api.Services
{
    public interface ITransferOtpService
    {
        Task<InitiateTransferResponse> InitiateTransferOtpAsync(
            Guid userId,
            InitiateTransferRequest request,
            CancellationToken cancellationToken);

        Task<TransferOtpSession> VerifyAndConsumeOtpAsync(
            Guid userId,
            ConfirmTransferRequest request,
            CancellationToken cancellationToken);

        Task<InitiateTransferResponse> ResendOtpAsync(
            Guid userId,
            ResendTransferOtpRequest request,
            CancellationToken cancellationToken);
    }
}
