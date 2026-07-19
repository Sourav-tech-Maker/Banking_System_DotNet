import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-verify-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-950 sm:px-6">
      <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div class="text-center">
          <h2 class="text-2xl font-extrabold text-slate-900 dark:text-white sm:text-3xl">
            Verify Your Email
          </h2>
          <p class="mt-2 break-words text-sm text-slate-600 dark:text-slate-300">
            Enter the 6-digit OTP sent to <span class="font-semibold text-indigo-600">{{ email }}</span>
          </p>
        </div>

        <div class="mt-8 space-y-6">
          <div class="flex justify-center gap-2">
            <input
              *ngFor="let index of [0,1,2,3,4,5]"
              type="text"
              maxlength="1"
              inputmode="numeric"
              pattern="[0-9]*"
              autocomplete="one-time-code"
              class="h-11 w-10 rounded-lg border border-slate-300 bg-slate-50 text-center text-xl font-bold text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:bg-slate-900 sm:h-12 sm:w-12"
              [value]="otpDigits[index]"
              (input)="onDigitInput($event, index)"
              (keydown)="onKeyDown($event, index)"
              #otpInput
            />
          </div>

          <div *ngIf="errorMsg()" class="rounded-md bg-rose-50 p-3 text-sm font-medium text-rose-700">
            {{ errorMsg() }}
          </div>
          <div *ngIf="successMsg()" class="rounded-md bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
            {{ successMsg() }}
          </div>

          <button
            (click)="handleVerify()"
            [disabled]="loading() || getOtpString().length !== 6"
            class="w-full rounded-lg bg-indigo-600 py-3 text-white font-semibold shadow-sm transition hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50"
          >
            {{ loading() ? 'Verifying...' : 'Verify OTP' }}
          </button>
        </div>

          <p class="text-center text-sm text-slate-500 dark:text-slate-400">
            Didn't receive the email?
            <button
              type="button"
              (click)="handleResend()"
              [disabled]="resendLoading()"
              class="font-semibold text-indigo-600 hover:text-indigo-500 hover:underline disabled:cursor-not-allowed disabled:text-slate-400 disabled:no-underline dark:text-indigo-400"
            >
              {{ resendLoading() ? 'Sending?' : 'Resend OTP' }}
            </button>
          </p>
      </div>
    </div>
  `
})
export class VerifyUserComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly apiService = inject(ApiService);

  protected email: string = '';
  protected otpDigits: string[] = ['', '', '', '', '', ''];
  protected loading = signal(false);
  protected errorMsg = signal('');
  protected resendLoading = signal(false);
  protected successMsg = signal('');

  ngOnInit() {
    // Read state or fallback
    const navigation = this.router.getCurrentNavigation();
    this.email = (navigation?.extras.state as { email?: string })?.email || sessionStorage.getItem('yono_verify_email') || '';
    if (!this.email) {
      this.router.navigate(['/register']);
    }
  }

  protected onDigitInput(event: any, index: number) {
    const val = event.target.value;
    this.otpDigits[index] = val.slice(-1);

    if (val && index < 5) {
      // Focus next input element
      const nextInput = event.target.nextElementSibling as HTMLInputElement | null;
      nextInput?.focus();
    }
  }

  protected onKeyDown(event: KeyboardEvent, index: number) {
    if (event.key === 'Backspace' && !this.otpDigits[index] && index > 0) {
      this.otpDigits[index - 1] = '';
      const prevInput = (event.target as HTMLInputElement).previousElementSibling as HTMLInputElement | null;
      prevInput?.focus();
    }
  }

  protected getOtpString(): string {
    return this.otpDigits.join('');
  }

  protected handleVerify() {
    const otp = this.getOtpString();
    if (otp.length !== 6) return;

    this.loading.set(true);
    this.errorMsg.set('');
    this.successMsg.set('');

    this.apiService.verifyOtp({ email: this.email, otp }).subscribe({
      next: (res) => {
        alert(res.message || 'Email verified successfully');
        sessionStorage.removeItem('yono_verify_email');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(err.error?.message || 'OTP verification failed');
      }
    });
  }

  protected handleResend() {
    if (!this.email || this.resendLoading()) return;

    this.resendLoading.set(true);
    this.errorMsg.set('');
    this.successMsg.set('');
    this.apiService.resendOtp({ email: this.email }).subscribe({
      next: (res) => {
        this.resendLoading.set(false);
        this.successMsg.set(res.message || 'If the account is eligible, a new OTP has been queued.');
      },
      error: (err) => {
        this.resendLoading.set(false);
        this.errorMsg.set(err.error?.message || 'Unable to resend the OTP. Please try again.');
      }
    });
  }
}
