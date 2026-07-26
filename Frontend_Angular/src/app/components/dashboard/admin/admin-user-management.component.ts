import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { ToastService } from './toast-notification.component';

@Component({
  selector: 'app-admin-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4 dark:border-slate-800">
        <div>
          <h2 class="text-xl font-extrabold text-slate-900 dark:text-white">User Account Management</h2>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage user access status, security locks, and bank accounts</p>
        </div>

        <div class="flex items-center gap-3">
          <!-- Search input -->
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Search username or email..."
            class="rounded-xl border border-slate-300 px-3.5 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 w-60"
          />
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading()" class="py-12 flex justify-center">
        <svg class="animate-spin h-8 w-8 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>

      <!-- Users Table -->
      <div *ngIf="!loading()" class="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-[10px] uppercase tracking-wider font-extrabold text-slate-400 border-b border-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-500">
              <tr>
                <th class="py-3 px-4">User</th>
                <th class="py-3 px-4">Email</th>
                <th class="py-3 px-4">Status</th>
                <th class="py-3 px-4">KYC Verified</th>
                <th class="py-3 px-4">Member Since</th>
                <th class="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              <tr *ngFor="let u of pagedUsers()" class="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition">
                <td class="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                  {{ u.username || u.userName }}
                </td>
                <td class="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                  {{ u.email }}
                </td>
                <td class="py-3.5 px-4">
                  <span
                    [ngClass]="u.status === 'ACTIVE' || u.userStatus === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'"
                    class="rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase"
                  >
                    {{ u.status || u.userStatus }}
                  </span>
                </td>
                <td class="py-3.5 px-4">
                  <span
                    [ngClass]="u.kycStatus === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'"
                    class="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase"
                  >
                    {{ u.kycStatus || 'PENDING' }}
                  </span>
                </td>
                <td class="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                  {{ u.createdAt | date:'dd MMM yyyy' }}
                </td>
                <td class="py-3.5 px-4 text-right space-x-1.5">
                  <!-- Toggle Status Button -->
                  <button
                    *ngIf="(u.status || u.userStatus) === 'ACTIVE'"
                    (click)="updateStatus(u, 'SUSPENDED')"
                    class="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/60 dark:text-amber-300 transition cursor-pointer"
                  >
                    Suspend
                  </button>
                  <button
                    *ngIf="(u.status || u.userStatus) !== 'ACTIVE'"
                    (click)="updateStatus(u, 'ACTIVE')"
                    class="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/60 dark:text-emerald-300 transition cursor-pointer"
                  >
                    Activate
                  </button>

                  <!-- Reset Lock Attempts -->
                  <button
                    (click)="resetLock(u)"
                    class="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 transition cursor-pointer"
                  >
                    Reset Lock
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Controls (20 per page) -->
        <div class="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs dark:border-slate-800">
          <span class="text-slate-500 dark:text-slate-400">Showing {{ (currentPage() - 1) * pageSize + 1 }} to {{ Math.min(currentPage() * pageSize, filteredUsers().length) }} of {{ filteredUsers().length }} users</span>

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
export class AdminUserManagementComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly toast = inject(ToastService);

  protected Math = Math;
  protected loading = signal(true);
  protected users = signal<any[]>([]);
  protected searchQuery = '';

  // Pagination: 20 records per page as requested
  protected pageSize = 20;
  protected currentPage = signal(1);

  ngOnInit() {
    this.loadUsers();
  }

  protected loadUsers() {
    this.loading.set(true);
    this.apiService.getAdminUsers().subscribe({
      next: (res) => {
        this.users.set(res.users || res || []);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(err.error?.message || 'Failed to load users');
      }
    });
  }

  protected filteredUsers() {
    const list = this.users();
    if (!this.searchQuery.trim()) return list;
    const q = this.searchQuery.toLowerCase();
    return list.filter(u =>
      (u.username || u.userName || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    );
  }

  protected totalPages() {
    return Math.ceil(this.filteredUsers().length / this.pageSize) || 1;
  }

  protected pagedUsers() {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredUsers().slice(start, start + this.pageSize);
  }

  protected updateStatus(u: any, newStatus: string) {
    const userId = u.id || u._id || u.userId;
    this.apiService.updateUserStatus(userId, newStatus).subscribe({
      next: () => {
        this.toast.success(`User status changed to ${newStatus}`);
        this.loadUsers();
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to update user status.');
      }
    });
  }

  protected resetLock(u: any) {
    const userId = u.id || u._id || u.userId;
    this.apiService.resetUserLogins(userId).subscribe({
      next: () => {
        this.toast.success(`Login attempts reset for ${u.username || u.userName}`);
        this.loadUsers();
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to reset login lock.');
      }
    });
  }
}
