using BankingSystem.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BankingSystem.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public sealed class UserController(AppDbContext context, TimeProvider timeProvider) : ControllerBase
{
        public sealed record ChangePasswordRequest(string CurrentPassword, string NewPassword);
        public sealed record UpdateProfileRequest(string Username);

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
                    fullName = kyc.FullName,
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

        [HttpPut("password")]
        public async Task<IActionResult> ChangePassword(
            [FromBody] ChangePasswordRequest request,
            CancellationToken cancellationToken)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.CurrentPassword) || string.IsNullOrWhiteSpace(request.NewPassword))
            {
                return BadRequest(new { message = "Current password and new password are required." });
            }

            if (request.NewPassword.Length < 8)
            {
                return BadRequest(new { message = "New password must be at least 8 characters long." });
            }

            var userIdClaim = User.FindFirst("userid")?.Value;
            if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "Unauthorized access" });
            }

            var user = await context.Users.FirstOrDefaultAsync(u => u.UserId == userId, cancellationToken);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            {
                return BadRequest(new { message = "Incorrect current password." });
            }

            var now = timeProvider.GetUtcNow().UtcDateTime;
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword, workFactor: 12);
            user.UpdatedAtUtc = now;

            await context.SaveChangesAsync(cancellationToken);

            return Ok(new { message = "Password updated successfully.", status = "success" });
        }

        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile(
            [FromBody] UpdateProfileRequest request,
            CancellationToken cancellationToken)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Username))
            {
                return BadRequest(new { message = "Username is required." });
            }

            var userIdClaim = User.FindFirst("userid")?.Value;
            if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "Unauthorized access" });
            }

            var newUsername = request.Username.Trim();
            var normalized = newUsername.ToUpperInvariant();

            var exists = await context.Users.AnyAsync(u => u.NormalizedUserName == normalized && u.UserId != userId, cancellationToken);
            if (exists)
            {
                return Conflict(new { message = "Username is already taken by another user." });
            }

            var user = await context.Users.FirstOrDefaultAsync(u => u.UserId == userId, cancellationToken);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            var now = timeProvider.GetUtcNow().UtcDateTime;
            user.UserName = newUsername;
            user.UpdatedAtUtc = now;

            await context.SaveChangesAsync(cancellationToken);

            return Ok(new { message = "Profile updated successfully.", username = newUsername, status = "success" });
        }
    }
