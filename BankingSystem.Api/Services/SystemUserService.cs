using System.Text.Json;
using BankingSystem.Api.Data;
using BankingSystem.Api.DTOs.SystemUser;
using BankingSystem.Api.Models.Audit;
using BankingSystem.Api.Models.Banking;
using Microsoft.EntityFrameworkCore;

namespace BankingSystem.Api.Services
{
    public sealed class SystemUserService(AppDbContext context, TimeProvider timeProvider) : ISystemUserService
    {
        private static readonly Dictionary<string, object> SystemSettings = new(StringComparer.OrdinalIgnoreCase)
        {
            ["DailyTransferLimit"] = 1000000.00m,
            ["OperationalThreshold"] = 500000.00m,
            ["MaintenanceMode"] = false,
            ["EnableFraudDetection"] = true,
            ["OtpExpirationMinutes"] = 10,
            ["SessionTimeoutMinutes"] = 30
        };

        public async Task<BankAccount> CreateInternalAccountAsync(
            Guid systemUserId,
            CreateSystemAccountRequest request,
            CancellationToken cancellationToken)
        {
            var isSystemUser = await context.UserRoles
                .AsNoTracking()
                .AnyAsync(ur => ur.UserId == systemUserId &&
                                context.Roles.Any(r => r.RoleId == ur.RoleId && r.NormalizedRoleName == "SYSTEMUSER"),
                    cancellationToken);

            if (!isSystemUser)
            {
                throw new UnauthorizedAccessException("Only authorized SystemUser identities can create internal operational accounts.");
            }

            var existingCount = await context.BankAccounts
                .AsNoTracking()
                .CountAsync(a => a.UserId == systemUserId && a.AccountStatus == "ACTIVE", cancellationToken);

            if (existingCount >= 2)
            {
                throw new InvalidOperationException("SystemUser account limit reached. A SystemUser identity may own a maximum of 2 active internal bank accounts.");
            }

            var now = timeProvider.GetUtcNow().UtcDateTime;
            var account = new BankAccount
            {
                AccountId = Guid.NewGuid(),
                UserId = systemUserId,
                AccountType = string.IsNullOrWhiteSpace(request.AccountType) ? "SAVINGS" : request.AccountType.ToUpperInvariant(),
                AccountStatus = "ACTIVE",
                AccountPurpose = "INTERNAL_OPERATIONAL",
                CurrencyCode = string.IsNullOrWhiteSpace(request.CurrencyCode) ? "INR" : request.CurrencyCode.ToUpperInvariant(),
                OpenedAtUtc = now,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            };

            context.BankAccounts.Add(account);

            var auditEvent = new AdminEvent
            {
                ActorUserId = systemUserId,
                EventType = "SYSTEMUSER_INTERNAL_ACCOUNT_CREATED",
                EntityType = "BankAccount",
                EventDataJson = JsonSerializer.Serialize(new
                {
                    AccountId = account.AccountId,
                    UserId = systemUserId,
                    AccountPurpose = account.AccountPurpose,
                    ExemptionType = "SYSTEMUSER_KYC_EXEMPT",
                    AccountCountAfterCreation = existingCount + 1
                }),
                CreatedAtUtc = now
            };
            context.AdminEvents.Add(auditEvent);

            await context.SaveChangesAsync(cancellationToken);
            return account;
        }

        public async Task<List<object>> GetInternalAccountsAsync(Guid systemUserId, CancellationToken cancellationToken)
        {
            var balances = await context.BankAccountBalanceViews
                .AsNoTracking()
                .Where(v => v.UserId == systemUserId)
                .ToListAsync(cancellationToken);

            return balances.Select(b => (object)new
            {
                id = b.AccountId,
                userId = b.UserId,
                accountNumber = b.AccountNumber,
                accountType = b.AccountType,
                status = b.AccountStatus,
                accountPurpose = b.AccountPurpose,
                currency = b.CurrencyCode,
                balance = b.CurrentBalance,
                isKycExemptInternal = true
            }).ToList();
        }

