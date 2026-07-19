/*
    Banking System - transaction-safe ledger operations

    Important:
      - Application code should not insert ledger rows directly.
      - Use the stored procedures in this script.
      - Balances are derived from immutable LedgerEntries.
      - Every completed transfer has exactly two postings:
            sequence 1: DEBIT source account
            sequence 2: CREDIT destination account
      - A reversal is a separate transfer linked to the original transfer.
*/

USE [Banking_System];
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER VIEW [Banking].[vwAccountBalances]
AS
    SELECT
        A.[AccountId],
        A.[AccountNumber],
        A.[UserId],
        A.[AccountType],
        A.[AccountStatus],
        A.[AccountPurpose],
        A.[CurrencyCode],
        CONVERT(DECIMAL(38,4), COALESCE(SUM(L.[SignedAmount]), 0)) AS [CurrentBalance]
    FROM [Banking].[BankAccounts] AS A
    LEFT JOIN [Banking].[LedgerEntries] AS L
        ON L.[AccountId] = A.[AccountId]
    GROUP BY
        A.[AccountId],
        A.[AccountNumber],
        A.[UserId],
        A.[AccountType],
        A.[AccountStatus],
        A.[AccountPurpose],
        A.[CurrencyCode];
GO

CREATE OR ALTER VIEW [Savings].[vwSavingsGoalProgress]
AS
    SELECT
        G.[SavingsGoalId],
        G.[UserId],
        G.[Title],
        G.[Category],
        G.[TargetAmount],
        CONVERT(DECIMAL(38,4), COALESCE(SUM(C.[Amount]), 0)) AS [CurrentAmount],
        CONVERT
        (
            DECIMAL(19,4),
            CASE
                WHEN G.[TargetAmount] - COALESCE(SUM(C.[Amount]), 0) > 0
                    THEN G.[TargetAmount] - COALESCE(SUM(C.[Amount]), 0)
                ELSE 0
            END
        ) AS [RemainingAmount],
        CONVERT
        (
            DECIMAL(7,2),
            CASE
                WHEN G.[TargetAmount] <= 0 THEN 0
                WHEN COALESCE(SUM(C.[Amount]), 0) >= G.[TargetAmount] THEN 100
                ELSE (COALESCE(SUM(C.[Amount]), 0) * 100.0) / G.[TargetAmount]
            END
        ) AS [ProgressPercentage],
        CASE
            WHEN G.[IsArchived] = 1 THEN N'ARCHIVED'
            WHEN COALESCE(SUM(C.[Amount]), 0) >= G.[TargetAmount] THEN N'COMPLETED'
            ELSE N'ACTIVE'
        END AS [GoalStatus],
        G.[TargetDateUtc],
        G.[CreatedAtUtc],
        G.[UpdatedAtUtc]
    FROM [Savings].[SavingsGoals] AS G
    LEFT JOIN [Savings].[SavingsContributions] AS C
        ON C.[SavingsGoalId] = G.[SavingsGoalId]
    GROUP BY
        G.[SavingsGoalId],
        G.[UserId],
        G.[Title],
        G.[Category],
        G.[TargetAmount],
        G.[IsArchived],
        G.[TargetDateUtc],
        G.[CreatedAtUtc],
        G.[UpdatedAtUtc];
GO

CREATE OR ALTER TRIGGER [Banking].[TR_LedgerEntries_Immutable]
ON [Banking].[LedgerEntries]
INSTEAD OF UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    THROW 51000, 'Ledger entries are immutable. Post a separate correcting or reversal transfer.', 1;
END;
GO

