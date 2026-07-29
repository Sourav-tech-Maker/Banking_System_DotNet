import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../services/translation.service';
import { CurrencyService } from '../../services/currency.service';

@Component({
  selector: 'app-recent-transactions',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div class="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 class="text-lg font-extrabold text-slate-950 dark:text-white tracking-tight">
            {{ ts.t('dashboard.recentTransactions') }}
          </h2>
          <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {{ ts.t('dashboard.recentTxSubtitle') }}
          </p>
        </div>
        <button
          type="button"
          (click)="onViewAll.emit()"
          class="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition hover:underline cursor-pointer"
        >
          {{ ts.t('dashboard.viewAll') }}
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full border-collapse text-left text-sm">
          <thead>
            <tr class="border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:text-slate-500">
              <th class="py-3 pr-4">{{ ts.t('tx.description') }}</th>
              <th class="py-3 px-4">{{ ts.t('tx.category') }}</th>
              <th class="py-3 px-4">{{ ts.t('tx.date') }}</th>
              <th class="py-3 px-4">{{ ts.t('tx.amount') }}</th>
              <th class="py-3 pl-4 text-right">{{ ts.t('tx.status') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-medium text-slate-700 dark:divide-slate-800 dark:text-slate-300">
            <tr *ngFor="let txn of transactions" class="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition">
              <!-- Description -->
              <td class="py-4 pr-4">
                <div class="flex items-center gap-3">
                  <div
                    [ngClass]="txn.direction === 'debit' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'"
                    class="flex size-9 shrink-0 items-center justify-center rounded-xl text-lg font-bold"
                  >
                    {{ txn.direction === 'debit' ? '↓' : '↑' }}
                  </div>
                  <div class="min-w-0">
                    <p class="truncate text-slate-900 font-bold dark:text-white">{{ txn.title }}</p>
                    <p class="truncate text-xs text-slate-500 dark:text-slate-400 mt-0.5">{{ txn.otherAccount || 'Transfer' }}</p>
                  </div>
                </div>
              </td>

              <!-- Category -->
              <td class="py-4 px-4 text-slate-500 dark:text-slate-400 text-xs">
                {{ txn.category }}
              </td>

              <!-- Date -->
              <td class="py-4 px-4 text-slate-500 dark:text-slate-400 text-xs">
                {{ txn.date | date:'dd MMM yyyy' }}
              </td>

              <!-- Amount -->
              <td
                [ngClass]="txn.direction === 'debit' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'"
                class="py-4 px-4 font-bold text-base"
              >
                {{ txn.direction === 'debit' ? '-' : '+' }}{{ cs.format(txn.amount) }}
              </td>

              <!-- Status -->
              <td class="py-4 pl-4 text-right">
                <span
                  [ngClass]="{
                    'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300': txn.status === 'completed',
                    'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300': txn.status === 'pending',
                    'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300': txn.status === 'failed' || txn.status === 'reversed'
                  }"
                  class="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                >
                  {{ ts.t('tx.' + (txn.status || 'completed')) }}
                </span>
              </td>
            </tr>

            <!-- Empty State Illustration -->
            <tr *ngIf="!transactions || transactions.length === 0">
              <td colspan="5" class="py-12 text-center text-slate-400 dark:text-slate-500 font-normal">
                <div class="flex flex-col items-center space-y-2">
                  <div class="size-12 rounded-2xl bg-indigo-50 text-indigo-500 dark:bg-indigo-950 dark:text-indigo-400 flex items-center justify-center text-xl">
                    💸
                  </div>
                  <p class="text-xs font-bold text-slate-600 dark:text-slate-400">{{ ts.t('tx.noTransactions') }}</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `
})
export class RecentTransactionsComponent {
  @Input() transactions: any[] = [];
  @Output() onViewAll = new EventEmitter<void>();

  protected readonly ts = inject(TranslationService);
  protected readonly cs = inject(CurrencyService);
}
