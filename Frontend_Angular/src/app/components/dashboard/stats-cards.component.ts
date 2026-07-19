import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stats-cards',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <!-- Balance Card -->
      <div class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-sm font-semibold text-slate-500">Total Balance</p>
            <h3 class="mt-2 text-2xl font-extrabold text-slate-950">₹{{ summary?.totalBalance | number:'1.2-2' }}</h3>
          </div>
          <div class="flex size-12 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 text-xl font-bold">
            💰
          </div>
        </div>
      </div>

      <!-- Income Card -->
      <div class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-sm font-semibold text-slate-500">Monthly Income</p>
            <h3 class="mt-2 text-2xl font-extrabold text-emerald-600">₹{{ summary?.totalIncome | number:'1.2-2' }}</h3>
          </div>
          <div class="flex size-12 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 text-xl font-bold">
            📈
          </div>
        </div>
      </div>

      <!-- Expenses Card -->
      <div class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-sm font-semibold text-slate-500">Monthly Expenses</p>
            <h3 class="mt-2 text-2xl font-extrabold text-rose-600">₹{{ summary?.totalExpense | number:'1.2-2' }}</h3>
          </div>
          <div class="flex size-12 items-center justify-center rounded-lg bg-rose-50 text-rose-600 text-xl font-bold">
            📉
          </div>
        </div>
      </div>

      <!-- Yono Coins Card -->
      <div class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-sm font-semibold text-slate-500">YONO Coins</p>
            <h3 class="mt-2 text-2xl font-extrabold text-amber-500">{{ summary?.oneo_BankCoins || summary?.oNEO_BankCoins || 0 }}</h3>
          </div>
          <div class="flex size-12 items-center justify-center rounded-lg bg-amber-50 text-amber-500 text-xl font-bold">
            🪙
          </div>
        </div>
      </div>
    </div>
  `
})
export class StatsCardsComponent {
  @Input() summary: any = {};
}
