import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="border-b border-slate-200/80 pb-4 dark:border-slate-800">
        <h2 class="text-xl font-extrabold text-slate-900 dark:text-white">Analytics & System Health Reports</h2>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Overview of system performance, compliance velocity, and audit event logs</p>
      </div>

      <!-- KPI Grid -->
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div class="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <span class="text-xs font-bold text-slate-400 uppercase">Total System Balance</span>
          <p class="mt-2 text-2xl font-extrabold text-slate-950 dark:text-white">₹{{ totalSystemBalance | number:'1.2-2' }}</p>
          <span class="mt-2 inline-block rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">Live Reserve Balance</span>
        </div>

        <div class="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <span class="text-xs font-bold text-slate-400 uppercase">Registered Users</span>
          <p class="mt-2 text-2xl font-extrabold text-slate-950 dark:text-white">{{ totalUsersCount }}</p>
          <span class="mt-2 inline-block rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">Active Identity DB</span>
        </div>

        <div class="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <span class="text-xs font-bold text-slate-400 uppercase">Pending Compliance</span>
          <p class="mt-2 text-2xl font-extrabold text-amber-600 dark:text-amber-400">{{ pendingKycCount }}</p>
          <span class="mt-2 inline-block rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300">Awaiting Admin Action</span>
        </div>

        <div class="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <span class="text-xs font-bold text-slate-400 uppercase">Total Transactions</span>
          <p class="mt-2 text-2xl font-extrabold text-slate-950 dark:text-white">{{ totalTransactionsCount }}</p>
          <span class="mt-2 inline-block rounded bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">Atomic Stored Proc Flow</span>
        </div>
      </div>

      <!-- Compliance Health Card -->
      <div class="grid gap-6 md:grid-cols-2">
        <div class="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 space-y-4">
          <h3 class="text-base font-bold text-slate-950 dark:text-white">KYC Verification Breakdown</h3>

          <div class="space-y-3 text-xs font-bold">
            <div>
              <div class="flex justify-between text-slate-600 dark:text-slate-300 mb-1">
                <span>Approved Applications</span>
                <span class="text-emerald-600 dark:text-emerald-400">{{ approvedKycCount }}</span>
              </div>
              <div class="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div [style.width.%]="getPercent(approvedKycCount)" class="h-full bg-emerald-500 rounded-full transition-all"></div>
              </div>
            </div>

            <div>
              <div class="flex justify-between text-slate-600 dark:text-slate-300 mb-1">
                <span>Pending Review</span>
                <span class="text-amber-600 dark:text-amber-400">{{ pendingKycCount }}</span>
              </div>
              <div class="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div [style.width.%]="getPercent(pendingKycCount)" class="h-full bg-amber-500 rounded-full transition-all"></div>
              </div>
            </div>

            <div>
              <div class="flex justify-between text-slate-600 dark:text-slate-300 mb-1">
                <span>Rejected Applications</span>
                <span class="text-rose-600 dark:text-rose-400">{{ rejectedKycCount }}</span>
              </div>
              <div class="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div [style.width.%]="getPercent(rejectedKycCount)" class="h-full bg-rose-500 rounded-full transition-all"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 space-y-4">
          <h3 class="text-base font-bold text-slate-950 dark:text-white">System Security Status</h3>

          <div class="space-y-3 text-xs">
            <div class="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
              <span class="font-bold text-slate-700 dark:text-slate-300">Rate Limiting</span>
              <span class="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">ACTIVE (10 req / 15m)</span>
            </div>
            <div class="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
              <span class="font-bold text-slate-700 dark:text-slate-300">Security Headers</span>
              <span class="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">CSP / X-Frame Active</span>
            </div>
            <div class="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
              <span class="font-bold text-slate-700 dark:text-slate-300">Admin Audit Trail</span>
              <span class="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">LOGGING ENFORCED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminReportsComponent {
  @Input() stats: any = null;

  protected get totalSystemBalance(): number {
    return this.stats?.totalSystemBalance ?? this.stats?.stats?.totalSystemBalance ?? 0;
  }

  protected get totalUsersCount(): number {
    return this.stats?.totalUsers ?? this.stats?.stats?.totalUsers ?? 0;
  }

  protected get pendingKycCount(): number {
    return this.stats?.pendingKyc ?? this.stats?.kyc?.pending ?? this.stats?.stats?.pendingKyc ?? 0;
  }

  protected get approvedKycCount(): number {
    return this.stats?.approvedKyc ?? this.stats?.kyc?.approved ?? this.stats?.stats?.approvedKyc ?? 0;
  }

  protected get rejectedKycCount(): number {
    return this.stats?.rejectedKyc ?? this.stats?.kyc?.rejected ?? this.stats?.stats?.rejectedKyc ?? 0;
  }

  protected get totalKycCount(): number {
    return this.stats?.totalKyc ?? this.stats?.kyc?.total ?? (this.pendingKycCount + this.approvedKycCount + this.rejectedKycCount);
  }

  protected get totalTransactionsCount(): number {
    return this.stats?.totalTransactions ?? this.stats?.stats?.totalTransactions ?? 0;
  }

  getPercent(val: number): number {
    const total = (this.totalKycCount || 1);
    if (!total) return 0;
    return Math.round(((val || 0) / total) * 100);
  }
}
