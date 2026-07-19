import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-profile-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">My Profile</h1>
          <p class="mt-1 text-sm text-slate-500">Manage your user registration, accounts, and KYC verification status</p>
        </div>
      </div>

      <div *ngIf="loading()" class="py-12 flex justify-center">
        <svg class="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>

      <div *ngIf="!loading()" class="grid gap-6 md:grid-cols-[1fr_1.5fr]">
        <!-- Account Info -->
        <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <h2 class="text-lg font-bold text-slate-950">Registration Details</h2>
          <div class="space-y-3 text-sm">
            <div>
              <span class="block text-xs font-bold text-slate-400 uppercase">Username</span>
              <span class="font-bold text-slate-900">{{ profile?.user?.username }}</span>
            </div>
            <div>
              <span class="block text-xs font-bold text-slate-400 uppercase">Email</span>
              <span class="font-bold text-slate-900">{{ profile?.user?.email }}</span>
            </div>
            <div>
              <span class="block text-xs font-bold text-slate-400 uppercase">Account Status</span>
              <span
                [ngClass]="profile?.user?.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'"
                class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase"
              >
                {{ profile?.user?.status }}
              </span>
            </div>
            <div>
              <span class="block text-xs font-bold text-slate-400 uppercase">Verified User</span>
              <span class="font-bold text-slate-900">{{ profile?.user?.verified ? 'Yes' : 'No' }}</span>
            </div>
            <div>
              <span class="block text-xs font-bold text-slate-400 uppercase">Member Since</span>
              <span class="font-bold text-slate-900">{{ profile?.user?.createdAt | date:'dd MMM yyyy' }}</span>
            </div>
          </div>
        </div>

        <!-- KYC & Bank Accounts -->
        <div class="space-y-6">
          <!-- KYC Verification -->
          <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h2 class="text-lg font-bold text-slate-950">KYC Status</h2>
            
            <div *ngIf="!profile?.kyc" class="rounded-lg border border-slate-100 bg-slate-50 p-4 text-center">
              <p class="text-sm text-slate-500">You have not submitted your KYC verification yet.</p>
            </div>

            <div *ngIf="profile?.kyc" class="space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-sm font-semibold text-slate-500">Status</span>
                <span
                  [ngClass]="{
                    'bg-emerald-50 text-emerald-700': profile.kyc.status === 'APPROVED',
                    'bg-amber-50 text-amber-700': profile.kyc.status === 'Pending' || profile.kyc.status === 'PENDING',
                    'bg-rose-50 text-rose-700': profile.kyc.status === 'REJECTED'
                  }"
                  class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold uppercase"
                >
                  {{ profile.kyc.status }}
                </span>
              </div>

              <div *ngIf="profile.kyc.rejectReason" class="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                <strong>Rejection Reason:</strong> {{ profile.kyc.rejectReason }}
              </div>

              <div class="grid gap-4 sm:grid-cols-2 text-sm border-t border-slate-100 pt-4">
                <div>
                  <span class="block text-xs font-bold text-slate-400 uppercase">Full Name</span>
                  <span class="font-bold text-slate-900">{{ profile.kyc.FullName }}</span>
                </div>
                <div>
                  <span class="block text-xs font-bold text-slate-400 uppercase">Date of Birth</span>
                  <span class="font-bold text-slate-900">{{ profile.kyc.dateOfBirth }}</span>
                </div>
                <div>
                  <span class="block text-xs font-bold text-slate-400 uppercase">Gender</span>
                  <span class="font-bold text-slate-900">{{ profile.kyc.gender }}</span>
                </div>
                <div>
                  <span class="block text-xs font-bold text-slate-400 uppercase">Document</span>
                  <span class="font-bold text-slate-900">{{ profile.kyc.documentType }} (No: {{ profile.kyc.documentNumber }})</span>
                </div>
              </div>

              <div *ngIf="profile.kyc.permanentAddress" class="text-sm border-t border-slate-100 pt-4">
                <span class="block text-xs font-bold text-slate-400 uppercase">Permanent Address</span>
                <span class="font-bold text-slate-900">
                  {{ profile.kyc.permanentAddress.street }}, {{ profile.kyc.permanentAddress.city }}, 
                  {{ profile.kyc.permanentAddress.state }}, {{ profile.kyc.permanentAddress.country }} - {{ profile.kyc.permanentAddress.postalCode }}
                </span>
              </div>

              <div *ngIf="profile.kyc.documentImg" class="border-t border-slate-100 pt-4">
                <span class="block text-xs font-bold text-slate-400 uppercase mb-2">Submitted Copy</span>
                <a [href]="profile.kyc.documentImg" target="_blank" class="inline-block rounded-lg overflow-hidden border border-slate-200 max-w-[200px] hover:opacity-85 transition">
                  <img [src]="profile.kyc.documentImg" alt="KYC document copy" class="max-h-28 object-cover" />
                </a>
              </div>
            </div>
          </div>

          <!-- Bank Accounts -->
          <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h2 class="text-lg font-bold text-slate-950">Active Bank Accounts</h2>

            <div class="space-y-3">
              <div *ngFor="let acc of profile?.accounts" class="rounded-lg border border-slate-200 bg-slate-50 p-4 flex items-center justify-between">
                <div>
                  <p class="font-bold text-slate-900">{{ acc.accountType }} Account</p>
                  <p class="font-mono text-xs text-slate-500 mt-1">ID: {{ acc.accountId }}</p>
                </div>
                <div class="text-right">
                  <p class="font-extrabold text-slate-950 text-base">₹{{ acc.balance | number:'1.2-2' }}</p>
                  <span class="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 uppercase mt-1 inline-block">
                    {{ acc.status }}
                  </span>
                </div>
              </div>

              <div *ngIf="!profile?.accounts || profile.accounts.length === 0" class="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-center">
                <p class="text-sm text-slate-500">No active bank accounts found.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ProfileViewComponent implements OnInit {
  private readonly apiService = inject(ApiService);

  protected profile: any = null;
  protected loading = signal(false);

  ngOnInit() {
    this.fetchProfile();
  }

  protected fetchProfile() {
    this.loading.set(true);
    this.apiService.getProfile().subscribe({
      next: (res) => {
        this.profile = res;
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
