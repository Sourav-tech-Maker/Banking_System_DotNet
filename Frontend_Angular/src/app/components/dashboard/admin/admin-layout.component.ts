import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { AdminSidebarComponent } from './admin-sidebar.component';
import { AdminKycManagementComponent } from './admin-kyc-management.component';
import { AdminUserManagementComponent } from './admin-user-management.component';
import { AdminTransactionsComponent } from './admin-transactions.component';
import { AdminReportsComponent } from './admin-reports.component';
import { ToastContainerComponent, ToastService } from './toast-notification.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    AdminSidebarComponent,
    AdminKycManagementComponent,
    AdminUserManagementComponent,
    AdminTransactionsComponent,
    AdminReportsComponent,
    ToastContainerComponent
  ],
  template: `
    <div class="space-y-6">
      <!-- Top Banner Bar -->
      <div class="flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div class="flex items-center gap-3">
          <div class="flex size-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300 font-extrabold text-lg">
            🛡️
          </div>
          <div>
            <h1 class="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">YONO Executive Console</h1>
            <p class="text-xs text-slate-500 dark:text-slate-400">Real-time compliance review, system administration, and audit logs</p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
            <span class="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Live Data Sync
          </span>

          <button
            (click)="loadStats()"
            class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-1.5"
          >
            <span>🔄</span> Refresh
          </button>
        </div>
      </div>

      <!-- Main Layout Grid: Inner Sidebar + Content Area -->
      <div class="flex flex-col md:flex-row gap-6">
        <!-- Inner Sidebar -->
        <app-admin-sidebar
          [activeSection]="activeSection()"
          [stats]="stats()"
          (sectionChange)="handleSectionChange($event)"
        />

        <!-- Dynamic Content Panel -->
        <main class="flex-1 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 min-h-[600px]">
          <!-- Overview / Dashboard -->
          <div *ngIf="activeSection() === 'dashboard'" class="space-y-6">
            <app-admin-reports [stats]="stats()" />

            <div class="border-t border-slate-100 dark:border-slate-800 pt-6">
              <h3 class="text-base font-bold text-slate-950 dark:text-white mb-4">Quick Compliance Priority Queue</h3>
              <app-admin-kyc-management filter="PENDING" (dataChanged)="loadStats()" />
            </div>
          </div>

          <!-- KYC Application Views (All / Pending / Approved / Rejected) -->
          <div *ngIf="activeSection().startsWith('kyc-')">
            <app-admin-kyc-management
              [filter]="getKycFilter()"
              (dataChanged)="loadStats()"
            />
          </div>

          <!-- User Management -->
          <div *ngIf="activeSection() === 'users'">
            <app-admin-user-management />
          </div>

          <!-- Transactions Ledger -->
          <div *ngIf="activeSection() === 'transactions'">
            <app-admin-transactions />
          </div>

          <!-- Reports & Analytics -->
          <div *ngIf="activeSection() === 'reports'">
            <app-admin-reports [stats]="stats()" />
          </div>

          <!-- Admin Audit Log -->
          <div *ngIf="activeSection() === 'audit'" class="space-y-6">
            <div class="border-b border-slate-200/80 pb-4 dark:border-slate-800">
              <h2 class="text-xl font-extrabold text-slate-900 dark:text-white">Admin Audit Log</h2>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Tamper-evident record of administrator actions</p>
            </div>

            <div *ngIf="loadingAudit()" class="py-12 flex justify-center">
              <svg class="animate-spin h-8 w-8 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>

            <div *ngIf="!loadingAudit()" class="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-sm dark:border-slate-800 dark:bg-slate-950">
              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs">
                  <thead class="bg-slate-50 text-[10px] uppercase tracking-wider font-extrabold text-slate-400 border-b border-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-500">
                    <tr>
                      <th class="py-3 px-4">Event</th>
                      <th class="py-3 px-4">Administrator</th>
                      <th class="py-3 px-4">IP Address</th>
                      <th class="py-3 px-4">Details</th>
                      <th class="py-3 px-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    <tr *ngFor="let log of auditLogs()" class="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition">
                      <td class="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        <span class="rounded bg-indigo-50 px-2 py-0.5 text-[10px] text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-extrabold">
                          {{ log.eventType }}
                        </span>
                      </td>
                      <td class="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-bold">
                        {{ log.adminUser }}
                      </td>
                      <td class="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400">
                        {{ log.ipAddress }}
                      </td>
                      <td class="py-3.5 px-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                        {{ log.details || '-' }}
                      </td>
                      <td class="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                        {{ log.createdAt | date:'medium' }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      <!-- Toast Container Component -->
      <app-toast-container />
    </div>
  `
})
export class AdminLayoutComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly toast = inject(ToastService);

  protected activeSection = signal('dashboard');
  protected stats = signal<any>(null);
  protected auditLogs = signal<any[]>([]);
  protected loadingAudit = signal(false);

  ngOnInit() {
    this.loadStats();
  }

  protected loadStats() {
    this.apiService.getAdminStats().subscribe({
      next: (res) => {
        this.stats.set(res.stats || res);
      },
      error: () => {
        this.toast.error('Failed to update admin statistics');
      }
    });
  }

  protected handleSectionChange(section: string) {
    this.activeSection.set(section);
    if (section === 'audit') {
      this.loadAuditLogs();
    }
  }

  protected getKycFilter(): string {
    const sec = this.activeSection();
    if (sec === 'kyc-pending') return 'PENDING';
    if (sec === 'kyc-approved') return 'APPROVED';
    if (sec === 'kyc-rejected') return 'REJECTED';
    return 'all';
  }

  protected loadAuditLogs() {
    this.loadingAudit.set(true);
    this.apiService.getAdminAuditLog(1).subscribe({
      next: (res) => {
        this.auditLogs.set(res.logs || res || []);
        this.loadingAudit.set(false);
      },
      error: () => {
        this.loadingAudit.set(false);
      }
    });
  }
}
