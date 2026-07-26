import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { ToastService } from './toast-notification.component';

@Component({
  selector: 'app-admin-transactions',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4 dark:border-slate-800">
        <div>
          <h2 class="text-xl font-extrabold text-slate-900 dark:text-white">System Transaction Ledger</h2>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Audit system transactions, track transfer flows, and execute reversals</p>
        </div>

        <div class="flex items-center gap-2">
          <button
            (click)="setFilter('all')"
            [ngClass]="filter() === 'all' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'"
            class="rounded-xl px-3.5 py-1.5 text-xs font-bold transition cursor-pointer"
          >
            All
          </button>
          <button
            (click)="setFilter('COMPLETED')"
            [ngClass]="filter() === 'COMPLETED' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'"
            class="rounded-xl px-3.5 py-1.5 text-xs font-bold transition cursor-pointer"
          >
            Completed
          </button>
          <button
            (click)="setFilter('REVERSED')"
            [ngClass]="filter() === 'REVERSED' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'"
            class="rounded-xl px-3.5 py-1.5 text-xs font-bold transition cursor-pointer"
          >
            Reversed
          </button>
        </div>
      </div>

      <div *ngIf="loading()" class="py-12 flex justify-center">
        <svg class="animate-spin h-8 w-8 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>

      <div *ngIf="!loading()" class="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-[10px] uppercase tracking-wider font-extrabold text-slate-400 border-b border-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-500">
              <tr>
                <th class="py-3 px-4">Transaction ID</th>
                <th class="py-3 px-4">Sender</th>
                <th class="py-3 px-4">Receiver</th>
                <th class="py-3 px-4 text-right">Amount (₹)</th>
                <th class="py-3 px-4">Status</th>
                <th class="py-3 px-4">Timestamp</th>
                <th class="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              <tr *ngFor="let t of pagedTransactions()" class="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition">
                <td class="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                  {{ (t.id || t._id | slice:0:12) }}...
                </td>
                <td class="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                  {{ t.fromAccount?.user?.username || 'Sender' }}
                </td>
                <td class="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                  {{ t.toAccount?.user?.username || 'Receiver' }}
                </td>
                <td class="py-3.5 px-4 text-right font-extrabold text-slate-950 dark:text-white">
                  ₹{{ t.amount | number:'1.2-2' }}
                </td>
                <td class="py-3.5 px-4">
                  <span
                    [ngClass]="{
                      'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300': t.status === 'COMPLETED' || t.status === 'Completed',
                      'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300': t.status === 'REVERSED' || t.status === 'Reversed',
                      'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300': t.status === 'PENDING' || t.status === 'Pending'
                    }"
                    class="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase"
                  >
                    {{ t.status }}
                  </span>
                </td>
                <td class="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                  {{ t.createdAt | date:'dd MMM yyyy, hh:mm a' }}
                </td>
                <td class="py-3.5 px-4 text-center">
                  <button
                    *ngIf="t.status === 'COMPLETED' || t.status === 'Completed'"
                    (click)="reverseTransaction(t)"
                    class="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 dark:hover:bg-rose-900 transition cursor-pointer"
                  >
                    Reverse
                  </button>
                  <span *ngIf="t.status !== 'COMPLETED' && t.status !== 'Completed'" class="text-slate-400 text-xs">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Controls (20 per page) -->
        <div class="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs dark:border-slate-800">
          <span class="text-slate-500 dark:text-slate-400">Showing {{ (currentPage() - 1) * pageSize + 1 }} to {{ Math.min(currentPage() * pageSize, filteredTransactions().length) }} of {{ filteredTransactions().length }} transactions</span>

          <div class="flex items-center gap-1.5">
            <button
              [disabled]="currentPage() === 1"
              (click)="currentPage.set(currentPage() - 1)"
              class="rounded-lg border border-slate-200 px-2.5 py-1 font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900 cursor-pointer"
            >
              Previous
            </button>
            <span class="px-2 font-bold text-slate-700 dark:text-slate-300">Page {{ currentPage() }} of {{ totalPages() }}</span>
            <button
              [disabled]="currentPage() >= totalPages()"
              (click)="currentPage.set(currentPage() + 1)"
              class="rounded-lg border border-slate-200 px-2.5 py-1 font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminTransactionsComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly toast = inject(ToastService);

  protected Math = Math;
  protected loading = signal(true);
  protected transactions = signal<any[]>([]);
  protected filter = signal('all');

  protected pageSize = 20;
  protected currentPage = signal(1);

  ngOnInit() {
    this.loadTransactions();
  }

  setFilter(f: string) {
    this.filter.set(f);
    this.currentPage.set(1);
  }

  protected loadTransactions() {
    this.loading.set(true);
    this.apiService.getAdminTransactions().subscribe({
      next: (res) => {
        this.transactions.set(res.transactions || res || []);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(err.error?.message || 'Failed to load transactions');
      }
    });
  }

  protected filteredTransactions() {
    const list = this.transactions();
    const f = this.filter();
    if (f === 'all') return list;
    return list.filter(t => t.status === f || t.status?.toUpperCase() === f);
  }

  protected totalPages() {
    return Math.ceil(this.filteredTransactions().length / this.pageSize) || 1;
  }

  protected pagedTransactions() {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredTransactions().slice(start, start + this.pageSize);
  }

  protected reverseTransaction(t: any) {
    const id = t.id || t._id;
    if (!confirm('Are you sure you want to reverse this completed transaction? Funds will be debited from receiver and credited back to sender.')) {
      return;
    }

    this.apiService.reverseTransaction(id).subscribe({
      next: (res) => {
        this.toast.success(res.message || 'Transaction reversed successfully!');
        this.loadTransactions();
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to reverse transaction.');
      }
    });
  }
}
