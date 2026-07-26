import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-open-account-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="mx-auto max-w-4xl space-y-6 pt-2">
      <!-- Success State -->
      <div *ngIf="success()" class="mx-auto max-w-lg space-y-6 pt-6">
        <div class="rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm dark:border-emerald-900/60 dark:bg-slate-950">
          <div class="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-3xl dark:bg-emerald-950 dark:text-emerald-400">
            ✓
          </div>
          <h2 class="mt-5 text-xl font-bold text-slate-950 dark:text-white">Bank Account Successfully Opened!</h2>
          <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Your SBI Part-II Account & Services Application has been processed.
          </p>

          <div class="mt-6 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left text-sm dark:border-slate-800 dark:bg-slate-900">
            <div *ngIf="success()?.account?.accountNumber || success()?.accountNumber" class="flex justify-between">
              <span class="font-medium text-slate-500 dark:text-slate-400">Account No.</span>
              <span class="font-bold text-slate-900 dark:text-white">{{ success()?.account?.accountNumber || success()?.accountNumber }}</span>
            </div>
            <div *ngIf="success()?.account?.id || success()?.id" class="flex justify-between">
              <span class="font-medium text-slate-500 dark:text-slate-400">Account ID</span>
              <span class="font-mono text-xs font-bold text-slate-900 dark:text-white">{{ success()?.account?.id || success()?.id }}</span>
            </div>
            <div *ngIf="success()?.account?.accountType || success()?.accountType" class="flex justify-between">
              <span class="font-medium text-slate-500 dark:text-slate-400">Product Type</span>
              <span class="font-bold text-slate-900 dark:text-white">{{ success()?.account?.accountType || success()?.accountType }}</span>
            </div>
            <div *ngIf="success()?.account?.status || success()?.status" class="flex justify-between">
              <span class="font-medium text-slate-500 dark:text-slate-400">Status</span>
              <span class="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                ACTIVE
              </span>
            </div>
          </div>

          <button
            class="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 cursor-pointer"
            (click)="success.set(null)"
            type="button"
          >
            Open Another Product / Account
          </button>
        </div>
      </div>

      <!-- Main SBI Part-II Application Form -->
      <div *ngIf="!success()" class="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950 space-y-6">
        
        <div class="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div>
            <div class="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              <span>🏛️ SBI Part-II Form</span>
              <span>•</span>
              <span>Account & Services Application</span>
            </div>
            <h2 class="mt-2 text-2xl font-bold text-slate-950 dark:text-white">Open Account & Configure Services</h2>
            <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Select product category, banking services, and complete Form DA-1 Nomination.
            </p>
          </div>
        </div>

        <div *ngIf="error()" class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          {{ error() }}
        </div>

        <form (submit)="handleOpen()" class="space-y-8">

          <!-- 1. Account Product Selection -->
          <div class="space-y-4">
            <h3 class="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span class="flex size-6 items-center justify-center rounded-full bg-emerald-600 text-xs text-white">1</span>
              Type of Account / Product
            </h3>

            <div class="grid gap-3 sm:grid-cols-3">
              <label
                [ngClass]="{ 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30': accountType === 'Savings' }"
                class="flex cursor-pointer flex-col justify-between rounded-xl border p-4 transition hover:border-indigo-500 dark:border-slate-800"
              >
                <div class="flex items-center justify-between">
                  <span class="font-bold text-slate-900 dark:text-white">Savings Bank</span>
                  <input type="radio" name="accountType" value="Savings" [(ngModel)]="accountType" class="text-indigo-600" />
                </div>
                <p class="mt-2 text-xs text-slate-500 dark:text-slate-400">Regular Savings Account with full digital banking access.</p>
              </label>

              <label
                [ngClass]="{ 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30': accountType === 'BSBDA' }"
                class="flex cursor-pointer flex-col justify-between rounded-xl border p-4 transition hover:border-indigo-500 dark:border-slate-800"
              >
                <div class="flex items-center justify-between">
                  <span class="font-bold text-slate-900 dark:text-white">BSBDA (Zero Balance)</span>
                  <input type="radio" name="accountType" value="BSBDA" [(ngModel)]="accountType" class="text-indigo-600" />
                </div>
                <p class="mt-2 text-xs text-slate-500 dark:text-slate-400">Basic Small Deposit Account without minimum balance fee.</p>
              </label>

              <label
                [ngClass]="{ 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30': accountType === 'Current' }"
                class="flex cursor-pointer flex-col justify-between rounded-xl border p-4 transition hover:border-indigo-500 dark:border-slate-800"
              >
                <div class="flex items-center justify-between">
                  <span class="font-bold text-slate-900 dark:text-white">Current Account</span>
                  <input type="radio" name="accountType" value="Current" [(ngModel)]="accountType" class="text-indigo-600" />
                </div>
                <p class="mt-2 text-xs text-slate-500 dark:text-slate-400">Commercial account for higher transaction volumes.</p>
              </label>
            </div>
          </div>

          <!-- 2. Services Required (Debit Card Name, Cheque Book, Netbanking) -->
          <div class="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-4">
            <h3 class="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span class="flex size-6 items-center justify-center rounded-full bg-emerald-600 text-xs text-white">2</span>
              Banking Services Required
            </h3>

            <div>
              <label for="cardName" class="block text-sm font-medium text-slate-700 dark:text-slate-300">Name to be Embossed on ATM Debit Card</label>
              <input
                id="cardName"
                type="text"
                name="cardName"
                [(ngModel)]="cardEmbossedName"
                class="mt-1 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none transition dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                placeholder="e.g. SOURAV SHARMA"
              />
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <label class="flex items-center gap-3 rounded-xl border border-slate-200 p-3.5 dark:border-slate-800 cursor-pointer">
                <input type="checkbox" name="chequeBook" [(ngModel)]="chequeBookRequired" class="size-4 rounded text-indigo-600" />
                <div>
                  <span class="block text-sm font-bold text-slate-900 dark:text-white">Cheque Book Required</span>
                  <span class="block text-xs text-slate-500">Issue personalized 25-leaf cheque book</span>
                </div>
              </label>

              <label class="flex items-center gap-3 rounded-xl border border-slate-200 p-3.5 dark:border-slate-800 cursor-pointer">
                <input type="checkbox" name="smsAlerts" [(ngModel)]="smsAlertsRequired" class="size-4 rounded text-indigo-600" />
                <div>
                  <span class="block text-sm font-bold text-slate-900 dark:text-white">SMS Banking & Alerts</span>
                  <span class="block text-xs text-slate-500">Instant SMS notifications for transactions</span>
                </div>
              </label>
            </div>
          </div>

          <!-- 3. Form DA-1 Nomination Section -->
          <div class="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span class="flex size-6 items-center justify-center rounded-full bg-emerald-600 text-xs text-white">3</span>
                Form DA-1 (Nomination Details)
              </h3>

              <label class="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input type="checkbox" name="addNominee" [(ngModel)]="addNominee" class="size-4 rounded text-indigo-600" />
                Add Nominee Details
              </label>
            </div>

            <div *ngIf="addNominee" class="rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/60 space-y-4">
              <div>
                <label for="nomineeName" class="block text-sm font-medium text-slate-700 dark:text-slate-300">Nominee Full Name*</label>
                <input
                  id="nomineeName"
                  type="text"
                  name="nomineeName"
                  [(ngModel)]="nominee.name"
                  class="mt-1 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none transition dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  placeholder="Enter nominee name"
                />
              </div>

              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <label for="relationship" class="block text-sm font-medium text-slate-700 dark:text-slate-300">Relationship with Depositor*</label>
                  <select
                    id="relationship"
                    name="relationship"
                    [(ngModel)]="nominee.relationship"
                    class="mt-1 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none transition bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Son">Son</option>
                    <option value="Daughter">Daughter</option>
                    <option value="Brother">Brother</option>
                    <option value="Sister">Sister</option>
                  </select>
                </div>

                <div>
                  <label for="nomineeAge" class="block text-sm font-medium text-slate-700 dark:text-slate-300">Nominee Age*</label>
                  <input
                    id="nomineeAge"
                    type="number"
                    name="nomineeAge"
                    [(ngModel)]="nominee.age"
                    class="mt-1 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none transition dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <label class="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                <input type="checkbox" name="printOnPassbook" [(ngModel)]="nominee.printOnPassbook" class="rounded text-indigo-600" />
                Print Nominee Name on Passbook / Account Statement
              </label>
            </div>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            [disabled]="loading()"
            class="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3.5 text-white font-bold text-base shadow-md transition hover:brightness-110 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
          >
            {{ loading() ? 'Processing Account Application...' : 'Submit Part-II Account Opening Application' }}
          </button>
        </form>
      </div>

    </div>
  `
})
export class OpenAccountViewComponent {
  private readonly apiService = inject(ApiService);

  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<any>(null);

  accountType = 'Savings';
  cardEmbossedName = '';
  chequeBookRequired = true;
  smsAlertsRequired = true;

  addNominee = true;
  nominee = {
    name: '',
    relationship: 'Spouse',
    age: 25,
    printOnPassbook: true
  };

  handleOpen(): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService.createAccount().subscribe({
      next: (res: any) => {
        this.loading.set(false);
        this.success.set(res);
      },
      error: (err: any) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Failed to open account. Ensure your KYC status is APPROVED.');
      }
    });
  }
}
