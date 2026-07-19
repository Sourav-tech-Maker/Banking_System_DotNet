-- =========================================================================
-- YONO BANK DIGITAL BANKING SUITE - SQL SERVER DATABASE SCHEMA SCRIPT
-- Compatible with SQL Server Management Studio (SSMS) & Azure SQL Database
-- =========================================================================

-- Create Database if not exists (uncomment if running as a standalone setup)
-- CREATE DATABASE YonoBank;
-- GO
-- USE YonoBank;
-- GO

-- Disable constraints to allow clean recreate during development/testing
IF OBJECT_ID('dbo.TR_Ledgers_PreventUpdateDelete', 'TR') IS NOT NULL DROP TRIGGER dbo.TR_Ledgers_PreventUpdateDelete;
IF OBJECT_ID('dbo.TR_SavingsLogs_PreventUpdateDelete', 'TR') IS NOT NULL DROP TRIGGER dbo.TR_SavingsLogs_PreventUpdateDelete;
IF OBJECT_ID('dbo.TR_Goals_UpdateStatus', 'TR') IS NOT NULL DROP TRIGGER dbo.TR_Goals_UpdateStatus;
IF OBJECT_ID('dbo.TR_Goals_CheckTargetDate', 'TR') IS NOT NULL DROP TRIGGER dbo.TR_Goals_CheckTargetDate;
IF OBJECT_ID('dbo.V_DashboardAnalytics', 'V') IS NOT NULL DROP VIEW dbo.V_DashboardAnalytics;
IF OBJECT_ID('dbo.V_AccountBalances', 'V') IS NOT NULL DROP VIEW dbo.V_AccountBalances;
IF OBJECT_ID('dbo.sp_CleanupExpiredRecords', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_CleanupExpiredRecords;

-- Drop Tables in reverse order of dependencies
IF OBJECT_ID('dbo.BlacklistedTokens', 'U') IS NOT NULL DROP TABLE dbo.BlacklistedTokens;
IF OBJECT_ID('dbo.Otps', 'U') IS NOT NULL DROP TABLE dbo.Otps;
IF OBJECT_ID('dbo.Sessions', 'U') IS NOT NULL DROP TABLE dbo.Sessions;
IF OBJECT_ID('dbo.SavingsLogs', 'U') IS NOT NULL DROP TABLE dbo.SavingsLogs;
IF OBJECT_ID('dbo.Goals', 'U') IS NOT NULL DROP TABLE dbo.Goals;
IF OBJECT_ID('dbo.Beneficiaries', 'U') IS NOT NULL DROP TABLE dbo.Beneficiaries;
IF OBJECT_ID('dbo.Ledgers', 'U') IS NOT NULL DROP TABLE dbo.Ledgers;
IF OBJECT_ID('dbo.Transactions', 'U') IS NOT NULL DROP TABLE dbo.Transactions;
IF OBJECT_ID('dbo.Accounts', 'U') IS NOT NULL DROP TABLE dbo.Accounts;
IF OBJECT_ID('dbo.KYC', 'U') IS NOT NULL DROP TABLE dbo.KYC;
IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL DROP TABLE dbo.Users;
GO

-- =========================================================================
-- 1. USERS TABLE
-- =========================================================================
CREATE TABLE dbo.Users (
    Id UNIQUEIDENTIFIER CONSTRAINT DF_Users_Id DEFAULT NEWID() PRIMARY KEY,
    Username NVARCHAR(100) NOT NULL CONSTRAINT UQ_Users_Username UNIQUE,
    Email NVARCHAR(256) NOT NULL CONSTRAINT UQ_Users_Email UNIQUE,
    PasswordHash NVARCHAR(MAX) NOT NULL,
    IsVerified BIT NOT NULL CONSTRAINT DF_Users_IsVerified DEFAULT 0,
    Status NVARCHAR(20) NOT NULL CONSTRAINT DF_Users_Status DEFAULT 'Active',
    Role NVARCHAR(20) NOT NULL CONSTRAINT DF_Users_Role DEFAULT 'user',
    IsSystemUser BIT NOT NULL CONSTRAINT DF_Users_IsSystemUser DEFAULT 0,
    LoginAttempts INT NOT NULL CONSTRAINT DF_Users_LoginAttempts DEFAULT 0,
    LockUntil DATETIME2 NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Users_CreatedAt DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Users_UpdatedAt DEFAULT GETUTCDATE(),

    -- Constraints
    CONSTRAINT CK_Users_Status CHECK (Status IN ('Active', 'Suspended', 'Locked')),
    CONSTRAINT CK_Users_Role CHECK (Role IN ('user', 'admin', 'systemUser'))
);
GO

-- =========================================================================
-- 2. KYC TABLE (1-to-1 Relationship with Users)
-- =========================================================================
CREATE TABLE dbo.KYC (
    Id UNIQUEIDENTIFIER CONSTRAINT DF_KYC_Id DEFAULT NEWID() PRIMARY KEY,
    UserId UNIQUEIDENTIFIER NOT NULL CONSTRAINT UQ_KYC_UserId UNIQUE,
    FullName NVARCHAR(150) NOT NULL,
    DateOfBirth NVARCHAR(50) NOT NULL, -- Stored as string matching Mongoose schema
    Gender NVARCHAR(10) NOT NULL,
    StreetAddress NVARCHAR(255) NOT NULL,
    City NVARCHAR(100) NOT NULL,
    State NVARCHAR(100) NOT NULL,
    Country NVARCHAR(100) NOT NULL,
    PostalCode NVARCHAR(20) NOT NULL,
    DocumentType NVARCHAR(50) NOT NULL,
    DocumentNumber NVARCHAR(50) NOT NULL CONSTRAINT UQ_KYC_DocNumber UNIQUE,
    DocumentImgUrl NVARCHAR(2083) NOT NULL, -- Max URL length
    Status NVARCHAR(20) NOT NULL CONSTRAINT DF_KYC_Status DEFAULT 'Pending',
    RejectReason NVARCHAR(500) NULL,
    ReviewedBy UNIQUEIDENTIFIER NULL,
    ReviewedAt DATETIME2 NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_KYC_CreatedAt DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_KYC_UpdatedAt DEFAULT GETUTCDATE(),

    -- Constraints
    CONSTRAINT FK_KYC_Users_UserId FOREIGN KEY (UserId) REFERENCES dbo.Users(Id) ON DELETE CASCADE,
    CONSTRAINT FK_KYC_Users_ReviewedBy FOREIGN KEY (ReviewedBy) REFERENCES dbo.Users(Id) ON DELETE NO ACTION,
    CONSTRAINT CK_KYC_Gender CHECK (Gender IN ('Male', 'Female', 'Other')),
    CONSTRAINT CK_KYC_DocumentType CHECK (DocumentType IN ('Passport', 'Aadhar-card', 'Driver License', 'Pan-Card')),
    CONSTRAINT CK_KYC_Status CHECK (Status IN ('Pending', 'Approve', 'Rejected')),
    -- Rejection reason is required if status is Rejected
    CONSTRAINT CK_KYC_RejectReason CHECK (Status != 'Rejected' OR (RejectReason IS NOT NULL AND LEN(TRIM(RejectReason)) > 0))
);
GO

-- =========================================================================
-- 3. ACCOUNTS TABLE
-- =========================================================================
CREATE TABLE dbo.Accounts (
    Id UNIQUEIDENTIFIER CONSTRAINT DF_Accounts_Id DEFAULT NEWID() PRIMARY KEY,
    UserId UNIQUEIDENTIFIER NOT NULL,
    AccountType NVARCHAR(20) NOT NULL CONSTRAINT DF_Accounts_AccountType DEFAULT 'Savings',
    Status NVARCHAR(20) NOT NULL CONSTRAINT DF_Accounts_Status DEFAULT 'Active',
    Currency NVARCHAR(10) NOT NULL CONSTRAINT DF_Accounts_Currency DEFAULT 'INR',
    IsKycVerified BIT NOT NULL CONSTRAINT DF_Accounts_IsKycVerified DEFAULT 0,
    IsSystemUser BIT NOT NULL CONSTRAINT DF_Accounts_IsSystemUser DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Accounts_CreatedAt DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Accounts_UpdatedAt DEFAULT GETUTCDATE(),

    -- Constraints
    CONSTRAINT FK_Accounts_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(Id) ON DELETE CASCADE,
    CONSTRAINT CK_Accounts_AccountType CHECK (AccountType IN ('Savings', 'Current')),
    CONSTRAINT CK_Accounts_Status CHECK (Status IN ('Active', 'Frozen', 'Closed'))
);
GO

-- =========================================================================
-- 4. TRANSACTIONS TABLE
-- =========================================================================
CREATE TABLE dbo.Transactions (
    Id UNIQUEIDENTIFIER CONSTRAINT DF_Transactions_Id DEFAULT NEWID() PRIMARY KEY,
    FromAccountId UNIQUEIDENTIFIER NOT NULL,
    ToAccountId UNIQUEIDENTIFIER NOT NULL,
    Amount DECIMAL(18, 4) NOT NULL,
    Status NVARCHAR(20) NOT NULL CONSTRAINT DF_Transactions_Status DEFAULT 'Pending',
    IdempotencyKey NVARCHAR(256) NOT NULL CONSTRAINT UQ_Transactions_Idempotency UNIQUE,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Transactions_CreatedAt DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Transactions_UpdatedAt DEFAULT GETUTCDATE(),

    -- Constraints
    -- Note: ON DELETE NO ACTION is used on both foreign keys to prevent multiple cascade paths / cycle errors in SQL Server.
    CONSTRAINT FK_Transactions_Accounts_From FOREIGN KEY (FromAccountId) REFERENCES dbo.Accounts(Id) ON DELETE NO ACTION,
    CONSTRAINT FK_Transactions_Accounts_To FOREIGN KEY (ToAccountId) REFERENCES dbo.Accounts(Id) ON DELETE NO ACTION,
    CONSTRAINT CK_Transactions_Amount CHECK (Amount > 0),
    CONSTRAINT CK_Transactions_Status CHECK (Status IN ('Pending', 'Completed', 'failed', 'Reversed'))
);
GO

-- =========================================================================
-- 5. LEDGERS TABLE (Dynamic Double-Entry Journal Records)
-- =========================================================================
CREATE TABLE dbo.Ledgers (
    Id UNIQUEIDENTIFIER CONSTRAINT DF_Ledgers_Id DEFAULT NEWID() PRIMARY KEY,
    AccountId UNIQUEIDENTIFIER NOT NULL,
    Amount DECIMAL(18, 4) NOT NULL,
    TransactionId UNIQUEIDENTIFIER NOT NULL,
    Type NVARCHAR(10) NOT NULL, -- Credit increases balance, Debit decreases balance
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Ledgers_CreatedAt DEFAULT GETUTCDATE(),

    -- Constraints
    CONSTRAINT FK_Ledgers_Accounts FOREIGN KEY (AccountId) REFERENCES dbo.Accounts(Id) ON DELETE NO ACTION,
    CONSTRAINT FK_Ledgers_Transactions FOREIGN KEY (TransactionId) REFERENCES dbo.Transactions(Id) ON DELETE NO ACTION,
    CONSTRAINT CK_Ledgers_Amount CHECK (Amount > 0),
    CONSTRAINT CK_Ledgers_Type CHECK (Type IN ('Credit', 'Debit'))
);
GO

-- =========================================================================
-- 6. BENEFICIARIES TABLE
-- =========================================================================
CREATE TABLE dbo.Beneficiaries (
    Id UNIQUEIDENTIFIER CONSTRAINT DF_Beneficiaries_Id DEFAULT NEWID() PRIMARY KEY,
    UserId UNIQUEIDENTIFIER NOT NULL,
    FullName NVARCHAR(150) NOT NULL,
    NickName NVARCHAR(50) NULL,
    AccountId UNIQUEIDENTIFIER NOT NULL,
    BankName NVARCHAR(100) NOT NULL CONSTRAINT DF_Beneficiaries_BankName DEFAULT 'YONO App',
    AccountType NVARCHAR(20) NOT NULL CONSTRAINT DF_Beneficiaries_AccountType DEFAULT 'Savings',
    Otp NVARCHAR(10) NULL,
    OtpExpiresAt DATETIME2 NULL,
    Status NVARCHAR(20) NOT NULL CONSTRAINT DF_Beneficiaries_Status DEFAULT 'Pending',
    IsVerified BIT NOT NULL CONSTRAINT DF_Beneficiaries_IsVerified DEFAULT 0,
    VerificationCode NVARCHAR(50) NULL,
    CodeExpiresAt DATETIME2 NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Beneficiaries_CreatedAt DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Beneficiaries_UpdatedAt DEFAULT GETUTCDATE(),

    -- Constraints
    CONSTRAINT FK_Beneficiaries_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(Id) ON DELETE CASCADE,
    CONSTRAINT FK_Beneficiaries_Accounts FOREIGN KEY (AccountId) REFERENCES dbo.Accounts(Id) ON DELETE NO ACTION,
    CONSTRAINT CK_Beneficiaries_AccountType CHECK (AccountType IN ('Savings', 'Checking', 'Current')),
    CONSTRAINT CK_Beneficiaries_Status CHECK (Status IN ('Pending', 'Active', 'Suspended')),
    -- Unique constraint to prevent adding the same beneficiary account multiple times for the same user
    CONSTRAINT UQ_Beneficiaries_User_Account UNIQUE (UserId, AccountId)
);
GO

-- =========================================================================
-- 7. GOALS TABLE
-- =========================================================================
CREATE TABLE dbo.Goals (
    Id UNIQUEIDENTIFIER CONSTRAINT DF_Goals_Id DEFAULT NEWID() PRIMARY KEY,
    UserId UNIQUEIDENTIFIER NOT NULL,
    Title NVARCHAR(100) NOT NULL,
    Category NVARCHAR(50) NOT NULL,
    TargetAmount DECIMAL(18, 4) NOT NULL,
    CurrentAmount DECIMAL(18, 4) NOT NULL CONSTRAINT DF_Goals_CurrentAmount DEFAULT 0.00,
    TargetDate DATETIME2 NOT NULL,
    Status NVARCHAR(20) NOT NULL CONSTRAINT DF_Goals_Status DEFAULT 'active',
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Goals_CreatedAt DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Goals_UpdatedAt DEFAULT GETUTCDATE(),

    -- Constraints
    CONSTRAINT FK_Goals_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(Id) ON DELETE CASCADE,
    CONSTRAINT CK_Goals_TargetAmount CHECK (TargetAmount > 0),
    CONSTRAINT CK_Goals_CurrentAmount CHECK (CurrentAmount >= 0),
    CONSTRAINT CK_Goals_Status CHECK (Status IN ('active', 'completed')),
    -- Goal title must be unique per user
    CONSTRAINT UQ_Goals_User_Title UNIQUE (UserId, Title)
);
GO

-- =========================================================================
-- 8. SAVINGS LOGS TABLE
-- =========================================================================
CREATE TABLE dbo.SavingsLogs (
    Id UNIQUEIDENTIFIER CONSTRAINT DF_SavingsLogs_Id DEFAULT NEWID() PRIMARY KEY,
    GoalId UNIQUEIDENTIFIER NOT NULL,
    AmountAdded DECIMAL(18, 4) NOT NULL,
    Type NVARCHAR(20) NOT NULL CONSTRAINT DF_SavingsLogs_Type DEFAULT 'manual',
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_SavingsLogs_CreatedAt DEFAULT GETUTCDATE(),

    -- Constraints
    CONSTRAINT FK_SavingsLogs_Goals FOREIGN KEY (GoalId) REFERENCES dbo.Goals(Id) ON DELETE CASCADE,
    CONSTRAINT CK_SavingsLogs_AmountAdded CHECK (AmountAdded >= 0.01),
    CONSTRAINT CK_SavingsLogs_Type CHECK (Type IN ('manual', 'auto-debit', 'round-up'))
);
GO

-- =========================================================================
-- 9. SESSIONS TABLE (Handles JWT Refresh Token Rotations)
-- =========================================================================
CREATE TABLE dbo.Sessions (
    Id UNIQUEIDENTIFIER CONSTRAINT DF_Sessions_Id DEFAULT NEWID() PRIMARY KEY,
    UserId UNIQUEIDENTIFIER NOT NULL,
    RefreshTokenHash NVARCHAR(256) NOT NULL CONSTRAINT UQ_Sessions_RefreshTokenHash UNIQUE,
    IpAddress NVARCHAR(45) NOT NULL, -- Length handles IPv6
    UserAgent NVARCHAR(500) NOT NULL,
    IsRevoked BIT NOT NULL CONSTRAINT DF_Sessions_IsRevoked DEFAULT 0,
    ExpiresAt DATETIME2 NOT NULL,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Sessions_CreatedAt DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Sessions_UpdatedAt DEFAULT GETUTCDATE(),

    -- Constraints
    CONSTRAINT FK_Sessions_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(Id) ON DELETE CASCADE
);
GO

-- =========================================================================
-- 10. OTPS TABLE
-- =========================================================================
CREATE TABLE dbo.Otps (
    Id UNIQUEIDENTIFIER CONSTRAINT DF_Otps_Id DEFAULT NEWID() PRIMARY KEY,
    Email NVARCHAR(256) NOT NULL,
    OtpHash NVARCHAR(256) NOT NULL,
    ExpiresAt DATETIME2 NOT NULL,
    IsVerified BIT NOT NULL CONSTRAINT DF_Otps_IsVerified DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Otps_CreatedAt DEFAULT GETUTCDATE()
);
GO

-- =========================================================================
-- 11. BLACKLISTED TOKENS TABLE (For instant access token logout)
-- =========================================================================
CREATE TABLE dbo.BlacklistedTokens (
    Id UNIQUEIDENTIFIER CONSTRAINT DF_BlacklistedTokens_Id DEFAULT NEWID() PRIMARY KEY,
    Token NVARCHAR(450) NOT NULL CONSTRAINT UQ_BlacklistedTokens_Token UNIQUE, -- Indexed limit length
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_BlacklistedTokens_CreatedAt DEFAULT GETUTCDATE()
);
GO

-- =========================================================================
-- INDEXES FOR FOREIGN KEYS & SEARCH OPTIMIZATIONS
-- =========================================================================

-- Users Search Indexes
CREATE NONCLUSTERED INDEX IX_Users_Role_Status ON dbo.Users(Role, Status);
GO

-- KYC Search Indexes
CREATE NONCLUSTERED INDEX IX_KYC_UserId ON dbo.KYC(UserId);
CREATE NONCLUSTERED INDEX IX_KYC_Status ON dbo.KYC(Status);
GO

-- Accounts Search Indexes
CREATE NONCLUSTERED INDEX IX_Accounts_UserId_Status ON dbo.Accounts(UserId, Status);
GO

-- Transactions Indexes
CREATE NONCLUSTERED INDEX IX_Transactions_FromAccountId ON dbo.Transactions(FromAccountId);
CREATE NONCLUSTERED INDEX IX_Transactions_ToAccountId ON dbo.Transactions(ToAccountId);
CREATE NONCLUSTERED INDEX IX_Transactions_Status_CreatedAt ON dbo.Transactions(Status, CreatedAt DESC);
GO

-- Ledgers Indexes
CREATE NONCLUSTERED INDEX IX_Ledgers_AccountId ON dbo.Ledgers(AccountId);
CREATE NONCLUSTERED INDEX IX_Ledgers_TransactionId ON dbo.Ledgers(TransactionId);
CREATE NONCLUSTERED INDEX IX_Ledgers_Type_Amount ON dbo.Ledgers(Type, Amount);
GO

-- Beneficiaries Indexes
CREATE NONCLUSTERED INDEX IX_Beneficiaries_UserId ON dbo.Beneficiaries(UserId);
CREATE NONCLUSTERED INDEX IX_Beneficiaries_AccountId ON dbo.Beneficiaries(AccountId);
GO

-- Goals Indexes
CREATE NONCLUSTERED INDEX IX_Goals_UserId_Status ON dbo.Goals(UserId, Status);
GO

-- SavingsLogs Indexes
CREATE NONCLUSTERED INDEX IX_SavingsLogs_GoalId ON dbo.SavingsLogs(GoalId);
GO

-- Sessions Indexes
CREATE NONCLUSTERED INDEX IX_Sessions_UserId ON dbo.Sessions(UserId);
CREATE NONCLUSTERED INDEX IX_Sessions_ExpiresAt ON dbo.Sessions(ExpiresAt);
GO

-- Otps Indexes
CREATE NONCLUSTERED INDEX IX_Otps_Email ON dbo.Otps(Email);
CREATE NONCLUSTERED INDEX IX_Otps_ExpiresAt ON dbo.Otps(ExpiresAt);
GO

-- =========================================================================
-- DYNAMIC VIEWS FOR CALCULATED METRICS
-- =========================================================================

-- View for Dynamic Account Balance Calculation (Credit sum - Debit sum)
CREATE VIEW dbo.V_AccountBalances
AS
SELECT 
    a.Id AS AccountId,
    a.UserId,
    a.AccountType,
    a.Status AS AccountStatus,
    a.Currency,
    a.IsKycVerified,
    ISNULL(SUM(CASE WHEN l.Type = 'Credit' THEN l.Amount ELSE 0 END), 0) -
    ISNULL(SUM(CASE WHEN l.Type = 'Debit' THEN l.Amount ELSE 0 END), 0) AS Balance
FROM dbo.Accounts a
LEFT JOIN dbo.Ledgers l ON a.Id = l.AccountId
GROUP BY a.Id, a.UserId, a.AccountType, a.Status, a.Currency, a.IsKycVerified;
GO

-- View for Dashboard Income vs. Expense Aggregates
CREATE VIEW dbo.V_DashboardAnalytics
AS
SELECT 
    a.UserId,
    ISNULL(SUM(CASE WHEN l.Type = 'Credit' THEN l.Amount ELSE 0 END), 0) AS TotalIncome,
    ISNULL(SUM(CASE WHEN l.Type = 'Debit' THEN l.Amount ELSE 0 END), 0) AS TotalExpense
FROM dbo.Accounts a
INNER JOIN dbo.Ledgers l ON a.Id = l.AccountId
GROUP BY a.UserId;
GO

-- =========================================================================
-- DATABASE TRIGGERS FOR CONSTRAINTS & IMMUTABILITY
-- =========================================================================

-- Ledgers Table Immutability Trigger (Throws error on UPDATE/DELETE)
CREATE TRIGGER dbo.TR_Ledgers_PreventUpdateDelete
ON dbo.Ledgers
FOR UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    RAISERROR('Ledger records are immutable and cannot be updated or deleted.', 16, 1);
    ROLLBACK TRANSACTION;
END;
GO

-- SavingsLogs Table Immutability Trigger (Throws error on UPDATE/DELETE)
CREATE TRIGGER dbo.TR_SavingsLogs_PreventUpdateDelete
ON dbo.SavingsLogs
FOR UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    RAISERROR('Savings log records are immutable and cannot be updated or deleted.', 16, 1);
    ROLLBACK TRANSACTION;
END;
GO

-- Goals Target Date Future Validation Trigger (on INSERT/UPDATE)
CREATE TRIGGER dbo.TR_Goals_CheckTargetDate
ON dbo.Goals
FOR INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM inserted WHERE TargetDate <= GETUTCDATE())
    BEGIN
        RAISERROR('Target date must be in the future.', 16, 1);
        ROLLBACK TRANSACTION;
    END;
