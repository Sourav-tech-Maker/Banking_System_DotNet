import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LucideArrowLeft,
  LucideLoaderCircle,
  LucideMail,
  LucidePlus,
  LucideShieldCheck,
  LucideTrash2,
  LucideUserRoundPlus,
  LucideUsersRound,
  LucideX
} from '@lucide/angular';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-beneficiaries-view',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideArrowLeft,
    LucideLoaderCircle,
    LucideMail,
    LucidePlus,
    LucideShieldCheck,
    LucideTrash2,
    LucideUserRoundPlus,
    LucideUsersRound,
    LucideX
  ],
  template: `
    <div class="space-y-5 sm:space-y-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Beneficiaries</h1>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage verified payees for fast, secure transfers.</p>
        </div>
        <button
          type="button"
          (click)="openAddModal()"
          class="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:bg-indigo-800"
        >
          <svg lucidePlus class="size-4"></svg>
          Add beneficiary
        </button>
      </div>

      <div *ngIf="pageMessage()" class="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
        <svg lucideShieldCheck class="size-5 shrink-0"></svg>
        {{ pageMessage() }}
      </div>

      <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div *ngIf="loading()" class="flex justify-center py-14">
          <svg lucideLoaderCircle class="size-8 animate-spin text-indigo-600"></svg>
        </div>

        <div *ngIf="!loading() && beneficiaries().length === 0" class="flex flex-col items-center px-5 py-14 text-center">
          <span class="mb-4 inline-flex size-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300">
            <svg lucideUsersRound class="size-6"></svg>
          </span>
          <h2 class="font-bold text-slate-900 dark:text-white">No verified beneficiaries</h2>
          <p class="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">Add a recipient and verify the emailed code before they appear here.</p>
        </div>

        <div *ngIf="!loading() && beneficiaries().length > 0" class="overflow-x-auto">
          <table class="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead class="bg-slate-50/80 dark:bg-slate-900/70">
              <tr class="border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th class="px-5 py-3.5">Full name</th>
                <th class="px-5 py-3.5">Nickname</th>
                <th class="px-5 py-3.5">Account ID</th>
                <th class="px-5 py-3.5">Account type</th>
                <th class="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 font-medium text-slate-700 dark:divide-slate-800 dark:text-slate-300">
              <tr *ngFor="let beneficiary of beneficiaries()" class="transition hover:bg-slate-50/70 dark:hover:bg-slate-900/60">
                <td class="px-5 py-4 font-bold text-slate-900 dark:text-white">{{ beneficiary.fullName }}</td>
                <td class="px-5 py-4 text-slate-500 dark:text-slate-400">{{ beneficiary.nickName }}</td>
                <td class="max-w-[180px] truncate px-5 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                  {{ beneficiary.accountId?._id || beneficiary.accountId }}
                </td>
                <td class="px-5 py-4 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">{{ beneficiary.accountType }}</td>
                <td class="px-5 py-4 text-right">
                  <button
                    type="button"
                    (click)="confirmDelete(beneficiary)"
                    class="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40"
                  >
                    <svg lucideTrash2 class="size-4"></svg>
                    Remove
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div *ngIf="showAddModal()" class="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/65 p-0 backdrop-blur-sm sm:items-center sm:p-5">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="beneficiary-dialog-title"
          class="relative max-h-[96vh] w-full overflow-y-auto rounded-t-3xl border border-slate-200 bg-white px-5 pb-5 pt-6 shadow-2xl dark:border-slate-700 dark:bg-slate-950 sm:max-w-xl sm:rounded-3xl sm:p-7"
        >
          <button
            type="button"
            (click)="closeModal()"
            aria-label="Close beneficiary dialog"
            class="absolute right-4 top-4 inline-flex size-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <svg lucideX class="size-5"></svg>
          </button>

          <span class="mb-5 inline-flex size-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300">
            <svg *ngIf="verificationStep() === 1" lucideUserRoundPlus class="size-7"></svg>
            <svg *ngIf="verificationStep() === 2" lucideMail class="size-7"></svg>
          </span>

          <h2 id="beneficiary-dialog-title" class="pr-10 text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white">
            {{ verificationStep() === 1 ? 'Add a beneficiary' : 'Verify beneficiary' }}
          </h2>
          <p class="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {{ verificationStep() === 1
              ? "Enter the recipient's bank details. We will email you a one-time verification code."
              : 'Enter the 6-digit code sent to ' + maskedEmail() + '. The beneficiary is not added until this code is verified.' }}
          </p>

          <div class="my-7 grid grid-cols-2 gap-2.5" aria-label="Verification progress">
            <span class="h-1.5 rounded-full bg-indigo-600"></span>
            <span class="h-1.5 rounded-full transition-colors" [ngClass]="verificationStep() === 2 ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'"></span>
          </div>

          <div *ngIf="modalError()" role="alert" class="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
            {{ modalError() }}
          </div>

          <form *ngIf="verificationStep() === 1" (submit)="handleAddSubmit($event)" class="space-y-5">
            <div>
              <label for="bFullName" class="block text-sm font-bold text-slate-700 dark:text-slate-300">Full name</label>
              <input
                id="bFullName"
                type="text"
                name="fullName"
                required
                maxlength="150"
                autocomplete="off"
                [(ngModel)]="addForm.fullName"
                class="mt-2 block min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                placeholder="Recipient's legal name"
              />
            </div>

            <div>
              <label for="bNickName" class="block text-sm font-bold text-slate-700 dark:text-slate-300">Nickname</label>
              <input
                id="bNickName"
                type="text"
                name="nickName"
                required
                maxlength="20"
                autocomplete="off"
                [(ngModel)]="addForm.nickName"
                class="mt-2 block min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                placeholder="For example, Rent or Mom"
              />
            </div>

            <div>
              <label for="bAccountId" class="block text-sm font-bold text-slate-700 dark:text-slate-300">Account ID</label>
              <input
                id="bAccountId"
                type="text"
                name="accountId"
                required
                autocomplete="off"
                [(ngModel)]="addForm.accountId"
                class="mt-2 block min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-mono text-sm text-slate-900 outline-none transition placeholder:font-sans placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                placeholder="Recipient account UUID"
              />
              <p class="mt-1.5 text-xs text-slate-500 dark:text-slate-400">Only active, KYC-verified YONO App accounts can be added.</p>
            </div>

            <div class="flex items-start gap-3 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-4 text-sm text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-300">
              <svg lucideMail class="mt-0.5 size-4 shrink-0"></svg>
              <span>The verification code will be sent to <strong>{{ maskedEmail() }}</strong>.</span>
            </div>

            <div class="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
              <button type="button" (click)="closeModal()" class="min-h-12 rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900">Cancel</button>
              <button
                type="submit"
                [disabled]="modalLoading() || !detailsAreComplete()"
                class="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg *ngIf="modalLoading()" lucideLoaderCircle class="size-4 animate-spin"></svg>
                <svg *ngIf="!modalLoading()" lucideMail class="size-4"></svg>
                {{ modalLoading() ? 'Sending code…' : 'Send verification code' }}
              </button>
            </div>
          </form>

          <form *ngIf="verificationStep() === 2" (submit)="handleVerifySubmit($event)" class="space-y-5">
            <div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
              <p class="text-xs font-bold uppercase tracking-wider text-slate-400">Beneficiary</p>
              <p class="mt-1 font-semibold text-slate-900 dark:text-white">{{ addForm.fullName }} <span class="font-normal text-slate-500">({{ addForm.nickName }})</span></p>
            </div>

            <div>
              <label for="verifyOtp" class="block text-sm font-bold text-slate-700 dark:text-slate-300">Verification code</label>
              <input
                id="verifyOtp"
                type="text"
                inputmode="numeric"
                pattern="[0-9]*"
                maxlength="6"
                name="otp"
                required
                autocomplete="one-time-code"
                [ngModel]="verifyOtpCode"
                (input)="onOtpInput($event)"
                class="mt-2 block min-h-14 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-center font-mono text-2xl font-extrabold tracking-[0.45em] text-slate-900 outline-none transition placeholder:tracking-[0.3em] placeholder:text-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                placeholder="000000"
              />
              <p class="mt-2 text-xs text-slate-500 dark:text-slate-400">The code expires after 10 minutes and allows a maximum of five attempts.</p>
            </div>

            <button type="button" (click)="handleResendCode()" [disabled]="modalLoading()" class="text-sm font-semibold text-indigo-600 hover:underline disabled:text-slate-400 dark:text-indigo-400">
              Send a new code
            </button>

            <div class="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
              <button type="button" (click)="goBackToDetails()" [disabled]="modalLoading()" class="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900">
                <svg lucideArrowLeft class="size-4"></svg>
                Back
              </button>
              <button
                type="submit"
                [disabled]="modalLoading() || verifyOtpCode.length !== 6"
                class="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg *ngIf="modalLoading()" lucideLoaderCircle class="size-4 animate-spin"></svg>
                <svg *ngIf="!modalLoading()" lucideShieldCheck class="size-4"></svg>
                {{ modalLoading() ? 'Verifying…' : 'Verify and add' }}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  `
})
export class BeneficiariesViewComponent implements OnInit {
  private readonly apiService = inject(ApiService);

