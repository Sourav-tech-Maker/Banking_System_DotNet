import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../services/translation.service';
import { CurrencyService } from '../../services/currency.service';

@Component({
  selector: 'app-stats-cards',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <!-- Balance Card -->
      <div class="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 transition hover:shadow-md">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
              {{ ts.t('dashboard.totalBalance') }}
            </p>
            <h3 class="mt-2 text-2xl font-extrabold text-slate-950 dark:text-white tracking-tight">
              {{ cs.format(summary?.totalBalance || 0) }}
            </h3>
            <span class="mt-1.5 inline-block text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              {{ ts.t('dashboard.liveReserve') }}
            </span>
          </div>
          <div class="flex size-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300 text-xl font-bold shadow-inner">
            💳
          </div>
        </div>
      </div>

      <!-- Income Card -->
      <div class="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 transition hover:shadow-md">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
              {{ ts.t('dashboard.monthlyCredit') }}
            </p>
            <h3 class="mt-2 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
              {{ cs.format(summary?.totalIncome || 0) }}
            </h3>
            <span class="mt-1.5 inline-block text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              {{ ts.t('dashboard.incomingTransfers') }}
            </span>
          </div>
          <div class="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 text-xl font-bold shadow-inner">
            📈
          </div>
        </div>
      </div>

      <!-- Expenses Card -->
      <div class="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 transition hover:shadow-md">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
              {{ ts.t('dashboard.monthlyOutflow') }}
            </p>
            <h3 class="mt-2 text-2xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight">
              {{ cs.format(summary?.totalExpense || 0) }}
            </h3>
            <span class="mt-1.5 inline-block text-[10px] font-bold text-rose-500 dark:text-rose-400">
              {{ ts.t('dashboard.outgoingPayments') }}
            </span>
          </div>
          <div class="flex size-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 text-xl font-bold shadow-inner">
            📉
          </div>
        </div>
      </div>

      <!-- Yono Coins Card -->
      <div class="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 transition hover:shadow-md">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
              {{ ts.t('dashboard.yonoRewards') }}
            </p>
            <h3 class="mt-2 text-2xl font-extrabold text-amber-500 dark:text-amber-400 tracking-tight">
              {{ summary?.oneo_BankCoins || summary?.oNEO_BankCoins || 0 }} Coins
            </h3>
            <span class="mt-1.5 inline-block text-[10px] font-bold text-amber-600 dark:text-amber-400">
              {{ ts.t('dashboard.redeemablePerks') }}
            </span>
          </div>
          <div class="flex size-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 dark:bg-amber-950/60 dark:text-amber-400 text-xl font-bold shadow-inner">
            🪙
          </div>
        </div>
      </div>
    </div>
  `
})
export class StatsCardsComponent {
  @Input() summary: any = {};
  protected readonly ts = inject(TranslationService);
  protected readonly cs = inject(CurrencyService);
}
