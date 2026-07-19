/*
    Banking System - post-deployment and reconciliation checks

    All result sets labelled "must return zero rows" should be empty.
    Run this script after schema deployment, data migration, and before every
    production cutover.
*/

USE [Banking_System];
GO

SET NOCOUNT ON;
GO

PRINT N'1. Row counts';
SELECT N'Auth.Users' AS [TableName], COUNT_BIG(*) AS [RowCount] FROM [Auth].[Users]
UNION ALL SELECT N'Compliance.KycApplications', COUNT_BIG(*) FROM [Compliance].[KycApplications]
UNION ALL SELECT N'Banking.BankAccounts', COUNT_BIG(*) FROM [Banking].[BankAccounts]
UNION ALL SELECT N'Banking.Transfers', COUNT_BIG(*) FROM [Banking].[Transfers]
UNION ALL SELECT N'Banking.LedgerEntries', COUNT_BIG(*) FROM [Banking].[LedgerEntries]
UNION ALL SELECT N'Banking.Beneficiaries', COUNT_BIG(*) FROM [Banking].[Beneficiaries]
UNION ALL SELECT N'Savings.SavingsGoals', COUNT_BIG(*) FROM [Savings].[SavingsGoals]
UNION ALL SELECT N'Savings.SavingsContributions', COUNT_BIG(*) FROM [Savings].[SavingsContributions];
GO

PRINT N'2. Constraint validation - must return zero rows';
DBCC CHECKCONSTRAINTS WITH ALL_CONSTRAINTS;
GO

PRINT N'3. Completed/reversed transfers without exactly two balanced postings - must return zero rows';
SELECT
    T.[TransferId],
    T.[TransferReference],
    T.[TransferStatus],
    COUNT(L.[LedgerEntryId]) AS [PostingCount],
    SUM(CASE WHEN L.[EntryType] = N'DEBIT' THEN L.[Amount] ELSE 0 END) AS [DebitTotal],
    SUM(CASE WHEN L.[EntryType] = N'CREDIT' THEN L.[Amount] ELSE 0 END) AS [CreditTotal],
    SUM(L.[SignedAmount]) AS [NetPostingAmount]
FROM [Banking].[Transfers] AS T
LEFT JOIN [Banking].[LedgerEntries] AS L
    ON L.[TransferId] = T.[TransferId]
WHERE T.[TransferStatus] IN (N'COMPLETED', N'REVERSED')
GROUP BY T.[TransferId], T.[TransferReference], T.[TransferStatus]
HAVING COUNT(L.[LedgerEntryId]) <> 2
    OR SUM(CASE WHEN L.[EntryType] = N'DEBIT' THEN 1 ELSE 0 END) <> 1
    OR SUM(CASE WHEN L.[EntryType] = N'CREDIT' THEN 1 ELSE 0 END) <> 1
    OR SUM(CASE WHEN L.[EntryType] = N'DEBIT' THEN L.[Amount] ELSE 0 END)
       <> SUM(CASE WHEN L.[EntryType] = N'CREDIT' THEN L.[Amount] ELSE 0 END)
    OR SUM(L.[SignedAmount]) <> 0;
GO

PRINT N'4. Pending/failed transfers that have ledger postings - must return zero rows';
SELECT
    T.[TransferId],
    T.[TransferReference],
    T.[TransferStatus],
    COUNT(L.[LedgerEntryId]) AS [PostingCount]
FROM [Banking].[Transfers] AS T
INNER JOIN [Banking].[LedgerEntries] AS L
    ON L.[TransferId] = T.[TransferId]
WHERE T.[TransferStatus] IN (N'PENDING', N'FAILED')
GROUP BY T.[TransferId], T.[TransferReference], T.[TransferStatus];
GO

PRINT N'5. Postings that do not match their transfer source/destination/amount - must return zero rows';
SELECT
    T.[TransferId],
    T.[TransferReference],
    L.[LedgerEntryId],
    L.[EntrySequence],
    L.[EntryType],
    L.[AccountId],
    L.[Amount]
FROM [Banking].[Transfers] AS T
INNER JOIN [Banking].[LedgerEntries] AS L
    ON L.[TransferId] = T.[TransferId]
