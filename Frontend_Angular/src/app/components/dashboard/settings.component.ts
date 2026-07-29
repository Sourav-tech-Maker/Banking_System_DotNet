import { Component, OnInit, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationService, SupportedLanguage } from '../../services/translation.service';
import { SessionTimeoutService } from '../../services/session-timeout.service';
import { CurrencyService, CurrencyCode } from '../../services/currency.service';

export interface UserAppSettings {
  darkMode: boolean;
  compactView: boolean;
  highContrast: boolean;
  lang: SupportedLanguage;
  currency: string;
  dateFormat: string;
  twoFactor: boolean;
  sessionTimeout: number;
  maskBalance: boolean;
  emailAlerts: boolean;
  pushAlerts: boolean;
  largeTxThreshold: number;
}

@Component({
  selector: 'app-settings-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 max-w-5xl pb-10">
      <!-- Top Title Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 class="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {{ ts.t('settings.title') }}
          </h1>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {{ ts.t('settings.subtitle') }}
          </p>
        </div>
        <div class="flex items-center gap-3">
          <button
            type="button"
            (click)="resetDefaults()"
            class="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {{ ts.t('settings.resetBtn') }}
          </button>
          <button
            type="button"
            (click)="saveSettings(true)"
            class="px-5 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow transition flex items-center gap-2"
          >
            <span>✓</span> {{ ts.t('settings.saveBtn') }}
          </button>
        </div>
      </div>

      <!-- Toast Notification -->
      <div
        *ngIf="showToast"
        class="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center justify-between shadow-sm animate-fade-in"
      >
        <div class="flex items-center gap-3">
          <span class="text-lg">🎉</span>
          <span class="text-sm font-semibold">{{ ts.t('settings.savedSuccess') }}</span>
        </div>
        <button (click)="showToast = false" class="text-emerald-600 dark:text-emerald-400 text-sm font-bold">✕</button>
      </div>

      <!-- 1. APPEARANCE & DISPLAY SECTION -->
      <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
        <div class="border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <h2 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>🎨</span> {{ ts.t('settings.appearance.title') }}
          </h2>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {{ ts.t('settings.appearance.subtitle') }}
          </p>
        </div>

        <!-- Dark Mode Toggle -->
        <div class="flex items-center justify-between gap-4">
          <div>
            <h3 class="text-sm font-bold text-slate-900 dark:text-white">{{ ts.t('settings.darkMode') }}</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{{ ts.t('settings.darkModeDesc') }}</p>
          </div>
          <button
            type="button"
            (click)="toggleDarkMode()"
            [ngClass]="settings.darkMode ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'"
            class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
          >
            <span
              [ngClass]="settings.darkMode ? 'translate-x-5' : 'translate-x-0'"
              class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
            ></span>
          </button>
        </div>

        <!-- Compact View Toggle -->
        <div class="border-t border-slate-100 dark:border-slate-800/60 pt-5 flex items-center justify-between gap-4">
          <div>
            <h3 class="text-sm font-bold text-slate-900 dark:text-white">{{ ts.t('settings.compactView') }}</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{{ ts.t('settings.compactViewDesc') }}</p>
          </div>
          <button
            type="button"
            (click)="settings.compactView = !settings.compactView; saveSettings()"
            [ngClass]="settings.compactView ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'"
            class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
          >
            <span
              [ngClass]="settings.compactView ? 'translate-x-5' : 'translate-x-0'"
              class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
            ></span>
          </button>
        </div>

        <!-- High Contrast Mode Toggle -->
        <div class="border-t border-slate-100 dark:border-slate-800/60 pt-5 flex items-center justify-between gap-4">
          <div>
            <h3 class="text-sm font-bold text-slate-900 dark:text-white">{{ ts.t('settings.highContrast') }}</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{{ ts.t('settings.highContrastDesc') }}</p>
          </div>
          <button
            type="button"
            (click)="settings.highContrast = !settings.highContrast; saveSettings()"
            [ngClass]="settings.highContrast ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'"
            class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
          >
            <span
              [ngClass]="settings.highContrast ? 'translate-x-5' : 'translate-x-0'"
              class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
            ></span>
          </button>
        </div>
      </div>

      <!-- 2. LANGUAGE & REGIONAL SECTION -->
      <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
        <div class="border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <h2 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>🌐</span> {{ ts.t('settings.language.title') }}
          </h2>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {{ ts.t('settings.language.subtitle') }}
          </p>
        </div>

        <!-- Display Language Selector -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 class="text-sm font-bold text-slate-900 dark:text-white">{{ ts.t('settings.displayLanguage') }}</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{{ ts.t('settings.displayLanguageDesc') }}</p>
          </div>
          <select
            [(ngModel)]="settings.lang"
            (change)="onLanguageChange(settings.lang)"
            class="block rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 focus:border-indigo-500 focus:outline-none min-w-[160px]"
          >
            <option *ngFor="let lang of availableLanguages" [value]="lang.code">
              {{ lang.flag }} {{ lang.nativeName }} ({{ lang.name }})
            </option>
          </select>
        </div>

        <!-- Default Currency Selector -->
        <div class="border-t border-slate-100 dark:border-slate-800/60 pt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 class="text-sm font-bold text-slate-900 dark:text-white">{{ ts.t('settings.currency') }}</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{{ ts.t('settings.currencyDesc') }}</p>
          </div>
          <select
            [(ngModel)]="settings.currency"
            (change)="saveSettings()"
            class="block rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 focus:border-indigo-500 focus:outline-none min-w-[160px]"
          >
            <option value="INR">₹ INR (Indian Rupee)</option>
            <option value="USD">$ USD (US Dollar)</option>
            <option value="EUR">€ EUR (Euro)</option>
            <option value="GBP">£ GBP (British Pound)</option>
          </select>
        </div>

        <!-- Date Format Selector -->
        <div class="border-t border-slate-100 dark:border-slate-800/60 pt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 class="text-sm font-bold text-slate-900 dark:text-white">{{ ts.t('settings.dateFormat') }}</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{{ ts.t('settings.dateFormatDesc') }}</p>
          </div>
          <select
            [(ngModel)]="settings.dateFormat"
            (change)="saveSettings()"
            class="block rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 focus:border-indigo-500 focus:outline-none min-w-[160px]"
          >
            <option value="DD/MM/YYYY">DD/MM/YYYY (29/07/2026)</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY (07/29/2026)</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD (2026-07-29)</option>
          </select>
        </div>
      </div>

      <!-- 3. SECURITY & PRIVACY SECTION -->
      <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
        <div class="border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <h2 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>🛡️</span> {{ ts.t('settings.security.title') }}
          </h2>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {{ ts.t('settings.security.subtitle') }}
          </p>
        </div>

        <!-- 2FA Toggle -->
        <div class="flex items-center justify-between gap-4">
          <div>
            <h3 class="text-sm font-bold text-slate-900 dark:text-white">{{ ts.t('settings.twoFactor') }}</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{{ ts.t('settings.twoFactorDesc') }}</p>
          </div>
          <button
            type="button"
            (click)="settings.twoFactor = !settings.twoFactor; saveSettings()"
            [ngClass]="settings.twoFactor ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'"
            class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none">
            <span
              [ngClass]="settings.twoFactor ? 'translate-x-5' : 'translate-x-0'"
              class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
            ></span>
          </button>
        </div>

        <!-- Mask Account Numbers -->
        <div class="border-t border-slate-100 dark:border-slate-800/60 pt-5 flex items-center justify-between gap-4">
          <div>
            <h3 class="text-sm font-bold text-slate-900 dark:text-white">{{ ts.t('settings.maskBalance') }}</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{{ ts.t('settings.maskBalanceDesc') }}</p>
          </div>
          <button
            type="button"
            (click)="settings.maskBalance = !settings.maskBalance; saveSettings()"
            [ngClass]="settings.maskBalance ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'"
            class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
          >
            <span
              [ngClass]="settings.maskBalance ? 'translate-x-5' : 'translate-x-0'"
              class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
            ></span>
          </button>
        </div>

        <!-- Session Timeout Selector -->
        <div class="border-t border-slate-100 dark:border-slate-800/60 pt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 class="text-sm font-bold text-slate-900 dark:text-white">{{ ts.t('settings.sessionTimeout') }}</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{{ ts.t('settings.sessionTimeoutDesc') }}</p>
          </div>
          <select
            [(ngModel)]="settings.sessionTimeout"
            (change)="saveSettings()"
            class="block rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 focus:border-indigo-500 focus:outline-none min-w-[160px]"
          >
            <option [value]="5">5 minutes</option>
            <option [value]="15">15 minutes</option>
            <option [value]="30">30 minutes</option>
            <option [value]="60">60 minutes</option>
          </select>
        </div>
      </div>

      <!-- 4. NOTIFICATIONS & ALERTS SECTION -->
      <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
        <div class="border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <h2 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>🔔</span> {{ ts.t('settings.notifications.title') }}
          </h2>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {{ ts.t('settings.notifications.subtitle') }}
          </p>
        </div>

        <!-- Email Alerts Toggle -->
        <div class="flex items-center justify-between gap-4">
          <div>
            <h3 class="text-sm font-bold text-slate-900 dark:text-white">{{ ts.t('settings.emailAlerts') }}</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{{ ts.t('settings.emailAlertsDesc') }}</p>
          </div>
          <button
            type="button"
            (click)="settings.emailAlerts = !settings.emailAlerts; saveSettings()"
            [ngClass]="settings.emailAlerts ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'"
            class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
          >
            <span
              [ngClass]="settings.emailAlerts ? 'translate-x-5' : 'translate-x-0'"
              class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
            ></span>
          </button>
        </div>

        <!-- Push/SMS Alerts Toggle -->
        <div class="border-t border-slate-100 dark:border-slate-800/60 pt-5 flex items-center justify-between gap-4">
          <div>
            <h3 class="text-sm font-bold text-slate-900 dark:text-white">{{ ts.t('settings.pushAlerts') }}</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{{ ts.t('settings.pushAlertsDesc') }}</p>
          </div>
          <button
            type="button"
            (click)="settings.pushAlerts = !settings.pushAlerts; saveSettings()"
            [ngClass]="settings.pushAlerts ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700'"
            class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
          >
            <span
              [ngClass]="settings.pushAlerts ? 'translate-x-5' : 'translate-x-0'"
              class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
            ></span>
          </button>
        </div>

        <!-- Large Transaction Alert Threshold -->
        <div class="border-t border-slate-100 dark:border-slate-800/60 pt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 class="text-sm font-bold text-slate-900 dark:text-white">{{ ts.t('settings.largeTxThreshold') }}</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{{ ts.t('settings.largeTxThresholdDesc') }}</p>
          </div>
          <div class="relative min-w-[160px]">
            <span class="absolute left-3 top-2 text-sm text-slate-400 font-bold">₹</span>
            <input
              type="number"
              [(ngModel)]="settings.largeTxThreshold"
              (change)="saveSettings()"
              class="w-full rounded-xl border border-slate-300 dark:border-slate-700 pl-7 pr-3 py-2 text-sm font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  `
})
export class SettingsViewComponent implements OnInit {
  @Output() onThemeChange = new EventEmitter<boolean>();

