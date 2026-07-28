import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import {
  LucideActivity,
  LucideArrowRightLeft,
  LucideCheckCircle2,
  LucideDatabase,
  LucideFileText,
  LucideLandmark,
  LucideRefreshCw,
  LucideServer,
  LucideShield,
  LucideShieldAlert,
  LucideShieldCheck,
  LucideSliders,
  LucideUsers,
  LucideXCircle
} from '@lucide/angular';

@Component({
  selector: 'app-system-console',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideActivity,
    LucideArrowRightLeft,
    LucideCheckCircle2,
    LucideDatabase,
    LucideFileText,
    LucideLandmark,
    LucideRefreshCw,
    LucideServer,
    LucideShield,
    LucideShieldAlert,
    LucideShieldCheck,
    LucideSliders,
    LucideUsers,
    LucideXCircle
  ],
  template: `
    <div class="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col md:flex-row">
      <!-- SYSTEM USER SIDEBAR NAV -->
      <aside class="w-full md:w-72 bg-slate-900 border-r border-slate-800 flex shrink-0 flex-col justify-between">
        <div>
          <!-- Header -->
          <div class="p-6 border-b border-slate-800 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <svg lucideServer class="w-5 h-5"></svg>
              </div>
              <div>
                <h1 class="text-sm font-bold text-white tracking-wider uppercase">System Console</h1>
                <span class="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  SystemUserIdentity
                </span>
              </div>
            </div>
          </div>

          <!-- Navigation Links -->
          <nav class="p-4 space-y-1.5 text-sm font-medium">
            <button
              type="button"
              (click)="activeTab.set('overview')"
              [class]="activeTab() === 'overview' ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border-transparent'"
              class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg border text-left transition-all cursor-pointer"
            >
              <svg lucideActivity class="w-4 h-4"></svg>
              <span>Overview & Diagnostics</span>
            </button>

            <button
              type="button"
              (click)="activeTab.set('accounts')"
              [class]="activeTab() === 'accounts' ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border-transparent'"
              class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg border text-left transition-all cursor-pointer"
            >
              <div class="flex items-center gap-3">
                <svg lucideLandmark class="w-4 h-4"></svg>
                <span>Internal Accounts</span>
              </div>
              <span class="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold border border-slate-700">
                {{ accounts().length }}/2
              </span>
            </button>

            <button
              type="button"
              (click)="activeTab.set('transactions')"
              [class]="activeTab() === 'transactions' ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border-transparent'"
              class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg border text-left transition-all cursor-pointer"
            >
              <svg lucideArrowRightLeft class="w-4 h-4"></svg>
              <span>Transaction Operations</span>
            </button>

            <button
              type="button"
              (click)="activeTab.set('ledger')"
              [class]="activeTab() === 'ledger' ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border-transparent'"
              class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg border text-left transition-all cursor-pointer"
            >
              <svg lucideDatabase class="w-4 h-4"></svg>
              <span>Ledger & Double-Entry</span>
            </button>

            <button
              type="button"
              (click)="activeTab.set('config')"
              [class]="activeTab() === 'config' ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border-transparent'"
              class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg border text-left transition-all cursor-pointer"
            >
              <svg lucideSliders class="w-4 h-4"></svg>
              <span>System Configuration</span>
            </button>

            <button
              type="button"
              (click)="activeTab.set('security')"
              [class]="activeTab() === 'security' ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border-transparent'"
              class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg border text-left transition-all cursor-pointer"
            >
              <svg lucideShield class="w-4 h-4"></svg>
              <span>Security Center</span>
            </button>

            <button
              type="button"
              (click)="activeTab.set('audit')"
              [class]="activeTab() === 'audit' ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border-transparent'"
              class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg border text-left transition-all cursor-pointer"
            >
              <svg lucideFileText class="w-4 h-4"></svg>
              <span>Immutable Audit Logs</span>
            </button>
          </nav>
        </div>

        <div class="p-4 border-t border-slate-800 bg-slate-900/50">
          <div class="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-400 space-y-1">
            <div class="flex items-center justify-between font-semibold text-slate-300">
              <span>KYC Exemption:</span>
              <span class="text-emerald-400">ACTIVE</span>
            </div>
            <p class="text-[11px] leading-tight text-slate-500">
              Exempt from customer KYC for SystemUser accounts. Max 2 active internal accounts limit enforced.
            </p>
          </div>
        </div>
      </aside>

      <!-- MAIN CONTENT CONTAINER -->
      <main class="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto max-w-7xl">
        <!-- Toast / Alert message -->
        <div *ngIf="message()" [class]="messageType() === 'error' ? 'bg-rose-950/80 border-rose-700 text-rose-200' : 'bg-emerald-950/80 border-emerald-700 text-emerald-200'" class="p-4 rounded-xl border flex items-center justify-between text-sm shadow-lg">
          <div class="flex items-center gap-3">
            <svg *ngIf="messageType() === 'error'" lucideXCircle class="w-5 h-5 shrink-0"></svg>
            <svg *ngIf="messageType() !== 'error'" lucideCheckCircle2 class="w-5 h-5 shrink-0"></svg>
            <span>{{ message() }}</span>
          </div>
          <button (click)="message.set('')" class="text-slate-400 hover:text-white">&times;</button>
        </div>

        <!-- 1. OVERVIEW TAB -->
        <section *ngIf="activeTab() === 'overview'" class="space-y-6">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-xl font-bold text-white">System Diagnostics & Operational Health</h2>
              <p class="text-xs text-slate-400 mt-1">Real-time status of internal banking infrastructure, ledger integrity, and active sessions.</p>
            </div>
            <button (click)="loadOverviewData()" class="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-2 cursor-pointer">
              <svg lucideRefreshCw class="w-3.5 h-3.5" [class.animate-spin]="loading()"></svg>
              Refresh Health
            </button>
          </div>

          <!-- Status Banner Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <span class="text-xs font-medium text-slate-400">Operational Health</span>
              <div class="flex items-center justify-between">
                <span class="text-xl font-extrabold text-white">{{ health()?.status || 'HEALTHY' }}</span>
                <svg lucideShieldCheck class="w-6 h-6 text-emerald-400"></svg>
              </div>
              <div class="text-[11px] text-slate-500">Checked: {{ health()?.timestampUtc | date:'mediumTime' }}</div>
            </div>

            <div class="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <span class="text-xs font-medium text-slate-400">Ledger Integrity</span>
              <div class="flex items-center justify-between">
                <span [class]="health()?.ledgerIntegrity ? 'text-emerald-400' : 'text-rose-400'" class="text-xl font-extrabold">
                  {{ health()?.ledgerIntegrity ? 'BALANCED' : 'UNBALANCED' }}
                </span>
                <svg lucideDatabase class="w-6 h-6 text-indigo-400"></svg>
              </div>
              <div class="text-[11px] text-slate-500">Double-entry verification active</div>
            </div>

            <div class="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <span class="text-xs font-medium text-slate-400">Active Sessions</span>
              <div class="flex items-center justify-between">
                <span class="text-xl font-extrabold text-white">{{ health()?.activeSessionsCount || 0 }}</span>
                <svg lucideUsers class="w-6 h-6 text-sky-400"></svg>
              </div>
              <div class="text-[11px] text-slate-500">Unrevoked active JWT sessions</div>
            </div>

            <div class="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <span class="text-xs font-medium text-slate-400">System Total Balance</span>
              <div class="flex items-center justify-between">
                <span class="text-xl font-extrabold text-indigo-300">₹{{ (health()?.systemBalanceSum || 0) | number:'1.2-2' }}</span>
                <svg lucideLandmark class="w-6 h-6 text-indigo-400"></svg>
              </div>
              <div class="text-[11px] text-slate-500">Derived from double-entry ledger</div>
            </div>
          </div>

          <!-- Operational Metrics Summary -->
          <div class="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <h3 class="text-sm font-bold text-slate-200">System Activity Metrics</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div class="p-4 bg-slate-950 rounded-lg border border-slate-800">
                <div class="text-slate-400 font-medium">Registered Banking Users</div>
                <div class="text-2xl font-bold text-white mt-1">{{ health()?.totalUsers || 0 }}</div>
              </div>
              <div class="p-4 bg-slate-950 rounded-lg border border-slate-800">
                <div class="text-slate-400 font-medium">Customer & Internal Accounts</div>
                <div class="text-2xl font-bold text-white mt-1">{{ health()?.totalAccounts || 0 }}</div>
              </div>
              <div class="p-4 bg-slate-950 rounded-lg border border-slate-800">
                <div class="text-slate-400 font-medium">Completed Transfers</div>
                <div class="text-2xl font-bold text-white mt-1">{{ health()?.totalTransactions || 0 }}</div>
              </div>
              <div class="p-4 bg-slate-950 rounded-lg border border-slate-800">
                <div class="text-slate-400 font-medium">Failed Operations</div>
                <div class="text-2xl font-bold text-amber-400 mt-1">{{ health()?.unhandledFailedTransactions || 0 }}</div>
              </div>
            </div>
          </div>
        </section>

        <!-- 2. INTERNAL ACCOUNTS TAB -->
        <section *ngIf="activeTab() === 'accounts'" class="space-y-6">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-xl font-bold text-white">SystemUser Internal Accounts</h2>
              <p class="text-xs text-slate-400 mt-1">Manage operational accounts. Permitted max 2 active internal accounts with KYC exemption.</p>
            </div>
            <button
              (click)="openCreateAccountModal.set(true)"
              [disabled]="accounts().length >= 2"
              [class]="accounts().length >= 2 ? 'opacity-50 cursor-not-allowed bg-slate-800 text-slate-500' : 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer'"
              class="px-4 py-2.5 text-xs font-semibold rounded-lg shadow-md transition-all flex items-center gap-2"
            >
              <svg lucideLandmark class="w-4 h-4"></svg>
              Create System Account ({{ accounts().length }}/2)
            </button>
          </div>

          <!-- Limit Banner -->
          <div [class]="accounts().length >= 2 ? 'border-amber-700/50 bg-amber-950/30 text-amber-300' : 'border-indigo-800/50 bg-indigo-950/30 text-indigo-300'" class="p-4 rounded-xl border flex items-center justify-between text-xs">
            <div class="flex items-center gap-3">
              <svg lucideShieldAlert class="w-5 h-5 shrink-0"></svg>
              <span>
                <strong>System Rule Enforcement:</strong> Maximum of 2 active internal operational accounts permitted per SystemUser identity.
                KYC requirements are automatically exempted ONLY for internal SystemUser accounts.
              </span>
            </div>
            <span class="font-black px-3 py-1 bg-slate-900 rounded-lg border border-slate-800">
              {{ accounts().length }} / 2 Accounts
            </span>
          </div>

          <!-- Accounts Cards List -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div *ngFor="let acc of accounts()" class="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4 shadow-lg">
              <div class="flex items-center justify-between border-b border-slate-800 pb-3">
                <span class="text-xs font-mono text-indigo-400 font-bold">ACC #{{ acc.accountNumber }}</span>
                <span class="text-[10px] font-bold px-2 py-0.5 bg-emerald-950 text-emerald-400 rounded border border-emerald-800 uppercase">
                  KYC Exempt Internal
                </span>
              </div>
              <div class="space-y-1">
                <div class="text-xs text-slate-400">Current Ledger Balance</div>
                <div class="text-3xl font-extrabold text-white">₹{{ acc.balance | number:'1.2-2' }}</div>
              </div>
              <div class="grid grid-cols-2 gap-2 text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                <div>Purpose: <strong class="text-slate-200">{{ acc.accountPurpose }}</strong></div>
                <div>Status: <strong class="text-emerald-400">{{ acc.status }}</strong></div>
                <div>Type: <strong class="text-slate-200">{{ acc.accountType }}</strong></div>
                <div>Currency: <strong class="text-slate-200">{{ acc.currency }}</strong></div>
              </div>
            </div>

            <div *ngIf="accounts().length === 0" class="col-span-2 p-12 text-center bg-slate-900 border border-slate-800 rounded-xl text-slate-400 space-y-3">
              <svg lucideLandmark class="w-10 h-10 mx-auto text-slate-600"></svg>
              <p class="text-sm font-medium">No internal system accounts opened yet.</p>
            </div>
          </div>
        </section>

        <!-- 3. TRANSACTION OPERATIONS TAB -->
        <section *ngIf="activeTab() === 'transactions'" class="space-y-6">
          <div>
            <h2 class="text-xl font-bold text-white">Privileged Transaction Operations</h2>
            <p class="text-xs text-slate-400 mt-1">Perform operational funding, fee collections, or system adjustments with audit logging and idempotency key protection.</p>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Form 1: System Internal Transfer -->
            <div class="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
              <h3 class="text-sm font-bold text-white flex items-center gap-2">
                <svg lucideArrowRightLeft class="w-4 h-4 text-indigo-400"></svg>
                Internal Transfer (Between System Accounts)
              </h3>
              <form (ngSubmit)="handleInternalTransfer()" class="space-y-3 text-xs">
                <div>
                  <label class="block text-slate-400 mb-1">Source Account</label>
                  <select [(ngModel)]="internalForm.fromAccount" name="fromAccount" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white">
                    <option value="">-- Select Source System Account --</option>
                    <option *ngFor="let a of accounts()" [value]="a.id">#{{ a.accountNumber }} (Bal: ₹{{ a.balance }})</option>
                  </select>
                </div>
                <div>
                  <label class="block text-slate-400 mb-1">Destination Account</label>
                  <select [(ngModel)]="internalForm.toAccount" name="toAccount" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white">
                    <option value="">-- Select Destination System Account --</option>
                    <option *ngFor="let a of accounts()" [value]="a.id">#{{ a.accountNumber }} (Bal: ₹{{ a.balance }})</option>
                  </select>
                </div>
                <div>
                  <label class="block text-slate-400 mb-1">Amount (₹)</label>
                  <input type="number" [(ngModel)]="internalForm.amount" name="amount" placeholder="0.00" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" />
                </div>
                <div>
                  <label class="block text-slate-400 mb-1">Idempotency Key</label>
                  <input type="text" [(ngModel)]="internalForm.idempotencyKey" name="idempotencyKey" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono text-[11px]" />
                </div>
                <button type="submit" [disabled]="loading()" class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 font-semibold text-white rounded-lg shadow transition-all cursor-pointer">
                  Execute Internal Transfer
                </button>
              </form>
            </div>

            <!-- Form 2: Privileged Operational Transfer -->
            <div class="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
              <h3 class="text-sm font-bold text-white flex items-center gap-2">
                <svg lucideShieldAlert class="w-4 h-4 text-amber-400"></svg>
                Privileged Operational Transfer (Customer Target)
              </h3>
              <form (ngSubmit)="handleOperationalTransfer()" class="space-y-3 text-xs">
                <div>
                  <label class="block text-slate-400 mb-1">Source Account ID (Guid)</label>
                  <input type="text" [(ngModel)]="opForm.sourceAccount" name="sourceAccount" placeholder="Source Account GUID or Quick Select below" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono" />
                  <select *ngIf="accounts().length > 0" (change)="opForm.sourceAccount = $any($event.target).value" class="mt-1 w-full bg-slate-950/80 border border-slate-800/80 rounded-lg p-2 text-[11px] text-indigo-400 cursor-pointer">
                    <option value="">-- Quick Select Source System Account --</option>
                    <option *ngFor="let a of accounts()" [value]="a.id">#{{ a.accountNumber }} - {{ a.accountType }} (Bal: ₹{{ a.balance }})</option>
                  </select>
                </div>
                <div>
                  <label class="block text-slate-400 mb-1">Destination Account ID (Guid)</label>
                  <input type="text" [(ngModel)]="opForm.destinationAccount" name="destinationAccount" placeholder="Destination Account GUID" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono" />
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="block text-slate-400 mb-1">Amount (₹)</label>
                    <input type="number" [(ngModel)]="opForm.amount" name="opAmount" placeholder="0.00" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" />
                  </div>
                  <div>
                    <label class="block text-slate-400 mb-1">Operation Type</label>
                    <select [(ngModel)]="opForm.operationType" name="operationType" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white">
                      <option value="OPERATIONAL_ADJUSTMENT">OPERATIONAL_ADJUSTMENT</option>
                      <option value="FEE_COLLECTION">FEE_COLLECTION</option>
                      <option value="REVERSAL_ADJUSTMENT">REVERSAL_ADJUSTMENT</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label class="block text-slate-400 mb-1">Mandatory Operational Reason Code</label>
                  <input type="text" [(ngModel)]="opForm.reason" name="reason" placeholder="e.g. AUDIT_RECOVERY_2026_Q3" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" />
                </div>
                <button type="submit" [disabled]="loading()" class="w-full py-2.5 bg-amber-600 hover:bg-amber-500 font-semibold text-white rounded-lg shadow transition-all cursor-pointer">
                  Execute Privileged Transfer & Audit Log
                </button>
              </form>
            </div>
          </div>
        </section>

        <!-- 4. LEDGER TAB -->
        <section *ngIf="activeTab() === 'ledger'" class="space-y-6">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-xl font-bold text-white">Ledger Reconciliation & Integrity</h2>
              <p class="text-xs text-slate-400 mt-1">Audit double-entry ledger balance consistency. Total DEBIT must equal Total CREDIT.</p>
            </div>
            <button (click)="loadLedgerData()" class="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-2 cursor-pointer">
              <svg lucideRefreshCw class="w-3.5 h-3.5"></svg>
              Run Reconciliation
            </button>
          </div>

          <div *ngIf="ledgerData()" class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <span class="text-xs font-medium text-slate-400">Total DEBIT Sum</span>
              <div class="text-2xl font-bold text-rose-400">₹{{ ledgerData()?.totalDebitAmount | number:'1.2-2' }}</div>
            </div>
            <div class="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <span class="text-xs font-medium text-slate-400">Total CREDIT Sum</span>
              <div class="text-2xl font-bold text-emerald-400">₹{{ ledgerData()?.totalCreditAmount | number:'1.2-2' }}</div>
            </div>
            <div class="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <span class="text-xs font-medium text-slate-400">Net Ledger Variance</span>
              <div [class]="ledgerData()?.isBalanced ? 'text-emerald-400' : 'text-rose-400'" class="text-2xl font-bold">
                ₹{{ ledgerData()?.netDifference | number:'1.2-2' }}
              </div>
            </div>
          </div>
        </section>

        <!-- 5. CONFIGURATION TAB -->
        <section *ngIf="activeTab() === 'config'" class="space-y-6">
          <div>
            <h2 class="text-xl font-bold text-white">System Configuration</h2>
            <p class="text-xs text-slate-400 mt-1">Configure non-secret operational parameters and feature flags.</p>
          </div>

          <div class="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4 max-w-2xl">
            <div class="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label class="block text-slate-400 mb-1">Daily Transfer Limit (₹)</label>
                <input type="number" [(ngModel)]="configForm.DailyTransferLimit" name="dailyLimit" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" />
              </div>
              <div>
                <label class="block text-slate-400 mb-1">Operational Threshold (₹)</label>
                <input type="number" [(ngModel)]="configForm.OperationalThreshold" name="opThreshold" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" />
              </div>
            </div>
            <div class="flex items-center gap-6 pt-2">
              <label class="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input type="checkbox" [(ngModel)]="configForm.MaintenanceMode" name="maintenance" class="rounded bg-slate-950 border-slate-800" />
                Enable Maintenance Mode
              </label>
              <label class="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input type="checkbox" [(ngModel)]="configForm.EnableFraudDetection" name="fraud" class="rounded bg-slate-950 border-slate-800" />
                Enable Fraud Detection Engine
              </label>
            </div>
            <button (click)="saveConfig()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold rounded-lg text-white cursor-pointer">
              Save Configuration
            </button>
          </div>
        </section>

        <!-- 6. SECURITY CENTER TAB -->
        <section *ngIf="activeTab() === 'security'" class="space-y-6">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-xl font-bold text-white">Security Center & Threat Monitoring</h2>
              <p class="text-xs text-slate-400 mt-1">Real-time threat monitoring, locked account remediation, token session invalidation, and rate-limiting policies.</p>
            </div>
            <button (click)="loadSecurityData()" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg border border-slate-700 text-slate-200 flex items-center gap-1.5 cursor-pointer">
              <span>↻ Refresh Security Monitor</span>
            </button>
          </div>

          <!-- Top Metrics Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-2 relative overflow-hidden">
              <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-slate-400">Revoked Access Tokens</span>
                <span class="size-2 rounded-full bg-rose-500 animate-pulse"></span>
              </div>
              <div class="text-3xl font-black text-rose-400">{{ securityData()?.revokedAccessTokensCount || 0 }}</div>
              <span class="text-[11px] text-slate-500 block">Invalidated session tokens</span>
            </div>

            <div class="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-2 relative overflow-hidden">
              <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-slate-400">Locked Accounts</span>
                <span class="size-2 rounded-full bg-amber-500"></span>
              </div>
              <div class="text-3xl font-black text-amber-400">{{ securityData()?.lockedUsersCount || 0 }}</div>
              <span class="text-[11px] text-slate-500 block">Accounts exceeding failed limit</span>
            </div>

            <div class="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-slate-400">Failed Login Attempts</span>
                <span class="size-2 rounded-full bg-sky-500"></span>
              </div>
              <div class="text-3xl font-black text-sky-400">{{ securityData()?.totalFailedLoginAttempts || 0 }}</div>
              <span class="text-[11px] text-slate-500 block">System-wide failed authentications</span>
            </div>

            <div class="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-medium text-slate-400">Active User Sessions</span>
                <span class="size-2 rounded-full bg-emerald-500"></span>
              </div>
              <div class="text-3xl font-black text-emerald-400">{{ securityData()?.activeSessionsCount || 1 }}</div>
              <span class="text-[11px] text-slate-500 block">Active authenticated identities</span>
            </div>
          </div>

          <!-- Locked Accounts Management Table -->
          <div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl p-5 space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-bold text-white flex items-center gap-2">
                  <span>🔒 Locked Customer Accounts Remediation</span>
                  <span *ngIf="securityData()?.lockedUsers?.length" class="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 text-xs font-mono border border-amber-800">
                    {{ securityData()?.lockedUsers?.length }} Actionable
                  </span>
                </h3>
                <p class="text-xs text-slate-400 mt-0.5">Direct admin unlock capability for customer accounts locked due to auth failures.</p>
              </div>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-slate-300">
                <thead class="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th class="p-3">User ID</th>
                    <th class="p-3">Username / Email</th>
                    <th class="p-3">Failed Attempts</th>
                    <th class="p-3">Lock Status</th>
                    <th class="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800/60">
                  <tr *ngFor="let user of securityData()?.lockedUsers" class="hover:bg-slate-800/40">
                    <td class="p-3 font-mono text-[11px] text-slate-400">{{ user.userId }}</td>
                    <td class="p-3">
                      <span class="font-bold text-white block">{{ user.userName }}</span>
                      <span class="text-slate-400 text-[11px]">{{ user.email }}</span>
                    </td>
                    <td class="p-3">
                      <span class="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-900 font-bold font-mono text-[11px]">
                        {{ user.loginAttempts }} Attempts
                      </span>
                    </td>
                    <td class="p-3">
                      <span class="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-semibold text-[10px]">
                        LOCKED
                      </span>
                    </td>
                    <td class="p-3 text-right">
                      <button (click)="unlockAccount(user.userId)" class="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs transition cursor-pointer">
                        Unlock Account
                      </button>
                    </td>
                  </tr>
                  <tr *ngIf="!securityData()?.lockedUsers?.length">
                    <td colspan="5" class="p-6 text-center text-slate-500">
                      ✓ No customer accounts are currently locked. All authentication policies operating normally.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Security Policy Controls Grid -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
              <div class="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                <span>🛡️ Authentication Policy</span>
              </div>
              <div class="space-y-2 text-xs">
                <div class="flex justify-between text-slate-300">
                  <span>MFA Enforced:</span>
                  <span class="font-bold text-emerald-400">ENABLED</span>
                </div>
                <div class="flex justify-between text-slate-300">
                  <span>Max Auth Attempts:</span>
                  <span class="font-mono text-white">5 Attempts</span>
                </div>
                <div class="flex justify-between text-slate-300">
                  <span>Lockout Duration:</span>
                  <span class="font-mono text-white">30 Minutes</span>
                </div>
              </div>
            </div>

            <div class="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
              <div class="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                <span>⚡ Rate Limiting & Firewall</span>
              </div>
              <div class="space-y-2 text-xs">
                <div class="flex justify-between text-slate-300">
                  <span>IP Rate Limiter:</span>
                  <span class="font-bold text-emerald-400">ACTIVE (100 req/min)</span>
                </div>
                <div class="flex justify-between text-slate-300">
                  <span>CORS Restrictive Mode:</span>
                  <span class="font-bold text-emerald-400">ENFORCED</span>
                </div>
                <div class="flex justify-between text-slate-300">
                  <span>XSS / SQLi Filter:</span>
                  <span class="font-bold text-emerald-400">PROTECTED</span>
                </div>
              </div>
            </div>

            <div class="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
              <div class="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
                <span>🔑 Token Session Lifecycle</span>
              </div>
              <div class="space-y-2 text-xs">
                <div class="flex justify-between text-slate-300">
                  <span>JWT Expiry Window:</span>
                  <span class="font-mono text-white">60 Minutes</span>
                </div>
                <div class="flex justify-between text-slate-300">
                  <span>Refresh Token Reuse:</span>
                  <span class="font-bold text-rose-400">BLOCKED</span>
                </div>
                <div class="flex justify-between text-slate-300">
                  <span>Revocation Store:</span>
                  <span class="font-bold text-emerald-400">IN-MEMORY REDIS</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 7. AUDIT LOGS TAB -->
        <section *ngIf="activeTab() === 'audit'" class="space-y-6">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-xl font-bold text-white">Immutable Audit Trail</h2>
              <p class="text-xs text-slate-400 mt-1">Append-only audit logs capturing SystemUser operations and critical administrative actions.</p>
            </div>
            <button (click)="loadAuditLogs()" class="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-2 cursor-pointer">
              <svg lucideRefreshCw class="w-3.5 h-3.5"></svg>
              Refresh Logs
            </button>
          </div>

          <!-- Audit Log Table -->
          <div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <table class="w-full text-left text-xs text-slate-300">
              <thead class="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th class="p-3.5">Timestamp (UTC)</th>
                  <th class="p-3.5">Actor</th>
                  <th class="p-3.5">Event Type</th>
                  <th class="p-3.5">Entity</th>
                  <th class="p-3.5">IP Address</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60">
                <tr *ngFor="let log of auditLogs()" class="hover:bg-slate-800/40 transition-colors">
                  <td class="p-3.5 text-slate-400 font-mono text-[11px]">{{ log.createdAtUtc | date:'yyyy-MM-dd HH:mm:ss' }}</td>
                  <td class="p-3.5 font-semibold text-white">{{ log.actorName }}</td>
                  <td class="p-3.5">
                    <span class="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] font-mono">
                      {{ log.eventType }}
                    </span>
                  </td>
                  <td class="p-3.5 text-slate-300">{{ log.entityType }}</td>
                  <td class="p-3.5 font-mono text-slate-400">{{ log.ipAddress || '127.0.0.1' }}</td>
                </tr>
                <tr *ngIf="auditLogs().length === 0">
                  <td colspan="5" class="p-8 text-center text-slate-500">No audit log records found.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>

    <!-- MODAL: CREATE SYSTEM ACCOUNT -->
    <div *ngIf="openCreateAccountModal()" class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl">
        <h3 class="text-base font-bold text-white">Create SystemUser Internal Account</h3>
        <p class="text-xs text-slate-400">
          This account is granted explicit KYC exemption for internal operational identity.
          Enforced maximum limit: 2 active accounts.
        </p>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block text-slate-400 mb-1">Account Type</label>
            <select [(ngModel)]="newAccountForm.accountType" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white">
              <option value="SAVINGS">SAVINGS</option>
              <option value="CURRENT">CURRENT</option>
            </select>
          </div>
          <div>
            <label class="block text-slate-400 mb-1">Currency Code</label>
            <input type="text" [(ngModel)]="newAccountForm.currencyCode" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white" />
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button (click)="openCreateAccountModal.set(false)" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 rounded-lg cursor-pointer">
            Cancel
          </button>
          <button (click)="handleCreateSystemAccount()" [disabled]="loading()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white rounded-lg cursor-pointer">
            Create Internal Account
          </button>
        </div>
      </div>
    </div>
  `
})
export class SystemConsoleComponent implements OnInit {
  private readonly apiService = inject(ApiService);

