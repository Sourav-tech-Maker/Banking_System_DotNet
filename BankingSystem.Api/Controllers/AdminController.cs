using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BankingSystem.Api.Data;
using BankingSystem.Api.Models.Auth;
using BankingSystem.Api.Models.Banking;
using BankingSystem.Api.Models.Compliance;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace BankingSystem.Api.Controllers
{
    [Authorize(Roles = "admin")]
    [ApiController]
    [Route("api/[controller]")]
    public sealed class AdminController(AppDbContext context, TimeProvider timeProvider) : ControllerBase
    {
        public sealed class StatusUpdateRequest
        {
            public string Status { get; set; } = null!;
        }

        [HttpGet("kyc-applications")]
        public async Task<IActionResult> GetKycApplications([FromQuery] string? status, CancellationToken cancellationToken)
        {
            var query = context.KycApplications
                .Include(k => k.KycAddress)
                .Include(k => k.KycDocuments)
                .AsNoTracking();

            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(k => k.KycStatus == status);
            }

            var applications = await query
                .OrderBy(k => k.KycStatus == "Pending" ? 0 : 1)
                .ThenByDescending(k => k.SubmittedAtUtc)
                .ToListAsync(cancellationToken);

            var userIds = applications.Select(a => a.UserId).Distinct().ToList();
            var users = await context.Users
                .AsNoTracking()
                .Where(u => userIds.Contains(u.UserId))
                .ToDictionaryAsync(u => u.UserId, cancellationToken);

            var responseList = applications.Select(k =>
            {
                var user = users.GetValueOrDefault(k.UserId);
                return new
                {
                    _id = k.KycApplicationId,
                    id = k.KycApplicationId,
                    userId = k.UserId,
                    userIdData = user != null ? new { _id = user.UserId, username = user.UserName, email = user.Email } : null,
                    fullName = k.FullName,
                    dateOfBirth = k.DateOfBirth.ToString("yyyy-MM-dd"),
                    gender = k.Gender,
                    permanentAddress = k.KycAddress != null ? new
                    {
                        street = k.KycAddress.Street,
                        city = k.KycAddress.City,
                        state = k.KycAddress.StateOrProvince,
                        country = k.KycAddress.Country,
                        postalCode = k.KycAddress.PostalCode
                    } : null,
                    documentType = k.KycDocuments.FirstOrDefault()?.DocumentType,
                    documentNumber = k.KycDocuments.FirstOrDefault()?.DocumentNumber,
                    documentImg = k.KycDocuments.FirstOrDefault()?.DocumentImageUrl,
                    status = k.KycStatus,
                    rejectReason = k.RejectionReason,
                    createdAt = k.SubmittedAtUtc
                };
            }).ToList();

            return Ok(new
            {
                status = "success",
                results = responseList.Count,
                applications = responseList
            });
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetAdminStats(CancellationToken cancellationToken)
        {
            // Count roles mapping to users
            var userRoleId = await context.Roles
                .AsNoTracking()
                .Where(r => r.NormalizedRoleName == "USER")
                .Select(r => r.RoleId)
                .FirstOrDefaultAsync(cancellationToken);

            var totalUsers = await context.UserRoles
                .Where(ur => ur.RoleId == userRoleId)
                .CountAsync(cancellationToken);

            var totalAccounts = await context.BankAccounts.CountAsync(cancellationToken);
            var totalTransactions = await context.Transfers.CountAsync(cancellationToken);

            decimal totalSystemBalance = await context.BankAccountBalanceViews
                .SumAsync(v => v.CurrentBalance, cancellationToken);

            var pendingKyc = await context.KycApplications.CountAsync(k => k.KycStatus == "Pending", cancellationToken);
            var approvedKyc = await context.KycApplications.CountAsync(k => k.KycStatus == "APPROVED", cancellationToken);
            var rejectedKyc = await context.KycApplications.CountAsync(k => k.KycStatus == "REJECTED", cancellationToken);

            return Ok(new
            {
                stats = new
                {
                    totalUsers,
                    totalAccounts,
                    totalTransactions,
                    totalSystemBalance,
                    kyc = new
                    {
                        pending = pendingKyc,
                        approved = approvedKyc,
                        rejected = rejectedKyc
                    }
                }
            });
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers(CancellationToken cancellationToken)
        {
            // Find regular users
            var userRoleId = await context.Roles
                .AsNoTracking()
                .Where(r => r.NormalizedRoleName == "USER")
                .Select(r => r.RoleId)
                .FirstOrDefaultAsync(cancellationToken);

            var userIds = await context.UserRoles
                .Where(ur => ur.RoleId == userRoleId)
                .Select(ur => ur.UserId)
                .ToListAsync(cancellationToken);

            var users = await context.Users
                .AsNoTracking()
                .Where(u => userIds.Contains(u.UserId))
                .ToListAsync(cancellationToken);

            // Fetch kyc and accounts
            var kycRecords = await context.KycApplications
                .AsNoTracking()
                .Where(k => userIds.Contains(k.UserId))
                .ToDictionaryAsync(k => k.UserId, cancellationToken);

            var balances = await context.BankAccountBalanceViews
                .AsNoTracking()
                .Where(v => userIds.Contains(v.UserId))
                .ToListAsync(cancellationToken);

            var userList = users.Select(user =>
            {
                var kyc = kycRecords.GetValueOrDefault(user.UserId);
                var userBalances = balances.Where(b => b.UserId == user.UserId).ToList();

                var accountsList = userBalances.Select(b => new
                {
                    id = b.AccountId,
                    accountType = b.AccountType,
                    status = b.AccountStatus,
                    balance = b.CurrentBalance
                }).ToList();

                return new
                {
                    id = user.UserId,
                    username = user.UserName,
                    email = user.Email,
                    verified = user.EmailVerified,
                    status = user.UserStatus,
                    createdAt = user.CreatedAtUtc,
                    kycStatus = kyc != null ? kyc.KycStatus : "Not Submitted",
                    accounts = accountsList
                };
            }).ToList();

            return Ok(new
            {
                status = "success",
                results = userList.Count,
                users = userList
            });
        }

        [HttpPut("users/{userId}/status")]
        public async Task<IActionResult> UpdateUserStatus(
            Guid userId,
            [FromBody] StatusUpdateRequest request,
            CancellationToken cancellationToken)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Status))
            {
                return BadRequest(new { message = "Status is required" });
            }

            var user = await context.Users
                .FirstOrDefaultAsync(u => u.UserId == userId, cancellationToken);

            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            user.UserStatus = request.Status.ToUpperInvariant();
            user.UpdatedAtUtc = timeProvider.GetUtcNow().UtcDateTime;

            await context.SaveChangesAsync(cancellationToken);

            return Ok(new
            {
                message = $"User status updated to {request.Status}",
                user = new
                {
                    id = user.UserId,
                    username = user.UserName,
                    status = user.UserStatus
                }
            });
        }

        [HttpPost("users/{userId}/reset-attempts")]
        public async Task<IActionResult> ResetUserLogins(Guid userId, CancellationToken cancellationToken)
        {
            var user = await context.Users
                .FirstOrDefaultAsync(u => u.UserId == userId, cancellationToken);

            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            user.LoginAttempts = 0;
            user.LockoutEndUtc = null;
            user.UserStatus = "ACTIVE";
            user.UpdatedAtUtc = timeProvider.GetUtcNow().UtcDateTime;

            await context.SaveChangesAsync(cancellationToken);

            return Ok(new
            {
                message = "User login attempts reset successfully",
                user = new
                {
                    id = user.UserId,
                    username = user.UserName,
                    status = user.UserStatus
                }
            });
        }

        [HttpPut("accounts/{accountId}/status")]
        public async Task<IActionResult> UpdateAccountStatus(
            Guid accountId,
            [FromBody] StatusUpdateRequest request,
            CancellationToken cancellationToken)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Status))
            {
                return BadRequest(new { message = "Status is required" });
            }

            var account = await context.BankAccounts
                .FirstOrDefaultAsync(a => a.AccountId == accountId, cancellationToken);

            if (account == null)
            {
                return NotFound(new { message = "Account not found" });
            }

            var status = request.Status.ToUpperInvariant();
            account.AccountStatus = status;
            account.UpdatedAtUtc = timeProvider.GetUtcNow().UtcDateTime;

            if (status == "CLOSED")
            {
                account.ClosedAtUtc = timeProvider.GetUtcNow().UtcDateTime;
            }
            else
            {
                account.ClosedAtUtc = null;
            }

            await context.SaveChangesAsync(cancellationToken);

            return Ok(new
            {
                message = $"Account status updated to {request.Status}",
                account = new
                {
                    id = account.AccountId,
                    status = account.AccountStatus
                }
            });
        }

        [HttpGet("transactions")]
        public async Task<IActionResult> GetAllTransactions(CancellationToken cancellationToken)
        {
            var transfers = await context.Transfers
                .AsNoTracking()
                .OrderByDescending(t => t.CreatedAtUtc)
                .ToListAsync(cancellationToken);

            var accountIds = transfers.Select(t => t.FromAccountId).Union(transfers.Select(t => t.ToAccountId)).Distinct().ToList();
            var accounts = await context.BankAccounts
                .AsNoTracking()
                .Where(a => accountIds.Contains(a.AccountId))
                .Include(a => a.User)
                .ToDictionaryAsync(a => a.AccountId, cancellationToken);

            var transactionsList = transfers.Select(t =>
            {
                var fromAcc = accounts.GetValueOrDefault(t.FromAccountId);
                var toAcc = accounts.GetValueOrDefault(t.ToAccountId);

                return new
                {
                    _id = t.TransferId,
                    id = t.TransferId,
                    FromAccount = fromAcc != null ? new
                    {
                        _id = fromAcc.AccountId,
                        accountType = fromAcc.AccountType,
                        user = new { username = fromAcc.User?.UserName, email = fromAcc.User?.Email }
                    } : null,
                    toAccount = toAcc != null ? new
                    {
                        _id = toAcc.AccountId,
                        accountType = toAcc.AccountType,
                        user = new { username = toAcc.User?.UserName, email = toAcc.User?.Email }
                    } : null,
                    amount = t.Amount,
                    status = t.TransferStatus,
                    createdAt = t.CreatedAtUtc
                };
            }).ToList();

            return Ok(new
            {
                status = "success",
                results = transactionsList.Count,
                transactions = transactionsList
            });
        }

        [HttpPost("transactions/{transactionId}/reverse")]
        public async Task<IActionResult> ReverseTransaction(
            Guid transactionId,
            CancellationToken cancellationToken)
        {
            var adminIdClaim = User.FindFirst("userid")?.Value;
            if (adminIdClaim == null || !Guid.TryParse(adminIdClaim, out var adminUserId))
            {
                return Unauthorized(new { message = "Unauthorized access" });
            }

            var txn = await context.Transfers
                .FirstOrDefaultAsync(t => t.TransferId == transactionId, cancellationToken);

            if (txn == null)
            {
                return NotFound(new { message = "Transaction not found" });
            }

            if (txn.TransferStatus == "REVERSED")
            {
                return BadRequest(new { message = "Transaction is already reversed" });
            }

            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
            var userAgent = Request.Headers.UserAgent.ToString();
            var idempotencyKey = $"reversal-{transactionId}-{DateTimeOffset.UtcNow.Ticks}";

            try
            {
                var originalTransferIdParam = new SqlParameter("@OriginalTransferId", transactionId);
                var idempotencyKeyParam = new SqlParameter("@IdempotencyKey", idempotencyKey);
                var reversedByParam = new SqlParameter("@ReversedByUserId", adminUserId);
                var reasonParam = new SqlParameter("@Reason", "Reversed by administrator");
                var ipParam = new SqlParameter("@ClientIpAddress", ipAddress);
                var uaParam = new SqlParameter("@UserAgent", userAgent);

                var reversalTransferIdParam = new SqlParameter("@ReversalTransferId", SqlDbType.UniqueIdentifier)
                {
                    Direction = ParameterDirection.Output
                };

                await context.Database.ExecuteSqlRawAsync(
                    "DECLARE @RId UNIQUEIDENTIFIER; EXEC [Banking].[usp_ReverseTransfer] @OriginalTransferId, @IdempotencyKey, @ReversedByUserId, @Reason, @ClientIpAddress, @UserAgent, @RId OUTPUT; SET @ReversalTransferId = @RId;",
                    originalTransferIdParam, idempotencyKeyParam, reversedByParam, reasonParam, ipParam, uaParam, reversalTransferIdParam);

                var generatedId = (Guid)reversalTransferIdParam.Value;

                var completedReversal = await context.Transfers
                    .FirstOrDefaultAsync(t => t.TransferId == generatedId, cancellationToken);

                return Ok(new
                {
                    message = "Transaction reversed successfully",
                    transaction = new
                    {
                        id = txn.TransferId,
                        status = "Reversed"
                    }
                });
            }
            catch (SqlException ex) when (ex.Number is >= 51000 and <= 51036)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    message = "Reversal failed",
                    error = ex.Message
                });
            }
        }

        [HttpDelete("kyc/{kycId}")]
        public async Task<IActionResult> DeleteKycApplication(Guid kycId, CancellationToken cancellationToken)
        {
            var kycRecord = await context.KycApplications
                .Include(k => k.KycAddress)
                .Include(k => k.KycDocuments)
                .FirstOrDefaultAsync(k => k.KycApplicationId == kycId, cancellationToken);

            if (kycRecord == null)
            {
                return NotFound(new { message = "KYC application not found", status = "failed" });
            }

            if (kycRecord.KycStatus == "Pending")
            {
                return BadRequest(new { message = "Cannot delete a pending KYC application. Approve or reject it first.", status = "failed" });
            }

            // Remove associated address and documents
            if (kycRecord.KycAddress != null)
            {
                context.KycAddresses.Remove(kycRecord.KycAddress);
            }
            context.KycDocuments.RemoveRange(kycRecord.KycDocuments);

            context.KycApplications.Remove(kycRecord);
            await context.SaveChangesAsync(cancellationToken);

            return Ok(new
            {
                message = "KYC application deleted successfully. User can now re-submit KYC.",
                status = "success"
            });
        }
    }
}
