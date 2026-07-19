# SQL Server database scripts

These scripts implement the approved normalized SQL Server design and are intended to be run from SQL Server Management Studio (SSMS).

## Run order

1. `00_CreateDatabase.sql`
2. `01_NormalizedSchema.sql`
3. `02_LedgerAndTransactions.sql`
4. `03_IntegrityChecks.sql`

The database name is `YonoBank`. If another name is required, change the database name in every script before running them.

`schema.sql` was already present and has been preserved unchanged. It is a destructive legacy draft that drops and recreates `dbo` tables. Do not run it in the same database as the numbered canonical scripts.

## Design summary

- User, account, transfer, KYC, beneficiary, and savings-goal identifiers use `uniqueidentifier`; high-volume journal and audit rows use integer identity keys.
- `LegacyObjectId char(24)` columns retain MongoDB-to-SQL traceability during migration.
- Money uses `decimal(19,4)`.
- UTC timestamps use `datetime2(3)` with `SYSUTCDATETIME()` defaults.
- Roles are normalized through `Auth.Roles` and `Auth.UserRoles`.
- KYC address and document data are normalized into separate tables.
- `Banking.Transfers` is the transfer/business-event header.
- `Banking.LedgerEntries` is the immutable journal and the source of account balances.
- `TransactionHistory` is intentionally not a table. History is queried from transfers, ledger entries, and audit events.
- Goal current amounts and status are derived from contribution history.
- Email/integration work is recorded transactionally through `Integration.OutboxMessages`.

## Posting money safely

Application code should use:

- `Banking.usp_PostCustomerTransfer`
- `Banking.usp_PostInitialFunding`
- `Banking.usp_ReverseTransfer`
- `Banking.usp_GetAccountBalance`

The procedures lock both involved account rows in a stable order, protect the idempotency-key range, reject key reuse with a different financial request, calculate the source balance while the lock is held, and insert the transfer plus both ledger entries in one SQL transaction. An insert trigger also rejects incomplete, unbalanced, or transfer-mismatched posting pairs.

Normal customer example:

```sql
DECLARE @TransferId uniqueidentifier;

EXEC Banking.usp_PostCustomerTransfer
    @FromAccountId = '00000000-0000-0000-0000-000000000001',
    @ToAccountId = '00000000-0000-0000-0000-000000000002',
    @Amount = 1250.00,
    @IdempotencyKey = '48ba8b74-77b8-4b37-98d8-a23726bb5e93',
    @InitiatedByUserId = '00000000-0000-0000-0000-000000000003',
    @Narration = N'Example transfer',
    @TransferId = @TransferId OUTPUT;

SELECT @TransferId AS TransferId;
```

Replace the example identifiers with real IDs. The initiating user must own the source customer account and have approved KYC.

## Reversals

A reversal never edits or deletes existing ledger entries. `usp_ReverseTransfer` creates a separate transfer in the opposite direction, adds two new postings, links it through `ReversalOfTransferId`, and marks the original transfer as reversed. A filtered unique index permits only one reversal per original transfer.

## Database permissions

`02_LedgerAndTransactions.sql` creates:

- `BankingApplicationRole` for ordinary balance and customer-transfer execution.
- `BankingOperationsRole` for initial funding and administrator reversal operations.

Both roles are denied direct ledger DML. Add the future ASP.NET Core database user to the appropriate role with `ALTER ROLE ... ADD MEMBER ...`.

## MongoDB migration notes

- Generate a deterministic or recorded mapping from each MongoDB ObjectId to its new `uniqueidentifier`.
- Store the original ObjectId in `LegacyObjectId`.
- Normalize statuses to the uppercase values enforced by the check constraints.
- Convert transaction and ledger amounts explicitly to `decimal(19,4)`.
- Convert KYC date-of-birth strings to SQL `date` and all timestamps to UTC.
- Map `User.role` into `Auth.UserRoles`; do not migrate `systemUser` booleans.
- Reconcile `Goal.currentAmount` against `SavingsLog` totals; contributions are authoritative in the new schema.
- Reconcile any legacy `TransactionHistory` collection by idempotency key. Move unmatched records to an audit/quarantine dataset rather than the financial ledger.
- Do not migrate expired OTPs, refresh sessions, or token-blacklist rows. Force a clean login at cutover.

After importing data, run `03_IntegrityChecks.sql`. Every result set labelled “must return zero rows” must be empty before cutover.
