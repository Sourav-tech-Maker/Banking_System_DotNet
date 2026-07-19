import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-transactions-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">Transaction History</h1>
          <p class="mt-1 text-sm text-slate-500">View and filter all your account movements</p>
        </div>
      </div>

      <!-- Filters Panel -->
      <div class="rounded-lg border border-slate-200 bg-white p-4 shadow-sm grid gap-4 sm:grid-cols-2 md:grid-cols-4 items-end">
        <!-- Start Date -->
        <div>
          <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Start Date</label>
          <input
            type="date"
            [(ngModel)]="filters.startDate"
            (change)="onFilterChange()"
            class="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
          />
        </div>

        <!-- End Date -->
        <div>
          <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider">End Date</label>
          <input
            type="date"
            [(ngModel)]="filters.endDate"
            (change)="onFilterChange()"
            class="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
          />
        </div>

        <!-- Type -->
        <div>
          <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</label>
          <select
            [(ngModel)]="filters.type"
            (change)="onFilterChange()"
            class="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition bg-white"
          >
            <option value="all">All Transactions</option>
            <option value="credit">Incoming (Credit)</option>
            <option value="debit">Outgoing (Debit)</option>
          </select>
        </div>

        <!-- Clear -->
        <div>
          <button
            type="button"
            (click)="clearFilters()"
            class="w-full rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 py-2.5 text-sm font-semibold text-slate-700 transition"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <!-- Transactions List -->
      <div class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div *ngIf="loading()" class="py-12 flex justify-center">
          <svg class="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>

        <div *ngIf="!loading()">
          <div class="overflow-x-auto">
            <table class="w-full border-collapse text-left text-sm">
              <thead>
                <tr class="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th class="py-3 pr-4">Description</th>
                  <th class="py-3 px-4">Idempotency Key</th>
                  <th class="py-3 px-4">Date</th>
                  <th class="py-3 px-4">Amount</th>
                  <th class="py-3 pl-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
                <tr *ngFor="let txn of transactions()" class="hover:bg-slate-50/50 transition">
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
                        <p class="truncate text-xs text-slate-500 mt-0.5">{{ txn.counterparty?.holderName }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="py-4 px-4 text-slate-500 font-mono text-xs max-w-[120px] truncate">
                    {{ txn.idempotencyKey }}
                  </td>
                  <td class="py-4 px-4 text-slate-500">
                    {{ txn.createdAt | date:'dd MMM yyyy HH:mm' }}
                  </td>
                  <td
                    [ngClass]="txn.direction === 'debit' ? 'text-rose-600' : 'text-emerald-600'"
                    class="py-4 px-4 font-bold text-base"
                  >
                    {{ txn.direction === 'debit' ? '-' : '+' }}₹{{ txn.amount | number:'1.2-2' }}
                  </td>
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

                <tr *ngIf="transactions().length === 0">
                  <td colspan="5" class="py-12 text-center text-slate-400 font-normal">
                    No transactions match your search filter criteria.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div *ngIf="pagination.totalPages > 1" class="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-semibold text-slate-600">
            <button
              type="button"
              [disabled]="filters.page === 1"
              (click)="goToPage(filters.page - 1)"
              class="rounded-lg border border-slate-200 bg-white px-4 py-2 hover:bg-slate-50 disabled:opacity-50 transition"
            >
              Previous
            </button>
            <span>Page {{ filters.page }} of {{ pagination.totalPages }}</span>
            <button
              type="button"
              [disabled]="filters.page === pagination.totalPages"
              (click)="goToPage(filters.page + 1)"
              class="rounded-lg border border-slate-200 bg-white px-4 py-2 hover:bg-slate-50 disabled:opacity-50 transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TransactionsViewComponent implements OnInit {
  private readonly apiService = inject(ApiService);

  protected transactions = signal<any[]>([]);
  protected loading = signal(false);

  protected filters = {
    startDate: '',
    endDate: '',
    type: 'all',
    page: 1,
    limit: 20
  };

  protected pagination = {
    total: 0,
    totalPages: 0
  };

  ngOnInit() {
    this.fetchTransactions();
  }

  protected fetchTransactions() {
    this.loading.set(true);
    this.apiService.getTransactionHistory(this.filters).subscribe({
      next: (res) => {
        this.transactions.set(res.transactions || []);
        this.pagination.total = res.pagination?.total || 0;
        this.pagination.totalPages = res.pagination?.totalPages || 0;
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  protected onFilterChange() {
    this.filters.page = 1;
    this.fetchTransactions();
  }

  protected clearFilters() {
    this.filters.startDate = '';
    this.filters.endDate = '';
    this.filters.type = 'all';
    this.filters.page = 1;
    this.fetchTransactions();
  }

  protected goToPage(page: number) {
    this.filters.page = page;
    this.fetchTransactions();
  }
}
