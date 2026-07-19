import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-recent-transactions',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div class="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 class="text-lg font-bold text-slate-950">Recent Transactions</h2>
          <p class="mt-1 text-sm text-slate-500">Your latest account activities</p>
        </div>
        <button
          type="button"
          (click)="onViewAll.emit()"
          class="text-sm font-semibold text-indigo-600 hover:text-indigo-500 transition hover:underline"
        >
          View All
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full border-collapse text-left text-sm">
          <thead>
            <tr class="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
              <th class="py-3 pr-4">Description</th>
              <th class="py-3 px-4">Category</th>
              <th class="py-3 px-4">Date</th>
              <th class="py-3 px-4">Amount</th>
              <th class="py-3 pl-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
            <tr *ngFor="let txn of transactions" class="hover:bg-slate-50/50 transition">
              <!-- Description -->
              <td class="py-4 pr-4">
                <div class="flex items-center gap-3">
                  <div
                    [ngClass]="txn.direction === 'debit' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'"
                    class="flex size-9 shrink-0 items-center justify-center rounded-lg text-lg font-bold"
                  >
                    {{ txn.direction === 'debit' ? '↓' : '↑' }}
                  </div>
                  <div class="min-w-0">
                    <p class="truncate text-slate-900 font-bold">{{ txn.title }}</p>
                    <p class="truncate text-xs text-slate-500 mt-0.5">{{ txn.otherAccount }}</p>
                  </div>
                </div>
              </td>

              <!-- Category -->
              <td class="py-4 px-4 text-slate-500">
                {{ txn.category }}
              </td>

              <!-- Date -->
              <td class="py-4 px-4 text-slate-500">
                {{ txn.date | date:'dd MMM yyyy' }}
              </td>

              <!-- Amount -->
              <td
                [ngClass]="txn.direction === 'debit' ? 'text-rose-600' : 'text-emerald-600'"
                class="py-4 px-4 font-bold text-base"
              >
                {{ txn.direction === 'debit' ? '-' : '+' }}₹{{ txn.amount | number:'1.2-2' }}
              </td>

              <!-- Status -->
              <td class="py-4 pl-4 text-right">
                <span
                  [ngClass]="{
                    'bg-emerald-50 text-emerald-700': txn.status === 'completed',
                    'bg-amber-50 text-amber-700': txn.status === 'pending',
                    'bg-rose-50 text-rose-700': txn.status === 'failed' || txn.status === 'reversed'
                  }"
                  class="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold uppercase tracking-wide"
                >
                  {{ txn.status }}
                </span>
              </td>
            </tr>

            <tr *ngIf="!transactions || transactions.length === 0">
              <td colspan="5" class="py-8 text-center text-slate-400 font-normal">
                No recent transactions found.
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
}