  protected beneficiaries = signal<any[]>([]);
  protected loading = signal(false);
  protected showAddModal = signal(false);
  protected modalLoading = signal(false);
  protected modalError = signal('');
  protected pageMessage = signal('');
  protected verificationStep = signal<1 | 2>(1);
  protected maskedEmail = signal('your registered email');

  protected addForm = {
    fullName: '',
    nickName: '',
    accountId: ''
  };

  protected currentBeneficiaryId = '';
  protected verifyOtpCode = '';

  ngOnInit() {
    this.fetchBeneficiaries();
  }

  protected fetchBeneficiaries() {
    this.loading.set(true);
    this.apiService.getBeneficiaries().subscribe({
      next: (response) => {
        this.beneficiaries.set(response.data?.beneficiaries || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  protected openAddModal() {
    this.addForm = { fullName: '', nickName: '', accountId: '' };
    this.currentBeneficiaryId = '';
    this.verifyOtpCode = '';
    this.modalError.set('');
    this.pageMessage.set('');
    this.verificationStep.set(1);
    this.maskedEmail.set(this.getMaskedSessionEmail());
    this.showAddModal.set(true);
  }

  protected closeModal() {
    this.showAddModal.set(false);
    this.modalLoading.set(false);
    this.modalError.set('');
  }

  protected detailsAreComplete() {
    return this.addForm.fullName.trim().length > 0
      && this.addForm.nickName.trim().length > 0
      && this.addForm.accountId.trim().length > 0;
  }

  protected handleAddSubmit(event: Event) {
    event.preventDefault();
    if (!this.detailsAreComplete()) return;
    this.requestVerificationCode();
  }

  protected handleResendCode() {
    this.requestVerificationCode();
  }

  private requestVerificationCode() {
    this.modalLoading.set(true);
    this.modalError.set('');

    this.apiService.addBeneficiary({
      fullName: this.addForm.fullName.trim(),
      nickName: this.addForm.nickName.trim(),
      accountId: this.addForm.accountId.trim()
    }).subscribe({
      next: (response) => {
        this.modalLoading.set(false);
        this.currentBeneficiaryId = response.data?.beneficiaryId || '';
        this.maskedEmail.set(response.data?.maskedEmail || this.maskedEmail());
        this.verifyOtpCode = '';
        this.verificationStep.set(2);
      },
      error: (error) => {
        this.modalLoading.set(false);
        this.modalError.set(error.error?.message || 'Unable to send the verification code.');
      }
    });
  }

  protected onOtpInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.verifyOtpCode = input.value.replace(/\D/g, '').slice(0, 6);
    input.value = this.verifyOtpCode;
  }

  protected goBackToDetails() {
    this.modalError.set('');
    this.verifyOtpCode = '';
    this.verificationStep.set(1);
  }

  protected handleVerifySubmit(event: Event) {
    event.preventDefault();
    if (this.verifyOtpCode.length !== 6 || !this.currentBeneficiaryId) return;

    this.modalLoading.set(true);
    this.modalError.set('');
    this.apiService.verifyBeneficiary({
      beneficiaryId: this.currentBeneficiaryId,
      otp: this.verifyOtpCode
    }).subscribe({
      next: (response) => {
        this.modalLoading.set(false);
        this.closeModal();
        this.pageMessage.set(response.message || 'Beneficiary verified and added successfully.');
        this.fetchBeneficiaries();
      },
      error: (error) => {
        this.modalLoading.set(false);
        this.modalError.set(error.error?.message || 'The verification code is invalid or expired.');
      }
    });
  }

  protected confirmDelete(beneficiary: any) {
    if (!confirm(`Are you sure you want to remove ${beneficiary.fullName}?`)) return;

    this.apiService.deleteBeneficiary(beneficiary.id).subscribe({
      next: () => this.fetchBeneficiaries(),
      error: (error) => alert(error.error?.message || 'Failed to delete beneficiary')
    });
  }

  private getMaskedSessionEmail() {
    const storedUser = sessionStorage.getItem('YONO AppUser');
    if (!storedUser) return 'your registered email';

    try {
      const email = JSON.parse(storedUser)?.email as string | undefined;
      if (!email || !email.includes('@')) return 'your registered email';
      const [localPart, domain] = email.split('@');
      const visible = localPart.slice(0, Math.min(2, localPart.length));
      return `${visible}${'•'.repeat(Math.max(3, localPart.length - visible.length))}@${domain}`;
    } catch {
      return 'your registered email';
    }
  }
}
