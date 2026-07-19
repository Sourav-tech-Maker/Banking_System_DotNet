using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BankingSystem.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BankingSystem.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public sealed class UserController(AppDbContext context) : ControllerBase
    {
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile(CancellationToken cancellationToken)
        {
            var userIdClaim = User.FindFirst("userid")?.Value;
            if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "Unauthorized access" });
            }

            var user = await context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.UserId == userId, cancellationToken);

            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            // Fetch KYC record
            var kyc = await context.KycApplications
                .Include(k => k.KycAddress)
                .Include(k => k.KycDocuments)
                .AsNoTracking()
                .FirstOrDefaultAsync(k => k.UserId == userId, cancellationToken);

            var kycStatus = kyc?.KycStatus ?? "Not Submitted";
            var isKycVerified = kycStatus == "APPROVED";

            // Fetch accounts from view to get balances
            var balances = await context.BankAccountBalanceViews
                .AsNoTracking()
                .Where(v => v.UserId == userId)
                .ToListAsync(cancellationToken);

            var accountsResponse = balances.Select(b => new
            {
                accountId = b.AccountId,
                accountType = b.AccountType,
                status = b.AccountStatus,
                isKycVerified = isKycVerified,
                balance = b.CurrentBalance
            }).ToList();

            var response = new
            {
                user = new
                {
                    id = user.UserId,
                    username = user.UserName,
                    email = user.Email,
                    verified = user.EmailVerified,
                    status = user.UserStatus,
                    createdAt = user.CreatedAtUtc
                },
                kyc = kyc != null ? new
                {
                    status = kyc.KycStatus,
                    FullName = kyc.FullName,
                    dateOfBirth = kyc.DateOfBirth.ToString("yyyy-MM-dd"),
                    gender = kyc.Gender,
                    permanentAddress = kyc.KycAddress != null ? new
                    {
                        street = kyc.KycAddress.Street,
                        city = kyc.KycAddress.City,
                        state = kyc.KycAddress.StateOrProvince,
                        country = kyc.KycAddress.Country,
                        postalCode = kyc.KycAddress.PostalCode
                    } : null,
                    documentType = kyc.KycDocuments.FirstOrDefault()?.DocumentType,
                    documentNumber = kyc.KycDocuments.FirstOrDefault()?.DocumentNumber,
                    documentImg = kyc.KycDocuments.FirstOrDefault()?.DocumentImageUrl,
                    rejectReason = kyc.RejectionReason
                } : null,
                accounts = accountsResponse
            };

            return Ok(response);
        }
    }
}
