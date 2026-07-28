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
    [Authorize(Roles = "admin,ADMIN")]
    [ApiController]
    [Route("api/[controller]")]
    public sealed class AdminController(AppDbContext context, TimeProvider timeProvider, ILogger<AdminController> logger) : ControllerBase
    {
        public sealed class StatusUpdateRequest
        {
            public string Status { get; set; } = null!;
        }

        [HttpGet("kyc-applications")]
        public async Task<IActionResult> GetKycApplications([FromQuery] string? status, CancellationToken cancellationToken)
        {
            try
            {
                var allApps = await context.KycApplications
                    .AsNoTracking()
                    .OrderByDescending(k => k.SubmittedAtUtc)
                    .ToListAsync(cancellationToken);

                IEnumerable<KycApplication> filtered = allApps;

                if (!string.IsNullOrWhiteSpace(status) && !string.Equals(status.Trim(), "all", StringComparison.OrdinalIgnoreCase))
                {
                    var normStatus = status.Trim().ToUpperInvariant();
                    filtered = filtered.Where(k => (k.KycStatus ?? "").Trim().Equals(normStatus, StringComparison.OrdinalIgnoreCase));
                }

                var applications = filtered
                    .OrderBy(k => string.Equals(k.KycStatus, "PENDING", StringComparison.OrdinalIgnoreCase) ? 0 : 1)
                    .ThenByDescending(k => k.SubmittedAtUtc)
                    .ToList();

                var appIds = applications.Select(a => a.KycApplicationId).Distinct().ToList();

                var addressList = appIds.Count > 0
                    ? await context.KycAddresses
                        .AsNoTracking()
                        .Where(a => appIds.Contains(a.KycApplicationId))
                        .ToListAsync(cancellationToken)
                    : new List<KycAddress>();

                var addresses = addressList
                    .GroupBy(a => a.KycApplicationId)
                    .ToDictionary(g => g.Key, g => g.First());

                var documentList = appIds.Count > 0
                    ? await context.KycDocuments
                        .AsNoTracking()
                        .Where(d => appIds.Contains(d.KycApplicationId))
                        .ToListAsync(cancellationToken)
                    : new List<KycDocument>();

                var documentsGrouped = documentList
                    .GroupBy(d => d.KycApplicationId)
                    .ToDictionary(g => g.Key, g => g.ToList());

                var userIds = applications.Select(a => a.UserId).Distinct().ToList();
                var userList = userIds.Count > 0
                    ? await context.Users
                        .AsNoTracking()
                        .Where(u => userIds.Contains(u.UserId))
                        .ToListAsync(cancellationToken)
                    : new List<User>();

                var users = userList
                    .GroupBy(u => u.UserId)
                    .ToDictionary(g => g.Key, g => g.First());


                var responseList = applications.Select(k =>
                {
                    var user = users.GetValueOrDefault(k.UserId);
                    var address = addresses.GetValueOrDefault(k.KycApplicationId);
                    var docs = documentsGrouped.GetValueOrDefault(k.KycApplicationId) ?? new List<KycDocument>();


                    var identityDoc = docs.FirstOrDefault(d =>
                        d.DocumentType != "PAN_CARD" &&
                        (string.IsNullOrEmpty(d.DocumentNumber) ||
                        (!d.DocumentNumber.StartsWith("PHOTO_") &&
                         !d.DocumentNumber.StartsWith("SIG_") &&
                         !d.DocumentNumber.StartsWith("FORM60_"))))
                        ?? docs.FirstOrDefault();

                    var photoDoc = docs.FirstOrDefault(d =>
                        d.DocumentType == "PASSPORT" || d.DocumentType == "PHOTO" ||
                        (!string.IsNullOrEmpty(d.DocumentNumber) && d.DocumentNumber.StartsWith("PHOTO_")));

                    var sigDoc = docs.FirstOrDefault(d =>
                        d.DocumentType == "SIGNATURE" || d.DocumentType == "SIG" ||
                        (!string.IsNullOrEmpty(d.DocumentNumber) && d.DocumentNumber.StartsWith("SIG_")));

                    var panDoc = docs.FirstOrDefault(d =>
                        d.DocumentType == "PAN_CARD" ||
                        (!string.IsNullOrEmpty(d.DocumentNumber) && d.DocumentNumber.StartsWith("FORM60_")));

                    var docList = docs.Select(d => new
                    {
                        id = d.KycDocumentId,
                        documentType = d.DocumentType ?? "IDENTITY_PROOF",
                        documentNumber = d.DocumentNumber ?? "N/A",
                        documentImageUrl = d.DocumentImageUrl ?? string.Empty,
                        documentImg = d.DocumentImageUrl ?? string.Empty,
                        uploadedAt = d.UploadedAtUtc
                    }).ToList();

                    var userObj = user != null ? new { id = user.UserId, _id = user.UserId, username = user.UserName, email = user.Email } : null;

                    return new
                    {
                        _id = k.KycApplicationId,
                        id = k.KycApplicationId,
                        userId = k.UserId,
                        userName = user?.UserName ?? k.FullName ?? "User",
                        email = user?.Email ?? string.Empty,
                        userIdData = userObj,
                        user = userObj,
                        fullName = k.FullName ?? string.Empty,
                        dateOfBirth = k.DateOfBirth == default ? string.Empty : k.DateOfBirth.ToString("yyyy-MM-dd"),
                        gender = k.Gender ?? string.Empty,
                        status = k.KycStatus ?? "PENDING",
                        rejectionReason = k.RejectionReason,
                        submittedAt = k.SubmittedAtUtc != default ? k.SubmittedAtUtc : k.UpdatedAtUtc,
                        createdAt = k.SubmittedAtUtc != default ? k.SubmittedAtUtc : k.UpdatedAtUtc,
                        address = address != null ? new
                        {
                            street = address.Street ?? string.Empty,
                            city = address.City ?? string.Empty,
                            state = address.StateOrProvince ?? string.Empty,
                            country = address.Country ?? string.Empty,
                            postalCode = address.PostalCode ?? string.Empty
                        } : null,
                        permanentAddress = address != null ? new
                        {
                            street = address.Street ?? string.Empty,
                            city = address.City ?? string.Empty,
                            state = address.StateOrProvince ?? string.Empty,
                            country = address.Country ?? string.Empty,
                            postalCode = address.PostalCode ?? string.Empty
                        } : null,
                        documentType = identityDoc?.DocumentType ?? "IDENTITY_PROOF",
                        documentNumber = identityDoc?.DocumentNumber ?? "N/A",
                        documentImageUrl = identityDoc?.DocumentImageUrl ?? string.Empty,
                        documentImg = identityDoc?.DocumentImageUrl ?? string.Empty,
                        photoUrl = photoDoc?.DocumentImageUrl ?? string.Empty,
                        signatureUrl = sigDoc?.DocumentImageUrl ?? string.Empty,
                        panNumber = panDoc?.DocumentNumber ?? string.Empty,
                        panImageUrl = panDoc?.DocumentImageUrl ?? string.Empty,
                        documents = docList
                    };
                }).ToList();

                return Ok(new
                {
                    status = "success",
                    results = responseList.Count,
                    applications = responseList
                });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error occurred in GetKycApplications");
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Failed to load KYC applications", error = ex.Message });
            }
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetAdminStats(CancellationToken cancellationToken)
        {
            var totalUsers = await context.Users.CountAsync(cancellationToken);
            var totalAccounts = await context.BankAccounts.CountAsync(cancellationToken);
            var totalTransactions = await context.Transfers.CountAsync(cancellationToken);

            decimal totalSystemBalance = await context.BankAccountBalanceViews
                .Select(v => (decimal?)v.CurrentBalance)
                .SumAsync(cancellationToken) ?? 0m;

            var pendingKyc = await context.KycApplications.CountAsync(k => k.KycStatus == "PENDING", cancellationToken);
            var approvedKyc = await context.KycApplications.CountAsync(k => k.KycStatus == "APPROVED", cancellationToken);
            var rejectedKyc = await context.KycApplications.CountAsync(k => k.KycStatus == "REJECTED", cancellationToken);
            var totalKyc = pendingKyc + approvedKyc + rejectedKyc;

            var statsObj = new
            {
                totalUsers,
                totalAccounts,
                totalTransactions,
                totalSystemBalance,
                totalKyc,
                pendingKyc,
                approvedKyc,
                rejectedKyc,
                kyc = new
                {
                    pending = pendingKyc,
                    approved = approvedKyc,
                    rejected = rejectedKyc,
                    total = totalKyc
                }
            };

            return Ok(new
            {
                stats = statsObj,
                totalUsers,
                totalAccounts,
                totalTransactions,
                totalSystemBalance,
                totalKyc,
                pendingKyc,
                approvedKyc,
                rejectedKyc,
                kyc = new
                {
                    pending = pendingKyc,
                    approved = approvedKyc,
                    rejected = rejectedKyc,
                    total = totalKyc
                }
            });
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers(CancellationToken cancellationToken)
        {
            var users = await context.Users
                .AsNoTracking()
                .ToListAsync(cancellationToken);

            var userIds = users.Select(u => u.UserId).ToList();

            // Fetch kyc and accounts
            var kycList = await context.KycApplications
                .AsNoTracking()
                .Where(k => userIds.Contains(k.UserId))
                .ToListAsync(cancellationToken);

            var kycRecords = kycList
                .GroupBy(k => k.UserId)
                .ToDictionary(g => g.Key, g => g.OrderByDescending(k => k.SubmittedAtUtc).First());

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
            var accountList = await context.BankAccounts
                .AsNoTracking()
                .Where(a => accountIds.Contains(a.AccountId))
                .Include(a => a.User)
                .ToListAsync(cancellationToken);

            var accounts = accountList
                .GroupBy(a => a.AccountId)
                .ToDictionary(g => g.Key, g => g.First());

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

                // Refresh the original transfer entity from DB to get updated status
                await context.Entry(txn).ReloadAsync(cancellationToken);

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

            if (kycRecord.KycStatus == "PENDING")
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

        [HttpGet("audit-log")]
        public async Task<IActionResult> GetAuditLogs(
            [FromQuery] int page = 1,
            [FromQuery] int limit = 20,
            CancellationToken cancellationToken = default)
        {
            if (page < 1) page = 1;
            if (limit < 1 || limit > 100) limit = 20;

            var query = context.AdminEvents.AsNoTracking();
            var totalCount = await query.CountAsync(cancellationToken);

            var events = await query
                .OrderByDescending(e => e.CreatedAtUtc)
                .Skip((page - 1) * limit)
                .Take(limit)
                .ToListAsync(cancellationToken);

            var adminUserIds = events.Where(e => e.ActorUserId.HasValue).Select(e => e.ActorUserId!.Value).Distinct().ToList();
            var adminList = await context.Users.AsNoTracking()
                .Where(u => adminUserIds.Contains(u.UserId))
                .ToListAsync(cancellationToken);

            var admins = adminList
                .GroupBy(u => u.UserId)
                .ToDictionary(g => g.Key, g => g.First());

            var responseList = events.Select(e =>
            {
                var admin = e.ActorUserId.HasValue ? admins.GetValueOrDefault(e.ActorUserId.Value) : null;
                return new
                {
                    eventId = e.AdminEventId,
                    adminUser = admin?.UserName ?? "System Admin",
                    adminEmail = admin?.Email,
                    eventType = e.EventType,
                    targetEntityId = e.EntityId,
                    details = e.EventDataJson,
                    ipAddress = e.IpAddress,
                    createdAt = e.CreatedAtUtc
                };
            }).ToList();

            return Ok(new
            {
                page,
                limit,
                totalCount,
                totalPages = (int)Math.Ceiling((double)totalCount / limit),
                logs = responseList
            });
        }
    }
}