  activeTab = signal<string>('overview');
  loading = signal<boolean>(false);
  message = signal<string>('');
  messageType = signal<'success' | 'error'>('success');

  health = signal<any>(null);
  accounts = signal<any[]>([]);
  ledgerData = signal<any>(null);
  securityData = signal<any>(null);
  auditLogs = signal<any[]>([]);

  openCreateAccountModal = signal<boolean>(false);
  newAccountForm = { accountType: 'SAVINGS', currencyCode: 'INR' };

  internalForm = {
    fromAccount: '',
    toAccount: '',
    amount: 1000,
    idempotencyKey: 'SYS_INT_' + Date.now()
  };

  opForm = {
    sourceAccount: '',
    destinationAccount: '',
    amount: 500,
    reason: 'OPERATIONAL_ADJUSTMENT_ROUTINE',
    operationType: 'OPERATIONAL_ADJUSTMENT'
  };

  configForm: any = {
    DailyTransferLimit: 1000000,
    OperationalThreshold: 500000,
    MaintenanceMode: false,
    EnableFraudDetection: true
  };

  ngOnInit() {
    this.loadOverviewData();
    this.loadAccounts();
    this.loadLedgerData();
    this.loadSecurityData();
    this.loadAuditLogs();
    this.loadConfig();
  }

