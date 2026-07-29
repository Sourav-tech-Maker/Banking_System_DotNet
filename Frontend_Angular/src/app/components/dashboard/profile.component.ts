import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-profile-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{{ ts.t('profile.headerTitle') }}</h1>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ ts.t('profile.headerSubtitle') }}</p>
        </div>

        <div class="flex gap-2">
          <button
            (click)="showUsernameModal.set(true)"
            class="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            ✏️ Edit Username
          </button>
          <button
            (click)="showPasswordModal.set(true)"
            class="rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition cursor-pointer"
          >
            🔒 Change Password
          </button>
        </div>
      </div>

      <div *ngIf="loading()" class="py-12 flex justify-center">
        <svg class="animate-spin h-8 w-8 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>

      <div *ngIf="!loading()" class="grid gap-6 md:grid-cols-[1fr_1.5fr]">
        <!-- Account Info -->
        <div class="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4 dark:border-slate-800 dark:bg-slate-950">
          <h2 class="text-lg font-bold text-slate-950 dark:text-white">{{ ts.t('profile.regDetails') }}</h2>
          <div class="space-y-3 text-sm">
            <div>
              <span class="block text-xs font-bold text-slate-400 uppercase">{{ ts.t('profile.username') }}</span>
              <span class="font-bold text-slate-900 dark:text-white">{{ profile?.user?.username }}</span>
            </div>
            <div>
              <span class="block text-xs font-bold text-slate-400 uppercase">{{ ts.t('profile.email') }}</span>
              <span class="font-bold text-slate-900 dark:text-white">{{ profile?.user?.email }}</span>
            </div>
            <div>
              <span class="block text-xs font-bold text-slate-400 uppercase">{{ ts.t('profile.accountStatus') }}</span>
              <span
                [ngClass]="profile?.user?.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'"
                class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase"
              >
                {{ profile?.user?.status }}
              </span>
            </div>
            <div>
              <span class="block text-xs font-bold text-slate-400 uppercase">Email Verified</span>
              <span class="font-bold text-slate-900 dark:text-white">{{ profile?.user?.verified ? 'Yes' : 'No' }}</span>
            </div>
            <div>
              <span class="block text-xs font-bold text-slate-400 uppercase">Member Since</span>
              <span class="font-bold text-slate-900 dark:text-white">{{ profile?.user?.createdAt | date:'dd MMM yyyy' }}</span>
            </div>
          </div>
        </div>

        <!-- KYC & Bank Accounts -->
        <div class="space-y-6">
          <!-- KYC Verification -->
          <div class="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4 dark:border-slate-800 dark:bg-slate-950">
            <h2 class="text-lg font-bold text-slate-950 dark:text-white">KYC Status</h2>
            
            <div *ngIf="!profile?.kyc" class="rounded-xl border border-slate-100 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-900">
              <p class="text-sm text-slate-500 dark:text-slate-400">You have not submitted your KYC verification yet.</p>
            </div>

            <div *ngIf="profile?.kyc" class="space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-sm font-semibold text-slate-500 dark:text-slate-400">Status</span>
                <span
                  [ngClass]="{
                    'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300': profile.kyc.status === 'APPROVED',
                    'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300': profile.kyc.status === 'Pending' || profile.kyc.status === 'PENDING',
                    'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300': profile.kyc.status === 'REJECTED'
                  }"
                  class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold uppercase"
                >
                  {{ profile.kyc.status }}
                </span>
              </div>

              <div *ngIf="profile.kyc.rejectReason" class="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                <strong>Rejection Reason:</strong> {{ profile.kyc.rejectReason }}
              </div>

              <div class="grid gap-4 sm:grid-cols-2 text-sm border-t border-slate-100 dark:border-slate-800 pt-4">
                <div>
                  <span class="block text-xs font-bold text-slate-400 uppercase">Full Name</span>
                  <span class="font-bold text-slate-900 dark:text-white">{{ profile.kyc.FullName }}</span>
                </div>
                <div>
                  <span class="block text-xs font-bold text-slate-400 uppercase">Date of Birth</span>
                  <span class="font-bold text-slate-900 dark:text-white">{{ profile.kyc.dateOfBirth }}</span>
                </div>
                <div>
                  <span class="block text-xs font-bold text-slate-400 uppercase">Gender</span>
                  <span class="font-bold text-slate-900 dark:text-white">{{ profile.kyc.gender }}</span>
                </div>
                <div>
                  <span class="block text-xs font-bold text-slate-400 uppercase">Document</span>
                  <span class="font-bold text-slate-900 dark:text-white">{{ profile.kyc.documentType }} ({{ profile.kyc.documentNumber }})</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Bank Accounts -->
          <div class="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4 dark:border-slate-800 dark:bg-slate-950">
            <h2 class="text-lg font-bold text-slate-950 dark:text-white">Active Bank Accounts</h2>

            <div class="space-y-3">
              <div *ngFor="let acc of profile?.accounts" class="rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-between dark:border-slate-800 dark:bg-slate-900">
                <div>
                  <p class="font-bold text-slate-900 dark:text-white">{{ acc.accountType }} Account</p>
                  <p class="font-mono text-xs text-slate-500 dark:text-slate-400 mt-1">ID: {{ acc.accountId }}</p>
                </div>
                <div class="text-right">
                  <p class="font-extrabold text-slate-950 dark:text-white text-base">₹{{ acc.balance | number:'1.2-2' }}</p>
                  <span class="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 uppercase mt-1 inline-block dark:bg-emerald-950 dark:text-emerald-300">
                    {{ acc.status }}
                  </span>
                </div>
              </div>

              <div *ngIf="!profile?.accounts || profile.accounts.length === 0" class="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-900">
                <p class="text-sm text-slate-500 dark:text-slate-400">No active bank accounts found.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Change Password Modal -->
      <div *ngIf="showPasswordModal()" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
        <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-bold text-slate-950 dark:text-white">Change Password</h3>
            <button (click)="showPasswordModal.set(false)" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">✕</button>
          </div>

          <div *ngIf="passwordError()" class="rounded-lg bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            {{ passwordError() }}
          </div>
          <div *ngIf="passwordSuccess()" class="rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            {{ passwordSuccess() }}
          </div>

          <form (submit)="handlePasswordChange($event)" class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Current Password</label>
              <input type="password" required [(ngModel)]="passwordForm.currentPassword" name="currentPassword" class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">New Password</label>
              <input type="password" required minlength="8" [(ngModel)]="passwordForm.newPassword" name="newPassword" class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white" placeholder="Min 8 characters" />
            </div>
            <div class="flex justify-end gap-2 pt-2">
              <button type="button" (click)="showPasswordModal.set(false)" class="rounded-lg px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer">Cancel</button>
              <button type="submit" [disabled]="savingPassword()" class="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50 cursor-pointer">Save Password</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Update Username Modal -->
      <div *ngIf="showUsernameModal()" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
        <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-bold text-slate-950 dark:text-white">Edit Username</h3>
            <button (click)="showUsernameModal.set(false)" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">✕</button>
          </div>

          <div *ngIf="usernameError()" class="rounded-lg bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            {{ usernameError() }}
          </div>

          <form (submit)="handleUsernameUpdate($event)" class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">New Username</label>
              <input type="text" required [(ngModel)]="newUsername" name="username" class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
            </div>
            <div class="flex justify-end gap-2 pt-2">
              <button type="button" (click)="showUsernameModal.set(false)" class="rounded-lg px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer">Cancel</button>
              <button type="submit" [disabled]="savingUsername()" class="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50 cursor-pointer">Update</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class ProfileViewComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  protected readonly ts = inject(TranslationService);

  protected profile: any = null;
  protected loading = signal(false);

  protected showPasswordModal = signal(false);
  protected passwordForm = { currentPassword: '', newPassword: '' };
  protected savingPassword = signal(false);
  protected passwordError = signal('');
  protected passwordSuccess = signal('');

  protected showUsernameModal = signal(false);
  protected newUsername = '';
  protected savingUsername = signal(false);
  protected usernameError = signal('');

  ngOnInit() {
    this.fetchProfile();
  }

  protected fetchProfile() {
    this.loading.set(true);
    this.apiService.getProfile().subscribe({
      next: (res) => {
        this.profile = res;
        this.newUsername = res?.user?.username || '';
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  protected handlePasswordChange(event: Event) {
    event.preventDefault();
    this.savingPassword.set(true);
    this.passwordError.set('');
    this.passwordSuccess.set('');

    this.apiService.changePassword(this.passwordForm).subscribe({
      next: (res) => {
        this.savingPassword.set(false);
        this.passwordSuccess.set(res.message || 'Password changed successfully!');
        this.passwordForm = { currentPassword: '', newPassword: '' };
        setTimeout(() => this.showPasswordModal.set(false), 1500);
      },
      error: (err) => {
        this.savingPassword.set(false);
        this.passwordError.set(err.error?.message || 'Failed to change password.');
      }
    });
  }

  protected handleUsernameUpdate(event: Event) {
    event.preventDefault();
    this.savingUsername.set(true);
    this.usernameError.set('');

    this.apiService.updateProfile({ username: this.newUsername }).subscribe({
      next: () => {
        this.savingUsername.set(false);
        this.showUsernameModal.set(false);
        this.fetchProfile();
      },
      error: (err) => {
        this.savingUsername.set(false);
        this.usernameError.set(err.error?.message || 'Failed to update username.');
      }
    });
  }
}