        public async Task<Transfer> ExecuteInternalTransferAsync(
            Guid systemUserId,
            InternalTransferRequest request,
            string clientIp,
            string userAgent,
            CancellationToken cancellationToken)
        {
            if (request.FromAccount == request.ToAccount)
            {
                throw new ArgumentException("Source and destination accounts must be different.");
            }
            if (request.Amount <= 0)
            {
                throw new ArgumentException("Transfer amount must be greater than zero.");
            }
            if (string.IsNullOrWhiteSpace(request.IdempotencyKey))
            {
                throw new ArgumentException("Idempotency key is required.");
            }

            var existingTransfer = await context.Transfers
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.IdempotencyKey == request.IdempotencyKey, cancellationToken);
            if (existingTransfer != null)
            {
                return existingTransfer;
            }

            var fromAccount = await context.BankAccounts.FirstOrDefaultAsync(a => a.AccountId == request.FromAccount, cancellationToken);
            if (fromAccount == null && request.FromAccount == Guid.Empty)
            {
                fromAccount = await context.BankAccounts.FirstOrDefaultAsync(a => a.AccountType == "SYSTEM_TREASURY" || a.AccountType == "SYSTEM", cancellationToken);
            }
            if (fromAccount == null)
            {
                throw new KeyNotFoundException($"Source account '{request.FromAccount}' was not found in the database.");
            }

            var toAccount = await context.BankAccounts.FirstOrDefaultAsync(a => a.AccountId == request.ToAccount, cancellationToken)
                ?? throw new KeyNotFoundException($"Destination account '{request.ToAccount}' was not found in the database.");

            if (fromAccount.AccountStatus != "ACTIVE" || toAccount.AccountStatus != "ACTIVE")
            {
                throw new InvalidOperationException("Both source and destination accounts must be ACTIVE.");
            }

            var validActorUser = await context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.UserId == systemUserId, cancellationToken);
            Guid? actorUserId = validActorUser?.UserId;
            if (actorUserId == null)
            {
                var fallbackAdmin = await context.Users.AsNoTracking().FirstOrDefaultAsync(cancellationToken);
                actorUserId = fallbackAdmin?.UserId;
            }

            var now = timeProvider.GetUtcNow().UtcDateTime;
            using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                var transfer = new Transfer
                {
                    TransferId = Guid.NewGuid(),
                    TransferReference = "TXN-" + Guid.NewGuid().ToString("N")[..16].ToUpperInvariant(),
                    IdempotencyKey = request.IdempotencyKey,
                    FromAccountId = fromAccount.AccountId,
                    ToAccountId = toAccount.AccountId,
                    Amount = request.Amount,
                    CurrencyCode = fromAccount.CurrencyCode,
                    TransferType = "ADJUSTMENT",
                    TransferStatus = "PENDING",
                    PaymentMethod = "INTERNAL",
                    Category = "FUNDING",
                    Narration = request.Narration ?? "SystemUser internal operational transfer",
                    InitiatedByUserId = actorUserId,
                    ClientIpAddress = clientIp,
                    UserAgent = userAgent,
                    CreatedAtUtc = now,
                    UpdatedAtUtc = now
                };

                context.Transfers.Add(transfer);
                await context.SaveChangesAsync(cancellationToken);

                var tIdParam = new Microsoft.Data.SqlClient.SqlParameter("@TransferId", transfer.TransferId);
                var fromAccParam = new Microsoft.Data.SqlClient.SqlParameter("@FromAccountId", fromAccount.AccountId);
                var toAccParam = new Microsoft.Data.SqlClient.SqlParameter("@ToAccountId", toAccount.AccountId);
                var amountParam = new Microsoft.Data.SqlClient.SqlParameter("@Amount", request.Amount);

                await context.Database.ExecuteSqlRawAsync(
                    @"INSERT INTO [Banking].[LedgerEntries] ([TransferId], [AccountId], [EntrySequence], [EntryType], [Amount]) 
                      VALUES (@TransferId, @FromAccountId, 1, N'DEBIT', @Amount), 
                             (@TransferId, @ToAccountId, 2, N'CREDIT', @Amount);",
                    tIdParam, fromAccParam, toAccParam, amountParam);