  protected readonly ts = inject(TranslationService);
  protected readonly cs = inject(CurrencyService);
  protected readonly sessionService = inject(SessionTimeoutService);
  protected readonly availableLanguages = TranslationService.LANGUAGES;
  protected showToast = false;

  protected settings: UserAppSettings = {
    darkMode: false,
    compactView: false,
    highContrast: false,
    lang: 'en',
    currency: 'INR',
    dateFormat: 'DD/MM/YYYY',
    twoFactor: true,
    sessionTimeout: 15,
    maskBalance: false,
    emailAlerts: true,
    pushAlerts: true,
    largeTxThreshold: 5000
  };

  ngOnInit() {
    this.loadSettings();
  }

  private loadSettings() {
    const saved = localStorage.getItem('yono_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.settings = { ...this.settings, ...parsed };
      } catch {
        // ignore
      }
    }
    // Sync language and currency services
    this.ts.setLanguage(this.settings.lang);
    this.cs.setCurrency((this.settings.currency || 'INR') as CurrencyCode);
    this.cs.setMaskBalance(!!this.settings.maskBalance);
  }

  protected onLanguageChange(newLang: SupportedLanguage) {
    this.ts.setLanguage(newLang);
    this.saveSettings();
  }

  protected toggleDarkMode() {
    this.settings.darkMode = !this.settings.darkMode;
    this.saveSettings();
    this.onThemeChange.emit(this.settings.darkMode);
  }

  protected saveSettings(triggerToast = false) {
    localStorage.setItem('yono_settings', JSON.stringify(this.settings));
    localStorage.setItem('yono_theme', this.settings.darkMode ? 'dark' : 'light');
    localStorage.setItem('yono_lang', this.settings.lang);

    this.cs.setCurrency((this.settings.currency || 'INR') as CurrencyCode);
    this.cs.setMaskBalance(!!this.settings.maskBalance);
    this.sessionService.updateTimeout(this.settings.sessionTimeout);

    if (this.settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    if (triggerToast) {
      this.showToast = true;
      setTimeout(() => (this.showToast = false), 4000);
    }
  }

  protected resetDefaults() {
    this.settings = {
      darkMode: false,
      compactView: false,
      highContrast: false,
      lang: 'en',
      currency: 'INR',
      dateFormat: 'DD/MM/YYYY',
      twoFactor: true,
      sessionTimeout: 15,
      maskBalance: false,
      emailAlerts: true,
      pushAlerts: true,
      largeTxThreshold: 5000
    };
    this.ts.setLanguage('en');
    this.cs.setCurrency('INR');
    this.cs.setMaskBalance(false);
    this.saveSettings(true);
    this.onThemeChange.emit(false);
  }
}