CREATE OR ALTER TRIGGER [Banking].[TR_LedgerEntries_ValidateInsert]
ON [Banking].[LedgerEntries]
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS
    (
        SELECT 1
        FROM inserted AS I
        INNER JOIN [Banking].[Transfers] AS T
            ON T.[TransferId] = I.[TransferId]
        INNER JOIN [Banking].[BankAccounts] AS A
            ON A.[AccountId] = I.[AccountId]
        WHERE T.[TransferStatus] <> N'PENDING'
           OR I.[Amount] <> T.[Amount]
           OR A.[CurrencyCode] <> T.[CurrencyCode]
           OR
           (
               I.[EntrySequence] = 1
               AND (I.[EntryType] <> N'DEBIT' OR I.[AccountId] <> T.[FromAccountId])
           )
           OR
           (
               I.[EntrySequence] = 2
               AND (I.[EntryType] <> N'CREDIT' OR I.[AccountId] <> T.[ToAccountId])
           )
    )
        THROW 51033, 'Ledger postings must match the pending transfer amount, currency, accounts and direction.', 1;

    IF EXISTS
    (
        SELECT I.[TransferId]
        FROM inserted AS I
        INNER JOIN [Banking].[LedgerEntries] AS L
            ON L.[TransferId] = I.[TransferId]
        GROUP BY I.[TransferId]
        HAVING COUNT_BIG(DISTINCT L.[LedgerEntryId]) <> 2
            OR SUM(L.[SignedAmount]) <> CONVERT(DECIMAL(38,4), 0)
    )
        THROW 51034, 'Both balanced ledger postings must be inserted in one statement.', 1;
END;
GO

CREATE OR ALTER TRIGGER [Savings].[TR_SavingsContributions_Immutable]
ON [Savings].[SavingsContributions]
INSTEAD OF UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;
    THROW 51001, 'Savings contributions are append-only. Add a correcting contribution instead.', 1;
END;
GO

CREATE OR ALTER PROCEDURE [Banking].[usp_GetAccountBalance]
    @AccountId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS
    (
        SELECT 1
        FROM [Banking].[BankAccounts]
        WHERE [AccountId] = @AccountId
    )
        THROW 51002, 'Bank account was not found.', 1;

    SELECT
        [AccountId],
        [AccountNumber],
        [CurrencyCode],
        [CurrentBalance]
    FROM [Banking].[vwAccountBalances]
    WHERE [AccountId] = @AccountId;
END;
GO

/* Internal core procedure. Grant application roles access to the public
   wrapper procedures below, not directly to this procedure. */
