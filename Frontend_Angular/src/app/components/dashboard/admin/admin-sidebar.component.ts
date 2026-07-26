import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside class="w-64 shrink-0 rounded-2xl bg-slate-900 text-slate-300 p-4 space-y-6 dark:bg-slate-950 dark:border dark:border-slate-800 flex flex-col justify-between min-h-[600px]">
      <div class="space-y-6">
        <!-- Brand Header -->
        <div class="flex items-center gap-3 px-2 py-1">
          <div class="flex size-9 items-center justify-center rounded-xl bg-indigo-600 text-white font-extrabold text-lg shadow-inner">
            Y
          </div>
          <div>
            <h2 class="text-sm font-extrabold text-white tracking-wide">YONO Console</h2>
            <p class="text-[10px] text-indigo-400 font-semibold uppercase">Admin Back-Office</p>
          </div>
        </div>

        <!-- Navigation Sections -->
        <nav class="space-y-1 text-xs font-bold">
          <div class="px-2 pb-1 text-[10px] uppercase tracking-wider text-slate-500 font-extrabold">General</div>

          <button
            (click)="select('dashboard')"
            [ngClass]="activeSection === 'dashboard' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-300'"
            class="w-full flex items-center justify-between rounded-xl px-3 py-2.5 transition text-left cursor-pointer"
          >
            <div class="flex items-center gap-2.5">
              <span>📊</span>
              <span>Overview</span>
            </div>
          </button>

          <!-- KYC Verification Accordion Section -->
          <div class="pt-3">
            <div class="px-2 pb-1.5 flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-500 font-extrabold">
              <span>Compliance & KYC</span>
              <span *ngIf="pendingKycCount > 0" class="flex size-2 rounded-full bg-amber-400 animate-ping"></span>
            </div>

            <div class="space-y-1 pl-2 border-l border-slate-800 ml-2">
              <button
                (click)="select('kyc-all')"
                [ngClass]="activeSection === 'kyc-all' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-400'"
                class="w-full flex items-center justify-between rounded-lg px-2.5 py-2 transition text-left cursor-pointer"
              >
                <span>All Applications</span>
                <span class="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 font-bold">{{ totalKycCount }}</span>
              </button>

              <button
                (click)="select('kyc-pending')"
                [ngClass]="activeSection === 'kyc-pending' ? 'bg-amber-600 text-white font-extrabold' : 'hover:bg-slate-800 text-amber-400'"
                class="w-full flex items-center justify-between rounded-lg px-2.5 py-2 transition text-left cursor-pointer"
              >
                <div class="flex items-center gap-1.5">
                  <span class="size-1.5 rounded-full bg-amber-400"></span>
                  <span>Pending</span>
                </div>
                <span
                  [ngClass]="pendingKycCount > 0 ? 'bg-amber-500/30 text-amber-300 font-extrabold animate-pulse' : 'bg-slate-800 text-slate-400'"
                  class="rounded-full px-2 py-0.5 text-[10px]"
                >
                  {{ pendingKycCount }}
                </span>
              </button>

              <button
                (click)="select('kyc-approved')"
                [ngClass]="activeSection === 'kyc-approved' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-800 text-emerald-400'"
                class="w-full flex items-center justify-between rounded-lg px-2.5 py-2 transition text-left cursor-pointer"
              >
                <div class="flex items-center gap-1.5">
                  <span class="size-1.5 rounded-full bg-emerald-400"></span>
                  <span>Approved</span>
                </div>
                <span class="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-emerald-400 font-bold">{{ approvedKycCount }}</span>
              </button>

              <button
                (click)="select('kyc-rejected')"
                [ngClass]="activeSection === 'kyc-rejected' ? 'bg-rose-600 text-white' : 'hover:bg-slate-800 text-rose-400'"
                class="w-full flex items-center justify-between rounded-lg px-2.5 py-2 transition text-left cursor-pointer"
              >
                <div class="flex items-center gap-1.5">
                  <span class="size-1.5 rounded-full bg-rose-400"></span>
                  <span>Rejected</span>
                </div>
                <span class="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-rose-400 font-bold">{{ rejectedKycCount }}</span>
              </button>
            </div>
          </div>

          <!-- Management Section -->
          <div class="pt-3">
            <div class="px-2 pb-1 text-[10px] uppercase tracking-wider text-slate-500 font-extrabold">System Data</div>

            <button
              (click)="select('users')"
              [ngClass]="activeSection === 'users' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-300'"
              class="w-full flex items-center justify-between rounded-xl px-3 py-2.5 transition text-left cursor-pointer"
            >
              <div class="flex items-center gap-2.5">
                <span>👥</span>
                <span>User Management</span>
              </div>
              <span class="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 font-bold">{{ totalUsersCount }}</span>
            </button>

            <button
              (click)="select('transactions')"
              [ngClass]="activeSection === 'transactions' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-300'"
              class="w-full flex items-center justify-between rounded-xl px-3 py-2.5 transition text-left cursor-pointer"
            >
              <div class="flex items-center gap-2.5">
                <span>💳</span>
                <span>Transactions</span>
              </div>
              <span class="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 font-bold">{{ totalTransactionsCount }}</span>
            </button>

            <button
              (click)="select('reports')"
              [ngClass]="activeSection === 'reports' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-300'"
              class="w-full flex items-center justify-between rounded-xl px-3 py-2.5 transition text-left cursor-pointer"
            >
              <div class="flex items-center gap-2.5">
                <span>📈</span>
                <span>Analytics & Reports</span>
              </div>
            </button>

            <button
              (click)="select('audit')"
              [ngClass]="activeSection === 'audit' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-300'"
              class="w-full flex items-center justify-between rounded-xl px-3 py-2.5 transition text-left cursor-pointer"
            >
              <div class="flex items-center gap-2.5">
                <span>📜</span>
                <span>Admin Audit Log</span>
              </div>
            </button>
          </div>
        </nav>
      </div>

      <!-- Footer Info -->
      <div class="rounded-xl border border-slate-800 bg-slate-900/50 p-3 text-xs">
        <div class="flex items-center gap-2">
          <div class="size-2 rounded-full bg-emerald-400"></div>
          <span class="font-bold text-slate-200">System Normal</span>
        </div>
        <p class="text-[10px] text-slate-500 mt-1">Version 2.0 (C# API + Angular)</p>
      </div>
    </aside>
  `
})
export class AdminSidebarComponent {
  @Input() activeSection = 'dashboard';
  @Input() stats: any = null;
  @Output() sectionChange = new EventEmitter<string>();

  protected get pendingKycCount(): number {
    if (!this.stats) return 0;
    return this.stats.pendingKyc ?? this.stats.kyc?.pending ?? this.stats.stats?.pendingKyc ?? this.stats.stats?.kyc?.pending ?? 0;
  }

  protected get approvedKycCount(): number {
    if (!this.stats) return 0;
    return this.stats.approvedKyc ?? this.stats.kyc?.approved ?? this.stats.stats?.approvedKyc ?? this.stats.stats?.kyc?.approved ?? 0;
  }

  protected get rejectedKycCount(): number {
    if (!this.stats) return 0;
    return this.stats.rejectedKyc ?? this.stats.kyc?.rejected ?? this.stats.stats?.rejectedKyc ?? this.stats.stats?.kyc?.rejected ?? 0;
  }

  protected get totalKycCount(): number {
    if (!this.stats) return 0;
    return this.stats.totalKyc ?? this.stats.kyc?.total ?? (this.pendingKycCount + this.approvedKycCount + this.rejectedKycCount);
  }

  protected get totalUsersCount(): number {
    if (!this.stats) return 0;
    return this.stats.totalUsers ?? this.stats.stats?.totalUsers ?? 0;
  }

  protected get totalTransactionsCount(): number {
    if (!this.stats) return 0;
    return this.stats.totalTransactions ?? this.stats.stats?.totalTransactions ?? 0;
  }

  select(section: string) {
    this.sectionChange.emit(section);
  }
}
