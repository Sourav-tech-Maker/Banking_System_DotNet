/*
    Banking System - normalized SQL Server schema

    Design principles:
      - UNIQUEIDENTIFIER primary keys, with optional LegacyObjectId columns
        for traceable MongoDB migration.
      - DATETIME2(3) UTC columns with SYSUTCDATETIME() defaults.
      - DECIMAL(19,4) for all monetary values.
      - LedgerEntries are the source of truth for account balances.
      - TransactionHistory is intentionally not duplicated. Its useful
        metadata is represented on Banking.Transfers or Audit.AdminEvents.

    This script is non-destructive. It refuses to overwrite an existing
    target schema.
*/

USE [Banking_System];
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

IF OBJECT_ID(N'Auth.Users', N'U') IS NOT NULL
    THROW 50000, 'The normalized schema already exists. This script will not overwrite it.', 1;
GO

IF SCHEMA_ID(N'Auth') IS NULL EXEC(N'CREATE SCHEMA [Auth] AUTHORIZATION [dbo];');
IF SCHEMA_ID(N'Compliance') IS NULL EXEC(N'CREATE SCHEMA [Compliance] AUTHORIZATION [dbo];');
IF SCHEMA_ID(N'Banking') IS NULL EXEC(N'CREATE SCHEMA [Banking] AUTHORIZATION [dbo];');
IF SCHEMA_ID(N'Savings') IS NULL EXEC(N'CREATE SCHEMA [Savings] AUTHORIZATION [dbo];');
IF SCHEMA_ID(N'Integration') IS NULL EXEC(N'CREATE SCHEMA [Integration] AUTHORIZATION [dbo];');
IF SCHEMA_ID(N'Audit') IS NULL EXEC(N'CREATE SCHEMA [Audit] AUTHORIZATION [dbo];');
GO

