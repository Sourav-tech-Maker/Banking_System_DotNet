using BankingSystem.Api.Models.Auth;
using BankingSystem.Api.Models.Integration;
using BankingSystem.Api.Models.Compliance;
using BankingSystem.Api.Models.Banking;
using BankingSystem.Api.Models.Savings;
using BankingSystem.Api.Models.Audit;
using Microsoft.EntityFrameworkCore;

namespace BankingSystem.Api.Data
{
    public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
    {
        public DbSet<User> Users => Set<User>();
        public DbSet<Role> Roles => Set<Role>();
        public DbSet<UserRole> UserRoles => Set<UserRole>();
        public DbSet<RefreshSession> RefreshSessions => Set<RefreshSession>();
        public DbSet<VerificationChallenge> VerificationChallenges => Set<VerificationChallenge>();
        public DbSet<RevokedAccessToken> RevokedAccessTokens => Set<RevokedAccessToken>();
        public DbSet<OutboxMessage> OutboxMessages => Set<OutboxMessage>();

        // Compliance
        public DbSet<KycApplication> KycApplications => Set<KycApplication>();
        public DbSet<KycAddress> KycAddresses => Set<KycAddress>();
        public DbSet<KycDocument> KycDocuments => Set<KycDocument>();

        // Banking
        public DbSet<BankAccount> BankAccounts => Set<BankAccount>();
        public DbSet<Transfer> Transfers => Set<Transfer>();
        public DbSet<LedgerEntry> LedgerEntries => Set<LedgerEntry>();
        public DbSet<Beneficiary> Beneficiaries => Set<Beneficiary>();

        // Savings
        public DbSet<SavingsGoal> SavingsGoals => Set<SavingsGoal>();
        public DbSet<SavingsContribution> SavingsContributions => Set<SavingsContribution>();

        // Audit
        public DbSet<AdminEvent> AdminEvents => Set<AdminEvent>();

        // Views (Keyless)
        public DbSet<BankAccountBalanceView> BankAccountBalanceViews => Set<BankAccountBalanceView>();
        public DbSet<SavingsGoalProgressView> SavingsGoalProgressViews => Set<SavingsGoalProgressView>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Base Auth mappings
            modelBuilder.Entity<User>(entity =>
            {
                entity.ToTable("Users", "Auth");
                entity.HasKey(user => user.UserId);
                entity.Property(user => user.UserId)
                    .HasDefaultValueSql("NEWSEQUENTIALID()")
                    .ValueGeneratedOnAdd();
                entity.Property(user => user.LegacyObjectId).HasColumnType("char(24)");
                entity.Property(user => user.UserName).HasMaxLength(100).IsRequired();
                entity.Property(user => user.NormalizedUserName)
                    .HasMaxLength(100)
                    .HasComputedColumnSql("UPPER(LTRIM(RTRIM([UserName])))", stored: true);
                entity.Property(user => user.Email).HasMaxLength(256).IsRequired();
                entity.Property(user => user.NormalizedEmail)
                    .HasMaxLength(256)
                    .HasComputedColumnSql("UPPER(LTRIM(RTRIM([Email])))", stored: true);
                entity.Property(user => user.PasswordHash).HasMaxLength(500).IsRequired();
                entity.Property(user => user.EmailVerified).HasDefaultValue(false);
                entity.Property(user => user.UserStatus)
                    .HasMaxLength(20)
                    .HasDefaultValue("ACTIVE")
                    .IsRequired();
                entity.Property(user => user.LoginAttempts).HasDefaultValue(0);
                entity.Property(user => user.LockoutEndUtc).HasColumnType("datetime2(3)");
                entity.Property(user => user.CreatedAtUtc)
                    .HasColumnType("datetime2(3)")
                    .HasDefaultValueSql("SYSUTCDATETIME()");
                entity.Property(user => user.UpdatedAtUtc)
                    .HasColumnType("datetime2(3)")
                    .HasDefaultValueSql("SYSUTCDATETIME()");
                entity.Property(user => user.RowVersion).IsRowVersion();
                entity.HasIndex(user => user.NormalizedUserName).IsUnique();
                entity.HasIndex(user => user.NormalizedEmail).IsUnique();
            });

            modelBuilder.Entity<Role>(entity =>
            {
                entity.ToTable("Roles", "Auth");
                entity.HasKey(role => role.RoleId);
                entity.Property(role => role.RoleId)
                    .HasDefaultValueSql("NEWSEQUENTIALID()")
                    .ValueGeneratedOnAdd();
                entity.Property(role => role.RoleName).HasMaxLength(50).IsRequired();
                entity.Property(role => role.NormalizedRoleName)
                    .HasMaxLength(50)
                    .HasComputedColumnSql("UPPER(LTRIM(RTRIM([RoleName])))", stored: true);
                entity.Property(role => role.CreatedAtUtc)
                    .HasColumnType("datetime2(3)")
                    .HasDefaultValueSql("SYSUTCDATETIME()");
                entity.HasIndex(role => role.NormalizedRoleName).IsUnique();
            });

            modelBuilder.Entity<UserRole>(entity =>
            {
                entity.ToTable("UserRoles", "Auth");
                entity.HasKey(userRole => new { userRole.UserId, userRole.RoleId });
                entity.Property(userRole => userRole.AssignedAtUtc)
                    .HasColumnType("datetime2(3)")
                    .HasDefaultValueSql("SYSUTCDATETIME()");
                entity.HasOne(userRole => userRole.User)
                    .WithMany(user => user.UserRoles)
                    .HasForeignKey(userRole => userRole.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(userRole => userRole.Role)
                    .WithMany(role => role.UserRoles)
                    .HasForeignKey(userRole => userRole.RoleId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(userRole => userRole.AssignedByUser)
                    .WithMany()
                    .HasForeignKey(userRole => userRole.AssignedByUserId)
                    .OnDelete(DeleteBehavior.NoAction);
            });

            modelBuilder.Entity<RefreshSession>(entity =>
            {
                entity.ToTable("RefreshSessions", "Auth");
                entity.HasKey(session => session.SessionId);
                entity.Property(session => session.SessionId)
                    .HasDefaultValueSql("NEWSEQUENTIALID()")
                    .ValueGeneratedOnAdd();
                entity.Property(session => session.LegacyObjectId).HasColumnType("char(24)");
                entity.Property(session => session.RefreshTokenHash)
                    .HasColumnType("binary(32)")
                    .IsRequired();
                entity.Property(session => session.IpAddress)
                    .HasColumnType("varchar(45)")
                    .HasMaxLength(45)
                    .IsRequired();
                entity.Property(session => session.UserAgent).HasMaxLength(512).IsRequired();
                entity.Property(session => session.IsRevoked).HasDefaultValue(false);
                entity.Property(session => session.RevocationReason).HasMaxLength(200);
                entity.Property(session => session.RevokedAtUtc).HasColumnType("datetime2(3)");
                entity.Property(session => session.ExpiresAtUtc).HasColumnType("datetime2(3)");
                entity.Property(session => session.CreatedAtUtc)
                    .HasColumnType("datetime2(3)")
                    .HasDefaultValueSql("SYSUTCDATETIME()");
                entity.Property(session => session.UpdatedAtUtc)
                    .HasColumnType("datetime2(3)")
                    .HasDefaultValueSql("SYSUTCDATETIME()");
                entity.HasIndex(session => session.RefreshTokenHash).IsUnique();
                entity.HasOne(session => session.User)
                    .WithMany(user => user.RefreshSessions)
                    .HasForeignKey(session => session.UserId)
                    .OnDelete(DeleteBehavior.NoAction);
                entity.HasOne(session => session.ReplacedBy)
                    .WithMany()
                    .HasForeignKey(session => session.ReplacedBySessionId)
                    .OnDelete(DeleteBehavior.NoAction);
            });

            modelBuilder.Entity<VerificationChallenge>(entity =>
            {
                entity.ToTable("VerificationChallenges", "Auth");
                entity.HasKey(challenge => challenge.ChallengeId);
                entity.Property(challenge => challenge.ChallengeId)
                    .HasDefaultValueSql("NEWSEQUENTIALID()")
                    .ValueGeneratedOnAdd();
                entity.Property(challenge => challenge.LegacyObjectId).HasColumnType("char(24)");
                entity.Property(challenge => challenge.SubjectEmail).HasMaxLength(256);
                entity.Property(challenge => challenge.Purpose).HasMaxLength(40).IsRequired();
                entity.Property(challenge => challenge.CodeHash)
                    .HasColumnType("binary(32)")
                    .IsRequired();
                entity.Property(challenge => challenge.AttemptCount).HasDefaultValue(0);
                entity.Property(challenge => challenge.MaximumAttempts).HasDefaultValue(5);
                entity.Property(challenge => challenge.ExpiresAtUtc).HasColumnType("datetime2(3)");
                entity.Property(challenge => challenge.ConsumedAtUtc).HasColumnType("datetime2(3)");
                entity.Property(challenge => challenge.CreatedAtUtc)
                    .HasColumnType("datetime2(3)")
                    .HasDefaultValueSql("SYSUTCDATETIME()");
                entity.HasOne(challenge => challenge.User)
                    .WithMany(user => user.VerificationChallenges)
                    .HasForeignKey(challenge => challenge.UserId)
                    .OnDelete(DeleteBehavior.NoAction);
            });

            modelBuilder.Entity<RevokedAccessToken>(entity =>
            {
                entity.ToTable("RevokedAccessTokens", "Auth");
                entity.HasKey(token => token.RevokedTokenId);
                entity.Property(token => token.RevokedTokenId).ValueGeneratedOnAdd();
                entity.Property(token => token.TokenHash).HasColumnType("binary(32)").IsRequired();
                entity.Property(token => token.JwtId).HasMaxLength(100);
                entity.Property(token => token.ExpiresAtUtc).HasColumnType("datetime2(3)");
                entity.Property(token => token.RevokedAtUtc)
                    .HasColumnType("datetime2(3)")
                    .HasDefaultValueSql("SYSUTCDATETIME()");
                entity.HasIndex(token => token.TokenHash).IsUnique();
                entity.HasIndex(token => token.JwtId).IsUnique().HasFilter("[JwtId] IS NOT NULL");
                entity.HasOne<User>()
                    .WithMany()
                    .HasForeignKey(token => token.UserId)
                    .OnDelete(DeleteBehavior.NoAction);
            });

            modelBuilder.Entity<OutboxMessage>(entity =>
            {
                entity.ToTable("OutboxMessages", "Integration");
                entity.HasKey(message => message.OutboxMessageId);
                entity.Property(message => message.OutboxMessageId).ValueGeneratedOnAdd();
                entity.Property(message => message.EventType).HasMaxLength(100).IsRequired();
                entity.Property(message => message.AggregateType).HasMaxLength(50).IsRequired();
                entity.Property(message => message.PayloadJson).HasColumnType("nvarchar(max)").IsRequired();
                entity.Property(message => message.OccurredAtUtc)
                    .HasColumnType("datetime2(3)")
                    .HasDefaultValueSql("SYSUTCDATETIME()");
                entity.Property(message => message.ProcessedAtUtc).HasColumnType("datetime2(3)");
                entity.Property(message => message.AttemptCount).HasDefaultValue(0);
                entity.Property(message => message.NextAttemptAtUtc).HasColumnType("datetime2(3)");
                entity.Property(message => message.LastError).HasMaxLength(2000);
            });

            // Compliance Schema mappings
            modelBuilder.Entity<KycApplication>(entity =>
            {
                entity.ToTable("KycApplications", "Compliance");
                entity.HasKey(kyc => kyc.KycApplicationId);
                entity.Property(kyc => kyc.KycApplicationId)
                    .HasDefaultValueSql("NEWSEQUENTIALID()")
                    .ValueGeneratedOnAdd();
                entity.Property(kyc => kyc.LegacyObjectId).HasColumnType("char(24)");
                entity.Property(kyc => kyc.FullName).HasMaxLength(150).IsRequired();
                entity.Property(kyc => kyc.DateOfBirth).HasColumnType("date").IsRequired();
                entity.Property(kyc => kyc.Gender).HasMaxLength(10).IsRequired();
                entity.Property(kyc => kyc.KycStatus).HasMaxLength(20).HasDefaultValue("PENDING").IsRequired();
                entity.Property(kyc => kyc.RejectionReason).HasMaxLength(500);
                entity.Property(kyc => kyc.ReviewedAtUtc).HasColumnType("datetime2(3)");
                entity.Property(kyc => kyc.SubmittedAtUtc).HasColumnType("datetime2(3)").HasDefaultValueSql("SYSUTCDATETIME()");
                entity.Property(kyc => kyc.UpdatedAtUtc).HasColumnType("datetime2(3)").HasDefaultValueSql("SYSUTCDATETIME()");
                entity.Property(kyc => kyc.RowVersion).IsRowVersion();

                entity.HasOne(kyc => kyc.User)
                    .WithOne()
                    .HasForeignKey<KycApplication>(kyc => kyc.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(kyc => kyc.Reviewer)
                    .WithMany()
                    .HasForeignKey(kyc => kyc.ReviewedByUserId)
                    .OnDelete(DeleteBehavior.NoAction);
            });

            modelBuilder.Entity<KycAddress>(entity =>
            {
                entity.ToTable("KycAddresses", "Compliance");
                entity.HasKey(addr => addr.KycApplicationId);
                entity.Property(addr => addr.Street).HasMaxLength(255).IsRequired();
                entity.Property(addr => addr.City).HasMaxLength(100).IsRequired();
                entity.Property(addr => addr.StateOrProvince).HasMaxLength(100).IsRequired();
                entity.Property(addr => addr.Country).HasMaxLength(100).IsRequired();
                entity.Property(addr => addr.PostalCode).HasMaxLength(20).IsRequired();

                entity.HasOne(addr => addr.KycApplication)
                    .WithOne(kyc => kyc.KycAddress)
                    .HasForeignKey<KycAddress>(addr => addr.KycApplicationId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<KycDocument>(entity =>
            {
                entity.ToTable("KycDocuments", "Compliance");
                entity.HasKey(doc => doc.KycDocumentId);
                entity.Property(doc => doc.KycDocumentId)
                    .HasDefaultValueSql("NEWSEQUENTIALID()")
                    .ValueGeneratedOnAdd();
                entity.Property(doc => doc.DocumentType).HasMaxLength(30).IsRequired();
                entity.Property(doc => doc.DocumentNumber).HasMaxLength(100).IsRequired();
                entity.Property(doc => doc.DocumentImageUrl).HasMaxLength(2048).IsRequired();
                entity.Property(doc => doc.ExternalFileId).HasMaxLength(200);
                entity.Property(doc => doc.UploadedAtUtc).HasColumnType("datetime2(3)").HasDefaultValueSql("SYSUTCDATETIME()");

                entity.HasOne(doc => doc.KycApplication)
                    .WithMany(kyc => kyc.KycDocuments)
                    .HasForeignKey(doc => doc.KycApplicationId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Banking Schema mappings
            modelBuilder.Entity<BankAccount>(entity =>
            {
                entity.ToTable("BankAccounts", "Banking");
                entity.HasKey(acc => acc.AccountId);
                entity.Property(acc => acc.AccountId)
                    .HasDefaultValueSql("NEWSEQUENTIALID()")
                    .ValueGeneratedOnAdd();
                entity.Property(acc => acc.LegacyObjectId).HasColumnType("char(24)");
                entity.Property(acc => acc.AccountNumber)
                    .HasDefaultValueSql("NEXT VALUE FOR [Banking].[AccountNumberSequence]");
                entity.Property(acc => acc.AccountType).HasMaxLength(20).HasDefaultValue("SAVINGS").IsRequired();
                entity.Property(acc => acc.AccountStatus).HasMaxLength(20).HasDefaultValue("ACTIVE").IsRequired();
                entity.Property(acc => acc.AccountPurpose).HasMaxLength(20).HasDefaultValue("CUSTOMER").IsRequired();
                entity.Property(acc => acc.CurrencyCode).HasColumnType("char(3)").HasDefaultValue("INR").IsRequired();
                entity.Property(acc => acc.OpenedAtUtc).HasColumnType("datetime2(3)").HasDefaultValueSql("SYSUTCDATETIME()");
                entity.Property(acc => acc.ClosedAtUtc).HasColumnType("datetime2(3)");
                entity.Property(acc => acc.CreatedAtUtc).HasColumnType("datetime2(3)").HasDefaultValueSql("SYSUTCDATETIME()");
                entity.Property(acc => acc.UpdatedAtUtc).HasColumnType("datetime2(3)").HasDefaultValueSql("SYSUTCDATETIME()");
                entity.Property(acc => acc.RowVersion).IsRowVersion();

                entity.HasOne(acc => acc.User)
                    .WithMany()
                    .HasForeignKey(acc => acc.UserId)
                    .OnDelete(DeleteBehavior.NoAction);
            });

            modelBuilder.Entity<Transfer>(entity =>
            {
                entity.ToTable("Transfers", "Banking");
                entity.HasKey(t => t.TransferId);
                entity.Property(t => t.TransferId)
                    .HasDefaultValueSql("NEWSEQUENTIALID()")
                    .ValueGeneratedOnAdd();
                entity.Property(t => t.LegacyObjectId).HasColumnType("char(24)");
                entity.Property(t => t.TransferNumber)
                    .HasDefaultValueSql("NEXT VALUE FOR [Banking].[TransferNumberSequence]");
                entity.Property(t => t.TransferReference)
                    .HasComputedColumnSql("('TXN-' + RIGHT(REPLICATE('0', 16) + CONVERT(VARCHAR(20), [TransferNumber]), 16))", stored: true);
                entity.Property(t => t.IdempotencyKey).HasMaxLength(100).IsRequired();
                entity.Property(t => t.Amount).HasColumnType("decimal(19,4)").IsRequired();
                entity.Property(t => t.CurrencyCode).HasColumnType("char(3)").IsRequired();
                entity.Property(t => t.TransferType).HasMaxLength(30).HasDefaultValue("CUSTOMER_TRANSFER").IsRequired();
                entity.Property(t => t.TransferStatus).HasMaxLength(20).HasDefaultValue("PENDING").IsRequired();
                entity.Property(t => t.PaymentMethod).HasMaxLength(30);
                entity.Property(t => t.Category).HasMaxLength(30);
                entity.Property(t => t.Narration).HasMaxLength(500);
                entity.Property(t => t.ClientIpAddress).HasMaxLength(45);
                entity.Property(t => t.UserAgent).HasMaxLength(512);
                entity.Property(t => t.ReversalReason).HasMaxLength(500);
                entity.Property(t => t.CreatedAtUtc).HasColumnType("datetime2(3)").HasDefaultValueSql("SYSUTCDATETIME()");
                entity.Property(t => t.UpdatedAtUtc).HasColumnType("datetime2(3)").HasDefaultValueSql("SYSUTCDATETIME()");
                entity.Property(t => t.CompletedAtUtc).HasColumnType("datetime2(3)");
                entity.Property(t => t.ReversedAtUtc).HasColumnType("datetime2(3)");
                entity.Property(t => t.RowVersion).IsRowVersion();

                entity.HasOne(t => t.FromAccount)
                    .WithMany()
                    .HasForeignKey(t => t.FromAccountId)
                    .OnDelete(DeleteBehavior.NoAction);

                entity.HasOne(t => t.ToAccount)
                    .WithMany()
                    .HasForeignKey(t => t.ToAccountId)
                    .OnDelete(DeleteBehavior.NoAction);

                entity.HasOne(t => t.Initiator)
                    .WithMany()
                    .HasForeignKey(t => t.InitiatedByUserId)
                    .OnDelete(DeleteBehavior.NoAction);

                entity.HasOne(t => t.ReversalOf)
                    .WithOne()
                    .HasForeignKey<Transfer>(t => t.ReversalOfTransferId)
                    .OnDelete(DeleteBehavior.NoAction);

                entity.HasOne(t => t.Reverser)
                    .WithMany()
                    .HasForeignKey(t => t.ReversedByUserId)
                    .OnDelete(DeleteBehavior.NoAction);
            });

            modelBuilder.Entity<LedgerEntry>(entity =>
            {
                entity.ToTable("LedgerEntries", "Banking");
                entity.HasKey(l => l.LedgerEntryId);
                entity.Property(l => l.LegacyObjectId).HasColumnType("char(24)");
                entity.Property(l => l.EntrySequence).IsRequired();
                entity.Property(l => l.EntryType).HasMaxLength(10).IsRequired();
                entity.Property(l => l.Amount).HasColumnType("decimal(19,4)").IsRequired();
                entity.Property(l => l.SignedAmount)
                    .HasComputedColumnSql("(CONVERT(DECIMAL(19,4), CASE WHEN [EntryType] = N'CREDIT' THEN [Amount] ELSE -[Amount] END))", stored: true);
                entity.Property(l => l.CreatedAtUtc).HasColumnType("datetime2(3)").HasDefaultValueSql("SYSUTCDATETIME()");

                entity.HasOne(l => l.Transfer)
                    .WithMany(t => t.LedgerEntries)
                    .HasForeignKey(l => l.TransferId)
                    .OnDelete(DeleteBehavior.NoAction);

                entity.HasOne(l => l.Account)
                    .WithMany(a => a.LedgerEntries)
                    .HasForeignKey(l => l.AccountId)
                    .OnDelete(DeleteBehavior.NoAction);
            });

            modelBuilder.Entity<Beneficiary>(entity =>
            {
                entity.ToTable("Beneficiaries", "Banking");
                entity.HasKey(b => b.BeneficiaryId);
                entity.Property(b => b.BeneficiaryId)
                    .HasDefaultValueSql("NEWSEQUENTIALID()")
                    .ValueGeneratedOnAdd();
                entity.Property(b => b.LegacyObjectId).HasColumnType("char(24)");
                entity.Property(b => b.DisplayName).HasMaxLength(150).IsRequired();
                entity.Property(b => b.NickName).HasMaxLength(20).IsRequired();
                entity.Property(b => b.BeneficiaryStatus).HasMaxLength(20).HasDefaultValue("PENDING").IsRequired();
                entity.Property(b => b.VerifiedAtUtc).HasColumnType("datetime2(3)");
                entity.Property(b => b.CreatedAtUtc).HasColumnType("datetime2(3)").HasDefaultValueSql("SYSUTCDATETIME()");
                entity.Property(b => b.UpdatedAtUtc).HasColumnType("datetime2(3)").HasDefaultValueSql("SYSUTCDATETIME()");
                entity.Property(b => b.RowVersion).IsRowVersion();

                entity.HasOne(b => b.Owner)
                    .WithMany()
                    .HasForeignKey(b => b.OwnerUserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(b => b.BeneficiaryAccount)
                    .WithMany()
                    .HasForeignKey(b => b.BeneficiaryAccountId)
                    .OnDelete(DeleteBehavior.NoAction);

                entity.HasIndex(b => new { b.OwnerUserId, b.BeneficiaryAccountId }).IsUnique();
            });

            // Savings Schema mappings
            modelBuilder.Entity<SavingsGoal>(entity =>
            {
                entity.ToTable("SavingsGoals", "Savings");
                entity.HasKey(g => g.SavingsGoalId);
                entity.Property(g => g.SavingsGoalId)
                    .HasDefaultValueSql("NEWSEQUENTIALID()")
                    .ValueGeneratedOnAdd();
                entity.Property(g => g.LegacyObjectId).HasColumnType("char(24)");
                entity.Property(g => g.Title).HasMaxLength(100).IsRequired();
                entity.Property(g => g.Category).HasMaxLength(50).IsRequired();
                entity.Property(g => g.TargetAmount).HasColumnType("decimal(19,4)").IsRequired();
                entity.Property(g => g.TargetDateUtc).HasColumnType("datetime2(3)").IsRequired();
                entity.Property(g => g.IsArchived).HasDefaultValue(false).IsRequired();
                entity.Property(g => g.CreatedAtUtc).HasColumnType("datetime2(3)").HasDefaultValueSql("SYSUTCDATETIME()");
                entity.Property(g => g.UpdatedAtUtc).HasColumnType("datetime2(3)").HasDefaultValueSql("SYSUTCDATETIME()");
                entity.Property(g => g.RowVersion).IsRowVersion();

                entity.HasOne(g => g.User)
                    .WithMany()
                    .HasForeignKey(g => g.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(g => new { g.UserId, g.Title }).IsUnique().HasFilter("[IsArchived] = 0");
            });

            modelBuilder.Entity<SavingsContribution>(entity =>
            {
                entity.ToTable("SavingsContributions", "Savings");
                entity.HasKey(c => c.SavingsContributionId);
                entity.Property(c => c.LegacyObjectId).HasColumnType("char(24)");
                entity.Property(c => c.Amount).HasColumnType("decimal(19,4)").IsRequired();
                entity.Property(c => c.ContributionType).HasMaxLength(20).HasDefaultValue("MANUAL").IsRequired();
                entity.Property(c => c.CreatedAtUtc).HasColumnType("datetime2(3)").HasDefaultValueSql("SYSUTCDATETIME()");

                entity.HasOne(c => c.SavingsGoal)
                    .WithMany(g => g.SavingsContributions)
                    .HasForeignKey(c => c.SavingsGoalId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(c => c.Transfer)
                    .WithOne()
                    .HasForeignKey<SavingsContribution>(c => c.TransferId)
                    .OnDelete(DeleteBehavior.NoAction);
            });

            // Audit Schema mappings
            modelBuilder.Entity<AdminEvent>(entity =>
            {
                entity.ToTable("AdminEvents", "Audit");
                entity.HasKey(e => e.AdminEventId);
                entity.Property(e => e.EventType).HasMaxLength(100).IsRequired();
                entity.Property(e => e.EntityType).HasMaxLength(50).IsRequired();
                entity.Property(e => e.EventDataJson).HasColumnType("nvarchar(max)");
                entity.Property(e => e.IpAddress).HasMaxLength(45);
                entity.Property(e => e.UserAgent).HasMaxLength(512);
                entity.Property(e => e.CreatedAtUtc).HasColumnType("datetime2(3)").HasDefaultValueSql("SYSUTCDATETIME()");

                entity.HasOne(e => e.Actor)
                    .WithMany()
                    .HasForeignKey(e => e.ActorUserId)
                    .OnDelete(DeleteBehavior.NoAction);
            });

            // View configurations (Keyless)
            modelBuilder.Entity<BankAccountBalanceView>(entity =>
            {
                entity.HasNoKey();
                entity.ToView("vwAccountBalances", "Banking");
            });

            modelBuilder.Entity<SavingsGoalProgressView>(entity =>
            {
                entity.HasNoKey();
                entity.ToView("vwSavingsGoalProgress", "Savings");
            });
        }
    }
}