CREATE OR ALTER PROCEDURE [Banking].[usp_PostTransferCore]
    @FromAccountId UNIQUEIDENTIFIER,
    @ToAccountId UNIQUEIDENTIFIER,
    @Amount DECIMAL(19,4),
    @IdempotencyKey VARCHAR(100),
    @InitiatedByUserId UNIQUEIDENTIFIER,
    @TransferType NVARCHAR(30),
    @PaymentMethod NVARCHAR(30) = NULL,
    @Category NVARCHAR(30) = NULL,
    @Narration NVARCHAR(500) = NULL,
    @ClientIpAddress VARCHAR(45) = NULL,
    @UserAgent NVARCHAR(512) = NULL,
    @TransferId UNIQUEIDENTIFIER OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @IdempotencyKey = LTRIM(RTRIM(@IdempotencyKey));
    SET @Narration = NULLIF(LTRIM(RTRIM(@Narration)), N'');

    IF @FromAccountId IS NULL OR @ToAccountId IS NULL
        THROW 51003, 'Source and destination accounts are required.', 1;
    IF @FromAccountId = @ToAccountId
        THROW 51004, 'Source and destination accounts must be different.', 1;
    IF @Amount IS NULL OR @Amount <= CONVERT(DECIMAL(19,4), 0)
        THROW 51005, 'Transfer amount must be greater than zero.', 1;
    IF @IdempotencyKey IS NULL OR LEN(@IdempotencyKey) = 0
        THROW 51006, 'An idempotency key is required.', 1;
    IF @InitiatedByUserId IS NULL
        THROW 51007, 'The initiating user is required.', 1;
    IF @TransferType NOT IN (N'CUSTOMER_TRANSFER', N'INITIAL_FUNDING', N'ADJUSTMENT')
        THROW 51008, 'Unsupported transfer type. Use usp_ReverseTransfer for reversals.', 1;

    DECLARE
        @ExistingTransferId UNIQUEIDENTIFIER,
        @ExistingFromAccountId UNIQUEIDENTIFIER,
        @ExistingToAccountId UNIQUEIDENTIFIER,
        @ExistingAmount DECIMAL(19,4),
        @ExistingInitiatedByUserId UNIQUEIDENTIFIER,
        @ExistingTransferType NVARCHAR(30),
        @FirstAccountId UNIQUEIDENTIFIER,
        @SecondAccountId UNIQUEIDENTIFIER,
        @LockedAccountId UNIQUEIDENTIFIER,
        @FromUserId UNIQUEIDENTIFIER,
        @FromStatus NVARCHAR(20),
        @FromPurpose NVARCHAR(20),
        @FromCurrency CHAR(3),
        @ToStatus NVARCHAR(20),
        @ToCurrency CHAR(3),
        @SourceBalance DECIMAL(38,4),
        @PayloadJson NVARCHAR(MAX);

    BEGIN TRY
        BEGIN TRANSACTION;

        /* HOLDLOCK protects the unique-key range, so simultaneous retries
           cannot both create a transfer with the same idempotency key. */
        SELECT
            @ExistingTransferId = T.[TransferId],
            @ExistingFromAccountId = T.[FromAccountId],
            @ExistingToAccountId = T.[ToAccountId],
            @ExistingAmount = T.[Amount],
            @ExistingInitiatedByUserId = T.[InitiatedByUserId],
            @ExistingTransferType = T.[TransferType]
        FROM [Banking].[Transfers] AS T WITH (UPDLOCK, HOLDLOCK)
        WHERE T.[IdempotencyKey] = @IdempotencyKey;

        IF @ExistingTransferId IS NOT NULL
        BEGIN
            IF @ExistingFromAccountId <> @FromAccountId
               OR @ExistingToAccountId <> @ToAccountId
               OR @ExistingAmount <> @Amount
               OR @ExistingInitiatedByUserId <> @InitiatedByUserId
               OR @ExistingTransferType <> @TransferType
                THROW 51035, 'The idempotency key is already associated with a different transfer request.', 1;

            SET @TransferId = @ExistingTransferId;
            COMMIT TRANSACTION;

            SELECT *
            FROM [Banking].[Transfers]
            WHERE [TransferId] = @TransferId;
            RETURN;
        END;

        /* Lock both account rows in a deterministic order. Every supported
           posting procedure follows this rule to avoid overdraft races and
           reduce deadlock risk. */
        IF CONVERT(CHAR(36), @FromAccountId) < CONVERT(CHAR(36), @ToAccountId)
        BEGIN
            SET @FirstAccountId = @FromAccountId;
            SET @SecondAccountId = @ToAccountId;
        END
        ELSE
        BEGIN
            SET @FirstAccountId = @ToAccountId;
            SET @SecondAccountId = @FromAccountId;
        END;

        SELECT @LockedAccountId = A.[AccountId]
        FROM [Banking].[BankAccounts] AS A WITH (UPDLOCK, HOLDLOCK)
        WHERE A.[AccountId] = @FirstAccountId;

        IF @LockedAccountId IS NULL
            THROW 51009, 'Source or destination bank account was not found.', 1;

        SET @LockedAccountId = NULL;

        SELECT @LockedAccountId = A.[AccountId]
        FROM [Banking].[BankAccounts] AS A WITH (UPDLOCK, HOLDLOCK)
        WHERE A.[AccountId] = @SecondAccountId;

        IF @LockedAccountId IS NULL
            THROW 51009, 'Source or destination bank account was not found.', 1;

        SELECT
            @FromUserId = A.[UserId],
            @FromStatus = A.[AccountStatus],
            @FromPurpose = A.[AccountPurpose],
            @FromCurrency = A.[CurrencyCode]
        FROM [Banking].[BankAccounts] AS A
        WHERE A.[AccountId] = @FromAccountId;

        SELECT
            @ToStatus = A.[AccountStatus],
            @ToCurrency = A.[CurrencyCode]
        FROM [Banking].[BankAccounts] AS A
        WHERE A.[AccountId] = @ToAccountId;

        IF @FromStatus <> N'ACTIVE' OR @ToStatus <> N'ACTIVE'
            THROW 51010, 'Both bank accounts must be active.', 1;
        IF @FromCurrency <> @ToCurrency
            THROW 51011, 'Cross-currency transfers are not supported.', 1;

        IF @TransferType = N'CUSTOMER_TRANSFER'
        BEGIN
            IF @FromUserId <> @InitiatedByUserId
                THROW 51012, 'The initiating user does not own the source account.', 1;

            IF @FromPurpose <> N'CUSTOMER'
                THROW 51013, 'Customer transfers must originate from a customer account.', 1;

            IF NOT EXISTS
            (
                SELECT 1
                FROM [Compliance].[KycApplications]
                WHERE [UserId] = @FromUserId
                  AND [KycStatus] = N'APPROVED'
            )
                THROW 51014, 'The source account owner does not have approved KYC.', 1;
        END;

        IF @TransferType IN (N'INITIAL_FUNDING', N'ADJUSTMENT')
        BEGIN
            IF @FromPurpose NOT IN (N'TREASURY', N'CLEARING')
                THROW 51015, 'Initial funding and adjustments must originate from an internal account.', 1;

            IF NOT EXISTS
            (
                SELECT 1
                FROM [Auth].[UserRoles] AS UR
                INNER JOIN [Auth].[Roles] AS R
                    ON R.[RoleId] = UR.[RoleId]
                WHERE UR.[UserId] = @InitiatedByUserId
                  AND R.[NormalizedRoleName] IN (N'ADMIN', N'SYSTEMUSER')
            )
                THROW 51016, 'An admin or system user is required for internal funding.', 1;

            SET @PaymentMethod = N'INTERNAL';
            SET @Category = N'FUNDING';
        END;

        SELECT
            @SourceBalance = COALESCE(SUM(L.[SignedAmount]), 0)
        FROM [Banking].[LedgerEntries] AS L WITH (HOLDLOCK)
        WHERE L.[AccountId] = @FromAccountId;

        /* Treasury and clearing accounts explicitly represent internal
           funding sources and may carry a negative application balance. */
        IF @FromPurpose NOT IN (N'TREASURY', N'CLEARING')
           AND @SourceBalance < @Amount
            THROW 51017, 'Insufficient available balance.', 1;

        DECLARE @InsertedTransfer TABLE ([TransferId] UNIQUEIDENTIFIER NOT NULL);

        INSERT INTO [Banking].[Transfers]
        (
            [IdempotencyKey],
            [FromAccountId],
            [ToAccountId],
            [Amount],
            [CurrencyCode],
            [TransferType],
            [TransferStatus],
            [PaymentMethod],
            [Category],
            [Narration],
            [InitiatedByUserId],
            [ClientIpAddress],
            [UserAgent]
        )
        OUTPUT INSERTED.[TransferId] INTO @InsertedTransfer ([TransferId])
        VALUES
        (
            @IdempotencyKey,
            @FromAccountId,
            @ToAccountId,
            @Amount,
            @FromCurrency,
            @TransferType,
            N'PENDING',
            @PaymentMethod,
            @Category,
            @Narration,
            @InitiatedByUserId,
            @ClientIpAddress,
            @UserAgent
        );

        SELECT @TransferId = [TransferId] FROM @InsertedTransfer;

        INSERT INTO [Banking].[LedgerEntries]
            ([TransferId], [AccountId], [EntrySequence], [EntryType], [Amount])
        VALUES
            (@TransferId, @FromAccountId, 1, N'DEBIT', @Amount),
            (@TransferId, @ToAccountId,   2, N'CREDIT', @Amount);

        UPDATE [Banking].[Transfers]
        SET
            [TransferStatus] = N'COMPLETED',
            [CompletedAtUtc] = SYSUTCDATETIME(),
            [UpdatedAtUtc] = SYSUTCDATETIME()
        WHERE [TransferId] = @TransferId;

        SELECT @PayloadJson =
        (
            SELECT
                CONVERT(NVARCHAR(36), @TransferId) AS [transferId],
                CONVERT(NVARCHAR(36), @FromAccountId) AS [fromAccountId],
                CONVERT(NVARCHAR(36), @ToAccountId) AS [toAccountId],
                @Amount AS [amount],
                @FromCurrency AS [currencyCode]
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        );

        INSERT INTO [Integration].[OutboxMessages]
            ([EventType], [AggregateType], [AggregateId], [PayloadJson])
        VALUES
            (N'TransferCompleted', N'Transfer', @TransferId, @PayloadJson);

        COMMIT TRANSACTION;

        SELECT *
        FROM [Banking].[Transfers]
        WHERE [TransferId] = @TransferId;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE [Banking].[usp_PostCustomerTransfer]
    @FromAccountId UNIQUEIDENTIFIER,
    @ToAccountId UNIQUEIDENTIFIER,
    @Amount DECIMAL(19,4),
    @IdempotencyKey VARCHAR(100),
    @InitiatedByUserId UNIQUEIDENTIFIER,
    @PaymentMethod NVARCHAR(30) = N'NET_BANKING',
    @Category NVARCHAR(30) = N'PEER_TO_PEER',
    @Narration NVARCHAR(500) = NULL,
    @ClientIpAddress VARCHAR(45) = NULL,
    @UserAgent NVARCHAR(512) = NULL,
    @TransferId UNIQUEIDENTIFIER OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    EXEC [Banking].[usp_PostTransferCore]
        @FromAccountId = @FromAccountId,
        @ToAccountId = @ToAccountId,
        @Amount = @Amount,
        @IdempotencyKey = @IdempotencyKey,
        @InitiatedByUserId = @InitiatedByUserId,
        @TransferType = N'CUSTOMER_TRANSFER',
        @PaymentMethod = @PaymentMethod,
        @Category = @Category,
        @Narration = @Narration,
        @ClientIpAddress = @ClientIpAddress,
        @UserAgent = @UserAgent,
        @TransferId = @TransferId OUTPUT;
