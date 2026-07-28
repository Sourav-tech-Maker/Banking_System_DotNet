using System;
using System.Threading;
using System.Threading.Tasks;
using BankingSystem.Api.DTOs.SystemUser;
using BankingSystem.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace BankingSystem.Api.Controllers
{
    [Authorize(Roles = "systemUser,SYSTEMUSER")]
    [ApiController]
    [Route("api/system")]
    public sealed class SystemUserController(ISystemUserService systemUserService) : ControllerBase
    {
        private bool TryGetUserId(out Guid userId)
        {
            userId = Guid.Empty;
            var claim = User.FindFirst("userid")?.Value;
            return claim != null && Guid.TryParse(claim, out userId);
        }

        [HttpGet("health")]
        public async Task<IActionResult> GetHealth(CancellationToken cancellationToken)
        {
            var health = await systemUserService.GetSystemHealthAsync(cancellationToken);
            return Ok(health);
        }

        [HttpGet("accounts")]
        public async Task<IActionResult> GetAccounts(CancellationToken cancellationToken)
        {
            if (!TryGetUserId(out var userId)) return Unauthorized(new { message = "Unauthorized identity" });

            var accounts = await systemUserService.GetInternalAccountsAsync(userId, cancellationToken);
            return Ok(new { accounts });
        }

        [HttpPost("accounts")]
        public async Task<IActionResult> CreateAccount(
            [FromBody] CreateSystemAccountRequest request,
            CancellationToken cancellationToken)
        {
            if (!TryGetUserId(out var userId)) return Unauthorized(new { message = "Unauthorized identity" });

            try
            {
                var account = await systemUserService.CreateInternalAccountAsync(userId, request, cancellationToken);
                return StatusCode(StatusCodes.Status201Created, new
                {
                    message = "SystemUser internal operational bank account created successfully.",
                    status = "success",
                    account = new
                    {
                        id = account.AccountId,
                        userId = account.UserId,
                        accountNumber = account.AccountNumber,
                        accountType = account.AccountType,
                        status = account.AccountStatus,
                        accountPurpose = account.AccountPurpose,
                        currency = account.CurrencyCode,
                        isKycExemptInternal = true
                    }
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message, code = "ACCOUNT_LIMIT_EXCEEDED" });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
            }
        }

        [HttpPost("transactions/internal-transfer")]
        public async Task<IActionResult> InternalTransfer(
            [FromBody] InternalTransferRequest request,
            CancellationToken cancellationToken)
        {
            if (!TryGetUserId(out var userId)) return Unauthorized(new { message = "Unauthorized identity" });

            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
            var userAgent = Request.Headers.UserAgent.ToString();

            try
            {
                var transfer = await systemUserService.ExecuteInternalTransferAsync(request.FromAccount == Guid.Empty ? Guid.Empty : userId, request, ipAddress, userAgent, cancellationToken);
                return Ok(new { message = "System internal transfer completed successfully.", transfer });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("transactions/operational-transfer")]
        public async Task<IActionResult> OperationalTransfer(
            [FromBody] OperationalTransferRequest request,
            CancellationToken cancellationToken)
        {
            if (!TryGetUserId(out var userId)) return Unauthorized(new { message = "Unauthorized identity" });

            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
            var userAgent = Request.Headers.UserAgent.ToString();

            try
            {
                var transfer = await systemUserService.ExecuteOperationalTransferAsync(userId, request, ipAddress, userAgent, cancellationToken);
                return Ok(new { message = "Privileged operational transfer executed and logged to immutable audit trail.", transfer });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("ledger")]
        public async Task<IActionResult> ReconcileLedger(CancellationToken cancellationToken)
        {
            var reconciliation = await systemUserService.ReconcileLedgerAsync(cancellationToken);
            return Ok(reconciliation);
        }

        [HttpGet("settings")]
        public async Task<IActionResult> GetSettings()
        {
            var settings = await systemUserService.GetSystemSettingsAsync();
            return Ok(new { settings });
        }

        [HttpPut("settings")]
        public async Task<IActionResult> UpdateSettings(
            [FromBody] UpdateSystemSettingsRequest request,
            CancellationToken cancellationToken)
        {
            if (!TryGetUserId(out var userId)) return Unauthorized(new { message = "Unauthorized identity" });

            var settings = await systemUserService.UpdateSystemSettingsAsync(request, userId, cancellationToken);
            return Ok(new { message = "System operational settings updated successfully.", settings });
        }

        [HttpGet("security/events")]
        public async Task<IActionResult> GetSecurityEvents(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            CancellationToken cancellationToken = default)
        {
            var data = await systemUserService.GetSecurityEventsAsync(page, pageSize, cancellationToken);
            return Ok(data);
        }

        [HttpPost("security/unlock-user/{targetUserId}")]
        public async Task<IActionResult> UnlockUser(Guid targetUserId, CancellationToken cancellationToken)
        {
            if (!TryGetUserId(out var adminUserId)) return Unauthorized(new { message = "Unauthorized identity" });
            var success = await systemUserService.UnlockUserAsync(targetUserId, adminUserId, cancellationToken);
            if (!success) return NotFound(new { message = "User not found or already active." });
            return Ok(new { message = "Customer account unlocked successfully." });
        }

        [HttpGet("audit")]
        public async Task<IActionResult> GetAuditLogs(
            [FromQuery] string? actorRole,
            [FromQuery] string? action,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            CancellationToken cancellationToken = default)
        {
            var logs = await systemUserService.GetAuditLogsAsync(actorRole, action, page, pageSize, cancellationToken);
            return Ok(logs);
        }
    }
}
