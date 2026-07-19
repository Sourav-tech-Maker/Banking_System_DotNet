using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using BankingSystem.Api.Data;
using BankingSystem.Api.DTOs.Beneficiary;
using BankingSystem.Api.Models.Auth;
using BankingSystem.Api.Models.Banking;
using BankingSystem.Api.Models.Integration;
using BankingSystem.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BankingSystem.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public sealed class BeneficiaryController(
        AppDbContext context,
        ITokenService tokenService,
        TimeProvider timeProvider) : ControllerBase
    {
        [HttpPost("add-beneficiary")]
        public async Task<IActionResult> AddBeneficiary(
            [FromBody] AddBeneficiaryRequest request,
            CancellationToken cancellationToken)
        {
            if (request == null ||
                string.IsNullOrWhiteSpace(request.FullName) ||
                string.IsNullOrWhiteSpace(request.NickName) ||
                request.AccountId == Guid.Empty)
            {
                return BadRequest(new { message = "All fields are required", status = "failed" });
            }

            var userIdClaim = User.FindFirst("userid")?.Value;
            if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var ownerUserId))
            {
                return Unauthorized(new { message = "Unauthorized access" });
            }

            // Check target account exists
            var targetAccount = await context.BankAccounts
                .Include(a => a.User)
                .FirstOrDefaultAsync(a => a.AccountId == request.AccountId, cancellationToken);

            if (targetAccount == null)
            {
                return NotFound(new { message = "The beneficiary account does not exist.", status = "failed" });
            }

            // Check if KYC is approved for target user
            var targetUserKyc = await context.KycApplications
                .AsNoTracking()
                .FirstOrDefaultAsync(k => k.UserId == targetAccount.UserId, cancellationToken);

            if (targetUserKyc == null || targetUserKyc.KycStatus != "APPROVED")
            {
                return BadRequest(new
                {
                    message = "You cannot add this beneficiary because their KYC is not verified.",
                    status = "failed"
                });
            }

            if (!targetAccount.AccountStatus.Equals("ACTIVE", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest(new
                {
                    message = "You cannot add this beneficiary because the account is not ACTIVE",
                    status = "failed"
                });
            }

            if (targetAccount.UserId == ownerUserId)
            {
                return BadRequest(new
                {
                    message = "You cannot add your own account as a beneficiary.",
                    status = "failed"
                });
            }

            var existingBeneficiary = await context.Beneficiaries
                .FirstOrDefaultAsync(
                    b => b.OwnerUserId == ownerUserId
                        && b.BeneficiaryAccountId == request.AccountId,
                    cancellationToken);

            if (existingBeneficiary is not null
                && !string.Equals(
                    existingBeneficiary.BeneficiaryStatus,
                    "PENDING",
                    StringComparison.OrdinalIgnoreCase))
            {
                return Conflict(new
                {
                    message = "This beneficiary is already added to your list.",
                    status = "failed"
                });
            }

            var now = timeProvider.GetUtcNow().UtcDateTime;
            var otp = RandomNumberGenerator.GetInt32(100_000, 1_000_000).ToString();
            var otpExpiry = now.AddMinutes(10);
            var beneficiary = existingBeneficiary ?? new Beneficiary
            {
                BeneficiaryId = Guid.NewGuid(),
                OwnerUserId = ownerUserId,
                BeneficiaryAccountId = request.AccountId,
                BeneficiaryStatus = "PENDING",
                CreatedAtUtc = now
            };

            beneficiary.DisplayName = request.FullName.Trim();
            beneficiary.NickName = request.NickName.Trim();
            beneficiary.UpdatedAtUtc = now;

            if (existingBeneficiary is null)
            {
                context.Beneficiaries.Add(beneficiary);
            }
            else
            {
                var previousChallenges = await context.VerificationChallenges
                    .Where(c => c.BeneficiaryId == beneficiary.BeneficiaryId
                        && c.Purpose == "BENEFICIARY_VERIFICATION"
                        && c.ConsumedAtUtc == null)
                    .ToListAsync(cancellationToken);

                foreach (var previousChallenge in previousChallenges)
                {
                    previousChallenge.ConsumedAtUtc = now;
                }
            }
            // Add challenge
            var challenge = new VerificationChallenge
            {
                ChallengeId = Guid.NewGuid(),
                BeneficiaryId = beneficiary.BeneficiaryId,
                Purpose = "BENEFICIARY_VERIFICATION",
                CodeHash = tokenService.HashToken(otp),
                AttemptCount = 0,
                MaximumAttempts = 5,
                ExpiresAtUtc = otpExpiry,
                CreatedAtUtc = now
            };

            context.VerificationChallenges.Add(challenge);

            // Queue the verification email via the transactional outbox.
            var ownerUser = await context.Users.FindAsync([ownerUserId], cancellationToken);
            if (ownerUser is null)
            {
                return Unauthorized(new { message = "The signed-in user no longer exists." });
            }

            var payload = new
            {
                to = ownerUser.Email,
                username = ownerUser.UserName,
                beneficiaryName = beneficiary.DisplayName,
                nickName = beneficiary.NickName,
                accountLastFour = targetAccount.AccountId.ToString("N")[^4..],
                verificationCode = otp,
                expiresAtUtc = otpExpiry
            };

            context.OutboxMessages.Add(new OutboxMessage
            {
                EventType = "BeneficiaryVerificationRequested",
                AggregateType = "Beneficiary",
                AggregateId = beneficiary.BeneficiaryId,
                PayloadJson = JsonSerializer.Serialize(payload),
                OccurredAtUtc = now,
                AttemptCount = 0
            });

            await context.SaveChangesAsync(cancellationToken);

            return StatusCode(StatusCodes.Status201Created, new
            {
                message = "Verification code queued for delivery.",
                status = "success",
                data = new
                {
                    beneficiaryId = beneficiary.BeneficiaryId,
                    isVerified = false,
                    maskedEmail = MaskEmail(ownerUser.Email),
                    expiresAtUtc = otpExpiry
                }
            });
        }

        [HttpPost("verify")]
        public async Task<IActionResult> VerifyBeneficiary(
            [FromBody] VerifyBeneficiaryRequest request,
            CancellationToken cancellationToken)
        {
            if (request == null
                || request.BeneficiaryId == Guid.Empty
                || string.IsNullOrWhiteSpace(request.Otp))
            {
                return BadRequest(new { message = "Please provide both beneficiaryId and OTP" });
            }

            var userIdClaim = User.FindFirst("userid")?.Value;
            if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var ownerUserId))
            {
                return Unauthorized(new { message = "Unauthorized access" });
            }

            var otp = request.Otp.Trim();
            if (otp.Length != 6 || otp.Any(character => !char.IsDigit(character)))
            {
                return BadRequest(new { message = "The verification code must contain exactly 6 digits." });
            }

            var beneficiary = await context.Beneficiaries
                .FirstOrDefaultAsync(
                    b => b.BeneficiaryId == request.BeneficiaryId
                        && b.OwnerUserId == ownerUserId
                        && b.BeneficiaryStatus == "PENDING",
                    cancellationToken);
            if (beneficiary == null)
            {
                return NotFound(new { message = "Beneficiary assignment log not found" });
            }

            var now = timeProvider.GetUtcNow().UtcDateTime;

            var challenge = await context.VerificationChallenges
                .Where(c => c.BeneficiaryId == request.BeneficiaryId && c.Purpose == "BENEFICIARY_VERIFICATION" && c.ConsumedAtUtc == null)
                .OrderByDescending(c => c.CreatedAtUtc)
                .FirstOrDefaultAsync(cancellationToken);

            if (challenge == null)
            {
                return BadRequest(new { message = "Invalid OTP code provided." });
            }

            if (challenge.ExpiresAtUtc < now)
            {
                return BadRequest(new { message = "OTP has expired. Please re-initiate beneficiary setup." });
            }

            var suppliedHash = tokenService.HashToken(otp);
            var hashesMatch = CryptographicOperations.FixedTimeEquals(challenge.CodeHash, suppliedHash);

            if (!hashesMatch || challenge.AttemptCount >= challenge.MaximumAttempts)
            {
                challenge.AttemptCount = Math.Min(challenge.AttemptCount + 1, challenge.MaximumAttempts);
                await context.SaveChangesAsync(cancellationToken);
                return BadRequest(new { message = "Invalid OTP code provided." });
            }

            challenge.ConsumedAtUtc = now;
            beneficiary.BeneficiaryStatus = "ACTIVE";
            beneficiary.VerifiedAtUtc = now;
            beneficiary.UpdatedAtUtc = now;

            await context.SaveChangesAsync(cancellationToken);

            return Ok(new { message = "Beneficiary verified and activated successfully" });
        }

        [HttpGet("get-beneficiary")]
        public async Task<IActionResult> GetBeneficiaries(CancellationToken cancellationToken)
        {
            var userIdClaim = User.FindFirst("userid")?.Value;
            if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var ownerUserId))
            {
                return Unauthorized(new { message = "Unauthorized access" });
            }

            var list = await context.Beneficiaries
                .AsNoTracking()
                .Where(b => b.OwnerUserId == ownerUserId && b.BeneficiaryStatus == "ACTIVE")
                .Join(context.BankAccounts.AsNoTracking(),
                    b => b.BeneficiaryAccountId,
                    a => a.AccountId,
                    (b, a) => new { b, a })
                .Select(x => new
                {
                    _id = x.b.BeneficiaryId, // Match React frontend expect "_id"
                    id = x.b.BeneficiaryId,
                    userId = x.b.OwnerUserId,
                    fullName = x.b.DisplayName,
                    nickName = x.b.NickName,
                    accountId = new
                    {
                        _id = x.a.AccountId,
                        accountType = x.a.AccountType,
                        status = x.a.AccountStatus,
                        currency = x.a.CurrencyCode
                    },
                    bankName = "YONO App",
                    accountType = x.a.AccountType,
                    status = x.b.BeneficiaryStatus,
                    isVerified = true
                })
                .ToListAsync(cancellationToken);

            return Ok(new
            {
                status = "success",
                results = list.Count,
                data = new
                {
                    beneficiaries = list
                }
            });
        }

        [HttpDelete("{beneficiaryId}")]
        public async Task<IActionResult> DeleteBeneficiary(Guid beneficiaryId, CancellationToken cancellationToken)
        {
            var userIdClaim = User.FindFirst("userid")?.Value;
            if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var ownerUserId))
            {
                return Unauthorized(new { message = "Unauthorized access" });
            }

            var beneficiary = await context.Beneficiaries
                .FirstOrDefaultAsync(b => b.BeneficiaryId == beneficiaryId && b.OwnerUserId == ownerUserId, cancellationToken);

            if (beneficiary == null)
            {
                return NotFound(new { message = "Beneficiary not found", status = "failed" });
            }

            // Remove associated challenges
            var challenges = await context.VerificationChallenges
                .Where(c => c.BeneficiaryId == beneficiaryId)
                .ToListAsync(cancellationToken);
            context.VerificationChallenges.RemoveRange(challenges);

            context.Beneficiaries.Remove(beneficiary);
            await context.SaveChangesAsync(cancellationToken);

            return Ok(new
            {
                message = "Beneficiary removed successfully",
                status = "success",
                data = new
                {
                    beneficiaryId = beneficiary.BeneficiaryId
                }
            });
        }
        private static string MaskEmail(string email)
        {
            var atIndex = email.IndexOf('@');
            if (atIndex <= 0)
            {
                return "your registered email";
            }

            var visibleCharacters = Math.Min(2, atIndex);
            var maskedCharacters = Math.Max(3, atIndex - visibleCharacters);
            return $"{email[..visibleCharacters]}{new string('•', maskedCharacters)}{email[atIndex..]}";
        }
    }
}