END;
GO

CREATE OR ALTER PROCEDURE [Banking].[usp_PostInitialFunding]
    @TreasuryAccountId UNIQUEIDENTIFIER,
    @CustomerAccountId UNIQUEIDENTIFIER,
    @Amount DECIMAL(19,4),
    @IdempotencyKey VARCHAR(100),
    @InitiatedByUserId UNIQUEIDENTIFIER,
    @Narration NVARCHAR(500) = N'Initial account funding',
    @ClientIpAddress VARCHAR(45) = NULL,
    @UserAgent NVARCHAR(512) = NULL,
    @TransferId UNIQUEIDENTIFIER OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    EXEC [Banking].[usp_PostTransferCore]
        @FromAccountId = @TreasuryAccountId,
        @ToAccountId = @CustomerAccountId,
        @Amount = @Amount,
        @IdempotencyKey = @IdempotencyKey,
        @InitiatedByUserId = @InitiatedByUserId,
        @TransferType = N'INITIAL_FUNDING',
        @PaymentMethod = N'INTERNAL',
        @Category = N'FUNDING',
        @Narration = @Narration,
        @ClientIpAddress = @ClientIpAddress,
        @UserAgent = @UserAgent,
        @TransferId = @TransferId OUTPUT;
END;
GO

CREATE OR ALTER PROCEDURE [Banking].[usp_ReverseTransfer]
    @OriginalTransferId UNIQUEIDENTIFIER,
    @IdempotencyKey VARCHAR(100),
    @ReversedByUserId UNIQUEIDENTIFIER,
    @Reason NVARCHAR(500),
    @ClientIpAddress VARCHAR(45) = NULL,
    @UserAgent NVARCHAR(512) = NULL,
    @ReversalTransferId UNIQUEIDENTIFIER OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @IdempotencyKey = LTRIM(RTRIM(@IdempotencyKey));
    SET @Reason = NULLIF(LTRIM(RTRIM(@Reason)), N'');

    IF @OriginalTransferId IS NULL
        THROW 51020, 'The original transfer is required.', 1;
    IF @IdempotencyKey IS NULL OR LEN(@IdempotencyKey) = 0
        THROW 51021, 'An idempotency key is required.', 1;
    IF @ReversedByUserId IS NULL
        THROW 51022, 'The reversing admin user is required.', 1;
    IF @Reason IS NULL
        THROW 51023, 'A reversal reason is required.', 1;

    DECLARE
        @ExistingTransferId UNIQUEIDENTIFIER,
        @ExistingTransferType NVARCHAR(30),
        @ExistingReversalOfTransferId UNIQUEIDENTIFIER,
        @OriginalStatus NVARCHAR(20),
        @OriginalType NVARCHAR(30),
        @OriginalFromAccountId UNIQUEIDENTIFIER,
        @OriginalToAccountId UNIQUEIDENTIFIER,
        @Amount DECIMAL(19,4),
        @CurrencyCode CHAR(3),
        @NewSourcePurpose NVARCHAR(20),
        @NewSourceStatus NVARCHAR(20),
        @NewDestinationStatus NVARCHAR(20),
        @NewSourceBalance DECIMAL(38,4),
        @FirstAccountId UNIQUEIDENTIFIER,
        @SecondAccountId UNIQUEIDENTIFIER,
        @LockedAccountId UNIQUEIDENTIFIER,
        @PayloadJson NVARCHAR(MAX),
        @AuditJson NVARCHAR(MAX);

    BEGIN TRY
        BEGIN TRANSACTION;

        SELECT
            @ExistingTransferId = [TransferId],
            @ExistingTransferType = [TransferType],
            @ExistingReversalOfTransferId = [ReversalOfTransferId]
        FROM [Banking].[Transfers] WITH (UPDLOCK, HOLDLOCK)
        WHERE [IdempotencyKey] = @IdempotencyKey;

        IF @ExistingTransferId IS NOT NULL
        BEGIN
            IF @ExistingTransferType <> N'REVERSAL'
               OR @ExistingReversalOfTransferId <> @OriginalTransferId
                THROW 51036, 'The idempotency key is already associated with a different request.', 1;

            SET @ReversalTransferId = @ExistingTransferId;
            COMMIT TRANSACTION;

            SELECT *
            FROM [Banking].[Transfers]
            WHERE [TransferId] = @ReversalTransferId;
            RETURN;
        END;

        IF NOT EXISTS
        (
            SELECT 1
            FROM [Auth].[UserRoles] AS UR
            INNER JOIN [Auth].[Roles] AS R
                ON R.[RoleId] = UR.[RoleId]
            WHERE UR.[UserId] = @ReversedByUserId
              AND R.[NormalizedRoleName] = N'ADMIN'
        )
            THROW 51024, 'Only an admin user can reverse a transfer.', 1;

        SELECT
            @OriginalStatus = T.[TransferStatus],
            @OriginalType = T.[TransferType],
            @OriginalFromAccountId = T.[FromAccountId],
            @OriginalToAccountId = T.[ToAccountId],
            @Amount = T.[Amount],
            @CurrencyCode = T.[CurrencyCode]
        FROM [Banking].[Transfers] AS T WITH (UPDLOCK, HOLDLOCK)
        WHERE T.[TransferId] = @OriginalTransferId;

        IF @OriginalStatus IS NULL
            THROW 51025, 'The original transfer was not found.', 1;
        IF @OriginalStatus <> N'COMPLETED'
            THROW 51026, 'Only a completed, unreversed transfer can be reversed.', 1;
        IF @OriginalType = N'REVERSAL'
            THROW 51027, 'A reversal transfer cannot itself be reversed.', 1;
        IF EXISTS
        (
            SELECT 1
            FROM [Banking].[Transfers] WITH (UPDLOCK, HOLDLOCK)
            WHERE [ReversalOfTransferId] = @OriginalTransferId
        )
            THROW 51028, 'The transfer has already been reversed.', 1;

        /* The original destination is the source of the reversal. */
        IF CONVERT(CHAR(36), @OriginalFromAccountId) < CONVERT(CHAR(36), @OriginalToAccountId)
        BEGIN
            SET @FirstAccountId = @OriginalFromAccountId;
            SET @SecondAccountId = @OriginalToAccountId;
        END
        ELSE
        BEGIN
            SET @FirstAccountId = @OriginalToAccountId;
            SET @SecondAccountId = @OriginalFromAccountId;
        END;

        SELECT @LockedAccountId = A.[AccountId]
        FROM [Banking].[BankAccounts] AS A WITH (UPDLOCK, HOLDLOCK)
        WHERE A.[AccountId] = @FirstAccountId;

        IF @LockedAccountId IS NULL
            THROW 51029, 'An account associated with the original transfer was not found.', 1;

        SET @LockedAccountId = NULL;

        SELECT @LockedAccountId = A.[AccountId]
        FROM [Banking].[BankAccounts] AS A WITH (UPDLOCK, HOLDLOCK)
        WHERE A.[AccountId] = @SecondAccountId;

        IF @LockedAccountId IS NULL
            THROW 51029, 'An account associated with the original transfer was not found.', 1;

        SELECT
            @NewSourcePurpose = [AccountPurpose],
            @NewSourceStatus = [AccountStatus]
        FROM [Banking].[BankAccounts]
        WHERE [AccountId] = @OriginalToAccountId;

        SELECT
            @NewDestinationStatus = [AccountStatus]
        FROM [Banking].[BankAccounts]
        WHERE [AccountId] = @OriginalFromAccountId;

        /* Frozen accounts may participate in an administrator-approved
           corrective reversal. Closed accounts may not. */
        IF @NewSourceStatus = N'CLOSED' OR @NewDestinationStatus = N'CLOSED'
            THROW 51030, 'A closed account cannot participate in a reversal.', 1;

        SELECT
            @NewSourceBalance = COALESCE(SUM(L.[SignedAmount]), 0)
        FROM [Banking].[LedgerEntries] AS L WITH (HOLDLOCK)
        WHERE L.[AccountId] = @OriginalToAccountId;

        IF @NewSourcePurpose NOT IN (N'TREASURY', N'CLEARING')
           AND @NewSourceBalance < @Amount
            THROW 51031, 'The original receiver has insufficient balance for reversal.', 1;

        DECLARE @InsertedReversal TABLE ([TransferId] UNIQUEIDENTIFIER NOT NULL);

        INSERT INTO [Banking].[Transfers]
        (
            [IdempotencyKey],
            [FromAccountId],
            [ToAccountId],
            [Amount],
            [CurrencyCode],
            [TransferType],
            [TransferStatus],
            [PaymentMethod],
            [Category],
            [Narration],
            [InitiatedByUserId],
            [ClientIpAddress],
            [UserAgent],
            [ReversalOfTransferId]
        )
        OUTPUT INSERTED.[TransferId] INTO @InsertedReversal ([TransferId])
        VALUES
        (
            @IdempotencyKey,
            @OriginalToAccountId,
            @OriginalFromAccountId,
            @Amount,
            @CurrencyCode,
            N'REVERSAL',
            N'PENDING',
            N'INTERNAL',
            N'REVERSAL',
            @Reason,
            @ReversedByUserId,
            @ClientIpAddress,
            @UserAgent,
            @OriginalTransferId
        );

        SELECT @ReversalTransferId = [TransferId] FROM @InsertedReversal;

        INSERT INTO [Banking].[LedgerEntries]
            ([TransferId], [AccountId], [EntrySequence], [EntryType], [Amount])
        VALUES
            (@ReversalTransferId, @OriginalToAccountId,   1, N'DEBIT', @Amount),
            (@ReversalTransferId, @OriginalFromAccountId, 2, N'CREDIT', @Amount);

        UPDATE [Banking].[Transfers]
        SET
            [TransferStatus] = N'COMPLETED',
            [CompletedAtUtc] = SYSUTCDATETIME(),
            [UpdatedAtUtc] = SYSUTCDATETIME()
        WHERE [TransferId] = @ReversalTransferId;

        UPDATE [Banking].[Transfers]
        SET
            [TransferStatus] = N'REVERSED',
            [ReversedByUserId] = @ReversedByUserId,
            [ReversalReason] = @Reason,
            [ReversedAtUtc] = SYSUTCDATETIME(),
            [UpdatedAtUtc] = SYSUTCDATETIME()
        WHERE [TransferId] = @OriginalTransferId
          AND [TransferStatus] = N'COMPLETED';

        IF @@ROWCOUNT <> 1
            THROW 51032, 'The original transfer changed while the reversal was being processed.', 1;

        SELECT @PayloadJson =
        (
            SELECT
                CONVERT(NVARCHAR(36), @ReversalTransferId) AS [reversalTransferId],
                CONVERT(NVARCHAR(36), @OriginalTransferId) AS [originalTransferId],
                @Amount AS [amount],
                @CurrencyCode AS [currencyCode],
                @Reason AS [reason]
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        );

        INSERT INTO [Integration].[OutboxMessages]
            ([EventType], [AggregateType], [AggregateId], [PayloadJson])
        VALUES
            (N'TransferReversed', N'Transfer', @OriginalTransferId, @PayloadJson);

        SELECT @AuditJson =
        (
            SELECT
                CONVERT(NVARCHAR(36), @ReversalTransferId) AS [reversalTransferId],
                @Reason AS [reason]
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        );

        INSERT INTO [Audit].[AdminEvents]
        (
            [ActorUserId], [EventType], [EntityType], [EntityId],
            [EventDataJson], [IpAddress], [UserAgent]
        )
        VALUES
        (
            @ReversedByUserId, N'TRANSFER_REVERSED', N'Transfer', @OriginalTransferId,
            @AuditJson, @ClientIpAddress, @UserAgent
        );

        COMMIT TRANSACTION;

        SELECT *
        FROM [Banking].[Transfers]
        WHERE [TransferId] = @ReversalTransferId;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO

