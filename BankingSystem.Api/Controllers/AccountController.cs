using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BankingSystem.Api.Data;
using BankingSystem.Api.Models.Banking;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BankingSystem.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public sealed class AccountController(AppDbContext context, TimeProvider timeProvider) : ControllerBase
    {
        [HttpPost]
        public async Task<IActionResult> CreateAccount(CancellationToken cancellationToken)
        {
            var userIdClaim = User.FindFirst("userid")?.Value;
            if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "Unauthorized access" });
            }

            // Check KYC status
            var kycRecord = await context.KycApplications
                .AsNoTracking()
                .FirstOrDefaultAsync(k => k.UserId == userId, cancellationToken);

            if (kycRecord == null)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    message = "Account creation blocked. You must submit your KYC details first.",
                    status = "failed"
                });
            }

            if (kycRecord.KycStatus != "APPROVED")
            {
                if (kycRecord.KycStatus == "REJECTED")
                {
                    return StatusCode(StatusCodes.Status403Forbidden, new
                    {
                        message = "Account creation blocked. Your KYC application was rejected.",
                        reason = kycRecord.RejectionReason,
                        status = "failed"
                    });
                }

                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    message = "Account creation blocked. Your KYC verification is currently pending by admin approval.",
                    status = "failed"
                });
            }

            var now = timeProvider.GetUtcNow().UtcDateTime;

            var account = new BankAccount
            {
                AccountId = Guid.NewGuid(),
                UserId = userId,
                AccountType = "Savings",
                AccountStatus = "ACTIVE",
                AccountPurpose = "CUSTOMER",
                CurrencyCode = "INR",
                OpenedAtUtc = now,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            };

            context.BankAccounts.Add(account);
            await context.SaveChangesAsync(cancellationToken);

            return StatusCode(StatusCodes.Status201Created, new
            {
                message = "Bank account created successfully.",
                status = "success",
                account = new
                {
                    id = account.AccountId,
                    user = account.UserId,
                    accountType = account.AccountType,
                    status = account.AccountStatus,
                    currency = account.CurrencyCode,
                    isKycVerified = true
                }
            });
        }

        [HttpGet]
        public async Task<IActionResult> GetAccountDetails(CancellationToken cancellationToken)
        {
            var userIdClaim = User.FindFirst("userid")?.Value;
            if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "Unauthorized access" });
            }

            // Query vwAccountBalances
            var balances = await context.BankAccountBalanceViews
                .AsNoTracking()
                .Where(v => v.UserId == userId)
                .ToListAsync(cancellationToken);

            var accountsResponse = balances.Select(b => new
            {
                _id = b.AccountId, // Match MERN's _id format
                id = b.AccountId,
                user = b.UserId,
                accountType = b.AccountType,
                status = b.AccountStatus,
                currency = b.CurrencyCode,
                isKycVerified = true, // Approved KYC required to create accounts
                balance = b.CurrentBalance
            }).ToList();

            return Ok(new { accounts = accountsResponse });
        }

        [HttpGet("balance/{accountId}")]
        public async Task<IActionResult> GetAccountBalance(Guid accountId, CancellationToken cancellationToken)
        {
            var userIdClaim = User.FindFirst("userid")?.Value;
            if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "Unauthorized access" });
            }

            var balanceView = await context.BankAccountBalanceViews
                .AsNoTracking()
                .FirstOrDefaultAsync(v => v.AccountId == accountId && v.UserId == userId, cancellationToken);

            if (balanceView == null)
            {
                return NotFound(new { message = "Account not found" });
            }

            return Ok(new
            {
                accountId = balanceView.AccountId,
                balance = balanceView.CurrentBalance
            });
        }
    }
}