END;
GO

-- Goals Dynamic Status Pre-save Logic equivalent (Sets 'completed' or 'active')
CREATE TRIGGER dbo.TR_Goals_UpdateStatus
ON dbo.Goals
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE G
    SET G.Status = CASE 
        WHEN G.CurrentAmount >= G.TargetAmount THEN 'completed' 
        ELSE 'active' 
    END,
    G.UpdatedAt = GETUTCDATE()
    FROM dbo.Goals G
    INNER JOIN inserted i ON G.Id = i.Id
    WHERE (G.CurrentAmount >= G.TargetAmount AND G.Status != 'completed')
       OR (G.CurrentAmount < G.TargetAmount AND G.Status != 'active');
END;
GO

-- =========================================================================
-- TIMEOUT & RETENTION CLEANUP (TTL Indexes Equivalence)
-- =========================================================================
CREATE PROCEDURE dbo.sp_CleanupExpiredRecords
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        -- Clean expired refresh sessions
        DELETE FROM dbo.Sessions WHERE ExpiresAt < GETUTCDATE();
        
        -- Clean expired OTPs
        DELETE FROM dbo.Otps WHERE ExpiresAt < GETUTCDATE();
        
        -- Clean blacklisted access tokens older than 24 hours
        DELETE FROM dbo.BlacklistedTokens WHERE CreatedAt < DATEADD(hour, -24, GETUTCDATE());
        
        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO
