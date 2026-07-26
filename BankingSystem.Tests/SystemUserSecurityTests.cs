using System;
using System.Threading;
using System.Threading.Tasks;
using BankingSystem.Api.Data;
using BankingSystem.Api.DTOs.SystemUser;
using BankingSystem.Api.Models.Auth;
using BankingSystem.Api.Models.Banking;
using BankingSystem.Api.Models.Compliance;
using BankingSystem.Api.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace BankingSystem.Tests
{
    public class SystemUserSecurityTests
    {
        private AppDbContext CreateInMemoryDbContext(string dbName)
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
                .Options;

            return new AppDbContext(options);
        }

        private async Task SeedRolesAsync(AppDbContext context)
        {
            context.Roles.AddRange(
                new Role { RoleId = Guid.NewGuid(), RoleName = "user", NormalizedRoleName = "USER" },
                new Role { RoleId = Guid.NewGuid(), RoleName = "admin", NormalizedRoleName = "ADMIN" },
                new Role { RoleId = Guid.NewGuid(), RoleName = "systemUser", NormalizedRoleName = "SYSTEMUSER" }
            );
            await context.SaveChangesAsync();
        }

        [Fact]
        public async Task SystemUser_CanCreateAccount1_And_Account2_WithoutCustomerKyc()
        {
            // Arrange
            var dbContext = CreateInMemoryDbContext("TestDb_SystemUser_Max2Accounts");
            await SeedRolesAsync(dbContext);

            var systemUser = new User
            {
                UserId = Guid.NewGuid(),
                UserName = "system_operator",
                NormalizedUserName = "SYSTEM_OPERATOR",
                Email = "ops@bank.com",
                NormalizedEmail = "OPS@BANK.COM",
                PasswordHash = "hash",
                EmailVerified = true
            };
            dbContext.Users.Add(systemUser);

            var sysRole = await dbContext.Roles.FirstAsync(r => r.NormalizedRoleName == "SYSTEMUSER");
            dbContext.UserRoles.Add(new UserRole { UserId = systemUser.UserId, RoleId = sysRole.RoleId });
            await dbContext.SaveChangesAsync();

            var service = new SystemUserService(dbContext, TimeProvider.System);

            // Act - Create Account 1
            var acc1 = await service.CreateInternalAccountAsync(systemUser.UserId, new CreateSystemAccountRequest { AccountType = "SAVINGS" }, CancellationToken.None);

            // Act - Create Account 2
            var acc2 = await service.CreateInternalAccountAsync(systemUser.UserId, new CreateSystemAccountRequest { AccountType = "SAVINGS" }, CancellationToken.None);

            // Assert
            Assert.NotNull(acc1);
            Assert.NotNull(acc2);
            Assert.Equal("INTERNAL_OPERATIONAL", acc1.AccountPurpose);
            Assert.Equal("INTERNAL_OPERATIONAL", acc2.AccountPurpose);
            Assert.NotEqual(acc1.AccountId, acc2.AccountId);

            var totalAccounts = await dbContext.BankAccounts.CountAsync(a => a.UserId == systemUser.UserId);
            Assert.Equal(2, totalAccounts);
        }

        [Fact]
        public async Task SystemUser_CannotCreate3rdAccount_ExceedingLimit()
        {
            // Arrange
            var dbContext = CreateInMemoryDbContext("TestDb_SystemUser_Reject3rdAccount");
            await SeedRolesAsync(dbContext);

            var systemUser = new User
            {
                UserId = Guid.NewGuid(),
                UserName = "system_op2",
                NormalizedUserName = "SYSTEM_OP2",
                Email = "ops2@bank.com",
                NormalizedEmail = "OPS2@BANK.COM",
                PasswordHash = "hash",
                EmailVerified = true
            };
            dbContext.Users.Add(systemUser);

            var sysRole = await dbContext.Roles.FirstAsync(r => r.NormalizedRoleName == "SYSTEMUSER");
            dbContext.UserRoles.Add(new UserRole { UserId = systemUser.UserId, RoleId = sysRole.RoleId });
            await dbContext.SaveChangesAsync();

            var service = new SystemUserService(dbContext, TimeProvider.System);

            // Create Account 1 & 2
            await service.CreateInternalAccountAsync(systemUser.UserId, new CreateSystemAccountRequest(), CancellationToken.None);
            await service.CreateInternalAccountAsync(systemUser.UserId, new CreateSystemAccountRequest(), CancellationToken.None);

            // Act & Assert - 3rd account creation should throw InvalidOperationException
            var ex = await Assert.ThrowsAsync<InvalidOperationException>(async () =>
            {
                await service.CreateInternalAccountAsync(systemUser.UserId, new CreateSystemAccountRequest(), CancellationToken.None);
            });

            Assert.Contains("SystemUser account limit reached", ex.Message);
        }

        [Fact]
        public async Task NonSystemUser_CannotCreateInternalAccount()
        {
            // Arrange
            var dbContext = CreateInMemoryDbContext("TestDb_NonSystemUser_Blocked");
            await SeedRolesAsync(dbContext);

            var normalUser = new User
            {
                UserId = Guid.NewGuid(),
                UserName = "john_doe",
                NormalizedUserName = "JOHN_DOE",
                Email = "john@example.com",
                NormalizedEmail = "JOHN@EXAMPLE.COM",
                PasswordHash = "hash",
                EmailVerified = true
            };
            dbContext.Users.Add(normalUser);

            var userRole = await dbContext.Roles.FirstAsync(r => r.NormalizedRoleName == "USER");
            dbContext.UserRoles.Add(new UserRole { UserId = normalUser.UserId, RoleId = userRole.RoleId });
            await dbContext.SaveChangesAsync();

            var service = new SystemUserService(dbContext, TimeProvider.System);

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
            {
                await service.CreateInternalAccountAsync(normalUser.UserId, new CreateSystemAccountRequest(), CancellationToken.None);
            });
        }

        [Fact]
        public async Task SystemUser_OperationalTransfer_CreatesAtomicBalancedLedgerEntries_And_AuditLog()
        {
            // Arrange
            var dbContext = CreateInMemoryDbContext("TestDb_OperationalTransfer");
            await SeedRolesAsync(dbContext);

            var systemUser = new User
            {
                UserId = Guid.NewGuid(),
                UserName = "sys_admin",
                NormalizedUserName = "SYS_ADMIN",
                Email = "sys@bank.com",
                NormalizedEmail = "SYS@BANK.COM",
                PasswordHash = "hash",
                EmailVerified = true
            };
            dbContext.Users.Add(systemUser);

            var sourceAccount = new BankAccount
            {
                AccountId = Guid.NewGuid(),
                UserId = systemUser.UserId,
                AccountType = "SAVINGS",
                AccountStatus = "ACTIVE",
                AccountPurpose = "INTERNAL_OPERATIONAL",
                CurrencyCode = "INR"
            };
            var destAccount = new BankAccount
            {
                AccountId = Guid.NewGuid(),
                UserId = systemUser.UserId,
                AccountType = "SAVINGS",
                AccountStatus = "ACTIVE",
                AccountPurpose = "INTERNAL_OPERATIONAL",
                CurrencyCode = "INR"
            };
            dbContext.BankAccounts.AddRange(sourceAccount, destAccount);
            await dbContext.SaveChangesAsync();

            var service = new SystemUserService(dbContext, TimeProvider.System);

            var transferRequest = new OperationalTransferRequest
            {
                SourceAccount = sourceAccount.AccountId,
                DestinationAccount = destAccount.AccountId,
                Amount = 15000.00m,
                Reason = "OPERATIONAL_SETTLEMENT_TEST",
                OperationType = "OPERATIONAL_ADJUSTMENT",
                IdempotencyKey = "IDEM_KEY_12345",
                CorrelationId = "CORR_9999"
            };

            // Act
            var transfer = await service.ExecuteOperationalTransferAsync(
                systemUser.UserId,
                transferRequest,
                "127.0.0.1",
                "UnitTestAgent",
                CancellationToken.None);

            // Assert Transfer
            Assert.NotNull(transfer);
            Assert.Equal("COMPLETED", transfer.TransferStatus);
            Assert.Equal(15000.00m, transfer.Amount);

            // Assert Ledger Entries (1 DEBIT, 1 CREDIT)
            var ledgerEntries = await dbContext.LedgerEntries.Where(l => l.TransferId == transfer.TransferId).ToListAsync();
            Assert.Equal(2, ledgerEntries.Count);
            Assert.Contains(ledgerEntries, l => l.EntryType == "DEBIT" && l.AccountId == sourceAccount.AccountId && l.Amount == 15000.00m);
            Assert.Contains(ledgerEntries, l => l.EntryType == "CREDIT" && l.AccountId == destAccount.AccountId && l.Amount == 15000.00m);

            // Assert Audit Log
            var auditLog = await dbContext.AdminEvents.FirstOrDefaultAsync(e => e.EventType == "PRIVILEGED_OPERATIONAL_TRANSFER");
            Assert.NotNull(auditLog);
            Assert.Equal(systemUser.UserId, auditLog.ActorUserId);
            Assert.Contains("CORR_9999", auditLog.EventDataJson!);
        }

        [Fact]
        public async Task SystemUser_DuplicateOperationalTransfer_PreventedByIdempotencyKey()
        {
            // Arrange
            var dbContext = CreateInMemoryDbContext("TestDb_IdempotencyPrevention");
            await SeedRolesAsync(dbContext);

            var systemUser = new User
            {
                UserId = Guid.NewGuid(),
                UserName = "sys_admin2",
                NormalizedUserName = "SYS_ADMIN2",
                Email = "sys2@bank.com",
                NormalizedEmail = "SYS2@BANK.COM",
                PasswordHash = "hash",
                EmailVerified = true
            };
            dbContext.Users.Add(systemUser);

            var sourceAccount = new BankAccount { AccountId = Guid.NewGuid(), UserId = systemUser.UserId, AccountStatus = "ACTIVE", AccountPurpose = "INTERNAL_OPERATIONAL" };
            var destAccount = new BankAccount { AccountId = Guid.NewGuid(), UserId = systemUser.UserId, AccountStatus = "ACTIVE", AccountPurpose = "INTERNAL_OPERATIONAL" };
            dbContext.BankAccounts.AddRange(sourceAccount, destAccount);
            await dbContext.SaveChangesAsync();

            var service = new SystemUserService(dbContext, TimeProvider.System);

            var request = new OperationalTransferRequest
            {
                SourceAccount = sourceAccount.AccountId,
                DestinationAccount = destAccount.AccountId,
                Amount = 5000.00m,
                Reason = "REPETITIVE_TEST",
                IdempotencyKey = "DUPLICATE_KEY_777"
            };

            // Act 1
            var firstCall = await service.ExecuteOperationalTransferAsync(systemUser.UserId, request, "127.0.0.1", "Agent", CancellationToken.None);

            // Act 2 - Repeat with same idempotency key
            var secondCall = await service.ExecuteOperationalTransferAsync(systemUser.UserId, request, "127.0.0.1", "Agent", CancellationToken.None);

            // Assert
            Assert.Equal(firstCall.TransferId, secondCall.TransferId);

            // Ensure ledger entries count is still exactly 2 (no duplicates)
            var totalLedgerCount = await dbContext.LedgerEntries.CountAsync();
            Assert.Equal(2, totalLedgerCount);
        }
    }
}
