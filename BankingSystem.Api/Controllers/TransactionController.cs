using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BankingSystem.Api.Data;
using BankingSystem.Api.DTOs.Transaction;
using BankingSystem.Api.Models.Banking;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace BankingSystem.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public sealed class TransactionController(AppDbContext context) : ControllerBase
    {
        [HttpPost]
        public async Task<IActionResult> CreateTransaction(
            [FromBody] CreateTransactionRequest request,
            CancellationToken cancellationToken)
        {
            if (request == null ||
                request.FromAccount == Guid.Empty ||
                request.ToAccount == Guid.Empty ||
                request.Amount <= 0 ||
                string.IsNullOrWhiteSpace(request.IdempotencyKey))
            {
                return BadRequest(new { message = "Missing required fields: FromAccount, toAccount, amount, idempotencyKey" });
            }

            var userIdClaim = User.FindFirst("userid")?.Value;
            if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "Unauthorized access" });
            }

            // Check if transaction with this idempotency key already exists
            var existingTransfer = await context.Transfers
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.IdempotencyKey == request.IdempotencyKey, cancellationToken);

            if (existingTransfer != null)
            {
                var status = existingTransfer.TransferStatus.ToLowerInvariant();
                if (status == "completed")
                {
                    return Ok(new
                    {
                        message = "Transaction is already processed",
                        transaction = MapTransferResponse(existingTransfer)
                    });
                }
                if (status == "pending")
                {
                    return Ok(new { message = "Transaction is still processing" });
                }
                if (status == "failed")
                {
                    return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Transaction processing failed, please retry" });
                }
                if (status == "reversed")
                {
                    return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Transaction was Reversed, please retry" });
                }
            }

            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
            var userAgent = Request.Headers.UserAgent.ToString();

            try
            {
                var fromAccountIdParam = new SqlParameter("@FromAccountId", request.FromAccount);
                var toAccountIdParam = new SqlParameter("@ToAccountId", request.ToAccount);
                var amountParam = new SqlParameter("@Amount", request.Amount);
                var idempotencyKeyParam = new SqlParameter("@IdempotencyKey", request.IdempotencyKey);
                var initiatedByParam = new SqlParameter("@InitiatedByUserId", userId);
                var paymentMethodParam = new SqlParameter("@PaymentMethod", "NET_BANKING");
                var categoryParam = new SqlParameter("@Category", "PEER_TO_PEER");
                var clientIpParam = new SqlParameter("@ClientIpAddress", ipAddress);
                var userAgentParam = new SqlParameter("@UserAgent", userAgent);

                var transferIdParam = new SqlParameter("@TransferId", SqlDbType.UniqueIdentifier)
                {
                    Direction = ParameterDirection.Output
                };

                await context.Database.ExecuteSqlRawAsync(
                    "DECLARE @TId UNIQUEIDENTIFIER; EXEC [Banking].[usp_PostCustomerTransfer] @FromAccountId, @ToAccountId, @Amount, @IdempotencyKey, @InitiatedByUserId, @PaymentMethod, @Category, NULL, @ClientIpAddress, @UserAgent, @TId OUTPUT; SET @TransferId = @TId;",
                    fromAccountIdParam, toAccountIdParam, amountParam, idempotencyKeyParam, initiatedByParam, paymentMethodParam, categoryParam, clientIpParam, userAgentParam, transferIdParam);

                var generatedId = (Guid)transferIdParam.Value;

                // Load the completed transfer
                var completedTransfer = await context.Transfers
                    .FirstOrDefaultAsync(t => t.TransferId == generatedId, cancellationToken);

                return Ok(new
                {
                    message = "Transaction processed successfully",
                    transaction = MapTransferResponse(completedTransfer!)
                });
            }
            catch (SqlException ex) when (ex.Number is >= 51000 and <= 51036)
            {
                // Return descriptive error messages from DB constraints
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    message = "Transaction processing failed",
                    error = ex.Message
                });
            }
        }

        [HttpPost("system/initial-funds")]
        public async Task<IActionResult> CreateInitialFundsTransaction(
            [FromBody] CreateInitialFundsRequest request,
            CancellationToken cancellationToken)
        {
            if (request == null ||
                request.ToAccount == Guid.Empty ||
                request.Amount <= 0 ||
                string.IsNullOrWhiteSpace(request.IdempotencyKey))
            {
                return BadRequest(new { message = "toAccount, amount and idempotencyKey are required " });
            }

            var userIdClaim = User.FindFirst("userid")?.Value;
            var roleClaim = User.FindFirst("role")?.Value;

            if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId) ||
                (roleClaim != "systemUser" && roleClaim != "admin"))
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { message = "Forbidden access, not a system user" });
            }

            // Find system user's account to use as Treasury
            var treasuryAccount = await context.BankAccounts
                .AsNoTracking()
                .FirstOrDefaultAsync(acc => acc.UserId == userId, cancellationToken);

            if (treasuryAccount == null)
            {
                return NotFound(new { message = "System user account not found" });
            }

            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
            var userAgent = Request.Headers.UserAgent.ToString();

            try
            {
                var treasuryParam = new SqlParameter("@TreasuryAccountId", treasuryAccount.AccountId);
                var customerParam = new SqlParameter("@CustomerAccountId", request.ToAccount);
                var amountParam = new SqlParameter("@Amount", request.Amount);
                var idempotencyParam = new SqlParameter("@IdempotencyKey", request.IdempotencyKey);
                var initiatedParam = new SqlParameter("@InitiatedByUserId", userId);
                var ipParam = new SqlParameter("@ClientIpAddress", ipAddress);
                var uaParam = new SqlParameter("@UserAgent", userAgent);

                var transferIdParam = new SqlParameter("@TransferId", SqlDbType.UniqueIdentifier)
                {
                    Direction = ParameterDirection.Output
                };

                await context.Database.ExecuteSqlRawAsync(
                    "DECLARE @TId UNIQUEIDENTIFIER; EXEC [Banking].[usp_PostInitialFunding] @TreasuryAccountId, @CustomerAccountId, @Amount, @IdempotencyKey, @InitiatedByUserId, N'Initial account funding', @ClientIpAddress, @UserAgent, @TId OUTPUT; SET @TransferId = @TId;",
                    treasuryParam, customerParam, amountParam, idempotencyParam, initiatedParam, ipParam, uaParam, transferIdParam);

                var generatedId = (Guid)transferIdParam.Value;

                var completedTransfer = await context.Transfers
                    .FirstOrDefaultAsync(t => t.TransferId == generatedId, cancellationToken);

                return StatusCode(StatusCodes.Status201Created, new
                {
                    message = "Initial funds added successfully",
                    transaction = MapTransferResponse(completedTransfer!)
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
                    message = "Transaction processing failed",
                    error = ex.Message
                });
            }
        }

        [HttpGet("history")]
        public async Task<IActionResult> GetTransactionHistory(
            [FromQuery] int page = 1,
            [FromQuery] int limit = 20,
            [FromQuery] string type = "all",
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            CancellationToken cancellationToken = default)
        {
            var userIdClaim = User.FindFirst("userid")?.Value;
            if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "Unauthorized access" });
            }

            // Find user's accounts
            var accounts = await context.BankAccounts
                .AsNoTracking()
                .Where(acc => acc.UserId == userId)
                .ToListAsync(cancellationToken);

            var accountIds = accounts.Select(acc => acc.AccountId).ToList();

            if (accountIds.Count == 0)
            {
                return Ok(new
                {
                    transactions = new List<object>(),
                    pagination = new { page, limit, total = 0, pages = 0 }
                });
            }

            // Build query
            var query = context.Transfers.AsNoTracking();

            if (type.Equals("credit", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(t => accountIds.Contains(t.ToAccountId));
            }
            else if (type.Equals("debit", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(t => accountIds.Contains(t.FromAccountId));
            }
            else
            {
                query = query.Where(t => accountIds.Contains(t.FromAccountId) || accountIds.Contains(t.ToAccountId));
            }

            if (startDate.HasValue)
            {
                query = query.Where(t => t.CreatedAtUtc >= startDate.Value);
            }
            if (endDate.HasValue)
            {
                query = query.Where(t => t.CreatedAtUtc <= endDate.Value);
            }

            var total = await query.CountAsync(cancellationToken);
            var pages = (int)Math.Ceiling((double)total / limit);

            var transfers = await query
                .OrderByDescending(t => t.CreatedAtUtc)
                .Skip((page - 1) * limit)
                .Take(limit)
                .ToListAsync(cancellationToken);

            var allTransferAccountIds = transfers.Select(t => t.FromAccountId).Union(transfers.Select(t => t.ToAccountId)).Distinct().ToList();
            var transferAccounts = await context.BankAccounts
                .AsNoTracking()
                .Where(acc => allTransferAccountIds.Contains(acc.AccountId))
                .Include(acc => acc.User)
                .ToDictionaryAsync(acc => acc.AccountId, cancellationToken);

            var mappedTransactions = transfers.Select(txn =>
            {
                var fromAcc = transferAccounts.GetValueOrDefault(txn.FromAccountId);
                var toAcc = transferAccounts.GetValueOrDefault(txn.ToAccountId);

                var isDebit = accountIds.Contains(txn.FromAccountId);
                var fromParty = FormatAccountParty(fromAcc);
                var toParty = FormatAccountParty(toAcc);
                var counterparty = isDebit ? toParty : fromParty;

                return new
                {
                    id = txn.TransferId,
                    amount = txn.Amount,
                    status = txn.TransferStatus.ToLowerInvariant(),
                    direction = isDebit ? "debit" : "credit",
                    title = isDebit ? "Outgoing Transfer" : "Incoming Transfer",
                    fromAccount = fromParty,
                    toAccount = toParty,
                    fromAccountId = txn.FromAccountId,
                    toAccountId = txn.ToAccountId,
                    senderName = fromParty.holderName,
                    receiverName = toParty.holderName,
                    counterparty,
                    category = txn.Category ?? "Bank Transfer",
                    createdAt = txn.CreatedAtUtc,
                    idempotencyKey = txn.IdempotencyKey
                };
            }).ToList();

            return Ok(new
            {
                transactions = mappedTransactions,
                pagination = new
                {
                    page,
                    limit,
                    total,
                    pages,
                    totalPages = pages
                }
            });
        }

        private static dynamic MapTransferResponse(Transfer txn)
        {
            return new
            {
                _id = txn.TransferId, // Map to _id to match MERN
                id = txn.TransferId,
                FromAccount = txn.FromAccountId,
                toAccount = txn.ToAccountId,
                amount = txn.Amount,
                idempotencyKey = txn.IdempotencyKey,
                status = txn.TransferStatus.ToLowerInvariant(),
                createdAt = txn.CreatedAtUtc,
                updatedAt = txn.UpdatedAtUtc
            };
        }

        private static dynamic FormatAccountParty(BankAccount? account)
        {
            if (account == null)
            {
                return new
                {
                    id = (string?)null,
                    holderName = "Unknown account holder",
                    email = "",
                    accountType = "Account",
                    shortAccountId = "Unknown"
                };
            }

            var accountIdStr = account.AccountId.ToString();
            return new
            {
                id = account.AccountId,
                holderName = account.User?.UserName ?? "Account holder",
                email = account.User?.Email ?? "",
                accountType = account.AccountType,
                shortAccountId = $"A/C {accountIdStr[^6..].ToUpperInvariant()}"
            };
        }
    }
}
