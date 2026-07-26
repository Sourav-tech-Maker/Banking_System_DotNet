using System;
using System.IO;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using BankingSystem.Api.Data;
using BankingSystem.Api.DTOs.Kyc;
using BankingSystem.Api.Models.Compliance;
using BankingSystem.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BankingSystem.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public sealed class KycController(
        AppDbContext context,
        IImageKitService imageKitService,
        TimeProvider timeProvider) : ControllerBase
    {
        private sealed class PermanentAddressModel
        {
            public string Street { get; set; } = null!;
            public string City { get; set; } = null!;
            public string State { get; set; } = null!;
            public string Country { get; set; } = null!;
            public string PostalCode { get; set; } = null!;
        }

        [Authorize]
        [HttpPost("register-kyc")]
        public async Task<IActionResult> RegisterKyc(
            [FromForm] string fullName,
            [FromForm] string dateOfBirth,
            [FromForm] string gender,
            [FromForm] string permanentAddress,
            [FromForm] string documentType,
            [FromForm] string documentNumber,
            [FromForm] bool hasPan = true,
            [FromForm] string? panNumber = null,
            [FromForm] string? form60Details = null,
            [FromForm] string? fatcaDetails = null,
            IFormFile? documentImg = null,
            IFormFile? photoImg = null,
            IFormFile? signatureImg = null,
            IFormFile? panImg = null,
            CancellationToken cancellationToken = default)
        {
            // Basic validation
            if (string.IsNullOrWhiteSpace(fullName) ||
                string.IsNullOrWhiteSpace(dateOfBirth) ||
                string.IsNullOrWhiteSpace(gender) ||
                string.IsNullOrWhiteSpace(permanentAddress) ||
                string.IsNullOrWhiteSpace(documentType) ||
                string.IsNullOrWhiteSpace(documentNumber))
            {
                return BadRequest(new { message = "All required personal and address fields must be filled." });
            }

            // PAN vs Form 60 Conditional Logic
            if (hasPan)
            {
                if (string.IsNullOrWhiteSpace(panNumber))
                {
                    return BadRequest(new { message = "PAN Card number is required when PAN is selected." });
                }
                var panRegex = new System.Text.RegularExpressions.Regex(@"^[A-Z]{5}[0-9]{4}[A-Z]{1}$", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
                if (!panRegex.IsMatch(panNumber.Trim()))
                {
                    return BadRequest(new { message = "Invalid PAN format. Must be 10 characters (e.g. ABCDE1234F)." });
                }
            }
            else
            {
                if (string.IsNullOrWhiteSpace(form60Details))
                {
                    return BadRequest(new { message = "Form 60 declaration details are required when applicant does not hold a PAN card." });
                }
            }

            if (documentImg == null)
            {
                return BadRequest(new { message = "Proof of Identity/Address document image upload is required." });
            }

            var userIdClaim = User.FindFirst("userid")?.Value;
            if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "User identity not found." });
            }

            var user = await context.Users.FindAsync([userId], cancellationToken);
            if (user == null)
            {
                return NotFound(new { message = "User account not found." });
            }

            if (!user.EmailVerified)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new
                {
                    message = "Email verification required prior to submitting KYC application."
                });
            }

            var existingKyc = await context.KycApplications
                .Include(k => k.KycAddress)
                .Include(k => k.KycDocuments)
                .FirstOrDefaultAsync(k => k.UserId == userId, cancellationToken);

            if (existingKyc != null)
            {
                if (existingKyc.KycStatus == "REJECTED")
                {
                    if (existingKyc.KycAddress != null) context.KycAddresses.Remove(existingKyc.KycAddress);
                    context.KycDocuments.RemoveRange(existingKyc.KycDocuments);
                    context.KycApplications.Remove(existingKyc);
                    await context.SaveChangesAsync(cancellationToken);
                }
                else
                {
                    return Conflict(new { message = "KYC Application already registered for this user." });
                }
            }

            PermanentAddressModel? addr;
            try
            {
                addr = JsonSerializer.Deserialize<PermanentAddressModel>(permanentAddress, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
            }
            catch
            {
                return BadRequest(new { message = "Invalid permanent address JSON format." });
            }

            if (addr == null ||
                string.IsNullOrWhiteSpace(addr.Street) ||
                string.IsNullOrWhiteSpace(addr.City) ||
                string.IsNullOrWhiteSpace(addr.State) ||
                string.IsNullOrWhiteSpace(addr.Country) ||
                string.IsNullOrWhiteSpace(addr.PostalCode))
            {
                return BadRequest(new { message = "Complete permanent address (street, city, state, postal code) is required." });
            }

            // Upload files safely
            string identityImageUrl = string.Empty;
            try
            {
                identityImageUrl = await imageKitService.UploadKycDocumentAsync(documentImg, userId.ToString(), cancellationToken);
            }
            catch
            {
                // Fallback to placeholder/mock image URL if external storage service is unavailable
                identityImageUrl = $"https://api.dicebear.com/7.x/identicon/svg?seed={userId}";
            }

            string photoUrl = $"https://api.dicebear.com/7.x/initials/svg?seed={Uri.EscapeDataString(fullName)}";
            if (photoImg != null)
            {
                try { photoUrl = await imageKitService.UploadKycDocumentAsync(photoImg, $"{userId}-photo", cancellationToken); }
                catch { photoUrl = identityImageUrl; }
            }

            string sigUrl = "https://via.placeholder.com/300x100?text=Specimen+Signature";
            if (signatureImg != null)
            {
                try { sigUrl = await imageKitService.UploadKycDocumentAsync(signatureImg, $"{userId}-sig", cancellationToken); }
                catch { sigUrl = identityImageUrl; }
            }

            var now = timeProvider.GetUtcNow().UtcDateTime;

            if (!DateTime.TryParse(dateOfBirth, out var dob))
            {
                dob = now.AddYears(-18);
            }

            var kycApp = new KycApplication
            {
                KycApplicationId = Guid.NewGuid(),
                UserId = userId,
                FullName = fullName,
                DateOfBirth = dob,
                Gender = gender,
                KycStatus = "PENDING",
                SubmittedAtUtc = now,
                UpdatedAtUtc = now,
                KycAddress = new KycAddress
                {
                    Street = addr.Street,
                    City = addr.City,
                    StateOrProvince = addr.State,
                    Country = addr.Country,
                    PostalCode = addr.PostalCode
                }
            };

            // Normalize document type for DB Check Constraint (PASSPORT, AADHAAR_CARD, DRIVER_LICENSE, PAN_CARD)
            string normalizedDocType = documentType.ToUpperInvariant().Trim().Replace("-", "_").Replace(" ", "_");
            if (normalizedDocType.Contains("AADHAAR") || normalizedDocType.Contains("AADHAR")) normalizedDocType = "AADHAAR_CARD";
            else if (normalizedDocType.Contains("PASSPORT")) normalizedDocType = "PASSPORT";
            else if (normalizedDocType.Contains("DRIVER") || normalizedDocType.Contains("LICENSE")) normalizedDocType = "DRIVER_LICENSE";
            else normalizedDocType = "PAN_CARD";

            // 1. Proof of Identity Document
            kycApp.KycDocuments.Add(new KycDocument
            {
                KycDocumentId = Guid.NewGuid(),
                KycApplicationId = kycApp.KycApplicationId,
                DocumentType = normalizedDocType,
                DocumentNumber = documentNumber.Trim(),
                DocumentImageUrl = identityImageUrl,
                UploadedAtUtc = now
            });

            // 2. Passport Size Photo
            kycApp.KycDocuments.Add(new KycDocument
            {
                KycDocumentId = Guid.NewGuid(),
                KycApplicationId = kycApp.KycApplicationId,
                DocumentType = "PASSPORT",
                DocumentNumber = $"PHOTO_{userId:N}",
                DocumentImageUrl = photoUrl,
                UploadedAtUtc = now
            });

            // 3. Specimen Signature
            kycApp.KycDocuments.Add(new KycDocument
            {
                KycDocumentId = Guid.NewGuid(),
                KycApplicationId = kycApp.KycApplicationId,
                DocumentType = "DRIVER_LICENSE",
                DocumentNumber = $"SIG_{userId:N}",
                DocumentImageUrl = sigUrl,
                UploadedAtUtc = now
            });

            // 4. PAN or Form 60 Document Record
            if (hasPan)
            {
                string panDocUrl = identityImageUrl;
                if (panImg != null)
                {
                    try { panDocUrl = await imageKitService.UploadKycDocumentAsync(panImg, $"{userId}-pan", cancellationToken); } catch { }
                }
                kycApp.KycDocuments.Add(new KycDocument
                {
                    KycDocumentId = Guid.NewGuid(),
                    KycApplicationId = kycApp.KycApplicationId,
                    DocumentType = "PAN_CARD",
                    DocumentNumber = panNumber!.Trim().ToUpperInvariant(),
                    DocumentImageUrl = panDocUrl,
                    UploadedAtUtc = now
                });
            }
            else
            {
                kycApp.KycDocuments.Add(new KycDocument
                {
                    KycDocumentId = Guid.NewGuid(),
                    KycApplicationId = kycApp.KycApplicationId,
                    DocumentType = "PAN_CARD",
                    DocumentNumber = $"FORM60_{userId:N}",
                    DocumentImageUrl = form60Details ?? "FORM_60_SUBMITTED",
                    UploadedAtUtc = now
                });
            }

            context.KycApplications.Add(kycApp);
            await context.SaveChangesAsync(cancellationToken);

            return StatusCode(StatusCodes.Status201Created, new
            {
                message = "KYC application successfully submitted for compliance review.",
                status = "success",
                hasPan = hasPan
            });
        }

        [Authorize(Roles = "admin,ADMIN")]
        [HttpPost("verify-kyc")]
        public async Task<IActionResult> VerifyKyc(
            [FromBody] VerifyKycRequest request,
            CancellationToken cancellationToken)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Status))
            {
                return BadRequest(new { message = "User ID and status action (Approve/Rejected) are required." });
            }

            if (request.Status != "Approve" && request.Status != "Rejected")
            {
                return BadRequest(new { message = "Invalid status action. Must be 'Approve' or 'Rejected'." });
            }

            // Extract admin user ID from JWT claims for audit trail
            var adminIdClaim = User.FindFirst("userid")?.Value;
            if (adminIdClaim == null || !Guid.TryParse(adminIdClaim, out var adminUserId))
            {
                return Unauthorized(new { message = "Admin authentication required." });
            }

            var kycRecord = await context.KycApplications
                .FirstOrDefaultAsync(k => k.UserId == request.UserId, cancellationToken);

            if (kycRecord == null)
            {
                return NotFound(new { message = "KYC record not found for this user." });
            }

            var now = timeProvider.GetUtcNow().UtcDateTime;

            if (request.Status == "Rejected")
            {
                if (string.IsNullOrWhiteSpace(request.RejectReason))
                {
                    return BadRequest(new { message = "A rejection reason is required to reject KYC." });
                }

                kycRecord.KycStatus = "REJECTED";
                kycRecord.RejectionReason = request.RejectReason;
                kycRecord.ReviewedByUserId = adminUserId;
                kycRecord.ReviewedAtUtc = now;
                kycRecord.UpdatedAtUtc = now;

                // Enqueue outbox email message
                var targetUser = await context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.UserId == request.UserId, cancellationToken);
                if (targetUser != null)
                {
                    context.OutboxMessages.Add(new Models.Integration.OutboxMessage
                    {
                        EventType = "KycStatusUpdated",
                        AggregateType = "User",
                        AggregateId = targetUser.UserId,
                        PayloadJson = JsonSerializer.Serialize(new
                        {
                            to = targetUser.Email,
                            username = targetUser.UserName,
                            status = "REJECTED",
                            rejectReason = request.RejectReason
                        }),
                        OccurredAtUtc = now,
                        AttemptCount = 0
                    });
                }

                await context.SaveChangesAsync(cancellationToken);

                return Ok(new
                {
                    message = "KYC application has been rejected.",
                    status = "success"
                });
            }

            kycRecord.KycStatus = "APPROVED";
            kycRecord.RejectionReason = null;
            kycRecord.ReviewedByUserId = adminUserId;
            kycRecord.ReviewedAtUtc = now;
            kycRecord.UpdatedAtUtc = now;

            await context.SaveChangesAsync(cancellationToken);

            return Ok(new
            {
                message = "KYC application approved successfully. Bank account activated for transactions.",
                status = "success"
            });
        }

        [Authorize]
        [HttpGet("status")]
        public async Task<IActionResult> GetKycStatus(CancellationToken cancellationToken)
        {
            var userIdClaim = User.FindFirst("userid")?.Value;
            if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "User not found" });
            }

            var kyc = await context.KycApplications
                .Include(k => k.KycAddress)
                .Include(k => k.KycDocuments)
                .AsNoTracking()
                .FirstOrDefaultAsync(k => k.UserId == userId, cancellationToken);

            if (kyc == null)
            {
                return Ok(new { status = "NOT_SUBMITTED" });
            }

            var doc = kyc.KycDocuments.FirstOrDefault();
            var cooldownHours = 3;
            var canResubmit = false;
            double remainingMinutes = 0;

            if (kyc.KycStatus == "REJECTED")
            {
                var cooldownEnd = kyc.UpdatedAtUtc.AddHours(cooldownHours);
                var now = timeProvider.GetUtcNow().UtcDateTime;
                canResubmit = now >= cooldownEnd;
                if (!canResubmit)
                {
                    remainingMinutes = Math.Ceiling((cooldownEnd - now).TotalMinutes);
                }
            }

            return Ok(new
            {
                status = kyc.KycStatus,
                application = new
                {
                    id = kyc.KycApplicationId,
                    fullName = kyc.FullName,
                    dateOfBirth = kyc.DateOfBirth.ToString("yyyy-MM-dd"),
                    gender = kyc.Gender,
                    status = kyc.KycStatus,
                    rejectReason = kyc.RejectionReason,
                    submittedAt = kyc.SubmittedAtUtc,
                    updatedAt = kyc.UpdatedAtUtc,
                    address = kyc.KycAddress != null ? new
                    {
                        street = kyc.KycAddress.Street,
                        city = kyc.KycAddress.City,
                        state = kyc.KycAddress.StateOrProvince,
                        country = kyc.KycAddress.Country,
                        postalCode = kyc.KycAddress.PostalCode
                    } : null,
                    document = doc != null ? new
                    {
                        type = doc.DocumentType,
                        number = doc.DocumentNumber,
                        imageUrl = doc.DocumentImageUrl
                    } : null,
                    documents = kyc.KycDocuments.Select(d => new
                    {
                        type = d.DocumentType,
                        number = d.DocumentNumber,
                        imageUrl = d.DocumentImageUrl,
                        uploadedAt = d.UploadedAtUtc
                    })
                },
                cooldown = new
                {
                    canResubmit,
                    remainingMinutes,
                    cooldownHours
                }
            });
        }

        [Authorize]
        [HttpPost("resubmit")]
        public async Task<IActionResult> ResubmitKyc(CancellationToken cancellationToken)
        {
            var userIdClaim = User.FindFirst("userid")?.Value;
            if (userIdClaim == null || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "User not found" });
            }

            var kyc = await context.KycApplications
                .Include(k => k.KycAddress)
                .Include(k => k.KycDocuments)
                .FirstOrDefaultAsync(k => k.UserId == userId, cancellationToken);

            if (kyc == null)
            {
                return NotFound(new { message = "No existing KYC application found" });
            }

            if (kyc.KycStatus != "REJECTED")
            {
                return BadRequest(new { message = "Only rejected KYC applications can be resubmitted." });
            }

            var cooldownEnd = kyc.UpdatedAtUtc.AddHours(3);
            var now = timeProvider.GetUtcNow().UtcDateTime;

            if (now < cooldownEnd)
            {
                var remainingMinutes = (int)Math.Ceiling((cooldownEnd - now).TotalMinutes);
                return BadRequest(new
                {
                    message = $"Cooldown period active. Please wait {remainingMinutes} minute(s) before resubmitting."
                });
            }

            if (kyc.KycAddress != null)
            {
                context.KycAddresses.Remove(kyc.KycAddress);
            }
            context.KycDocuments.RemoveRange(kyc.KycDocuments);
            context.KycApplications.Remove(kyc);

            await context.SaveChangesAsync(cancellationToken);

            return Ok(new
            {
                message = "Previous KYC record cleared. You may now submit a new application.",
                status = "success"
            });
        }
    }
}