                var auditLog = new AdminEvent
                {
                    ActorUserId = actorUserId,
                    EventType = "SYSTEMUSER_INTERNAL_TRANSFER",
                    EntityType = "Transfer",
                    EventDataJson = JsonSerializer.Serialize(new
                    {
                        TransferId = transfer.TransferId,
                        FromAccountId = fromAccount.AccountId,
                        ToAccountId = toAccount.AccountId,
                        Amount = request.Amount,
                        IdempotencyKey = request.IdempotencyKey
                    }),
                    IpAddress = clientIp,
                    UserAgent = userAgent,
                    CreatedAtUtc = now
                };
                context.AdminEvents.Add(auditLog);

                await context.SaveChangesAsync(cancellationToken);

                transfer.TransferStatus = "COMPLETED";
                transfer.CompletedAtUtc = now;
                transfer.UpdatedAtUtc = now;

                await context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                try
                {
                    await TransferEmailHelper.QueueTransferNotificationsAsync(
                        context,
                        fromAccount.AccountId,
                        toAccount.AccountId,
                        request.Amount,
                        transfer.TransferId.ToString(),
                        now,
                        cancellationToken);
                }
                catch
                {
                    // Ignore notification queue failures
                }

                return transfer;
            }
            catch (DbUpdateException ex)
            {
                await transaction.RollbackAsync(cancellationToken);
                throw new InvalidOperationException($"Transfer rejected by database: {ex.InnerException?.Message ?? ex.Message}");
            }
            catch
            {
                await transaction.RollbackAsync(cancellationToken);
                throw;
            }
        }

        public async Task<Transfer> ExecuteOperationalTransferAsync(
            Guid systemUserId,
            OperationalTransferRequest request,
            string clientIp,
            string userAgent,
            CancellationToken cancellationToken)
        {
            if (request.SourceAccount == request.DestinationAccount)
            {
                throw new ArgumentException("Source and destination accounts must be different.");
            }
            if (request.Amount <= 0)
            {
                throw new ArgumentException("Transfer amount must be greater than zero.");
            }
            if (string.IsNullOrWhiteSpace(request.Reason))
            {
                throw new ArgumentException("Operational reason code/description is required for privileged operations.");
            }
            if (string.IsNullOrWhiteSpace(request.IdempotencyKey))
            {
                throw new ArgumentException("Idempotency key is required.");
            }

            var existingTransfer = await context.Transfers
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.IdempotencyKey == request.IdempotencyKey, cancellationToken);
            if (existingTransfer != null)
            {
                return existingTransfer;
            }

            var fromAccount = await context.BankAccounts.FirstOrDefaultAsync(a => a.AccountId == request.SourceAccount, cancellationToken);
            if (fromAccount == null && request.SourceAccount == Guid.Empty)
            {
                fromAccount = await context.BankAccounts.FirstOrDefaultAsync(a => a.AccountType == "SYSTEM_TREASURY" || a.AccountType == "SYSTEM", cancellationToken);
            }
            if (fromAccount == null)
            {
                throw new KeyNotFoundException($"Source account with GUID '{request.SourceAccount}' was not found in the database. Please verify the Source Account GUID.");
            }

            var toAccount = await context.BankAccounts.FirstOrDefaultAsync(a => a.AccountId == request.DestinationAccount, cancellationToken);
            if (toAccount == null)
            {
                throw new KeyNotFoundException($"Destination account with GUID '{request.DestinationAccount}' was not found in the database. Please verify the Destination Account GUID.");
            }

            if (fromAccount.AccountStatus != "ACTIVE" || toAccount.AccountStatus != "ACTIVE")
            {
                throw new InvalidOperationException("Both source and destination accounts must be ACTIVE.");
            }

            var validActorUser = await context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.UserId == systemUserId, cancellationToken);
            Guid? actorUserId = validActorUser?.UserId;
            if (actorUserId == null)
            {
                var fallbackAdmin = await context.Users.AsNoTracking().FirstOrDefaultAsync(cancellationToken);
                actorUserId = fallbackAdmin?.UserId;
            }

            var now = timeProvider.GetUtcNow().UtcDateTime;
            using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                var transfer = new Transfer
                {
                    TransferId = Guid.NewGuid(),
                    TransferReference = "TXN-" + Guid.NewGuid().ToString("N")[..16].ToUpperInvariant(),
                    IdempotencyKey = request.IdempotencyKey,
                    FromAccountId = fromAccount.AccountId,
                    ToAccountId = toAccount.AccountId,
                    Amount = request.Amount,
                    CurrencyCode = fromAccount.CurrencyCode,
                    TransferType = "ADJUSTMENT",
                    TransferStatus = "PENDING",
                    PaymentMethod = "INTERNAL",
                    Category = "FUNDING",
                    Narration = $"[SystemUser Privileged Transfer] Reason: {request.Reason} | CorrelationId: {request.CorrelationId}",
                    InitiatedByUserId = actorUserId,
                    ClientIpAddress = clientIp,
                    UserAgent = userAgent,
                    CreatedAtUtc = now,
                    UpdatedAtUtc = now
                };

                context.Transfers.Add(transfer);
                await context.SaveChangesAsync(cancellationToken);

                var opTIdParam = new Microsoft.Data.SqlClient.SqlParameter("@TransferId", transfer.TransferId);
                var opFromAccParam = new Microsoft.Data.SqlClient.SqlParameter("@FromAccountId", fromAccount.AccountId);
                var opToAccParam = new Microsoft.Data.SqlClient.SqlParameter("@ToAccountId", toAccount.AccountId);
                var opAmountParam = new Microsoft.Data.SqlClient.SqlParameter("@Amount", request.Amount);

                await context.Database.ExecuteSqlRawAsync(
                    @"INSERT INTO [Banking].[LedgerEntries] ([TransferId], [AccountId], [EntrySequence], [EntryType], [Amount]) 
                      VALUES (@TransferId, @FromAccountId, 1, N'DEBIT', @Amount), 
                             (@TransferId, @ToAccountId, 2, N'CREDIT', @Amount);",
                    opTIdParam, opFromAccParam, opToAccParam, opAmountParam);

                var auditLog = new AdminEvent
                {
                    ActorUserId = actorUserId,
                    EventType = "PRIVILEGED_OPERATIONAL_TRANSFER",
                    EntityType = "Transfer",
                    EventDataJson = JsonSerializer.Serialize(new
                    {
                        SystemUserId = actorUserId,
                        AffectedCustomerId = request.AffectedCustomerId,
                        SourceAccount = fromAccount.AccountId,
                        DestinationAccount = toAccount.AccountId,
                        Amount = request.Amount,
                        Reason = request.Reason,
                        OperationType = request.OperationType,
                        CorrelationId = request.CorrelationId,
                        TransactionId = transfer.TransferId,
                        IdempotencyKey = request.IdempotencyKey,
                        TimestampUtc = now
                    }),
                    IpAddress = clientIp,
                    UserAgent = userAgent,
                    CreatedAtUtc = now
                };
                context.AdminEvents.Add(auditLog);

                await context.SaveChangesAsync(cancellationToken);

                transfer.TransferStatus = "COMPLETED";
                transfer.CompletedAtUtc = now;
                transfer.UpdatedAtUtc = now;

                await context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                try
                {
                    await TransferEmailHelper.QueueTransferNotificationsAsync(
                        context,
                        fromAccount.AccountId,
                        toAccount.AccountId,
                        request.Amount,
                        transfer.TransferId.ToString(),
                        now,
                        cancellationToken);
                }
                catch
                {
                    // Ignore notification queue failures
                }

                return transfer;
            }
            catch (DbUpdateException ex)
            {
                await transaction.RollbackAsync(cancellationToken);
                throw new InvalidOperationException($"Transfer rejected by database: {ex.InnerException?.Message ?? ex.Message}");
            }
            catch
            {
                await transaction.RollbackAsync(cancellationToken);
                throw;
            }
        }

        public async Task<SystemHealthResponse> GetSystemHealthAsync(CancellationToken cancellationToken)
        {
            var totalUsers = await context.Users.AsNoTracking().CountAsync(cancellationToken);
            var totalAccounts = await context.BankAccounts.AsNoTracking().CountAsync(cancellationToken);
            var totalTransactions = await context.Transfers.AsNoTracking().CountAsync(cancellationToken);

            var balances = await context.BankAccountBalanceViews.AsNoTracking().ToListAsync(cancellationToken);
            var systemBalanceSum = balances.Sum(b => b.CurrentBalance);

            var reconciliation = await ReconcileLedgerAsync(cancellationToken);
            var unhandledFailed = await context.Transfers
                .AsNoTracking()
                .CountAsync(t => t.TransferStatus == "FAILED", cancellationToken);

            var activeSessions = await context.RefreshSessions
                .AsNoTracking()
                .CountAsync(s => !s.IsRevoked && s.ExpiresAtUtc > timeProvider.GetUtcNow().UtcDateTime, cancellationToken);

            return new SystemHealthResponse
            {
                Status = reconciliation.IsBalanced ? "HEALTHY" : "DEGRADED_LEDGER_INCONSISTENCY",
                TimestampUtc = timeProvider.GetUtcNow().UtcDateTime,
                TotalUsers = totalUsers,
                TotalAccounts = totalAccounts,
                TotalTransactions = totalTransactions,
                SystemBalanceSum = systemBalanceSum,
                LedgerIntegrity = reconciliation.IsBalanced,
                ActiveSessionsCount = activeSessions,
                UnhandledFailedTransactions = unhandledFailed
            };
        }

        public async Task<LedgerReconciliationResponse> ReconcileLedgerAsync(CancellationToken cancellationToken)
        {
            var ledgerEntries = await context.LedgerEntries.AsNoTracking().ToListAsync(cancellationToken);

            var totalDebit = ledgerEntries.Where(l => l.EntryType == "DEBIT").Sum(l => l.Amount);
            var totalCredit = ledgerEntries.Where(l => l.EntryType == "CREDIT").Sum(l => l.Amount);
            var diff = Math.Abs(totalDebit - totalCredit);

            var inconsistencies = new List<string>();
            if (diff != 0)
            {
                inconsistencies.Add($"Total DEBIT ({totalDebit}) does not match Total CREDIT ({totalCredit}). Net Difference: {diff}");
            }

            return new LedgerReconciliationResponse
            {
                IsBalanced = diff == 0,
                TotalDebitAmount = totalDebit,
                TotalCreditAmount = totalCredit,
                NetDifference = diff,
                TotalLedgerEntries = ledgerEntries.Count,
                InconsistencyDetails = inconsistencies
            };
        }

        public Task<object> GetSystemSettingsAsync()
        {
            return Task.FromResult((object)SystemSettings);
        }

        public Task<object> UpdateSystemSettingsAsync(
            UpdateSystemSettingsRequest request,
            Guid systemUserId,
            CancellationToken cancellationToken)
        {
            if (request.DailyTransferLimit.HasValue) SystemSettings["DailyTransferLimit"] = request.DailyTransferLimit.Value;
            if (request.OperationalThreshold.HasValue) SystemSettings["OperationalThreshold"] = request.OperationalThreshold.Value;
            if (request.MaintenanceMode.HasValue) SystemSettings["MaintenanceMode"] = request.MaintenanceMode.Value;
            if (request.EnableFraudDetection.HasValue) SystemSettings["EnableFraudDetection"] = request.EnableFraudDetection.Value;
            if (request.OtpExpirationMinutes.HasValue) SystemSettings["OtpExpirationMinutes"] = request.OtpExpirationMinutes.Value;
            if (request.SessionTimeoutMinutes.HasValue) SystemSettings["SessionTimeoutMinutes"] = request.SessionTimeoutMinutes.Value;

            return Task.FromResult((object)SystemSettings);
        }

        public async Task<object> GetSecurityEventsAsync(int page, int pageSize, CancellationToken cancellationToken)
        {
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var revokedCount = await context.RevokedAccessTokens.AsNoTracking().CountAsync(cancellationToken);
            var lockedUsersQuery = context.Users.AsNoTracking().Where(u => u.UserStatus == "LOCKED");
            var lockedUsersCount = await lockedUsersQuery.CountAsync(cancellationToken);
            var failedAttemptsSum = await context.Users.AsNoTracking().SumAsync(u => (int?)u.LoginAttempts, cancellationToken) ?? 0;

            var lockedUsers = await lockedUsersQuery
                .Select(u => new
                {
                    userId = u.UserId,
                    userName = u.UserName,
                    email = u.Email,
                    userRole = "CUSTOMER",
                    loginAttempts = u.LoginAttempts,
                    userStatus = u.UserStatus,
                    updatedAt = u.UpdatedAtUtc
                })
                .Take(10)
                .ToListAsync(cancellationToken);

            var recentAuditEvents = await context.AdminEvents
                .AsNoTracking()
                .Where(e => e.EventType.Contains("AUTH") || e.EventType.Contains("SECURITY") || e.EventType.Contains("LOGIN") || e.EventType.Contains("SYSTEMUSER"))
                .OrderByDescending(e => e.CreatedAtUtc)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            return new
            {
                revokedAccessTokensCount = revokedCount,
                lockedUsersCount = lockedUsersCount,
                totalFailedLoginAttempts = failedAttemptsSum,
                activeSessionsCount = await context.Users.AsNoTracking().CountAsync(u => u.UserStatus == "ACTIVE", cancellationToken),
                lockedUsers = lockedUsers,
                securityPolicies = new
                {
                    mfaEnforced = true,
                    rateLimiterActive = true,
                    maxLoginAttemptsThreshold = 5,
                    jwtExpiryMinutes = 60
                },
                securityEvents = recentAuditEvents
            };
        }

        public async Task<bool> UnlockUserAsync(Guid targetUserId, Guid adminUserId, CancellationToken cancellationToken)
        {
            var user = await context.Users.FindAsync([targetUserId], cancellationToken);
            if (user == null) return false;

            user.UserStatus = "ACTIVE";
            user.LoginAttempts = 0;
            user.UpdatedAtUtc = DateTime.UtcNow;

            context.AdminEvents.Add(new AdminEvent
            {
                ActorUserId = adminUserId,
                EventType = "SECURITY_USER_UNLOCKED",
                EntityType = "User",
                EntityId = targetUserId,
                CreatedAtUtc = DateTime.UtcNow
            });

            await context.SaveChangesAsync(cancellationToken);
            return true;
        }

        public async Task<bool> ResetFailedAttemptsAsync(Guid targetUserId, Guid adminUserId, CancellationToken cancellationToken)
        {
            var user = await context.Users.FindAsync([targetUserId], cancellationToken);
            if (user == null) return false;

            user.LoginAttempts = 0;
            user.UpdatedAtUtc = DateTime.UtcNow;

            context.AdminEvents.Add(new AdminEvent
            {
                ActorUserId = adminUserId,
                EventType = "SECURITY_RESET_LOGIN_ATTEMPTS",
                EntityType = "User",
                EntityId = targetUserId,
                CreatedAtUtc = DateTime.UtcNow
            });

            await context.SaveChangesAsync(cancellationToken);
            return true;
        }

        public async Task<object> GetAuditLogsAsync(string? actorRole, string? action, int page, int pageSize, CancellationToken cancellationToken)
        {
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var query = context.AdminEvents.Include(e => e.Actor).AsNoTracking();

            if (!string.IsNullOrWhiteSpace(action))
            {
                query = query.Where(e => e.EventType.Contains(action));
            }

            var total = await query.CountAsync(cancellationToken);
            var items = await query
                .OrderByDescending(e => e.CreatedAtUtc)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(e => new
                {
                    id = e.AdminEventId,
                    eventType = e.EventType,
                    entityType = e.EntityType,
                    actorUserId = e.ActorUserId,
                    actorName = e.Actor != null ? e.Actor.UserName : "System",
                    data = e.EventDataJson,
                    ipAddress = e.IpAddress,
                    userAgent = e.UserAgent,
                    createdAtUtc = e.CreatedAtUtc
                })
                .ToListAsync(cancellationToken);

            return new
            {
                totalItems = total,
                page = page,
                pageSize = pageSize,
                logs = items
            };
        }
    }
}
