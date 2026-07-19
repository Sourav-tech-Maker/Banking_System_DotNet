import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import {
  LucideArrowRightLeft,
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

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideArrowRightLeft,
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
    AdminPanelComponent
  ],
  template: `
    <div [class.dark]="isDarkMode()" class="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-900 dark:text-slate-100 md:flex">
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
              <span>{{ link.name }}</span>
            </button>

            <!-- Admin Console Link (shown only if role is admin) -->
            <button
              *ngIf="isAdmin()"
              type="button"
              (click)="navigateTo('admin')"
              [ngClass]="activeView() === 'admin' ? 'bg-rose-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-900 hover:text-white'"
              class="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition text-left border border-dashed border-rose-800/40 mt-6"
            >
              <svg lucideShieldCog class="size-[18px]"></svg>
              <span>Admin Console</span>
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
      <div class="flex min-h-screen min-w-0 flex-1 flex-col">
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
              <span class="hidden sm:inline">Send Money</span>
              <span class="sm:hidden">Send</span>
            </button>
          </div>
        </header>

        <!-- ROUTED CONTENT CONTAINER -->
        <main class="flex-1 overflow-y-auto bg-slate-50 px-3 py-4 dark:bg-slate-900 dark:text-slate-100 sm:px-5 sm:py-6 lg:px-8">
          <div class="mx-auto w-full max-w-[1440px]">
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
            <app-kyc-verification-view *ngIf="activeView() === 'kyc'"></app-kyc-verification-view>
            <app-beneficiaries-view *ngIf="activeView() === 'beneficiaries'"></app-beneficiaries-view>
            <app-goals-view *ngIf="activeView() === 'goals'"></app-goals-view>
            <app-profile-view *ngIf="activeView() === 'profile'"></app-profile-view>
            <app-settings-view *ngIf="activeView() === 'settings'" (onThemeChange)="handleThemeChange($event)"></app-settings-view>
            <app-admin-panel *ngIf="activeView() === 'admin'"></app-admin-panel>
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

          <h2 class="text-lg font-bold text-slate-950 dark:text-white mb-1">Send Money</h2>
          <p class="text-sm text-slate-500 mb-4">Transfer funds to another account</p>

          <div *ngIf="sendError()" class="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {{ sendError() }}
          </div>
          <div *ngIf="sendSuccess()" class="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {{ sendSuccess() }}
          </div>

          <form (submit)="handleSendMoney($event)" class="space-y-4">
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
                  {{ acc.accountType }} - A/C {{ acc.id.slice(-6).toUpperCase() }} (Bal: ₹{{ acc.balance | number:'1.0-0' }})
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
              <label for="sendAmt" class="block text-sm font-medium text-slate-700 dark:text-slate-300">Amount (INR)</label>
              <input
                id="sendAmt"
                type="number"
                name="amount"
                required
                min="1"
                [(ngModel)]="sendForm.amount"
                class="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                placeholder="₹1,000"
              />
            </div>

            <div class="pt-2">
              <button
                type="submit"
                [disabled]="modalLoading() || sendForm.amount <= 0 || !sendForm.fromAccount || !sendForm.toAccount"
                class="w-full rounded-lg bg-indigo-600 py-2.5 text-white font-semibold shadow-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                {{ modalLoading() ? 'Processing...' : 'Transfer Funds' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class HomeComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly router = inject(Router);

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

  protected sendForm = {
    fromAccount: '',
    toAccount: '',
    amount: 0
  };

  protected sidebarLinks = [
    { id: 'dashboard', name: 'Dashboard' },
    { id: 'transactions', name: 'Transactions' },
    { id: 'open-account', name: 'Open Account' },
    { id: 'kyc', name: 'KYC Verification' },
    { id: 'beneficiaries', name: 'Beneficiaries' },
    { id: 'goals', name: 'Savings Goals' },
    { id: 'profile', name: 'My Profile' },
    { id: 'settings', name: 'Settings' }
  ];

  ngOnInit() {
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
    const role = this.user()?.role;
    return role === 'admin' || role === 'systemUser';
  }

  protected fetchDashboardData() {
    this.loading.set(true);
    this.apiService.getDashboard().subscribe({
      next: (res) => {
        this.dashboard.set(res);
        this.user.set(res.user);
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
    this.sendForm.fromAccount = '';
    this.sendForm.toAccount = '';
    this.sendForm.amount = 0;
    this.sendError.set('');
    this.sendSuccess.set('');
    this.userAccounts.set([]);
    this.showSendModal.set(true);

    // Fetch user accounts
    this.apiService.getAccountDetails().subscribe({
      next: (res) => {
        this.userAccounts.set(res.accounts || []);
      },
      error: (err) => {
        this.sendError.set('Failed to fetch source accounts');
      }
    });
  }

  protected handleSendMoney(event: Event) {
    event.preventDefault();
    this.modalLoading.set(true);
    this.sendError.set('');
    this.sendSuccess.set('');

    const idempotencyKey = `transfer-${this.sendForm.fromAccount}-${DateTimeOffset.UtcNow.Ticks}`;

    this.apiService.createTransaction({
      FromAccount: this.sendForm.fromAccount,
      toAccount: this.sendForm.toAccount,
      amount: this.sendForm.amount,
      idempotencyKey: idempotencyKey
    }).subscribe({
      next: (res) => {
        this.modalLoading.set(false);
        this.sendSuccess.set(res.message || 'Transfer completed successfully!');
        this.fetchDashboardData();
        setTimeout(() => {
          this.showSendModal.set(false);
        }, 1500);
      },
      error: (err) => {
        this.modalLoading.set(false);
        this.sendError.set(err.error?.message || 'Transfer failed. Check details and balance.');
      }
    });
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

// Simple DateTimeOffset helper class
class DateTimeOffset {
  static get UtcNow() {
    return {
      Ticks: Date.now() + Math.random().toString().slice(2, 6)
    };
  }
}