CREATE OR ALTER PROCEDURE [Auth].[usp_CleanupExpiredSecurityData]
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DELETE FROM [Auth].[VerificationChallenges]
        WHERE [ExpiresAtUtc] < SYSUTCDATETIME();

        DELETE FROM [Auth].[RevokedAccessTokens]
        WHERE [ExpiresAtUtc] < SYSUTCDATETIME();

        /* Break self-references before deleting expired refresh sessions. */
        UPDATE S
        SET
            S.[ReplacedBySessionId] = NULL,
            S.[UpdatedAtUtc] = SYSUTCDATETIME()
        FROM [Auth].[RefreshSessions] AS S
        INNER JOIN [Auth].[RefreshSessions] AS Replacement
            ON Replacement.[SessionId] = S.[ReplacedBySessionId]
        WHERE Replacement.[ExpiresAtUtc] < SYSUTCDATETIME();

        DELETE FROM [Auth].[RefreshSessions]
        WHERE [ExpiresAtUtc] < SYSUTCDATETIME();

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO

/* Database roles make the intended write boundary explicit. Add the future
   ASP.NET Core SQL login/user to the appropriate role during deployment. */
IF DATABASE_PRINCIPAL_ID(N'BankingApplicationRole') IS NULL
    CREATE ROLE [BankingApplicationRole] AUTHORIZATION [dbo];
