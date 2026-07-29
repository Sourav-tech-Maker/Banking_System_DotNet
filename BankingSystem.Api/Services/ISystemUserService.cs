using BankingSystem.Api.DTOs.SystemUser;
using BankingSystem.Api.Models.Banking;


namespace BankingSystem.Api.Services
{
    public interface ISystemUserService
    {
        Task<BankAccount> CreateInternalAccountAsync(Guid systemUserId, CreateSystemAccountRequest request, CancellationToken cancellationToken);
        Task<List<object>> GetInternalAccountsAsync(Guid systemUserId, CancellationToken cancellationToken);
        Task<Transfer> ExecuteInternalTransferAsync(Guid systemUserId, InternalTransferRequest request, string clientIp, string userAgent, CancellationToken cancellationToken);
        Task<Transfer> ExecuteOperationalTransferAsync(Guid systemUserId, OperationalTransferRequest request, string clientIp, string userAgent, CancellationToken cancellationToken);
        Task<SystemHealthResponse> GetSystemHealthAsync(CancellationToken cancellationToken);
        Task<LedgerReconciliationResponse> ReconcileLedgerAsync(CancellationToken cancellationToken);
        Task<object> GetSystemSettingsAsync();
        Task<object> UpdateSystemSettingsAsync(UpdateSystemSettingsRequest request, Guid systemUserId, CancellationToken cancellationToken);
        Task<object> GetSecurityEventsAsync(int page, int pageSize, CancellationToken cancellationToken);
        Task<bool> UnlockUserAsync(Guid targetUserId, Guid adminUserId, CancellationToken cancellationToken);
        Task<bool> ResetFailedAttemptsAsync(Guid targetUserId, Guid adminUserId, CancellationToken cancellationToken);
        Task<object> GetAuditLogsAsync(string? actorRole, string? action, int page, int pageSize, CancellationToken cancellationToken);
    }
}