WHERE
    (L.[EntrySequence] = 1 AND
        (L.[EntryType] <> N'DEBIT' OR L.[AccountId] <> T.[FromAccountId] OR L.[Amount] <> T.[Amount]))
    OR
    (L.[EntrySequence] = 2 AND
        (L.[EntryType] <> N'CREDIT' OR L.[AccountId] <> T.[ToAccountId] OR L.[Amount] <> T.[Amount]));
GO

PRINT N'6. Negative customer balances - must return zero rows after migration';
SELECT
    B.[AccountId],
    B.[AccountNumber],
    B.[UserId],
    B.[CurrencyCode],
    B.[CurrentBalance]
FROM [Banking].[vwAccountBalances] AS B
WHERE B.[AccountPurpose] = N'CUSTOMER'
  AND B.[CurrentBalance] < 0;
GO

PRINT N'7. Reversal relationship problems - must return zero rows';
SELECT
    Original.[TransferId] AS [OriginalTransferId],
    Original.[TransferReference] AS [OriginalReference],
    Original.[TransferStatus],
    COUNT(Reversal.[TransferId]) AS [ReversalCount]
FROM [Banking].[Transfers] AS Original
LEFT JOIN [Banking].[Transfers] AS Reversal
    ON Reversal.[ReversalOfTransferId] = Original.[TransferId]
WHERE Original.[TransferStatus] = N'REVERSED'
GROUP BY Original.[TransferId], Original.[TransferReference], Original.[TransferStatus]
HAVING COUNT(Reversal.[TransferId]) <> 1;
GO

PRINT N'8. Reversal transfers whose direction or amount differs from the original - must return zero rows';
SELECT
    Reversal.[TransferId] AS [ReversalTransferId],
    Original.[TransferId] AS [OriginalTransferId]
FROM [Banking].[Transfers] AS Reversal
INNER JOIN [Banking].[Transfers] AS Original
    ON Original.[TransferId] = Reversal.[ReversalOfTransferId]
WHERE Reversal.[TransferType] = N'REVERSAL'
  AND
  (
      Reversal.[FromAccountId] <> Original.[ToAccountId]
      OR Reversal.[ToAccountId] <> Original.[FromAccountId]
      OR Reversal.[Amount] <> Original.[Amount]
      OR Reversal.[CurrencyCode] <> Original.[CurrencyCode]
      OR Reversal.[TransferStatus] <> N'COMPLETED'
  );
GO

PRINT N'9. Per-currency ledger control totals - debit and credit must match';
SELECT
    T.[CurrencyCode],
    SUM(CASE WHEN L.[EntryType] = N'DEBIT' THEN L.[Amount] ELSE 0 END) AS [TotalDebits],
    SUM(CASE WHEN L.[EntryType] = N'CREDIT' THEN L.[Amount] ELSE 0 END) AS [TotalCredits],
    SUM(L.[SignedAmount]) AS [NetAmount]
FROM [Banking].[LedgerEntries] AS L
INNER JOIN [Banking].[Transfers] AS T
    ON T.[TransferId] = L.[TransferId]
GROUP BY T.[CurrencyCode];
GO

PRINT N'10. Account balances';
SELECT
    [AccountId],
    [AccountNumber],
    [UserId],
    [AccountType],
    [AccountStatus],
    [AccountPurpose],
    [CurrencyCode],
    [CurrentBalance]
FROM [Banking].[vwAccountBalances]
ORDER BY [AccountPurpose], [AccountNumber];
GO

PRINT N'11. Savings goal values derived from contribution history';
SELECT *
FROM [Savings].[vwSavingsGoalProgress]
ORDER BY [UserId], [CreatedAtUtc];
GO

PRINT N'12. Users without exactly one recognized role - must return zero rows after migration';
SELECT
    U.[UserId],
    U.[UserName],
    COUNT(UR.[RoleId]) AS [RoleCount]
FROM [Auth].[Users] AS U
LEFT JOIN [Auth].[UserRoles] AS UR
    ON UR.[UserId] = U.[UserId]
GROUP BY U.[UserId], U.[UserName]
HAVING COUNT(UR.[RoleId]) <> 1;
GO

PRINT N'13. Open outbox work';
SELECT
    [OutboxMessageId],
    [EventType],
    [AggregateType],
    [AggregateId],
    [OccurredAtUtc],
    [AttemptCount],
    [NextAttemptAtUtc],
    [LastError]
FROM [Integration].[OutboxMessages]
WHERE [ProcessedAtUtc] IS NULL
ORDER BY [OccurredAtUtc];
GO

