import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">Admin Console</h1>
        <p class="mt-1 text-sm text-slate-500">System management, KYC processing, and transaction audits</p>
      </div>

      <!-- Admin sub-navigation tabs -->
      <div class="border-b border-slate-200">
        <nav class="-mb-px flex gap-6">
          <button
            type="button"
            *ngFor="let tab of adminTabs"
            (click)="setActiveTab(tab.id)"
            [ngClass]="activeTab() === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'"
            class="whitespace-nowrap border-b-2 py-4 px-1 text-sm font-bold transition"
          >
            {{ tab.name }}
          </button>
        </nav>
      </div>

      <div *ngIf="loading()" class="py-12 flex justify-center">
        <svg class="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>

      <!-- Content Views -->
      <div *ngIf="!loading()">
        <!-- KYC APPLICATIONS TAB -->
        <div *ngIf="activeTab() === 'kyc'" class="space-y-4">
          <div class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm overflow-x-auto">
            <h2 class="text-lg font-bold text-slate-900 mb-4">Pending KYC Submissions</h2>
            <table class="w-full border-collapse text-left text-sm">
              <thead>
                <tr class="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th class="py-3 pr-4">Applicant</th>
                  <th class="py-3 px-4">DOB &amp; Gender</th>
                  <th class="py-3 px-4">Document</th>
                  <th class="py-3 px-4">Submitted Date</th>
                  <th class="py-3 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
                <tr *ngFor="let k of kycApplications()" class="hover:bg-slate-50/50 transition">
                  <td class="py-4 pr-4">
                    <p class="font-bold text-slate-900">{{ k.fullName }}</p>
                    <p class="text-xs text-slate-500 mt-0.5">{{ k.userIdData?.email }}</p>
                  </td>
                  <td class="py-4 px-4 text-slate-500">
                    {{ k.dateOfBirth }} ({{ k.gender }})
                  </td>
                  <td class="py-4 px-4">
                    <p class="text-slate-900 font-bold text-xs">{{ k.documentType }}</p>
                    <a [href]="k.documentImg" target="_blank" class="text-[11px] text-indigo-600 font-bold hover:underline">
                      View Copy (No: {{ k.documentNumber }})
                    </a>
                  </td>
                  <td class="py-4 px-4 text-slate-500">
                    {{ k.createdAt | date:'dd MMM yyyy HH:mm' }}
                  </td>
                  <td class="py-4 pl-4 text-right space-x-2">
                    <button
                      type="button"
                      (click)="processKyc(k, 'Approve')"
                      class="rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 text-xs font-bold transition"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      (click)="openKycRejectModal(k)"
                      class="rounded bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-1.5 text-xs font-bold transition"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
                <tr *ngIf="kycApplications().length === 0">
                  <td colspan="5" class="py-12 text-center text-slate-400 font-normal">
                    No pending KYC applications found.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- SYSTEM STATS TAB -->
        <div *ngIf="activeTab() === 'stats'" class="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Total Users</span>
            <h3 class="mt-2 text-3xl font-extrabold text-slate-900">{{ stats?.totalUsers }}</h3>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Total Bank Accounts</span>
            <h3 class="mt-2 text-3xl font-extrabold text-slate-900">{{ stats?.totalAccounts }}</h3>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Total System Balance</span>
            <h3 class="mt-2 text-3xl font-extrabold text-slate-950">₹{{ stats?.totalSystemBalance | number:'1.2-2' }}</h3>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <span class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Total Transactions</span>
            <h3 class="mt-2 text-3xl font-extrabold text-slate-900">{{ stats?.totalTransactions }}</h3>
          </div>
        </div>

        <!-- REGISTERED USERS TAB -->
        <div *ngIf="activeTab() === 'users'" class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm overflow-x-auto">
          <h2 class="text-lg font-bold text-slate-900 mb-4">User Registry</h2>
          <table class="w-full border-collapse text-left text-sm">
            <thead>
              <tr class="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
                <th class="py-3 pr-4">Username &amp; Email</th>
                <th class="py-3 px-4">Status</th>
                <th class="py-3 px-4">KYC State</th>
                <th class="py-3 px-4">Accounts &amp; Balance</th>
                <th class="py-3 pl-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
              <tr *ngFor="let u of users()" class="hover:bg-slate-50/50 transition">
                <td class="py-4 pr-4">
                  <p class="font-bold text-slate-900">{{ u.username }}</p>
                  <p class="text-xs text-slate-500 mt-0.5">{{ u.email }}</p>
                </td>
                <td class="py-4 px-4">
                  <span
                    [ngClass]="u.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'"
                    class="inline-flex rounded-full px-2 py-0.5 text-xs font-bold uppercase"
                  >
                    {{ u.status }}
                  </span>
                </td>
                <td class="py-4 px-4 text-xs font-bold uppercase text-slate-500">
                  {{ u.kycStatus }}
                </td>
                <td class="py-4 px-4 space-y-1.5">
                  <div *ngFor="let acc of u.accounts" class="text-xs text-slate-600">
                    <span class="font-bold">{{ acc.accountType }}:</span> ₹{{ acc.balance | number:'1.0-0' }} ({{ acc.status }})
                  </div>
                  <p *ngIf="u.accounts.length === 0" class="text-xs text-slate-400 italic">No bank accounts</p>
                </td>
                <td class="py-4 pl-4 text-right space-x-1">
                  <button
                    type="button"
                    (click)="changeUserStatus(u, 'Suspended')"
                    *ngIf="u.status === 'ACTIVE'"
                    class="rounded border border-slate-200 hover:bg-slate-50 text-rose-600 px-2 py-1 text-xs font-semibold transition"
                  >
                    Suspend
                  </button>
                  <button
                    type="button"
                    (click)="changeUserStatus(u, 'Active')"
                    *ngIf="u.status !== 'ACTIVE'"
                    class="rounded border border-slate-200 hover:bg-slate-50 text-emerald-600 px-2 py-1 text-xs font-semibold transition"
                  >
                    Activate
                  </button>
                  <button
                    type="button"
                    (click)="resetLogins(u)"
                    class="rounded border border-slate-200 hover:bg-slate-50 text-slate-700 px-2 py-1 text-xs font-semibold transition"
                  >
                    Reset attempts
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- TRANSACTIONS LIST TAB -->
        <div *ngIf="activeTab() === 'transactions'" class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm overflow-x-auto">
          <h2 class="text-lg font-bold text-slate-900 mb-4">Transaction Ledger</h2>
          <table class="w-full border-collapse text-left text-sm">
            <thead>
              <tr class="border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
                <th class="py-3 pr-4">Transaction ID</th>
                <th class="py-3 px-4">From Account (Owner)</th>
                <th class="py-3 px-4">To Account (Owner)</th>
                <th class="py-3 px-4">Amount</th>
                <th class="py-3 px-4">Status</th>
                <th class="py-3 pl-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
              <tr *ngFor="let t of transactions()" class="hover:bg-slate-50/50 transition">
                <td class="py-4 pr-4 font-mono text-xs max-w-[120px] truncate">
                  {{ t.id }}
                </td>
                <td class="py-4 px-4">
                  <p class="font-bold text-slate-900 text-xs">{{ t.FromAccount?.user?.username || 'System' }}</p>
                  <p class="font-mono text-[10px] text-slate-400 truncate max-w-[120px]">{{ t.FromAccount?._id }}</p>
                </td>
                <td class="py-4 px-4">
                  <p class="font-bold text-slate-900 text-xs">{{ t.toAccount?.user?.username || 'System' }}</p>
                  <p class="font-mono text-[10px] text-slate-400 truncate max-w-[120px]">{{ t.toAccount?._id }}</p>
                </td>
                <td class="py-4 px-4 font-bold text-slate-900">
                  ₹{{ t.amount | number:'1.2-2' }}
                </td>
                <td class="py-4 px-4">
                  <span
                    [ngClass]="{
                      'bg-emerald-50 text-emerald-700': t.status === 'Completed' || t.status === 'COMPLETED',
                      'bg-rose-50 text-rose-700': t.status === 'Reversed' || t.status === 'REVERSED' || t.status === 'Failed'
                    }"
                    class="inline-flex rounded px-2 py-0.5 text-xs font-bold uppercase"
                  >
                    {{ t.status }}
                  </span>
                </td>
                <td class="py-4 pl-4 text-right">
                  <button
                    type="button"
                    (click)="reverseTxn(t)"
                    *ngIf="t.status === 'Completed' || t.status === 'COMPLETED'"
                    class="rounded border border-slate-200 hover:bg-slate-50 text-rose-600 px-2 py-1 text-xs font-semibold transition"
                  >
                    Reverse
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- KYC Reject Modal -->
      <div *ngIf="showRejectModal()" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div class="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
          <button
            type="button"
            (click)="showRejectModal.set(false)"
            class="absolute right-4 top-4 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>

          <h2 class="text-lg font-bold text-slate-950 mb-1">Reject KYC</h2>
          <p class="text-sm text-slate-500 mb-4">Please provide a rejection reason for "{{ selectedKyc?.fullName }}"</p>

          <div class="space-y-4">
            <div>
              <label for="rejectReason" class="block text-sm font-medium text-slate-700">Reason</label>
              <textarea
                id="rejectReason"
                name="reason"
                required
                rows="3"
                [(ngModel)]="rejectReasonText"
                class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                placeholder="Documents are unclear or invalid ID number."
              ></textarea>
            </div>

            <div class="pt-2">
              <button
                type="button"
                (click)="submitKycRejection()"
                [disabled]="!rejectReasonText"
                class="w-full rounded-lg bg-rose-600 py-2.5 text-white font-semibold shadow-sm hover:bg-rose-700 disabled:opacity-50"
              >
                Submit Rejection
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminPanelComponent implements OnInit {
  private readonly apiService = inject(ApiService);

  protected activeTab = signal('kyc');
  protected loading = signal(false);

  protected kycApplications = signal<any[]>([]);
  protected stats: any = null;
  protected users = signal<any[]>([]);
  protected transactions = signal<any[]>([]);

  // Reject Modal state
  protected showRejectModal = signal(false);
  protected selectedKyc: any = null;
  protected rejectReasonText = '';

  protected adminTabs = [
    { id: 'kyc', name: 'KYC Verification' },
    { id: 'stats', name: 'System Stats' },
    { id: 'users', name: 'User Registry' },
    { id: 'transactions', name: 'Transactions' }
  ];

  ngOnInit() {
    this.loadData();
  }

  protected setActiveTab(tabId: string) {
    this.activeTab.set(tabId);
    this.loadData();
  }

  private loadData() {
    this.loading.set(true);
    const tab = this.activeTab();

    if (tab === 'kyc') {
      this.apiService.getAdminKycApplications('Pending').subscribe({
        next: (res) => {
          this.kycApplications.set(res.applications || []);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
    } else if (tab === 'stats') {
      this.apiService.getAdminStats().subscribe({
        next: (res) => {
          this.stats = res.stats;
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
    } else if (tab === 'users') {
      this.apiService.getAdminUsers().subscribe({
        next: (res) => {
          this.users.set(res.users || []);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
    } else if (tab === 'transactions') {
      this.apiService.getAdminTransactions().subscribe({
        next: (res) => {
          this.transactions.set(res.transactions || []);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
    }
  }

  protected processKyc(k: any, action: 'Approve' | 'Rejected', reason?: string) {
    this.apiService.verifyKyc({
      userId: k.userId,
      status: action,
      rejectReason: reason
    }).subscribe({
      next: (res) => {
        alert(res.message || 'KYC application updated successfully.');
        this.loadData();
      },
      error: (err) => {
        alert(err.error?.message || 'Verification update failed.');
      }
    });
  }

  protected openKycRejectModal(k: any) {
    this.selectedKyc = k;
    this.rejectReasonText = '';
    this.showRejectModal.set(true);
  }

  protected submitKycRejection() {
    this.showRejectModal.set(false);
    this.processKyc(this.selectedKyc, 'Rejected', this.rejectReasonText);
  }

  protected changeUserStatus(u: any, newStatus: string) {
    this.apiService.updateUserStatus(u.id, newStatus).subscribe({
      next: (res) => {
        alert(res.message || 'User status updated');
        this.loadData();
      },
      error: (err) => alert(err.error?.message || 'Failed to update user status')
    });
  }

  protected resetLogins(u: any) {
    this.apiService.resetUserLogins(u.id).subscribe({
      next: (res) => {
        alert(res.message || 'Logins reset');
        this.loadData();
      },
      error: (err) => alert(err.error?.message || 'Failed to reset attempts')
    });
  }

  protected reverseTxn(t: any) {
    if (confirm('Are you sure you want to reverse this transaction? This will debit target account and credit source account.')) {
      this.apiService.reverseTransaction(t.id).subscribe({
        next: (res) => {
          alert(res.message || 'Transaction reversed successfully.');
          this.loadData();
        },
        error: (err) => alert(err.error?.message || 'Failed to reverse transaction')
      });
    }
  }
}
