using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using BankingSystem.Api.Data;
using BankingSystem.Api.Models.Auth;
using BankingSystem.Api.Models.Banking;
using Microsoft.EntityFrameworkCore;

namespace BankingSystem.Api.Services
{
    public sealed class DashboardService(AppDbContext context) : IDashboardService
    {
        private static readonly string[] ChartColors = ["#6D5DFB", "#2F80ED", "#22C55E", "#F59E0B", "#EF4444"];

        public async Task<object> GetDashboardDataAsync(User user, CancellationToken cancellationToken)
        {
            // 1. Fetch user accounts
            var accounts = await context.BankAccounts
                .AsNoTracking()
                .Where(acc => acc.UserId == user.UserId)
                .ToListAsync(cancellationToken);

            var accountIds = accounts.Select(acc => acc.AccountId).ToList();

            // 2. Fetch KYC details
            var kycRecord = await context.KycApplications
                .AsNoTracking()
                .Where(kyc => kyc.UserId == user.UserId)
                .FirstOrDefaultAsync(cancellationToken);

            var kycStatus = kycRecord?.KycStatus ?? "Not Submitted";

            // 3. Compute balances from vwAccountBalances view
            decimal totalBalance = 0;
            if (accountIds.Count > 0)
            {
                totalBalance = await context.BankAccountBalanceViews
                    .AsNoTracking()
                    .Where(view => accountIds.Contains(view.AccountId))
                    .SumAsync(view => view.CurrentBalance, cancellationToken);
            }

            // 4. Calculate totalIncome and totalExpense from ledger entries
            decimal totalIncome = 0;
            decimal totalExpense = 0;

            if (accountIds.Count > 0)
            {
                var ledgerSummary = await context.LedgerEntries
                    .AsNoTracking()
                    .Where(l => accountIds.Contains(l.AccountId))
                    .GroupBy(l => l.EntryType)
                    .Select(g => new { EntryType = g.Key, Total = g.Sum(l => l.Amount) })
                    .ToListAsync(cancellationToken);

                foreach (var item in ledgerSummary)
                {
                    if (item.EntryType.Equals("CREDIT", StringComparison.OrdinalIgnoreCase))
                    {
                        totalIncome = item.Total;
                    }
                    else if (item.EntryType.Equals("DEBIT", StringComparison.OrdinalIgnoreCase))
                    {
                        totalExpense = item.Total;
                    }
                }
            }

            // 5. Outgoing transfers for spending analytics
            decimal bankTransferExpense = 0;
            if (accountIds.Count > 0)
            {
                bankTransferExpense = await context.Transfers
                    .AsNoTracking()
                    .Where(t => accountIds.Contains(t.FromAccountId) && t.TransferStatus == "COMPLETED")
                    .SumAsync(t => t.Amount, cancellationToken);
            }

            var spendingCategories = new List<object>();
            if (bankTransferExpense > 0)
            {
                spendingCategories.Add(new
                {
                    name = "Bank Transfers",
                    amount = bankTransferExpense,
                    percentage = 100,
                    color = ChartColors[0]
                });
            }

            // 6. ONEO_BankCoins calculation
            var activeAccountsCount = accounts.Count(acc => acc.AccountStatus.Equals("ACTIVE", StringComparison.OrdinalIgnoreCase));
            var oneoBankCoins = (int)Math.Floor(totalBalance / 1000) + activeAccountsCount * 50;

            // 7. Fetch recent transactions (last 10)
            var recentTransfers = new List<object>();
            if (accountIds.Count > 0)
            {
                var transfers = await context.Transfers
                    .AsNoTracking()
                    .Where(t => accountIds.Contains(t.FromAccountId) || accountIds.Contains(t.ToAccountId))
                    .OrderByDescending(t => t.CreatedAtUtc)
                    .Take(10)
                    .ToListAsync(cancellationToken);

                // Fetch corresponding account reference with user names
                var allTransferAccountIds = transfers.Select(t => t.FromAccountId).Union(transfers.Select(t => t.ToAccountId)).Distinct().ToList();
                var transferAccounts = await context.BankAccounts
                    .AsNoTracking()
                    .Where(acc => allTransferAccountIds.Contains(acc.AccountId))
                    .Include(acc => acc.User)
                    .ToDictionaryAsync(acc => acc.AccountId, cancellationToken);

                foreach (var txn in transfers)
                {
                    var fromAcc = transferAccounts.GetValueOrDefault(txn.FromAccountId);
                    var toAcc = transferAccounts.GetValueOrDefault(txn.ToAccountId);

                    var isDebit = accountIds.Contains(txn.FromAccountId);
                    var fromParty = FormatAccountParty(fromAcc);
                    var toParty = FormatAccountParty(toAcc);
                    var counterparty = isDebit ? toParty : fromParty;

                    recentTransfers.Add(new
                    {
                        id = txn.TransferId,
                        amount = txn.Amount,
                        status = txn.TransferStatus.ToLowerInvariant(),
                        title = isDebit ? "Outgoing Transfer" : "Incoming Transfer",
                        category = "Bank Transfer",
                        date = txn.CreatedAtUtc,
                        createdAt = txn.CreatedAtUtc,
                        direction = isDebit ? "debit" : "credit",
                        fromAccount = fromParty,
                        toAccount = toParty,
                        senderName = fromParty.holderName,
                        receiverName = toParty.holderName,
                        counterparty,
                        otherAccount = $"{counterparty.holderName} · {counterparty.shortAccountId}"
                    });
                }
            }

            // 8. Construct response
            return new
            {
                user = new
                {
                    id = user.UserId,
                    username = user.UserName,
                    email = user.Email,
                    verified = user.EmailVerified,
                    kycStatus
                },
                summary = new
                {
                    totalBalance,
                    totalIncome,
                    totalExpense,
                    oNEO_BankCoins = oneoBankCoins, // Map ONEO_BankCoins correctly (camelCase is oneo_BankCoins / oNEO_BankCoins in React depending on fetch parsing)
                    oneo_BankCoins = oneoBankCoins, // Provide both formats to be safe
                    totalAccounts = accounts.Count,
                    accountStatus = accounts.Count > 0 ? accounts[0].AccountStatus : "No Account"
                },
                recentTransactions = recentTransfers,
                analytics = new
                {
                    totalExpense,
                    categories = spendingCategories
                },
                aiInsights = new
                {
                    headline = recentTransfers.Count > 0 ? "Activity is now visible" : "Your activity is ready to grow",
                    message = recentTransfers.Count > 0
                        ? "Your dashboard is using live transfers to show balances, spending, and rewards."
                        : "Start using your account to unlock spending patterns and saving suggestions.",
                    savingsPotential = (int)Math.Round((double)totalExpense * 0.12),
                    items = recentTransfers.Count > 0
                        ? new List<object>
                        {
                            new { type = "insight", title = "Transfer visibility", message = "Transaction rows now show sender and receiver names with account references." },
                            new { type = "tip", title = "Spending clarity", message = "Outgoing transfers are grouped under Bank Transfers until detailed categories are added." }
                        }
                        : new List<object>()
                },
                spendingByCategory = spendingCategories,
                kycDetails = kycRecord != null ? new
                {
                    status = kycRecord.KycStatus,
                    submittedAt = kycRecord.SubmittedAtUtc
                } : null
            };
        }

        private static dynamic FormatAccountParty(BankAccount? account)
        {
            if (account == null)
            {
                return new
                {
                    id = (string?)null,
                    holderName = "Unknown account holder",
                    email = "",
                    accountType = "Account",
                    shortAccountId = "Unknown"
                };
            }

            var accountIdStr = account.AccountId.ToString();
            return new
            {
                id = account.AccountId,
                holderName = account.User?.UserName ?? "Account holder",
                email = account.User?.Email ?? "",
                accountType = account.AccountType,
                shortAccountId = $"A/C {accountIdStr[^6..].ToUpperInvariant()}"
            };
        }
    }
}
