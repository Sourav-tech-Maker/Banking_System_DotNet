using System;
using System.Linq;
using System.Security.Cryptography;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using BankingSystem.Api.Data;
using BankingSystem.Api.DTOs.Transaction;
using BankingSystem.Api.Middleware;
using BankingSystem.Api.Models.Banking;
using BankingSystem.Api.Models.Integration;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace BankingSystem.Api.Services
{
    public sealed class TransferOtpService(
        AppDbContext context,
        ITokenService tokenService,
        TimeProvider timeProvider) : ITransferOtpService
    {
        public async Task<InitiateTransferResponse> InitiateTransferOtpAsync(
            Guid userId,
            InitiateTransferRequest request,
            CancellationToken cancellationToken)
        {
            if (request == null ||
                request.FromAccount == Guid.Empty ||
                request.ToAccount == Guid.Empty ||
                request.Amount <= 0 ||
                string.IsNullOrWhiteSpace(request.IdempotencyKey))
            {
                throw new ApiException(StatusCodes.Status400BadRequest, "Missing required fields: fromAccount, toAccount, amount, idempotencyKey");
            }

            if (request.FromAccount == request.ToAccount)
            {
                throw new ApiException(StatusCodes.Status400BadRequest, "Cannot transfer funds to the same account.");
            }

            // Verify sender account exists and belongs to user
            var senderAccount = await context.BankAccounts
                .AsNoTracking()
                .FirstOrDefaultAsync(acc => acc.AccountId == request.FromAccount && acc.UserId == userId, cancellationToken);

            if (senderAccount == null)
            {
                throw new ApiException(StatusCodes.Status403Forbidden, "Sender account does not exist or does not belong to you.");
            }

            if (!string.Equals(senderAccount.AccountStatus, "ACTIVE", StringComparison.OrdinalIgnoreCase))
            {
                throw new ApiException(StatusCodes.Status400BadRequest, "Sender account is not active.");
            }

            // Verify recipient account exists
            var recipientAccount = await context.BankAccounts
                .AsNoTracking()
                .Include(acc => acc.User)
                .FirstOrDefaultAsync(acc => acc.AccountId == request.ToAccount, cancellationToken);

            if (recipientAccount == null)
            {
                throw new ApiException(StatusCodes.Status404NotFound, "Recipient account not found.");
            }

            // Verify sender user exists
            var user = await context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.UserId == userId, cancellationToken);

            if (user == null)
            {
                throw new ApiException(StatusCodes.Status401Unauthorized, "User not found.");
            }

            // Check current account balance
            var balanceView = await context.BankAccountBalanceViews
                .AsNoTracking()
                .FirstOrDefaultAsync(v => v.AccountId == request.FromAccount, cancellationToken);

            var availableBalance = balanceView?.CurrentBalance ?? 0m;
            if (availableBalance < request.Amount)
            {
                throw new ApiException(StatusCodes.Status400BadRequest, $"Insufficient balance. Available balance: ₹{availableBalance:F2}, requested: ₹{request.Amount:F2}");
            }

            var now = timeProvider.GetUtcNow().UtcDateTime;
            var otpCode = RandomNumberGenerator.GetInt32(100_000, 1_000_000).ToString();
            var expiresAt = now.AddMinutes(5);

            var session = new TransferOtpSession
            {
                SessionId = Guid.NewGuid(),
                UserId = userId,
                FromAccountId = request.FromAccount,
                ToAccountId = request.ToAccount,
                Amount = request.Amount,
                IdempotencyKey = request.IdempotencyKey,
                CodeHash = tokenService.HashToken(otpCode),
                AttemptCount = 0,
                MaxAttempts = 3,
                ExpiresAtUtc = expiresAt,
                IsConsumed = false,
                CreatedAtUtc = now
            };

            context.TransferOtpSessions.Add(session);

            var recipientName = recipientAccount.User?.UserName ?? "Beneficiary";
            var outboxPayload = new
            {
                to = user.Email,
                username = user.UserName,
                recipientName,
                amount = request.Amount,
                otpCode,
                expiresAtUtc = expiresAt
            };

            context.OutboxMessages.Add(new OutboxMessage
            {
                EventType = "TransferOtpRequested",
                AggregateType = "Transfer",
                PayloadJson = JsonSerializer.Serialize(outboxPayload),
                OccurredAtUtc = now,
                AttemptCount = 0
            });

            await context.SaveChangesAsync(cancellationToken);

            return new InitiateTransferResponse
            {
                SessionId = session.SessionId,
                ExpiresAtUtc = expiresAt,
                MaskedEmail = MaskEmail(user.Email),
                Message = $"OTP code sent to {MaskEmail(user.Email)}"
            };
        }

        public async Task<TransferOtpSession> VerifyAndConsumeOtpAsync(
            Guid userId,
            ConfirmTransferRequest request,
            CancellationToken cancellationToken)
        {
            if (request == null || request.SessionId == Guid.Empty || string.IsNullOrWhiteSpace(request.OtpCode))
            {
                throw new ApiException(StatusCodes.Status400BadRequest, "Session ID and OTP code are required.");
            }

            var session = await context.TransferOtpSessions
                .FirstOrDefaultAsync(s => s.SessionId == request.SessionId && s.UserId == userId, cancellationToken);

            if (session == null)
            {
                throw new ApiException(StatusCodes.Status404NotFound, "Transfer OTP session not found.");
            }

            if (session.IsConsumed)
            {
                throw new ApiException(StatusCodes.Status400BadRequest, "This OTP session has already been processed.");
            }

            var now = timeProvider.GetUtcNow().UtcDateTime;
            if (session.ExpiresAtUtc <= now)
            {
                throw new ApiException(StatusCodes.Status400BadRequest, "OTP has expired. Please request a new OTP.");
            }

            if (session.AttemptCount >= session.MaxAttempts)
            {
                throw new ApiException(StatusCodes.Status400BadRequest, "Maximum OTP verification attempts exceeded. Please initiate a new transfer.");
            }

            var submittedHash = tokenService.HashToken(request.OtpCode.Trim());
            if (!submittedHash.SequenceEqual(session.CodeHash))
            {
                session.AttemptCount++;
                await context.SaveChangesAsync(cancellationToken);
                var remaining = session.MaxAttempts - session.AttemptCount;
                throw new ApiException(StatusCodes.Status400BadRequest, remaining > 0 
                    ? $"Invalid OTP code. {remaining} attempt(s) remaining." 
                    : "Invalid OTP code. Maximum attempts reached.");
            }

            session.IsConsumed = true;
            await context.SaveChangesAsync(cancellationToken);

            return session;
        }

        public async Task<InitiateTransferResponse> ResendOtpAsync(
            Guid userId,
            ResendTransferOtpRequest request,
            CancellationToken cancellationToken)
        {
            if (request == null || request.SessionId == Guid.Empty)
            {
                throw new ApiException(StatusCodes.Status400BadRequest, "Session ID is required.");
            }

            var session = await context.TransferOtpSessions
                .FirstOrDefaultAsync(s => s.SessionId == request.SessionId && s.UserId == userId, cancellationToken);

            if (session == null)
            {
                throw new ApiException(StatusCodes.Status404NotFound, "Transfer OTP session not found.");
            }

            if (session.IsConsumed)
            {
                throw new ApiException(StatusCodes.Status400BadRequest, "This transfer session has already been completed.");
            }

            var user = await context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.UserId == userId, cancellationToken);

            if (user == null)
            {
                throw new ApiException(StatusCodes.Status401Unauthorized, "User not found.");
            }

            var recipientAccount = await context.BankAccounts
                .AsNoTracking()
                .Include(acc => acc.User)
                .FirstOrDefaultAsync(acc => acc.AccountId == session.ToAccountId, cancellationToken);

            var now = timeProvider.GetUtcNow().UtcDateTime;
            var newOtpCode = RandomNumberGenerator.GetInt32(100_000, 1_000_000).ToString();
            var newExpiresAt = now.AddMinutes(5);

            session.CodeHash = tokenService.HashToken(newOtpCode);
            session.AttemptCount = 0;
            session.ExpiresAtUtc = newExpiresAt;

            var recipientName = recipientAccount?.User?.UserName ?? "Beneficiary";
            var outboxPayload = new
            {
                to = user.Email,
                username = user.UserName,
                recipientName,
                amount = session.Amount,
                otpCode = newOtpCode,
                expiresAtUtc = newExpiresAt
            };

            context.OutboxMessages.Add(new OutboxMessage
            {
                EventType = "TransferOtpRequested",
                AggregateType = "Transfer",
                PayloadJson = JsonSerializer.Serialize(outboxPayload),
                OccurredAtUtc = now,
                AttemptCount = 0
            });

            await context.SaveChangesAsync(cancellationToken);

            return new InitiateTransferResponse
            {
                SessionId = session.SessionId,
                ExpiresAtUtc = newExpiresAt,
                MaskedEmail = MaskEmail(user.Email),
                Message = $"A new OTP code has been sent to {MaskEmail(user.Email)}"
            };
        }

        private static string MaskEmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
                return email;

            var parts = email.Split('@');
            var name = parts[0];
            var domain = parts[1];

            if (name.Length <= 2)
                return $"{name[0]}*@{domain}";

            return $"{name[0]}{new string('*', name.Length - 2)}{name[^1]}@{domain}";
        }
    }
}
