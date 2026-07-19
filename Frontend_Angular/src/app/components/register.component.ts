import { Component, signal, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <main class="flex min-h-screen w-full bg-slate-950 font-sans text-slate-900 overflow-hidden">
      <!-- Left Hero Panel (Hidden on Mobile) -->
      <section class="hidden lg:flex w-1/2 flex-col justify-between p-12 relative overflow-hidden text-white bg-slate-950">
        <div class="absolute inset-0 z-0">
          <div class="absolute inset-0 bg-gradient-to-tr from-slate-950 via-indigo-950/80 to-slate-950"></div>
          <div class="absolute inset-0 bg-slate-950/40"></div>
        </div>

        <div class="relative z-10 flex items-center">
          <div class="relative w-8 h-10 bg-gradient-to-tr from-pink-600 via-fuchsia-500 to-violet-600 rounded-lg flex items-center justify-center font-black text-2xl text-white shadow-lg shadow-indigo-500/20 cursor-default">
            Y
          </div>
          <div class="ml-3">
            <span class="block text-3xl font-extrabold tracking-widest text-white leading-none">YONO</span>
            <span class="block text-[10px] tracking-[0.25em] text-slate-400 font-bold uppercase">DIGITAL BANKING SUITE</span>
          </div>
        </div>

        <div class="relative z-10 space-y-8 max-w-lg my-auto">
          <h1 class="text-5xl lg:text-6xl font-sans font-semibold tracking-tight leading-tight">
            <span class="inline-block bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              Experience the future of
            </span>
            <br />
            <span class="inline-block bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent font-extrabold">
              Smart Banking.
            </span>
          </h1>
          <p class="text-slate-300 text-base lg:text-lg leading-relaxed">
            Manage accounts, transfer funds, track savings goals, and unlock rewards with our secure digital banking app.
          </p>
        </div>

        <div class="relative z-10 flex flex-col gap-6">
          
          <div class="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm p-4 max-w-sm">
            <div class="flex size-11 shrink-0 items-center justify-center rounded-xl bg-indigo-950/30 text-indigo-400">
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h4 class="text-sm font-bold text-white leading-snug">Your trust is our priority.</h4>
              <p class="text-xs text-slate-400 mt-1">We never share your data with third parties.</p>
            </div>
          </div>

          <div class="text-sm text-slate-400">
            &copy; {{ currentYear }} YONO Bank. All rights reserved.
          </div>
        </div>
      </section>

      <!-- Right Registration Form Panel -->
      <section class="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 md:p-12 bg-white overflow-y-auto max-h-screen">
        <div class="w-full max-w-xl space-y-6">
          <div>
            <h2 class="text-2xl font-extrabold text-slate-900 tracking-tight">Create your account</h2>
            <p class="mt-1 text-sm text-slate-500">
              Already have an account?
              <a routerLink="/login" class="font-medium text-indigo-600 hover:text-indigo-500 hover:underline">
                Sign in
              </a>
            </p>
          </div>

          <div *ngIf="successMessage()" class="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
            {{ successMessage() }}
          </div>

          <div *ngIf="errorMessage()" class="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
            {{ errorMessage() }}
          </div>

          <form (submit)="handleSubmit($event)" class="space-y-5">
            <!-- Dummy inputs to capture browser autofill -->
            <input type="text" name="prevent_autofill_email" style="display:none;" aria-hidden="true" tabindex="-1" />
            <input type="password" name="prevent_autofill_password" style="display:none;" aria-hidden="true" tabindex="-1" />

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Full Name -->
              <div>
                <label for="fullName" class="block text-sm font-bold text-slate-700">Full Name</label>
                <div class="relative mt-1">
                  <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </span>
                  <input
                    id="fullName"
                    type="text"
                    name="fullName"
                    required
                    autocomplete="off"
                    [(ngModel)]="formData.fullName"
                    class="block w-full rounded-lg border border-slate-300 pl-10 pr-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#5850ec] focus:outline-none focus:ring-1 focus:ring-[#5850ec] transition"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <!-- Email Address -->
              <div>
                <label for="email" class="block text-sm font-bold text-slate-700">Email Address</label>
                <div class="relative mt-1">
                  <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    required
                    autocomplete="off"
                    [(ngModel)]="formData.email"
                    class="block w-full rounded-lg border border-slate-300 pl-10 pr-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#5850ec] focus:outline-none focus:ring-1 focus:ring-[#5850ec] transition"
                    placeholder="Enter your email address"
                  />
                </div>
              </div>

              <!-- Mobile Number -->
              <div>
                <label for="mobile" class="block text-sm font-bold text-slate-700">Mobile Number</label>
                <div class="relative mt-1 flex rounded-lg border border-slate-300 overflow-hidden focus-within:border-[#5850ec] focus-within:ring-1 focus-within:ring-[#5850ec] transition bg-white">
                  <div class="flex items-center bg-slate-50 px-3 border-r border-slate-300 text-sm font-semibold text-slate-600">
                    <span>IN+91</span>
                    <svg class="h-3 w-3 ml-1 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <input
                    id="mobile"
                    type="text"
                    name="mobile"
                    [(ngModel)]="formData.mobile"
                    class="block w-full px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
                    placeholder="Enter your 10-digit mobile number"
                  />
                </div>
              </div>

              <!-- Date of Birth -->
              <div>
                <label for="dob" class="block text-sm font-bold text-slate-700">Date of Birth</label>
                <div class="relative mt-1">
                  <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <input
                    id="dob"
                    type="date"
                    name="dob"
                    [(ngModel)]="formData.dob"
                    class="block w-full rounded-lg border border-slate-300 pl-10 pr-3 py-2.5 text-sm text-slate-900 focus:border-[#5850ec] focus:outline-none focus:ring-1 focus:ring-[#5850ec] transition"
                  />
                </div>
              </div>

              <!-- Register As -->
              <div>
                <label for="role" class="block text-sm font-bold text-slate-700">Register As</label>
                <div class="relative mt-1">
                  <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </span>
                  <select
                    id="role"
                    name="role"
                    [(ngModel)]="formData.role"
                    class="block w-full rounded-lg border border-slate-300 pl-10 pr-10 py-2.5 text-sm text-slate-900 focus:border-[#5850ec] focus:outline-none focus:ring-1 focus:ring-[#5850ec] transition bg-white appearance-none"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="systemUser">System User</option>
                  </select>
                  <span class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 pointer-events-none">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </div>
              </div>

              <!-- RBAC Registration Key -->
              <div>
                <label for="roleAccessKey" class="block text-sm font-bold text-slate-700">RBAC Registration Key</label>
                <div class="relative mt-1">
                  <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m-3.418 4.818L9 17.586V19h1.586l4.768-4.768a2 2 0 10-2.828-2.828z" />
                    </svg>
                  </span>
                  <input
                    id="roleAccessKey"
                    type="password"
                    name="roleAccessKey"
                    [disabled]="formData.role === 'user'"
                    [(ngModel)]="formData.roleAccessKey"
                    [ngClass]="formData.role !== 'user' ? 'border-violet-600 focus:border-[#5850ec] focus:ring-[#5850ec] ring-1 ring-violet-200' : 'border-slate-300 bg-slate-50 cursor-not-allowed'"
                    class="block w-full rounded-lg border pl-10 pr-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 transition"
                    placeholder="Enter registration key"
                  />
                </div>
              </div>
            </div>

            <!-- Password -->
            <div>
              <label for="password" class="block text-sm font-bold text-slate-700">Password</label>
              <div class="relative mt-1">
                <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  id="password"
                  [type]="showPassword() ? 'text' : 'password'"
                  name="password"
                  required
                  autocomplete="new-password"
                  [(ngModel)]="formData.password"
                  (input)="checkPasswordRequirements()"
                  class="block w-full rounded-lg border border-slate-300 pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#5850ec] focus:outline-none focus:ring-1 focus:ring-[#5850ec] transition"
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  (click)="showPassword.set(!showPassword())"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <span class="text-sm">
                    <svg *ngIf="showPassword()" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                    <svg *ngIf="!showPassword()" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </span>
                </button>
              </div>
            </div>

            <!-- Confirm Password -->
            <div>
              <label for="confirmPassword" class="block text-sm font-bold text-slate-700">Confirm Password</label>
              <div class="relative mt-1">
                <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  id="confirmPassword"
                  [type]="showConfirmPassword() ? 'text' : 'password'"
                  name="confirmPassword"
                  required
                  autocomplete="new-password"
                  [(ngModel)]="formData.confirmPassword"
                  class="block w-full rounded-lg border border-slate-300 pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#5850ec] focus:outline-none focus:ring-1 focus:ring-[#5850ec] transition"
                  placeholder="Re-enter your password"
                />
                <button
                  type="button"
                  (click)="showConfirmPassword.set(!showConfirmPassword())"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <span class="text-sm">
                    <svg *ngIf="showConfirmPassword()" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                    <svg *ngIf="!showConfirmPassword()" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </span>
                </button>
              </div>
            </div>

            <!-- Password Requirements checklist Box -->
            <div class="rounded-xl border border-[#e0e7ff] bg-[#f0f2ff] p-4 space-y-3">
              <div class="flex items-center gap-2 text-[#312e81] font-bold text-sm">
                <svg class="h-4.5 w-4.5 text-[#5850ec]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Password must contain:</span>
              </div>
              
              <div class="flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold">
                <!-- requirement 8 chars -->
                <div class="flex items-center gap-2" [ngClass]="reqs.length ? 'text-slate-900' : 'text-slate-400'">
                  <span class="flex items-center justify-center size-4.5 rounded-full text-[10px] font-bold"
                        [ngClass]="reqs.length ? 'bg-[#e0e7ff] text-[#4338ca]' : 'bg-slate-100 text-slate-400'">
                    ✓
                  </span>
                  <span>At least 8 characters</span>
                </div>

                <!-- requirement number -->
                <div class="flex items-center gap-2" [ngClass]="reqs.number ? 'text-slate-900' : 'text-slate-400'">
                  <span class="flex items-center justify-center size-4.5 rounded-full text-[10px] font-bold"
                        [ngClass]="reqs.number ? 'bg-[#e0e7ff] text-[#4338ca]' : 'bg-slate-100 text-slate-400'">
                    ✓
                  </span>
                  <span>At least 1 number (0-9)</span>
                </div>

                <!-- requirement special character -->
                <div class="flex items-center gap-2" [ngClass]="reqs.special ? 'text-slate-900' : 'text-slate-400'">
                  <span class="flex items-center justify-center size-4.5 rounded-full text-[10px] font-bold"
                        [ngClass]="reqs.special ? 'bg-[#e0e7ff] text-[#4338ca]' : 'bg-slate-100 text-slate-400'">
                    ✓
                  </span>
                  <span>At least 1 special character</span>
                </div>
              </div>
            </div>

            <!-- Terms & Conditions Checkbox -->
            <div class="flex items-start">
              <div class="flex h-5 items-center">
                <input
                  id="terms"
                  type="checkbox"
                  name="terms"
                  [(ngModel)]="termsAccepted"
                  class="h-4 w-4 rounded border-slate-300 text-[#5850ec] focus:ring-[#5850ec]"
                />
              </div>
              <label for="terms" class="ml-2 block text-sm font-semibold text-slate-600">
                I accept the Terms &amp; Conditions and Privacy Policy
              </label>
            </div>

            <!-- Submit Button -->
            <div>
              <button
                type="submit"
                [disabled]="loading() || !termsAccepted"
                class="w-full rounded-lg bg-[#5850ec] hover:bg-[#4c44d6] active:bg-[#3f37c9] py-3 text-white font-semibold shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm tracking-wide"
              >
                <svg *ngIf="!loading()" class="h-4.5 w-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <svg *ngIf="loading()" class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ loading() ? 'Registering...' : 'Register' }}
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  `
})
export class RegisterComponent {
  private readonly router = inject(Router);
  private readonly apiService = inject(ApiService);

  protected currentYear = new Date().getFullYear();
  protected formData = {
    fullName: '',
    email: '',
    mobile: '',
    dob: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    roleAccessKey: ''
  };

  protected termsAccepted = false;
  protected loading = signal(false);
  protected showPassword = signal(false);
  protected showConfirmPassword = signal(false);
  protected successMessage = signal('');
  protected errorMessage = signal('');

  protected reqs = {
    length: false,
    number: false,
    special: false
  };

  protected checkPasswordRequirements() {
    const pw = this.formData.password;
    this.reqs.length = pw.length >= 8;
    this.reqs.number = /\d/.test(pw);
    this.reqs.special = /[@$!%*?&]/.test(pw);
  }

  protected handleSubmit(event: Event) {
    event.preventDefault();
    if (this.formData.password !== this.formData.confirmPassword) {
      this.errorMessage.set('Passwords do not match');
      return;
    }

    if (!this.termsAccepted) {
      this.errorMessage.set('You must agree to the Terms & Conditions');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.apiService.register({
      username: this.formData.fullName,
      email: this.formData.email,
      password: this.formData.password,
      role: this.formData.role,
      roleAccessKey: this.formData.roleAccessKey
    }).subscribe({
      next: (res) => {
        this.successMessage.set(res.message || 'Registration successful!');
        sessionStorage.setItem('yono_verify_email', this.formData.email);
        setTimeout(() => {
          this.router.navigate(['/verify-otp'], { state: { email: this.formData.email } });
        }, 1500);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.message || 'Registration failed');
      }
    });
  }
}