IF DATABASE_PRINCIPAL_ID(N'BankingOperationsRole') IS NULL
    CREATE ROLE [BankingOperationsRole] AUTHORIZATION [dbo];
GO

GRANT SELECT ON [Banking].[vwAccountBalances] TO [BankingApplicationRole];
GRANT EXECUTE ON [Banking].[usp_GetAccountBalance] TO [BankingApplicationRole];
GRANT EXECUTE ON [Banking].[usp_PostCustomerTransfer] TO [BankingApplicationRole];

GRANT SELECT ON [Banking].[vwAccountBalances] TO [BankingOperationsRole];
GRANT EXECUTE ON [Banking].[usp_GetAccountBalance] TO [BankingOperationsRole];
GRANT EXECUTE ON [Banking].[usp_PostInitialFunding] TO [BankingOperationsRole];
GRANT EXECUTE ON [Banking].[usp_ReverseTransfer] TO [BankingOperationsRole];

DENY INSERT, UPDATE, DELETE ON [Banking].[LedgerEntries] TO [BankingApplicationRole];
DENY INSERT, UPDATE, DELETE ON [Banking].[LedgerEntries] TO [BankingOperationsRole];
DENY UPDATE, DELETE ON [Savings].[SavingsContributions] TO [BankingApplicationRole];
GO