  loadOverviewData() {
    this.loading.set(true);
    this.apiService.getSystemHealth().subscribe({
      next: (res) => {
        this.health.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadAccounts() {
    this.apiService.getSystemAccounts().subscribe({
      next: (res) => {
        this.accounts.set(res.accounts || []);
      }
    });
  }

  loadLedgerData() {
    this.apiService.getSystemLedgerReconciliation().subscribe({
      next: (res) => this.ledgerData.set(res)
    });
  }

  loadSecurityData() {
    this.apiService.getSystemSecurityEvents().subscribe({
      next: (res) => this.securityData.set(res)
    });
  }

  loadAuditLogs() {
    this.apiService.getSystemAuditLogs().subscribe({
      next: (res) => this.auditLogs.set(res.logs || [])
    });
  }

  loadConfig() {
    this.apiService.getSystemSettings().subscribe({
      next: (res) => {
        if (res.settings) this.configForm = { ...res.settings };
      }
    });
  }

  handleCreateSystemAccount() {
    this.loading.set(true);
    this.apiService.createSystemAccount(this.newAccountForm).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.openCreateAccountModal.set(false);
        this.messageType.set('success');
        this.message.set(res.message || 'SystemUser internal account created.');
        this.loadAccounts();
        this.loadOverviewData();
      },
      error: (err) => {
        this.loading.set(false);
        this.messageType.set('error');
        this.message.set(err.error?.message || 'Failed to create internal account.');
      }
    });
  }

  handleInternalTransfer() {
    if (!this.internalForm.fromAccount || !this.internalForm.toAccount || this.internalForm.amount <= 0) {
      this.messageType.set('error');
      this.message.set('Please fill all required internal transfer fields.');
      return;
    }
    this.loading.set(true);
    this.apiService.systemInternalTransfer(this.internalForm).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.messageType.set('success');
        this.message.set(res.message || 'Internal transfer completed successfully.');
        this.internalForm.idempotencyKey = 'SYS_INT_' + Date.now();
        this.loadAccounts();
        this.loadLedgerData();
      },
      error: (err) => {
        this.loading.set(false);
        this.messageType.set('error');
        this.message.set(err.error?.message || 'Transfer failed.');
      }
    });
  }

  handleOperationalTransfer() {
    if (!this.opForm.sourceAccount || !this.opForm.destinationAccount || !this.opForm.reason) {
      this.messageType.set('error');
      this.message.set('Please specify source, destination, and mandatory reason code.');
      return;
    }
    this.loading.set(true);
    const body = {
      ...this.opForm,
      idempotencyKey: 'SYS_OP_' + Date.now(),
      correlationId: 'CORR_' + Math.random().toString(36).substring(2, 10).toUpperCase()
    };
    this.apiService.systemOperationalTransfer(body).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.messageType.set('success');
        this.message.set(res.message || 'Privileged operational transfer executed.');
        this.loadAccounts();
        this.loadLedgerData();
        this.loadAuditLogs();
      },
      error: (err) => {
        this.loading.set(false);
        this.messageType.set('error');
        this.message.set(err.error?.message || 'Operational transfer failed.');
      }
    });
  }

  saveConfig() {
    this.apiService.updateSystemSettings(this.configForm).subscribe({
      next: (res) => {
        this.messageType.set('success');
        this.message.set('System settings updated successfully.');
      }
    });
  }

  unlockAccount(userId: string) {
    this.apiService.unlockCustomerAccount(userId).subscribe({
      next: (res) => {
        this.messageType.set('success');
        this.message.set(res.message || 'Account unlocked successfully.');
        this.loadSecurityData();
      },
      error: (err) => {
        this.messageType.set('error');
        this.message.set(err.error?.message || 'Failed to unlock account.');
      }
    });
  }
}
