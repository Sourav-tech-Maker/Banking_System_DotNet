import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { TranslationService } from '../services/translation.service';
import { CurrencyService } from '../services/currency.service';
import { SessionTimeoutService } from '../services/session-timeout.service';
import {
  LucideArrowRightLeft,
  LucideClock,
  LucideLandmark,
  LucideLayoutDashboard,
  LucideLogOut,
  LucideMenu,
  LucideMoon,
  LucidePiggyBank,
  LucideSend,
  LucideSettings,
  LucideServer,
  LucideShieldCheck,
  LucideShieldCog,
  LucideSun,
  LucideUserRound,
  LucideUsersRound,
  LucideX
} from '@lucide/angular';

// Import subviews
import { StatsCardsComponent } from './dashboard/stats-cards.component';
import { RecentTransactionsComponent } from './dashboard/recent-transactions.component';
import { SpendingChartComponent } from './dashboard/spending-chart.component';
import { AiInsightsComponent } from './dashboard/ai-insights.component';
import { TransactionsViewComponent } from './dashboard/transactions.component';
import { OpenAccountViewComponent } from './dashboard/open-account.component';
import { KycVerificationViewComponent } from './dashboard/kyc.component';
import { BeneficiariesViewComponent } from './dashboard/beneficiaries.component';
import { GoalsViewComponent } from './dashboard/goals.component';
import { ProfileViewComponent } from './dashboard/profile.component';
import { SettingsViewComponent } from './dashboard/settings.component';
import { AdminPanelComponent } from './dashboard/admin.component';
import { SystemConsoleComponent } from './system-console/system-console.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideArrowRightLeft,
    LucideClock,
    LucideLandmark,
    LucideLayoutDashboard,
    LucideLogOut,
    LucideMenu,
    LucideMoon,
    LucidePiggyBank,
    LucideSend,
    LucideSettings,
    LucideShieldCheck,
    LucideShieldCog,
    LucideSun,
    LucideUserRound,
    LucideUsersRound,
    LucideSettings,
    LucideServer,
    LucideShieldCheck,
    LucideShieldCog,
    LucideSun,
    LucideUserRound,
    LucideUsersRound,
    LucideX,
    StatsCardsComponent,
    RecentTransactionsComponent,
    SpendingChartComponent,
    AiInsightsComponent,
    TransactionsViewComponent,
    OpenAccountViewComponent,
    KycVerificationViewComponent,
    BeneficiariesViewComponent,
    GoalsViewComponent,
    ProfileViewComponent,
    SettingsViewComponent,
    AdminPanelComponent,
    SystemConsoleComponent
  ],
  template: `
    <div [class.dark]="isDarkMode()" class="min-h-screen md:h-screen md:overflow-hidden bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-900 dark:text-slate-100 md:flex">
      <button
        *ngIf="mobileSidebarOpen()"
        type="button"
        aria-label="Close navigation"
        class="fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-[2px] md:hidden"
        (click)="mobileSidebarOpen.set(false)"
      ></button>

      <!-- SIDEBAR -->
      <aside
        [ngClass]="mobileSidebarOpen() ? 'translate-x-0' : '-translate-x-full md:translate-x-0'"
        class="fixed inset-y-0 left-0 z-40 flex w-[min(18rem,86vw)] shrink-0 flex-col justify-between border-r border-slate-800 bg-slate-950 text-white shadow-2xl transition-transform duration-200 md:sticky md:top-0 md:h-screen md:w-64 md:shadow-none"
      >
        <div>
          <!-- Logo Header -->
          <div class="h-16 flex items-center px-6 border-b border-slate-800">
            <div class="w-7 h-9 bg-gradient-to-tr from-indigo-500 to-pink-500 rounded flex items-center justify-center font-bold text-white mr-3">
              Y
            </div>
            <div>
              <span class="block font-black tracking-wider text-white text-lg leading-none">YONO</span>
              <span class="block text-[8px] tracking-widest text-slate-400 font-bold uppercase">DIGITAL BANKING</span>
            </div>
          </div>

          <!-- Sidebar Nav links -->
          <nav class="p-4 space-y-1">
            <button
              *ngFor="let link of sidebarLinks"
              type="button"
              (click)="navigateTo(link.id)"
              [ngClass]="activeView() === link.id ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-900 hover:text-white'"
              class="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition text-left"
            >
              <svg *ngIf="link.id === 'dashboard'" lucideLayoutDashboard class="size-[18px]"></svg>
              <svg *ngIf="link.id === 'transactions'" lucideArrowRightLeft class="size-[18px]"></svg>
              <svg *ngIf="link.id === 'open-account'" lucideLandmark class="size-[18px]"></svg>
              <svg *ngIf="link.id === 'kyc'" lucideShieldCheck class="size-[18px]"></svg>
              <svg *ngIf="link.id === 'beneficiaries'" lucideUsersRound class="size-[18px]"></svg>
              <svg *ngIf="link.id === 'goals'" lucidePiggyBank class="size-[18px]"></svg>
              <svg *ngIf="link.id === 'profile'" lucideUserRound class="size-[18px]"></svg>
              <svg *ngIf="link.id === 'settings'" lucideSettings class="size-[18px]"></svg>
              <span>{{ ts.t(link.navKey) }}</span>
            </button>

            <!-- Admin Console Link (shown if role is admin) -->
            <button
              *ngIf="isAdmin()"
              type="button"
              (click)="navigateTo('admin')"
              [ngClass]="activeView() === 'admin' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-900 hover:text-white'"
              class="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition text-left border border-dashed border-rose-800/40 mt-4"
            >
              <svg lucideShieldCog class="size-[18px]"></svg>
              <span>{{ ts.t('nav.admin') }}</span>
            </button>

            <!-- SystemUser Console Link (shown if role is systemUser) -->
            <button
              *ngIf="isSystemUser()"
              type="button"
              (click)="navigateTo('system-console')"
              [ngClass]="activeView() === 'system-console' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-900 hover:text-white'"
              class="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition text-left border border-dashed border-indigo-700/50 mt-2"
            >
              <svg lucideServer class="size-[18px]"></svg>
              <span>{{ ts.t('nav.systemConsole') }}</span>
            </button>
          </nav>
        </div>

        <!-- Footer profile summary -->
        <div class="p-4 border-t border-slate-800 flex items-center justify-between">
          <div class="min-w-0">
            <p class="text-sm font-bold text-white truncate">{{ user()?.username }}</p>
            <p class="text-xs text-slate-400 truncate">{{ user()?.email }}</p>
          </div>
          <button
            type="button"
            (click)="handleLogout()"
            aria-label="Log out"
            class="ml-3 inline-flex shrink-0 items-center rounded-lg p-2 text-rose-400 hover:bg-rose-950/40 hover:text-rose-300"
          >
            <svg lucideLogOut class="size-4"></svg>
            <span class="sr-only">Logout</span>
          </button>
        </div>
      </aside>

      <!-- MAIN PAGE AREA -->
      <div class="flex min-h-screen md:h-screen md:overflow-y-auto min-w-0 flex-1 flex-col">
        <!-- NAVBAR -->
        <header class="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 sm:px-6">
          <div class="flex min-w-0 items-center gap-3 sm:gap-4">
            <button
              type="button"
              aria-label="Open navigation"
              class="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 md:hidden"
              (click)="mobileSidebarOpen.set(true)"
            >
              <svg lucideMenu class="size-5"></svg>
            </button>
            <h2 class="truncate text-base font-bold capitalize text-slate-900 dark:text-white sm:text-lg">
              {{ activeView() === 'dashboard' ? 'Overview' : activeView() }}
            </h2>
          </div>

          <div class="flex shrink-0 items-center gap-2 sm:gap-3">
            <!-- Auto Session Timeout Countdown Pill -->
            <div 
              class="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border transition-all duration-300 shadow-xs cursor-pointer select-none"
              [ngClass]="sessionService.isExpiringSoon() ? 'bg-rose-500/15 border-rose-500/50 text-rose-600 dark:text-rose-400 animate-pulse ring-2 ring-rose-500/30' : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'"
              (click)="sessionService.extendSession()"
              [attr.title]="'Session timeout set to ' + sessionService.timeoutMinutes() + ' mins. Click to extend timer!'"
            >
              <svg lucideClock class="size-3.5 shrink-0" [ngClass]="sessionService.isExpiringSoon() ? 'text-rose-500 animate-bounce' : 'text-indigo-500'"></svg>
              <span class="font-mono font-bold tracking-tight">{{ sessionService.remainingTimeFormatted() }}</span>
              
              <button 
                *ngIf="sessionService.isExpiringSoon()"
                type="button"
                (click)="$event.stopPropagation(); sessionService.extendSession()"
                class="ml-1 text-[10px] font-extrabold uppercase tracking-wider bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-0.5 rounded-full transition shadow-md animate-pulse"
              >
                Extend
              </button>
            </div>

            <!-- Theme Toggle -->
            <button
              type="button"
              (click)="toggleTheme()"
              [attr.aria-label]="isDarkMode() ? 'Switch to light mode' : 'Switch to dark mode'"
              [attr.title]="isDarkMode() ? 'Switch to light mode' : 'Switch to dark mode'"
              class="inline-flex size-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <svg *ngIf="isDarkMode()" lucideSun class="size-5 text-amber-400"></svg>
              <svg *ngIf="!isDarkMode()" lucideMoon class="size-5"></svg>
            </button>

            <!-- Send Money Button -->
            <button
              *ngIf="activeView() === 'dashboard'"
              type="button"
              (click)="openSendMoneyModal()"
              class="inline-flex min-h-10 items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 sm:px-4"
            >
              <svg lucideSend class="size-4"></svg>
              <span class="hidden sm:inline">{{ ts.t('dashboard.sendMoneyBtn') }}</span>
              <span class="sm:hidden">{{ ts.t('dashboard.sendMoneyBtn') }}</span>
            </button>
          </div>
        </header>

        <!-- ROUTED CONTENT CONTAINER -->
        <main class="flex-1 overflow-y-auto bg-slate-50 px-3 py-4 dark:bg-slate-900 dark:text-slate-100 sm:px-5 sm:py-6 lg:px-8">
          <div class="mx-auto w-full max-w-[1440px]">
            <!-- Session Expiration Warning Banner (shows when <= 1 min remaining) -->
            <div *ngIf="sessionService.isExpiringSoon()" class="mb-4 rounded-xl border border-rose-400/80 bg-rose-500/10 p-3.5 text-rose-900 shadow-md dark:border-rose-800/80 dark:bg-rose-950/60 dark:text-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse ring-1 ring-rose-500/20">
              <div class="flex items-center gap-2.5 text-xs font-semibold sm:text-sm">
                <span class="text-base">⚠️</span>
                <span>Session expiring in <strong class="font-mono text-rose-600 dark:text-rose-400 text-sm font-bold">{{ sessionService.remainingTimeFormatted() }}</strong>! Click Extend Session to avoid automatic logout.</span>
              </div>
              <button 
                type="button" 
                (click)="sessionService.extendSession()" 
                class="shrink-0 rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-bold text-white shadow-md hover:bg-rose-700 transition active:scale-95"
              >
                Extend Session
              </button>
            </div>
            <!-- SKELETON / LOADING -->
            <div *ngIf="loading() && activeView() === 'dashboard'" class="space-y-6">
              <div class="grid gap-4 md:grid-cols-4">
                <div *ngFor="let x of [1,2,3,4]" class="h-28 animate-pulse rounded-lg bg-white border border-slate-200 shadow-sm dark:bg-slate-950 dark:border-slate-800"></div>
              </div>
              <div class="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
                <div class="h-96 animate-pulse rounded-lg bg-white border border-slate-200 shadow-sm dark:bg-slate-950"></div>
                <div class="h-96 animate-pulse rounded-lg bg-white border border-slate-200 shadow-sm dark:bg-slate-950"></div>
              </div>
            </div>

            <!-- DASHBOARD CONTAINER VIEW -->
            <div *ngIf="!loading() && activeView() === 'dashboard'" class="space-y-4 sm:space-y-6">
              <!-- Personalized Greeting Banner -->
              <div class="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 text-white shadow-md dark:border-indigo-950">
                <div class="flex items-center justify-between gap-4">
                  <div>
                    <span class="inline-block rounded-full bg-indigo-500/30 px-3 py-1 text-xs font-bold text-indigo-200">
                      {{ getGreetingTime() }}
                    </span>
                    <h1 class="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
                      {{ ts.t('dashboard.welcomeBack') }}, {{ user()?.username || 'Customer' }}!
                    </h1>
                    <p class="mt-1 text-xs text-indigo-200 sm:text-sm">
                      {{ ts.t('dashboard.welcomeSubtitle') }}
                    </p>
                  </div>
                  <div class="hidden sm:flex size-14 items-center justify-center rounded-2xl bg-white/10 text-2xl backdrop-blur-md">
                    👋
                  </div>
                </div>
              </div>

              <!-- Statistics -->
              <app-stats-cards [summary]="dashboard()?.summary"></app-stats-cards>

              <!-- Inner Dashboard Sections -->
              <div class="grid gap-4 lg:gap-5 xl:grid-cols-[1.05fr_.95fr]">
                <app-recent-transactions
                  [transactions]="dashboard()?.recentTransactions"
                  (onViewAll)="navigateTo('transactions')"
                ></app-recent-transactions>

                <app-ai-insights [insights]="dashboard()?.aiInsights"></app-ai-insights>
              </div>

              <!-- Spending charts -->
              <app-spending-chart [analytics]="dashboard()?.analytics"></app-spending-chart>
            </div>

            <!-- OTHER DYNAMIC VIEWS -->
            <app-transactions-view *ngIf="activeView() === 'transactions'"></app-transactions-view>
            <app-open-account-view *ngIf="activeView() === 'open-account'"></app-open-account-view>
            <app-kyc-verification-view *ngIf="activeView() === 'kyc'" (navigateToOpenAccount)="navigateTo('open-account')"></app-kyc-verification-view>
            <app-beneficiaries-view *ngIf="activeView() === 'beneficiaries'" (sendMoney)="openQuickSend($event)"></app-beneficiaries-view>
            <app-goals-view *ngIf="activeView() === 'goals'"></app-goals-view>
            <app-profile-view *ngIf="activeView() === 'profile'"></app-profile-view>
            <app-settings-view *ngIf="activeView() === 'settings'" (onThemeChange)="handleThemeChange($event)"></app-settings-view>
            <app-admin-panel *ngIf="activeView() === 'admin'"></app-admin-panel>
            <app-system-console *ngIf="activeView() === 'system-console'"></app-system-console>
          </div>
        </main>
      </div>

      <!-- SEND MONEY MODAL -->
      <div *ngIf="showSendModal()" class="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 backdrop-blur-sm sm:items-center sm:p-4">
        <div class="relative max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-950 sm:max-w-md sm:rounded-2xl sm:p-6">
          <button
            type="button"
            (click)="showSendModal.set(false)"
            aria-label="Close send money dialog"
            class="absolute right-4 top-4 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <svg lucideX class="size-5"></svg>
          </button>

          <h2 class="text-lg font-bold text-slate-950 dark:text-white mb-1">
            {{ sendStep() === 'form' ? 'Send Money' : 'Authorize Transfer' }}
          </h2>
          <p class="text-sm text-slate-500 mb-4">
            {{ sendStep() === 'form' ? 'Transfer funds securely to another bank account' : 'Enter the 6-digit verification code sent to your email' }}
          </p>

          <div *ngIf="sendError()" class="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {{ sendError() }}
          </div>
          <div *ngIf="sendSuccess()" class="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {{ sendSuccess() }}
          </div>

          <!-- STEP 1: TRANSFER DETAILS FORM -->
          <form *ngIf="sendStep() === 'form'" (submit)="handleSendMoney($event)" class="space-y-4">
            <!-- Source Account -->
            <div>
              <label for="fromAcc" class="block text-sm font-medium text-slate-700 dark:text-slate-300">From Account</label>
              <select
                id="fromAcc"
                name="fromAccount"
                required
                [(ngModel)]="sendForm.fromAccount"
                class="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                <option value="">Select source account</option>
                <option *ngFor="let acc of userAccounts()" [value]="acc.id">
                  {{ acc.accountType }} - A/C {{ cs.maskAccount(acc.id.slice(-6).toUpperCase()) }} (Bal: {{ cs.format(acc.balance) }})
                </option>
              </select>
            </div>

            <!-- Destination Account -->
            <div>
              <label for="toAcc" class="block text-sm font-medium text-slate-700 dark:text-slate-300">To Account ID (GUID)</label>
              <input
                id="toAcc"
                type="text"
                name="toAccount"
                required
                [(ngModel)]="sendForm.toAccount"
                class="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                placeholder="Paste destination account GUID"
              />
            </div>

            <!-- Amount -->
            <div>
              <div class="flex items-center justify-between">
                <label for="sendAmt" class="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Amount in {{ cs.currentCurrency() }} ({{ cs.getSymbol() }})
                </label>
                <span *ngIf="cs.currentCurrency() !== 'INR' && sendForm.amount > 0" class="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  ≈ ₹{{ cs.convertSelectedToInr(sendForm.amount) | number:'1.2-2' }} INR
                </span>
              </div>
              <input
                id="sendAmt"
                type="number"
                name="amount"
                required
                min="0.01"
                step="0.01"
                [(ngModel)]="sendForm.amount"
                class="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                [placeholder]="cs.getSymbol() + '100'"
              />
            </div>

            <div class="pt-2">
              <button
                type="submit"
                [disabled]="modalLoading() || sendForm.amount <= 0 || !sendForm.fromAccount || !sendForm.toAccount"
                class="w-full rounded-lg bg-indigo-600 py-2.5 text-white font-semibold shadow-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                {{ modalLoading() ? 'Sending OTP Code...' : 'Generate OTP & Continue' }}
              </button>
            </div>
          </form>

          <!-- STEP 2: OTP VERIFICATION -->
          <div *ngIf="sendStep() === 'otp'" class="space-y-5">
            <div class="rounded-xl border border-sky-100 bg-sky-50/70 p-4 text-center dark:border-sky-900/50 dark:bg-sky-950/40">
              <div class="mx-auto flex size-12 items-center justify-center rounded-full bg-sky-100 text-sky-600 dark:bg-sky-900 dark:text-sky-300">
                <svg lucideLock class="size-6"></svg>
              </div>
              <h3 class="mt-2 text-base font-bold text-slate-900 dark:text-white">Enter OTP Code</h3>
              <p class="mt-1 text-xs text-slate-600 dark:text-slate-400">
                We sent a 6-digit OTP code to <span class="font-semibold text-slate-900 dark:text-white">{{ maskedEmail() }}</span>
              </p>
              <div class="mt-2 inline-flex items-center gap-1.5 rounded-full bg-sky-200/60 px-3 py-1 text-xs font-semibold text-sky-800 dark:bg-sky-900/80 dark:text-sky-200">
                <svg lucideClock class="size-3.5"></svg>
                Expires in: {{ formatTimer(otpTimer()) }}
              </div>
            </div>

            <div>
              <label for="otpInput" class="block text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">6-Digit OTP</label>
              <input
                id="otpInput"
                type="text"
                maxlength="6"
                required
                pattern="[0-9]{6}"
                [(ngModel)]="otpCode"
                class="mt-2 block w-full rounded-xl border border-slate-300 bg-slate-50 py-3 text-center text-2xl font-bold tracking-[10px] text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-indigo-400"
                placeholder="000000"
              />
            </div>

            <div class="flex items-center justify-between text-xs">
              <button type="button" (click)="sendStep.set('form')" class="font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                ← Edit Transfer
              </button>
              <button type="button" (click)="handleResendOtp()" [disabled]="modalLoading() || otpTimer() > 240" class="font-semibold text-indigo-600 hover:underline disabled:opacity-50 dark:text-indigo-400">
                Resend OTP
              </button>
            </div>

            <button
              type="button"
              (click)="handleConfirmOtp()"
              [disabled]="modalLoading() || !otpCode() || otpCode().length !== 6"
              class="w-full rounded-xl bg-indigo-600 py-3 font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              {{ modalLoading() ? 'Verifying OTP...' : 'Verify OTP & Complete Transfer' }}
            </button>
          </div>
        </div>
      </div>

    </div>
  `
})
export class HomeComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly router = inject(Router);
  protected readonly ts = inject(TranslationService);
  protected readonly cs = inject(CurrencyService);
  protected readonly sessionService = inject(SessionTimeoutService);

  protected activeView = signal('dashboard');
  protected loading = signal(true);
  protected dashboard = signal<any>(null);
  protected user = signal<any>(null);

  protected isDarkMode = signal(false);
  protected mobileSidebarOpen = signal(false);

  // Send Money Modal State
  protected showSendModal = signal(false);
  protected modalLoading = signal(false);
  protected userAccounts = signal<any[]>([]);
  protected sendError = signal('');
  protected sendSuccess = signal('');

  protected sendStep = signal<'form' | 'otp'>('form');
  protected otpSessionId = signal('');
  protected maskedEmail = signal('');
  protected otpCode = signal('');
  protected otpTimer = signal(300);
  private timerInterval: any = null;

  protected sendForm = {
    fromAccount: '',
    toAccount: '',
    amount: 0
  };

  protected sidebarLinks = [
    { id: 'dashboard', name: 'Dashboard', navKey: 'nav.dashboard' },
    { id: 'transactions', name: 'Transactions', navKey: 'nav.transactions' },
    { id: 'open-account', name: 'Open Account', navKey: 'nav.openAccount' },
    { id: 'kyc', name: 'KYC Verification', navKey: 'nav.kyc' },
    { id: 'beneficiaries', name: 'Beneficiaries', navKey: 'nav.beneficiaries' },
    { id: 'goals', name: 'Savings Goals', navKey: 'nav.goals' },
    { id: 'profile', name: 'My Profile', navKey: 'nav.profile' },
    { id: 'settings', name: 'Settings', navKey: 'nav.settings' }
  ];

  ngOnInit() {
    this.sessionService.startMonitoring();
    this.checkUserSession();
    this.fetchDashboardData();
    this.loadTheme();
  }

  private checkUserSession() {
    const stored = sessionStorage.getItem('YONO AppUser');
    if (stored) {
      try {
        this.user.set(JSON.parse(stored));
      } catch {
        // ignore
      }
    }
  }

  protected isAdmin(): boolean {
    const role = (this.user()?.role || '').toString().toLowerCase();
    const username = (this.user()?.username || '').toString().toLowerCase();
    return role === 'admin' || username === 'admin';
  }

  protected isSystemUser(): boolean {
    const role = (this.user()?.role || '').toString().toLowerCase();
    const username = (this.user()?.username || '').toString().toLowerCase();
    return role === 'systemuser' || role === 'system_user' || username === 'systemuser';
  }

  protected fetchDashboardData() {
    this.loading.set(true);
    this.apiService.getDashboard().subscribe({
      next: (res) => {
        this.dashboard.set(res);
        const existingRole = this.user()?.role;
        const mergedUser = {
          ...res.user,
          role: res.user?.role || existingRole || (res.user?.username?.toLowerCase() === 'admin' ? 'admin' : 'customer')
        };
        this.user.set(mergedUser);
        sessionStorage.setItem('YONO AppUser', JSON.stringify(mergedUser));
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 401) {
          this.router.navigate(['/login']);
        }
      }
    });
  }

  protected navigateTo(viewId: string) {
    this.activeView.set(viewId);
    this.mobileSidebarOpen.set(false);
  }

  protected handleLogout() {
    this.apiService.logout().subscribe({
      next: () => {
        sessionStorage.removeItem('YONO AppUser');
        this.router.navigate(['/login']);
      },
      error: () => {
        sessionStorage.removeItem('YONO AppUser');
        this.router.navigate(['/login']);
      }
    });
  }

  protected openSendMoneyModal() {
    this.sendStep.set('form');
    this.otpSessionId.set('');
    this.maskedEmail.set('');
    this.otpCode.set('');
    this.sendForm.fromAccount = '';
    this.sendForm.toAccount = '';
    this.sendForm.amount = 0;
    this.sendError.set('');
    this.sendSuccess.set('');
    this.userAccounts.set([]);
    this.stopOtpTimer();
    this.showSendModal.set(true);

    // Fetch user accounts
    this.apiService.getAccountDetails().subscribe({
      next: (res) => {
        this.userAccounts.set(res.accounts || []);
      },
      error: () => {
        this.sendError.set('Failed to fetch source accounts');
      }
    });
  }

  protected openQuickSend(accountId: string) {
    this.openSendMoneyModal();
    this.sendForm.toAccount = accountId;
  }

  protected getGreetingTime(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  protected handleSendMoney(event: Event) {
    event.preventDefault();
    this.modalLoading.set(true);
    this.sendError.set('');
    this.sendSuccess.set('');

    const idempotencyKey = `transfer-${this.sendForm.fromAccount}-${crypto.randomUUID()}`;
    const amountInInr = this.cs.convertSelectedToInr(this.sendForm.amount);

    this.apiService.initiateTransfer({
      fromAccount: this.sendForm.fromAccount,
      toAccount: this.sendForm.toAccount,
      amount: amountInInr,
      idempotencyKey: idempotencyKey
    }).subscribe({
      next: (res) => {
        this.modalLoading.set(false);
        this.otpSessionId.set(res.sessionId);
        this.maskedEmail.set(res.maskedEmail);
        this.sendStep.set('otp');
        this.startOtpTimer();
      },
      error: (err) => {
        this.modalLoading.set(false);
        this.sendError.set(err.error?.message || 'Transfer initiation failed. Check details and balance.');
      }
    });
  }

  protected handleConfirmOtp() {
    if (!this.otpCode() || this.otpCode().length !== 6) return;

    this.modalLoading.set(true);
    this.sendError.set('');
    this.sendSuccess.set('');

    this.apiService.confirmTransferWithOtp({
      sessionId: this.otpSessionId(),
      otpCode: this.otpCode().trim()
    }).subscribe({
      next: (res) => {
        this.modalLoading.set(false);
        this.stopOtpTimer();
        this.sendSuccess.set(res.message || 'Transaction processed successfully!');
        this.fetchDashboardData();
        setTimeout(() => {
          this.showSendModal.set(false);
        }, 1500);
      },
      error: (err) => {
        this.modalLoading.set(false);
        this.sendError.set(err.error?.message || 'OTP verification failed. Please try again.');
      }
    });
  }

  protected handleResendOtp() {
    if (!this.otpSessionId()) return;

    this.modalLoading.set(true);
    this.sendError.set('');

    this.apiService.resendTransferOtp({
      sessionId: this.otpSessionId()
    }).subscribe({
      next: (res) => {
        this.modalLoading.set(false);
        this.sendSuccess.set(res.message || 'New OTP sent to your email');
        this.startOtpTimer();
      },
      error: (err) => {
        this.modalLoading.set(false);
        this.sendError.set(err.error?.message || 'Failed to resend OTP.');
      }
    });
  }

  protected formatTimer(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  private startOtpTimer() {
    this.stopOtpTimer();
    this.otpTimer.set(300);
    this.timerInterval = setInterval(() => {
      if (this.otpTimer() > 0) {
        this.otpTimer.update((val) => val - 1);
      } else {
        this.stopOtpTimer();
      }
    }, 1000);
  }

  private stopOtpTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  // Theme support
  protected loadTheme() {
    const saved = localStorage.getItem('yono_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.applyTheme(saved ? saved === 'dark' : prefersDark);
  }

  protected toggleTheme() {
    const dark = !this.isDarkMode();
    this.applyTheme(dark);
    localStorage.setItem('yono_theme', dark ? 'dark' : 'light');
  }

  protected handleThemeChange(dark: boolean) {
    this.applyTheme(dark);
    localStorage.setItem('yono_theme', dark ? 'dark' : 'light');
  }

  private applyTheme(dark: boolean) {
    this.isDarkMode.set(dark);
    document.documentElement.classList.toggle('dark', dark);
  }
}