BEGIN TRY
    BEGIN TRANSACTION;

    CREATE SEQUENCE [Banking].[AccountNumberSequence]
        AS BIGINT
        START WITH 100000000001
        INCREMENT BY 1
        CACHE 100;

    CREATE SEQUENCE [Banking].[TransferNumberSequence]
        AS BIGINT
        START WITH 1000000001
        INCREMENT BY 1
        CACHE 100;

    /* ---------------------------------------------------------------------
       Authentication and authorization
       --------------------------------------------------------------------- */

    CREATE TABLE [Auth].[Users]
    (
        [UserId] UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT [DF_Users_UserId] DEFAULT NEWSEQUENTIALID(),
        [LegacyObjectId] CHAR(24) NULL,
        [UserName] NVARCHAR(100) NOT NULL,
        [NormalizedUserName] AS UPPER(LTRIM(RTRIM([UserName]))) PERSISTED,
        [Email] NVARCHAR(256) NOT NULL,
        [NormalizedEmail] AS UPPER(LTRIM(RTRIM([Email]))) PERSISTED,
        [PasswordHash] NVARCHAR(500) NOT NULL,
        [EmailVerified] BIT NOT NULL
            CONSTRAINT [DF_Users_EmailVerified] DEFAULT (0),
        [UserStatus] NVARCHAR(20) NOT NULL
            CONSTRAINT [DF_Users_UserStatus] DEFAULT (N'ACTIVE'),
        [LoginAttempts] INT NOT NULL
            CONSTRAINT [DF_Users_LoginAttempts] DEFAULT (0),
        [LockoutEndUtc] DATETIME2(3) NULL,
        [CreatedAtUtc] DATETIME2(3) NOT NULL
            CONSTRAINT [DF_Users_CreatedAtUtc] DEFAULT SYSUTCDATETIME(),
        [UpdatedAtUtc] DATETIME2(3) NOT NULL
            CONSTRAINT [DF_Users_UpdatedAtUtc] DEFAULT SYSUTCDATETIME(),
        [RowVersion] ROWVERSION NOT NULL,

        CONSTRAINT [PK_Users] PRIMARY KEY CLUSTERED ([UserId]),
        CONSTRAINT [CK_Users_Status]
            CHECK ([UserStatus] IN (N'ACTIVE', N'SUSPENDED', N'LOCKED', N'CLOSED')),
        CONSTRAINT [CK_Users_LoginAttempts]
            CHECK ([LoginAttempts] >= 0),
        CONSTRAINT [CK_Users_LegacyObjectId]
            CHECK
            (
                [LegacyObjectId] IS NULL
                OR
                (
                    DATALENGTH([LegacyObjectId]) = 24
                    AND [LegacyObjectId] NOT LIKE '%[^0-9A-Fa-f]%'
                )
            )
    );

    CREATE UNIQUE INDEX [UX_Users_NormalizedUserName]
        ON [Auth].[Users] ([NormalizedUserName]);
    CREATE UNIQUE INDEX [UX_Users_NormalizedEmail]
        ON [Auth].[Users] ([NormalizedEmail]);
    CREATE UNIQUE INDEX [UX_Users_LegacyObjectId]
        ON [Auth].[Users] ([LegacyObjectId])
        WHERE [LegacyObjectId] IS NOT NULL;
    CREATE INDEX [IX_Users_Status]
        ON [Auth].[Users] ([UserStatus]);

    CREATE TABLE [Auth].[Roles]
    (
        [RoleId] UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT [DF_Roles_RoleId] DEFAULT NEWSEQUENTIALID(),
        [RoleName] NVARCHAR(50) NOT NULL,
        [NormalizedRoleName] AS UPPER(LTRIM(RTRIM([RoleName]))) PERSISTED,
        [CreatedAtUtc] DATETIME2(3) NOT NULL
            CONSTRAINT [DF_Roles_CreatedAtUtc] DEFAULT SYSUTCDATETIME(),

        CONSTRAINT [PK_Roles] PRIMARY KEY CLUSTERED ([RoleId])
    );

    CREATE UNIQUE INDEX [UX_Roles_NormalizedRoleName]
        ON [Auth].[Roles] ([NormalizedRoleName]);

    CREATE TABLE [Auth].[UserRoles]
    (
        [UserId] UNIQUEIDENTIFIER NOT NULL,
        [RoleId] UNIQUEIDENTIFIER NOT NULL,
        [AssignedAtUtc] DATETIME2(3) NOT NULL
            CONSTRAINT [DF_UserRoles_AssignedAtUtc] DEFAULT SYSUTCDATETIME(),
        [AssignedByUserId] UNIQUEIDENTIFIER NULL,

        CONSTRAINT [PK_UserRoles] PRIMARY KEY CLUSTERED ([UserId], [RoleId]),
        CONSTRAINT [FK_UserRoles_User]
            FOREIGN KEY ([UserId]) REFERENCES [Auth].[Users] ([UserId]) ON DELETE CASCADE,
        CONSTRAINT [FK_UserRoles_Role]
            FOREIGN KEY ([RoleId]) REFERENCES [Auth].[Roles] ([RoleId]) ON DELETE CASCADE,
        CONSTRAINT [FK_UserRoles_AssignedBy]
            FOREIGN KEY ([AssignedByUserId]) REFERENCES [Auth].[Users] ([UserId])
    );

    CREATE INDEX [IX_UserRoles_RoleId]
        ON [Auth].[UserRoles] ([RoleId], [UserId]);

    CREATE TABLE [Auth].[RefreshSessions]
    (
        [SessionId] UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT [DF_RefreshSessions_SessionId] DEFAULT NEWSEQUENTIALID(),
        [LegacyObjectId] CHAR(24) NULL,
        [UserId] UNIQUEIDENTIFIER NOT NULL,
        [RefreshTokenHash] BINARY(32) NOT NULL,
        [IpAddress] VARCHAR(45) NOT NULL,
        [UserAgent] NVARCHAR(512) NOT NULL,
        [IsRevoked] BIT NOT NULL
            CONSTRAINT [DF_RefreshSessions_IsRevoked] DEFAULT (0),
        [RevokedAtUtc] DATETIME2(3) NULL,
        [RevocationReason] NVARCHAR(200) NULL,
        [ReplacedBySessionId] UNIQUEIDENTIFIER NULL,
        [ExpiresAtUtc] DATETIME2(3) NOT NULL,
        [CreatedAtUtc] DATETIME2(3) NOT NULL
            CONSTRAINT [DF_RefreshSessions_CreatedAtUtc] DEFAULT SYSUTCDATETIME(),
        [UpdatedAtUtc] DATETIME2(3) NOT NULL
            CONSTRAINT [DF_RefreshSessions_UpdatedAtUtc] DEFAULT SYSUTCDATETIME(),

        CONSTRAINT [PK_RefreshSessions] PRIMARY KEY CLUSTERED ([SessionId]),
        CONSTRAINT [UQ_RefreshSessions_RefreshTokenHash] UNIQUE ([RefreshTokenHash]),
        CONSTRAINT [FK_RefreshSessions_User]
            FOREIGN KEY ([UserId]) REFERENCES [Auth].[Users] ([UserId]),
        CONSTRAINT [FK_RefreshSessions_ReplacedBy]
            FOREIGN KEY ([ReplacedBySessionId]) REFERENCES [Auth].[RefreshSessions] ([SessionId]),
        CONSTRAINT [CK_RefreshSessions_Expiry]
            CHECK ([ExpiresAtUtc] > [CreatedAtUtc]),
        CONSTRAINT [CK_RefreshSessions_Revocation]
            CHECK
            (
                ([IsRevoked] = 0 AND [RevokedAtUtc] IS NULL)
                OR ([IsRevoked] = 1 AND [RevokedAtUtc] IS NOT NULL)
            ),
        CONSTRAINT [CK_RefreshSessions_LegacyObjectId]
            CHECK
            (
                [LegacyObjectId] IS NULL
                OR
                (
                    DATALENGTH([LegacyObjectId]) = 24
                    AND [LegacyObjectId] NOT LIKE '%[^0-9A-Fa-f]%'
                )
            )
    );

    CREATE UNIQUE INDEX [UX_RefreshSessions_LegacyObjectId]
        ON [Auth].[RefreshSessions] ([LegacyObjectId])
        WHERE [LegacyObjectId] IS NOT NULL;
    CREATE INDEX [IX_RefreshSessions_User_Active]
        ON [Auth].[RefreshSessions] ([UserId], [ExpiresAtUtc])
        INCLUDE ([IpAddress], [UserAgent])
        WHERE [IsRevoked] = 0;
    CREATE INDEX [IX_RefreshSessions_ExpiresAtUtc]
        ON [Auth].[RefreshSessions] ([ExpiresAtUtc]);

    CREATE TABLE [Auth].[VerificationChallenges]
    (
        [ChallengeId] UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT [DF_VerificationChallenges_ChallengeId] DEFAULT NEWSEQUENTIALID(),
        [LegacyObjectId] CHAR(24) NULL,
        [UserId] UNIQUEIDENTIFIER NULL,
        [BeneficiaryId] UNIQUEIDENTIFIER NULL,
        [SubjectEmail] NVARCHAR(256) NULL,
        [Purpose] NVARCHAR(40) NOT NULL,
        [CodeHash] BINARY(32) NOT NULL,
        [AttemptCount] INT NOT NULL
            CONSTRAINT [DF_VerificationChallenges_AttemptCount] DEFAULT (0),
        [MaximumAttempts] INT NOT NULL
            CONSTRAINT [DF_VerificationChallenges_MaximumAttempts] DEFAULT (5),
        [ExpiresAtUtc] DATETIME2(3) NOT NULL,
        [ConsumedAtUtc] DATETIME2(3) NULL,
        [CreatedAtUtc] DATETIME2(3) NOT NULL
            CONSTRAINT [DF_VerificationChallenges_CreatedAtUtc] DEFAULT SYSUTCDATETIME(),

        CONSTRAINT [PK_VerificationChallenges] PRIMARY KEY CLUSTERED ([ChallengeId]),
        CONSTRAINT [FK_VerificationChallenges_User]
            FOREIGN KEY ([UserId]) REFERENCES [Auth].[Users] ([UserId]),
        CONSTRAINT [CK_VerificationChallenges_Purpose]
            CHECK ([Purpose] IN
                (N'EMAIL_VERIFICATION', N'BENEFICIARY_VERIFICATION', N'PASSWORD_RESET', N'MFA')),
        CONSTRAINT [CK_VerificationChallenges_Subject]
            CHECK ([UserId] IS NOT NULL OR [BeneficiaryId] IS NOT NULL OR [SubjectEmail] IS NOT NULL),
        CONSTRAINT [CK_VerificationChallenges_Attempts]
            CHECK ([AttemptCount] >= 0 AND [MaximumAttempts] > 0 AND [AttemptCount] <= [MaximumAttempts]),
        CONSTRAINT [CK_VerificationChallenges_Expiry]
            CHECK ([ExpiresAtUtc] > [CreatedAtUtc]),
        CONSTRAINT [CK_VerificationChallenges_Consumed]
            CHECK ([ConsumedAtUtc] IS NULL OR [ConsumedAtUtc] >= [CreatedAtUtc]),
        CONSTRAINT [CK_VerificationChallenges_LegacyObjectId]
            CHECK
            (
                [LegacyObjectId] IS NULL
                OR
                (
                    DATALENGTH([LegacyObjectId]) = 24
                    AND [LegacyObjectId] NOT LIKE '%[^0-9A-Fa-f]%'
                )
            )
    );

    CREATE UNIQUE INDEX [UX_VerificationChallenges_LegacyObjectId]
        ON [Auth].[VerificationChallenges] ([LegacyObjectId])
        WHERE [LegacyObjectId] IS NOT NULL;
    CREATE INDEX [IX_VerificationChallenges_Open]
        ON [Auth].[VerificationChallenges] ([Purpose], [SubjectEmail], [ExpiresAtUtc])
        WHERE [ConsumedAtUtc] IS NULL;
    CREATE INDEX [IX_VerificationChallenges_Beneficiary_Open]
        ON [Auth].[VerificationChallenges] ([BeneficiaryId], [Purpose], [ExpiresAtUtc])
        INCLUDE ([AttemptCount], [MaximumAttempts])
        WHERE [BeneficiaryId] IS NOT NULL AND [ConsumedAtUtc] IS NULL;

    /* Compatibility replacement for the Mongoose blacklist model.
       Store only hashes/JTIs, never complete bearer tokens. */
    CREATE TABLE [Auth].[RevokedAccessTokens]
    (
        [RevokedTokenId] BIGINT IDENTITY(1,1) NOT NULL,
        [TokenHash] BINARY(32) NOT NULL,
        [JwtId] NVARCHAR(100) NULL,
        [UserId] UNIQUEIDENTIFIER NULL,
        [ExpiresAtUtc] DATETIME2(3) NOT NULL,
        [RevokedAtUtc] DATETIME2(3) NOT NULL
            CONSTRAINT [DF_RevokedAccessTokens_RevokedAtUtc] DEFAULT SYSUTCDATETIME(),

        CONSTRAINT [PK_RevokedAccessTokens] PRIMARY KEY CLUSTERED ([RevokedTokenId]),
        CONSTRAINT [UQ_RevokedAccessTokens_TokenHash] UNIQUE ([TokenHash]),
        CONSTRAINT [FK_RevokedAccessTokens_User]
            FOREIGN KEY ([UserId]) REFERENCES [Auth].[Users] ([UserId]),
        CONSTRAINT [CK_RevokedAccessTokens_Expiry]
            CHECK ([ExpiresAtUtc] > [RevokedAtUtc])
    );

    CREATE UNIQUE INDEX [UX_RevokedAccessTokens_JwtId]
        ON [Auth].[RevokedAccessTokens] ([JwtId])
        WHERE [JwtId] IS NOT NULL;
    CREATE INDEX [IX_RevokedAccessTokens_ExpiresAtUtc]
        ON [Auth].[RevokedAccessTokens] ([ExpiresAtUtc]);

    /* ---------------------------------------------------------------------
       KYC / compliance
       --------------------------------------------------------------------- */

    CREATE TABLE [Compliance].[KycApplications]
    (
        [KycApplicationId] UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT [DF_KycApplications_Id] DEFAULT NEWSEQUENTIALID(),
        [LegacyObjectId] CHAR(24) NULL,
        [UserId] UNIQUEIDENTIFIER NOT NULL,
        [FullName] NVARCHAR(150) NOT NULL,
        [DateOfBirth] DATE NOT NULL,
        [Gender] NVARCHAR(10) NOT NULL,
        [KycStatus] NVARCHAR(20) NOT NULL
            CONSTRAINT [DF_KycApplications_Status] DEFAULT (N'PENDING'),
        [RejectionReason] NVARCHAR(500) NULL,
        [ReviewedByUserId] UNIQUEIDENTIFIER NULL,
        [ReviewedAtUtc] DATETIME2(3) NULL,
        [SubmittedAtUtc] DATETIME2(3) NOT NULL
            CONSTRAINT [DF_KycApplications_SubmittedAtUtc] DEFAULT SYSUTCDATETIME(),
        [UpdatedAtUtc] DATETIME2(3) NOT NULL
            CONSTRAINT [DF_KycApplications_UpdatedAtUtc] DEFAULT SYSUTCDATETIME(),
        [RowVersion] ROWVERSION NOT NULL,

        CONSTRAINT [PK_KycApplications] PRIMARY KEY CLUSTERED ([KycApplicationId]),
        CONSTRAINT [UQ_KycApplications_UserId] UNIQUE ([UserId]),
        CONSTRAINT [FK_KycApplications_User]
            FOREIGN KEY ([UserId]) REFERENCES [Auth].[Users] ([UserId]),
        CONSTRAINT [FK_KycApplications_Reviewer]
            FOREIGN KEY ([ReviewedByUserId]) REFERENCES [Auth].[Users] ([UserId]),
        CONSTRAINT [CK_KycApplications_Gender]
            CHECK ([Gender] IN (N'Male', N'Female', N'Other')),
        CONSTRAINT [CK_KycApplications_Status]
            CHECK ([KycStatus] IN (N'PENDING', N'APPROVED', N'REJECTED')),
        CONSTRAINT [CK_KycApplications_Review]
            CHECK
            (
                ([KycStatus] = N'PENDING'
                    AND [ReviewedByUserId] IS NULL
                    AND [ReviewedAtUtc] IS NULL
                    AND [RejectionReason] IS NULL)
                OR
                ([KycStatus] = N'APPROVED'
                    AND [ReviewedByUserId] IS NOT NULL
                    AND [ReviewedAtUtc] IS NOT NULL
                    AND [RejectionReason] IS NULL)
                OR
                ([KycStatus] = N'REJECTED'
                    AND [ReviewedByUserId] IS NOT NULL
                    AND [ReviewedAtUtc] IS NOT NULL
                    AND [RejectionReason] IS NOT NULL
                    AND LEN(LTRIM(RTRIM([RejectionReason]))) > 0)
            ),
        CONSTRAINT [CK_KycApplications_LegacyObjectId]
            CHECK
            (
                [LegacyObjectId] IS NULL
                OR
                (
                    DATALENGTH([LegacyObjectId]) = 24
                    AND [LegacyObjectId] NOT LIKE '%[^0-9A-Fa-f]%'
                )
            )
    );

    CREATE UNIQUE INDEX [UX_KycApplications_LegacyObjectId]
        ON [Compliance].[KycApplications] ([LegacyObjectId])
        WHERE [LegacyObjectId] IS NOT NULL;
    CREATE INDEX [IX_KycApplications_Status_Submitted]
        ON [Compliance].[KycApplications] ([KycStatus], [SubmittedAtUtc] DESC)
        INCLUDE ([UserId], [FullName]);

    CREATE TABLE [Compliance].[KycAddresses]
    (
        [KycApplicationId] UNIQUEIDENTIFIER NOT NULL,
        [Street] NVARCHAR(255) NOT NULL,
        [City] NVARCHAR(100) NOT NULL,
        [StateOrProvince] NVARCHAR(100) NOT NULL,
        [Country] NVARCHAR(100) NOT NULL,
        [PostalCode] NVARCHAR(20) NOT NULL,

        CONSTRAINT [PK_KycAddresses] PRIMARY KEY CLUSTERED ([KycApplicationId]),
        CONSTRAINT [FK_KycAddresses_Application]
            FOREIGN KEY ([KycApplicationId])
            REFERENCES [Compliance].[KycApplications] ([KycApplicationId]) ON DELETE CASCADE
    );

    CREATE TABLE [Compliance].[KycDocuments]
    (
        [KycDocumentId] UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT [DF_KycDocuments_Id] DEFAULT NEWSEQUENTIALID(),
        [KycApplicationId] UNIQUEIDENTIFIER NOT NULL,
        [DocumentType] NVARCHAR(30) NOT NULL,
        [DocumentNumber] NVARCHAR(100) NOT NULL,
        [DocumentImageUrl] NVARCHAR(2048) NOT NULL,
        [ExternalFileId] NVARCHAR(200) NULL,
        [UploadedAtUtc] DATETIME2(3) NOT NULL
            CONSTRAINT [DF_KycDocuments_UploadedAtUtc] DEFAULT SYSUTCDATETIME(),

        CONSTRAINT [PK_KycDocuments] PRIMARY KEY CLUSTERED ([KycDocumentId]),
        CONSTRAINT [UQ_KycDocuments_DocumentNumber] UNIQUE ([DocumentNumber]),
        CONSTRAINT [FK_KycDocuments_Application]
            FOREIGN KEY ([KycApplicationId])
            REFERENCES [Compliance].[KycApplications] ([KycApplicationId]) ON DELETE CASCADE,
        CONSTRAINT [CK_KycDocuments_Type]
            CHECK ([DocumentType] IN
                (N'PASSPORT', N'AADHAAR_CARD', N'DRIVER_LICENSE', N'PAN_CARD'))
    );

    CREATE INDEX [IX_KycDocuments_Application]
        ON [Compliance].[KycDocuments] ([KycApplicationId]);

    /* ---------------------------------------------------------------------
       Bank accounts, transfers, beneficiaries, and ledger
       --------------------------------------------------------------------- */

    CREATE TABLE [Banking].[BankAccounts]
    (
        [AccountId] UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT [DF_BankAccounts_AccountId] DEFAULT NEWSEQUENTIALID(),
        [LegacyObjectId] CHAR(24) NULL,
        [AccountNumber] BIGINT NOT NULL
            CONSTRAINT [DF_BankAccounts_AccountNumber]
            DEFAULT (NEXT VALUE FOR [Banking].[AccountNumberSequence]),
        [UserId] UNIQUEIDENTIFIER NOT NULL,
        [AccountType] NVARCHAR(20) NOT NULL
            CONSTRAINT [DF_BankAccounts_AccountType] DEFAULT (N'SAVINGS'),
        [AccountStatus] NVARCHAR(20) NOT NULL
            CONSTRAINT [DF_BankAccounts_AccountStatus] DEFAULT (N'ACTIVE'),
        [AccountPurpose] NVARCHAR(20) NOT NULL
            CONSTRAINT [DF_BankAccounts_AccountPurpose] DEFAULT (N'CUSTOMER'),
        [CurrencyCode] CHAR(3) NOT NULL
            CONSTRAINT [DF_BankAccounts_Currency] DEFAULT ('INR'),
        [OpenedAtUtc] DATETIME2(3) NOT NULL
            CONSTRAINT [DF_BankAccounts_OpenedAtUtc] DEFAULT SYSUTCDATETIME(),
        [ClosedAtUtc] DATETIME2(3) NULL,
        [CreatedAtUtc] DATETIME2(3) NOT NULL
            CONSTRAINT [DF_BankAccounts_CreatedAtUtc] DEFAULT SYSUTCDATETIME(),
        [UpdatedAtUtc] DATETIME2(3) NOT NULL
            CONSTRAINT [DF_BankAccounts_UpdatedAtUtc] DEFAULT SYSUTCDATETIME(),
        [RowVersion] ROWVERSION NOT NULL,

        CONSTRAINT [PK_BankAccounts] PRIMARY KEY CLUSTERED ([AccountId]),
        CONSTRAINT [UQ_BankAccounts_AccountNumber] UNIQUE ([AccountNumber]),
        CONSTRAINT [FK_BankAccounts_User]
            FOREIGN KEY ([UserId]) REFERENCES [Auth].[Users] ([UserId]),
        CONSTRAINT [CK_BankAccounts_Type]
            CHECK ([AccountType] IN (N'SAVINGS', N'CURRENT')),
        CONSTRAINT [CK_BankAccounts_Status]
            CHECK ([AccountStatus] IN (N'ACTIVE', N'FROZEN', N'CLOSED')),
        CONSTRAINT [CK_BankAccounts_Purpose]
            CHECK ([AccountPurpose] IN (N'CUSTOMER', N'TREASURY', N'CLEARING', N'REVENUE')),
        CONSTRAINT [CK_BankAccounts_Currency]
            CHECK ([CurrencyCode] = UPPER([CurrencyCode]) AND [CurrencyCode] NOT LIKE '%[^A-Z]%'),
        CONSTRAINT [CK_BankAccounts_Closed]
            CHECK
            (
                ([AccountStatus] = N'CLOSED' AND [ClosedAtUtc] IS NOT NULL)
                OR ([AccountStatus] <> N'CLOSED' AND [ClosedAtUtc] IS NULL)
            ),
        CONSTRAINT [CK_BankAccounts_LegacyObjectId]
            CHECK
            (
                [LegacyObjectId] IS NULL
                OR
                (
                    DATALENGTH([LegacyObjectId]) = 24
                    AND [LegacyObjectId] NOT LIKE '%[^0-9A-Fa-f]%'
                )
            )
    );

    CREATE UNIQUE INDEX [UX_BankAccounts_LegacyObjectId]
        ON [Banking].[BankAccounts] ([LegacyObjectId])
        WHERE [LegacyObjectId] IS NOT NULL;
    CREATE INDEX [IX_BankAccounts_User_Status]
        ON [Banking].[BankAccounts] ([UserId], [AccountStatus])
        INCLUDE ([AccountNumber], [AccountType], [CurrencyCode], [AccountPurpose]);
    CREATE INDEX [IX_BankAccounts_Status_Currency]
        ON [Banking].[BankAccounts] ([AccountStatus], [CurrencyCode]);

    CREATE TABLE [Banking].[Transfers]
    (
        [TransferId] UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT [DF_Transfers_TransferId] DEFAULT NEWSEQUENTIALID(),
        [LegacyObjectId] CHAR(24) NULL,
        [TransferNumber] BIGINT NOT NULL
            CONSTRAINT [DF_Transfers_TransferNumber]
            DEFAULT (NEXT VALUE FOR [Banking].[TransferNumberSequence]),
        [TransferReference] AS
            ('TXN-' + RIGHT(REPLICATE('0', 16) + CONVERT(VARCHAR(20), [TransferNumber]), 16)) PERSISTED,
        [IdempotencyKey] VARCHAR(100) NOT NULL,
        [FromAccountId] UNIQUEIDENTIFIER NOT NULL,
        [ToAccountId] UNIQUEIDENTIFIER NOT NULL,
        [Amount] DECIMAL(19,4) NOT NULL,
        [CurrencyCode] CHAR(3) NOT NULL,
        [TransferType] NVARCHAR(30) NOT NULL
            CONSTRAINT [DF_Transfers_TransferType] DEFAULT (N'CUSTOMER_TRANSFER'),
        [TransferStatus] NVARCHAR(20) NOT NULL
            CONSTRAINT [DF_Transfers_Status] DEFAULT (N'PENDING'),
        [PaymentMethod] NVARCHAR(30) NULL,
        [Category] NVARCHAR(30) NULL,
        [Narration] NVARCHAR(500) NULL,
        [InitiatedByUserId] UNIQUEIDENTIFIER NULL,
        [ClientIpAddress] VARCHAR(45) NULL,
        [UserAgent] NVARCHAR(512) NULL,
        [ReversalOfTransferId] UNIQUEIDENTIFIER NULL,
        [ReversedByUserId] UNIQUEIDENTIFIER NULL,
        [ReversalReason] NVARCHAR(500) NULL,
        [CreatedAtUtc] DATETIME2(3) NOT NULL
            CONSTRAINT [DF_Transfers_CreatedAtUtc] DEFAULT SYSUTCDATETIME(),
        [UpdatedAtUtc] DATETIME2(3) NOT NULL
            CONSTRAINT [DF_Transfers_UpdatedAtUtc] DEFAULT SYSUTCDATETIME(),
        [CompletedAtUtc] DATETIME2(3) NULL,
        [ReversedAtUtc] DATETIME2(3) NULL,
        [RowVersion] ROWVERSION NOT NULL,

        CONSTRAINT [PK_Transfers] PRIMARY KEY CLUSTERED ([TransferId]),
        CONSTRAINT [UQ_Transfers_TransferNumber] UNIQUE ([TransferNumber]),
        CONSTRAINT [UQ_Transfers_IdempotencyKey] UNIQUE ([IdempotencyKey]),
        CONSTRAINT [FK_Transfers_FromAccount]
            FOREIGN KEY ([FromAccountId]) REFERENCES [Banking].[BankAccounts] ([AccountId]),
        CONSTRAINT [FK_Transfers_ToAccount]
            FOREIGN KEY ([ToAccountId]) REFERENCES [Banking].[BankAccounts] ([AccountId]),
        CONSTRAINT [FK_Transfers_InitiatedBy]
            FOREIGN KEY ([InitiatedByUserId]) REFERENCES [Auth].[Users] ([UserId]),
        CONSTRAINT [FK_Transfers_ReversalOf]
            FOREIGN KEY ([ReversalOfTransferId]) REFERENCES [Banking].[Transfers] ([TransferId]),
        CONSTRAINT [FK_Transfers_ReversedBy]
            FOREIGN KEY ([ReversedByUserId]) REFERENCES [Auth].[Users] ([UserId]),
        CONSTRAINT [CK_Transfers_DifferentAccounts]
            CHECK ([FromAccountId] <> [ToAccountId]),
        CONSTRAINT [CK_Transfers_Amount]
            CHECK ([Amount] > CONVERT(DECIMAL(19,4), 0)),
        CONSTRAINT [CK_Transfers_IdempotencyKey]
            CHECK (LEN(LTRIM(RTRIM([IdempotencyKey]))) > 0),
        CONSTRAINT [CK_Transfers_Currency]
            CHECK ([CurrencyCode] = UPPER([CurrencyCode]) AND [CurrencyCode] NOT LIKE '%[^A-Z]%'),
        CONSTRAINT [CK_Transfers_Type]
            CHECK ([TransferType] IN
                (N'CUSTOMER_TRANSFER', N'INITIAL_FUNDING', N'REVERSAL', N'ADJUSTMENT')),
        CONSTRAINT [CK_Transfers_Status]
            CHECK ([TransferStatus] IN (N'PENDING', N'COMPLETED', N'FAILED', N'REVERSED')),
        CONSTRAINT [CK_Transfers_PaymentMethod]
            CHECK
            (
                [PaymentMethod] IS NULL
                OR [PaymentMethod] IN (N'UPI', N'WALLET', N'NET_BANKING', N'CARD', N'INTERNAL')
            ),
        CONSTRAINT [CK_Transfers_Category]
            CHECK
            (
                [Category] IS NULL
                OR [Category] IN
                    (N'PEER_TO_PEER', N'MERCHANT_PAYMENT', N'RECHARGE', N'UTILITY_BILL', N'FUNDING', N'REVERSAL')
            ),
        CONSTRAINT [CK_Transfers_ReversalLink]
            CHECK
            (
                ([TransferType] = N'REVERSAL' AND [ReversalOfTransferId] IS NOT NULL)
                OR ([TransferType] <> N'REVERSAL' AND [ReversalOfTransferId] IS NULL)
            ),
        CONSTRAINT [CK_Transfers_Completion]
            CHECK
            (
                ([TransferStatus] IN (N'COMPLETED', N'REVERSED') AND [CompletedAtUtc] IS NOT NULL)
                OR ([TransferStatus] IN (N'PENDING', N'FAILED') AND [CompletedAtUtc] IS NULL)
            ),
        CONSTRAINT [CK_Transfers_Reversed]
            CHECK
            (
                ([TransferStatus] = N'REVERSED'
                    AND [ReversedAtUtc] IS NOT NULL
                    AND [ReversedByUserId] IS NOT NULL
                    AND [ReversalReason] IS NOT NULL
                    AND LEN(LTRIM(RTRIM([ReversalReason]))) > 0)
                OR
                ([TransferStatus] <> N'REVERSED'
                    AND [ReversedAtUtc] IS NULL
                    AND [ReversedByUserId] IS NULL
                    AND [ReversalReason] IS NULL)
            ),
        CONSTRAINT [CK_Transfers_LegacyObjectId]
            CHECK
            (
                [LegacyObjectId] IS NULL
                OR
                (
                    DATALENGTH([LegacyObjectId]) = 24
                    AND [LegacyObjectId] NOT LIKE '%[^0-9A-Fa-f]%'
                )
            )
    );

    CREATE UNIQUE INDEX [UX_Transfers_TransferReference]
        ON [Banking].[Transfers] ([TransferReference]);
    CREATE UNIQUE INDEX [UX_Transfers_LegacyObjectId]
        ON [Banking].[Transfers] ([LegacyObjectId])
        WHERE [LegacyObjectId] IS NOT NULL;
    CREATE UNIQUE INDEX [UX_Transfers_ReversalOf]
        ON [Banking].[Transfers] ([ReversalOfTransferId])
        WHERE [ReversalOfTransferId] IS NOT NULL;
    CREATE INDEX [IX_Transfers_FromAccount_Created]
        ON [Banking].[Transfers] ([FromAccountId], [CreatedAtUtc] DESC)
        INCLUDE ([ToAccountId], [Amount], [CurrencyCode], [TransferStatus], [TransferReference]);
    CREATE INDEX [IX_Transfers_ToAccount_Created]
        ON [Banking].[Transfers] ([ToAccountId], [CreatedAtUtc] DESC)
        INCLUDE ([FromAccountId], [Amount], [CurrencyCode], [TransferStatus], [TransferReference]);
    CREATE INDEX [IX_Transfers_Status_Created]
        ON [Banking].[Transfers] ([TransferStatus], [CreatedAtUtc] DESC);

    CREATE TABLE [Banking].[LedgerEntries]
    (
        [LedgerEntryId] BIGINT IDENTITY(1,1) NOT NULL,
        [LegacyObjectId] CHAR(24) NULL,
        [TransferId] UNIQUEIDENTIFIER NOT NULL,
        [AccountId] UNIQUEIDENTIFIER NOT NULL,
        [EntrySequence] TINYINT NOT NULL,
        [EntryType] NVARCHAR(10) NOT NULL,
        [Amount] DECIMAL(19,4) NOT NULL,
        [SignedAmount] AS
            (CONVERT(DECIMAL(19,4), CASE WHEN [EntryType] = N'CREDIT' THEN [Amount] ELSE -[Amount] END)) PERSISTED,
        [CreatedAtUtc] DATETIME2(3) NOT NULL
            CONSTRAINT [DF_LedgerEntries_CreatedAtUtc] DEFAULT SYSUTCDATETIME(),

        CONSTRAINT [PK_LedgerEntries] PRIMARY KEY CLUSTERED ([LedgerEntryId]),
        CONSTRAINT [UQ_LedgerEntries_TransferSequence] UNIQUE ([TransferId], [EntrySequence]),
        CONSTRAINT [UQ_LedgerEntries_TransferAccount] UNIQUE ([TransferId], [AccountId]),
        CONSTRAINT [FK_LedgerEntries_Transfer]
            FOREIGN KEY ([TransferId]) REFERENCES [Banking].[Transfers] ([TransferId]),
        CONSTRAINT [FK_LedgerEntries_Account]
            FOREIGN KEY ([AccountId]) REFERENCES [Banking].[BankAccounts] ([AccountId]),
        CONSTRAINT [CK_LedgerEntries_Sequence]
            CHECK ([EntrySequence] IN (1, 2)),
        CONSTRAINT [CK_LedgerEntries_Type]
            CHECK ([EntryType] IN (N'CREDIT', N'DEBIT')),
        CONSTRAINT [CK_LedgerEntries_Amount]
            CHECK ([Amount] > CONVERT(DECIMAL(19,4), 0)),
        CONSTRAINT [CK_LedgerEntries_LegacyObjectId]
            CHECK
            (
                [LegacyObjectId] IS NULL
                OR
                (
                    DATALENGTH([LegacyObjectId]) = 24
                    AND [LegacyObjectId] NOT LIKE '%[^0-9A-Fa-f]%'
                )
            )
    );

    CREATE UNIQUE INDEX [UX_LedgerEntries_LegacyObjectId]
        ON [Banking].[LedgerEntries] ([LegacyObjectId])
        WHERE [LegacyObjectId] IS NOT NULL;
    CREATE INDEX [IX_LedgerEntries_Account]
        ON [Banking].[LedgerEntries] ([AccountId], [LedgerEntryId])
        INCLUDE ([SignedAmount], [TransferId], [CreatedAtUtc]);
    CREATE INDEX [IX_LedgerEntries_Transfer]
        ON [Banking].[LedgerEntries] ([TransferId])
        INCLUDE ([AccountId], [EntryType], [Amount]);

    CREATE TABLE [Banking].[Beneficiaries]
    (
        [BeneficiaryId] UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT [DF_Beneficiaries_BeneficiaryId] DEFAULT NEWSEQUENTIALID(),
        [LegacyObjectId] CHAR(24) NULL,
        [OwnerUserId] UNIQUEIDENTIFIER NOT NULL,
        [BeneficiaryAccountId] UNIQUEIDENTIFIER NOT NULL,
        [DisplayName] NVARCHAR(150) NOT NULL,
        [NickName] NVARCHAR(20) NOT NULL,
        [BeneficiaryStatus] NVARCHAR(20) NOT NULL
            CONSTRAINT [DF_Beneficiaries_Status] DEFAULT (N'PENDING'),
        [VerifiedAtUtc] DATETIME2(3) NULL,
        [CreatedAtUtc] DATETIME2(3) NOT NULL
            CONSTRAINT [DF_Beneficiaries_CreatedAtUtc] DEFAULT SYSUTCDATETIME(),
        [UpdatedAtUtc] DATETIME2(3) NOT NULL
            CONSTRAINT [DF_Beneficiaries_UpdatedAtUtc] DEFAULT SYSUTCDATETIME(),
        [RowVersion] ROWVERSION NOT NULL,

        CONSTRAINT [PK_Beneficiaries] PRIMARY KEY CLUSTERED ([BeneficiaryId]),
        CONSTRAINT [UQ_Beneficiaries_OwnerAccount] UNIQUE ([OwnerUserId], [BeneficiaryAccountId]),
        CONSTRAINT [FK_Beneficiaries_Owner]
            FOREIGN KEY ([OwnerUserId]) REFERENCES [Auth].[Users] ([UserId]),
        CONSTRAINT [FK_Beneficiaries_Account]
            FOREIGN KEY ([BeneficiaryAccountId]) REFERENCES [Banking].[BankAccounts] ([AccountId]),
        CONSTRAINT [CK_Beneficiaries_Status]
            CHECK ([BeneficiaryStatus] IN (N'PENDING', N'ACTIVE', N'SUSPENDED')),
        CONSTRAINT [CK_Beneficiaries_Verification]
            CHECK
            (
                ([BeneficiaryStatus] = N'PENDING' AND [VerifiedAtUtc] IS NULL)
                OR ([BeneficiaryStatus] IN (N'ACTIVE', N'SUSPENDED') AND [VerifiedAtUtc] IS NOT NULL)
            ),
        CONSTRAINT [CK_Beneficiaries_NickName]
            CHECK (LEN(LTRIM(RTRIM([NickName]))) BETWEEN 1 AND 20),
        CONSTRAINT [CK_Beneficiaries_LegacyObjectId]
            CHECK
            (
                [LegacyObjectId] IS NULL
                OR
                (
                    DATALENGTH([LegacyObjectId]) = 24
                    AND [LegacyObjectId] NOT LIKE '%[^0-9A-Fa-f]%'
                )
            )
    );

    CREATE UNIQUE INDEX [UX_Beneficiaries_LegacyObjectId]
        ON [Banking].[Beneficiaries] ([LegacyObjectId])
        WHERE [LegacyObjectId] IS NOT NULL;
    CREATE INDEX [IX_Beneficiaries_Owner_Status]
        ON [Banking].[Beneficiaries] ([OwnerUserId], [BeneficiaryStatus])
        INCLUDE ([BeneficiaryAccountId], [DisplayName], [NickName]);

    ALTER TABLE [Auth].[VerificationChallenges]
        ADD CONSTRAINT [FK_VerificationChallenges_Beneficiary]
            FOREIGN KEY ([BeneficiaryId]) REFERENCES [Banking].[Beneficiaries] ([BeneficiaryId]);

    /* ---------------------------------------------------------------------
       Savings goals. Current amount is derived from contribution rows.
       --------------------------------------------------------------------- */

    CREATE TABLE [Savings].[SavingsGoals]
    (
        [SavingsGoalId] UNIQUEIDENTIFIER NOT NULL
            CONSTRAINT [DF_SavingsGoals_Id] DEFAULT NEWSEQUENTIALID(),
        [LegacyObjectId] CHAR(24) NULL,
        [UserId] UNIQUEIDENTIFIER NOT NULL,
        [Title] NVARCHAR(100) NOT NULL,
        [Category] NVARCHAR(50) NOT NULL,
        [TargetAmount] DECIMAL(19,4) NOT NULL,
        [TargetDateUtc] DATETIME2(3) NOT NULL,
        [IsArchived] BIT NOT NULL
            CONSTRAINT [DF_SavingsGoals_IsArchived] DEFAULT (0),
        [CreatedAtUtc] DATETIME2(3) NOT NULL
            CONSTRAINT [DF_SavingsGoals_CreatedAtUtc] DEFAULT SYSUTCDATETIME(),
        [UpdatedAtUtc] DATETIME2(3) NOT NULL
            CONSTRAINT [DF_SavingsGoals_UpdatedAtUtc] DEFAULT SYSUTCDATETIME(),
        [RowVersion] ROWVERSION NOT NULL,

        CONSTRAINT [PK_SavingsGoals] PRIMARY KEY CLUSTERED ([SavingsGoalId]),
        CONSTRAINT [FK_SavingsGoals_User]
            FOREIGN KEY ([UserId]) REFERENCES [Auth].[Users] ([UserId]),
        CONSTRAINT [CK_SavingsGoals_TargetAmount]
            CHECK ([TargetAmount] > CONVERT(DECIMAL(19,4), 0)),
        CONSTRAINT [CK_SavingsGoals_Title]
            CHECK (LEN(LTRIM(RTRIM([Title]))) BETWEEN 1 AND 100),
        CONSTRAINT [CK_SavingsGoals_TargetDate]
            CHECK ([TargetDateUtc] > [CreatedAtUtc]),
        CONSTRAINT [CK_SavingsGoals_LegacyObjectId]
            CHECK
            (
                [LegacyObjectId] IS NULL
                OR
                (
                    DATALENGTH([LegacyObjectId]) = 24
                    AND [LegacyObjectId] NOT LIKE '%[^0-9A-Fa-f]%'
                )
            )
    );

    CREATE UNIQUE INDEX [UX_SavingsGoals_LegacyObjectId]
        ON [Savings].[SavingsGoals] ([LegacyObjectId])
        WHERE [LegacyObjectId] IS NOT NULL;
    CREATE UNIQUE INDEX [UX_SavingsGoals_User_Title_Active]
        ON [Savings].[SavingsGoals] ([UserId], [Title])
        WHERE [IsArchived] = 0;
    CREATE INDEX [IX_SavingsGoals_User]
        ON [Savings].[SavingsGoals] ([UserId], [IsArchived], [TargetDateUtc]);

    CREATE TABLE [Savings].[SavingsContributions]
    (
        [SavingsContributionId] BIGINT IDENTITY(1,1) NOT NULL,
        [LegacyObjectId] CHAR(24) NULL,
        [SavingsGoalId] UNIQUEIDENTIFIER NOT NULL,
        [TransferId] UNIQUEIDENTIFIER NULL,
        [Amount] DECIMAL(19,4) NOT NULL,
        [ContributionType] NVARCHAR(20) NOT NULL
            CONSTRAINT [DF_SavingsContributions_Type] DEFAULT (N'MANUAL'),
        [CreatedAtUtc] DATETIME2(3) NOT NULL
            CONSTRAINT [DF_SavingsContributions_CreatedAtUtc] DEFAULT SYSUTCDATETIME(),

        CONSTRAINT [PK_SavingsContributions] PRIMARY KEY CLUSTERED ([SavingsContributionId]),
        CONSTRAINT [FK_SavingsContributions_Goal]
            FOREIGN KEY ([SavingsGoalId]) REFERENCES [Savings].[SavingsGoals] ([SavingsGoalId]),
        CONSTRAINT [FK_SavingsContributions_Transfer]
            FOREIGN KEY ([TransferId]) REFERENCES [Banking].[Transfers] ([TransferId]),
        CONSTRAINT [CK_SavingsContributions_Amount]
            CHECK ([Amount] > CONVERT(DECIMAL(19,4), 0)),
        CONSTRAINT [CK_SavingsContributions_Type]
            CHECK ([ContributionType] IN (N'MANUAL', N'AUTO_DEBIT', N'ROUND_UP')),
        CONSTRAINT [CK_SavingsContributions_LegacyObjectId]
            CHECK
            (
                [LegacyObjectId] IS NULL
                OR
                (
                    DATALENGTH([LegacyObjectId]) = 24
                    AND [LegacyObjectId] NOT LIKE '%[^0-9A-Fa-f]%'
                )
            )
    );

    CREATE UNIQUE INDEX [UX_SavingsContributions_LegacyObjectId]
        ON [Savings].[SavingsContributions] ([LegacyObjectId])
        WHERE [LegacyObjectId] IS NOT NULL;
    CREATE UNIQUE INDEX [UX_SavingsContributions_TransferId]
        ON [Savings].[SavingsContributions] ([TransferId])
        WHERE [TransferId] IS NOT NULL;
    CREATE INDEX [IX_SavingsContributions_Goal_Created]
        ON [Savings].[SavingsContributions] ([SavingsGoalId], [CreatedAtUtc] DESC)
        INCLUDE ([Amount], [ContributionType], [TransferId]);

    /* ---------------------------------------------------------------------
       Reliable integrations and audit trail
       --------------------------------------------------------------------- */

    CREATE TABLE [Integration].[OutboxMessages]
    (
        [OutboxMessageId] BIGINT IDENTITY(1,1) NOT NULL,
        [EventType] NVARCHAR(100) NOT NULL,
        [AggregateType] NVARCHAR(50) NOT NULL,
        [AggregateId] UNIQUEIDENTIFIER NULL,
        [PayloadJson] NVARCHAR(MAX) NOT NULL,
        [OccurredAtUtc] DATETIME2(3) NOT NULL
            CONSTRAINT [DF_OutboxMessages_OccurredAtUtc] DEFAULT SYSUTCDATETIME(),
        [ProcessedAtUtc] DATETIME2(3) NULL,
        [AttemptCount] INT NOT NULL
            CONSTRAINT [DF_OutboxMessages_AttemptCount] DEFAULT (0),
        [NextAttemptAtUtc] DATETIME2(3) NULL,
        [LastError] NVARCHAR(2000) NULL,

        CONSTRAINT [PK_OutboxMessages] PRIMARY KEY CLUSTERED ([OutboxMessageId]),
        CONSTRAINT [CK_OutboxMessages_Json] CHECK (ISJSON([PayloadJson]) = 1),
        CONSTRAINT [CK_OutboxMessages_Attempts] CHECK ([AttemptCount] >= 0),
        CONSTRAINT [CK_OutboxMessages_Processed]
            CHECK ([ProcessedAtUtc] IS NULL OR [ProcessedAtUtc] >= [OccurredAtUtc])
    );

    CREATE INDEX [IX_OutboxMessages_Pending]
        ON [Integration].[OutboxMessages] ([NextAttemptAtUtc], [OccurredAtUtc])
        INCLUDE ([EventType], [AggregateType], [AggregateId], [AttemptCount])
        WHERE [ProcessedAtUtc] IS NULL;

    CREATE TABLE [Audit].[AdminEvents]
    (
        [AdminEventId] BIGINT IDENTITY(1,1) NOT NULL,
        [ActorUserId] UNIQUEIDENTIFIER NULL,
        [EventType] NVARCHAR(100) NOT NULL,
        [EntityType] NVARCHAR(50) NOT NULL,
        [EntityId] UNIQUEIDENTIFIER NULL,
        [EventDataJson] NVARCHAR(MAX) NULL,
        [IpAddress] VARCHAR(45) NULL,
        [UserAgent] NVARCHAR(512) NULL,
        [CreatedAtUtc] DATETIME2(3) NOT NULL
            CONSTRAINT [DF_AdminEvents_CreatedAtUtc] DEFAULT SYSUTCDATETIME(),

        CONSTRAINT [PK_AdminEvents] PRIMARY KEY CLUSTERED ([AdminEventId]),
        CONSTRAINT [FK_AdminEvents_Actor]
            FOREIGN KEY ([ActorUserId]) REFERENCES [Auth].[Users] ([UserId]),
        CONSTRAINT [CK_AdminEvents_Json]
            CHECK ([EventDataJson] IS NULL OR ISJSON([EventDataJson]) = 1)
    );

    CREATE INDEX [IX_AdminEvents_Actor_Created]
        ON [Audit].[AdminEvents] ([ActorUserId], [CreatedAtUtc] DESC);
    CREATE INDEX [IX_AdminEvents_Entity_Created]
        ON [Audit].[AdminEvents] ([EntityType], [EntityId], [CreatedAtUtc] DESC);

    INSERT INTO [Auth].[Roles] ([RoleName])
    VALUES (N'user'), (N'admin'), (N'systemUser');

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO
