import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-open-account-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mx-auto max-w-3xl space-y-6 pt-2">
      <!-- Success State -->
      <div *ngIf="success()" class="mx-auto max-w-lg space-y-6 pt-6">
        <div class="rounded-xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
          <div class="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-3xl">
            ✓
          </div>
          <h2 class="mt-5 text-xl font-bold text-slate-950">Account Created!</h2>
          <p class="mt-2 text-sm text-slate-500">
            Your new savings account is ready to use.
          </p>

          <div class="mt-6 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-left text-sm">
            <div *ngIf="success()?.account?.accountNumber || success()?.accountNumber" class="flex justify-between">
              <span class="font-medium text-slate-500">Account No.</span>
              <span class="font-bold text-slate-900">{{ success()?.account?.accountNumber || success()?.accountNumber }}</span>
            </div>
            <div *ngIf="success()?.account?.id || success()?.id" class="flex justify-between">
              <span class="font-medium text-slate-500">Account ID</span>
              <span class="font-mono text-xs font-bold text-slate-900">{{ success()?.account?.id || success()?.id }}</span>
            </div>
            <div *ngIf="success()?.account?.accountType || success()?.accountType" class="flex justify-between">
              <span class="font-medium text-slate-500">Type</span>
              <span class="font-bold text-slate-900">{{ success()?.account?.accountType || success()?.accountType }}</span>
            </div>
            <div *ngIf="success()?.account?.status || success()?.status" class="flex justify-between">
              <span class="font-medium text-slate-500">Status</span>
              <span class="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                {{ success()?.account?.status || success()?.status }}
              </span>
            </div>
          </div>

          <button
            class="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            (click)="success.set(null)"
            type="button"
          >
            Open Another
          </button>
        </div>
      </div>

      <!-- Main CTA -->
      <div *ngIf="!success()" class="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500"></div>

        <div class="flex flex-col items-center px-8 pb-8 pt-10 text-center">
          <div class="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-lg shadow-indigo-200 text-3xl">
            🏛️
          </div>

          <h2 class="mt-5 text-2xl font-bold text-slate-950">Open a Savings Account</h2>
          <p class="mt-2 max-w-md text-sm leading-6 text-slate-500">
            Start your banking journey with YONO App. One click is all it takes — no paperwork, no waiting. Your KYC must be approved before opening an account.
          </p>

          <div *ngIf="error()" class="mt-5 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {{ error() }}
          </div>

          <button
            class="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 px-7 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:shadow-lg hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            [disabled]="loading()"
            (click)="handleOpen()"
            type="button"
          >
            <span *ngIf="loading()">Creating Account…</span>
            <span *ngIf="!loading()">Open Account Now</span>
          </button>
        </div>
      </div>

      <!-- Benefits Grid -->
      <div *ngIf="!success()" class="grid gap-4 sm:grid-cols-2">
        <div *ngFor="let b of benefits" class="flex items-start gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 text-lg">
            {{ b.emoji }}
          </div>
          <div>
            <h3 class="text-sm font-bold text-slate-950">{{ b.title }}</h3>
            <p class="mt-1 text-sm leading-5 text-slate-500">{{ b.description }}</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class OpenAccountViewComponent {
  private readonly apiService = inject(ApiService);

  protected loading = signal(false);
  protected success = signal<any>(null);
  protected error = signal('');

  protected benefits = [
    {
      emoji: '🛡️',
      title: 'Bank-Grade Security',
      description: '256-bit encryption and multi-factor authentication protect every transaction.'
    },
    {
      emoji: '📈',
      title: 'Real-Time Analytics',
      description: 'Track your spending, income and net worth with live dashboard insights.'
    },
    {
      emoji: '✨',
      title: 'YONO App Rewards',
      description: 'Earn YONO Coins on every transaction and redeem exclusive perks.'
    },
    {
      emoji: '💳',
      title: 'Instant Transfers',
      description: 'Send and receive money in seconds with zero hidden fees.'
    }
  ];

  protected handleOpen() {
    this.loading.set(true);
    this.error.set('');
    this.success.set(null);

    this.apiService.createAccount().subscribe({
      next: (res) => {
        this.success.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || err.error?.error || 'Something went wrong. Please try again.');
      }
    });
  }
}
