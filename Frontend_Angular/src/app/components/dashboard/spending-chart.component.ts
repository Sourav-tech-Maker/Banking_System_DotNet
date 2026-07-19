import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spending-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div class="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 class="text-lg font-bold text-slate-950">Spending Analytics</h2>
          <p class="mt-1 text-sm text-slate-500">Category-wise outgoing money</p>
        </div>
        <span class="rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600">
          This Month
        </span>
      </div>

      <div class="grid items-center gap-6 md:grid-cols-[240px_1fr]">
        <div class="relative mx-auto size-56">
          <div
            class="size-full rounded-full"
            [style.background]="conicGradient"
          ></div>
          <div class="absolute inset-8 flex flex-col items-center justify-center rounded-full bg-white shadow-inner">
            <p class="text-xl font-bold text-slate-950">
              ₹{{ totalExpense | number:'1.0-0' }}
            </p>
            <p class="mt-1 text-xs text-slate-500">Total Expense</p>
          </div>
        </div>

        <div *ngIf="categories && categories.length > 0; else emptyState" class="space-y-4">
          <div *ngFor="let category of categories" class="grid grid-cols-[1fr_auto_auto] items-center gap-4">
            <div class="flex min-w-0 items-center gap-3">
              <span
                class="size-3 shrink-0 rounded-full"
                [style.backgroundColor]="category.color"
              ></span>
              <span class="truncate text-sm font-medium text-slate-700">
                {{ category.name }}
              </span>
            </div>
            <span class="text-sm font-bold text-slate-950">
              ₹{{ category.amount | number:'1.0-0' }}
            </span>
            <span class="text-sm font-semibold text-slate-500">
              {{ category.percentage }}%
            </span>
          </div>
        </div>

        <ng-template #emptyState>
          <div class="flex min-h-56 flex-col items-center justify-center rounded-md border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
            <div class="flex size-12 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm ring-1 ring-slate-200 text-2xl">
              📊
            </div>
            <h3 class="mt-4 text-base font-bold text-slate-950">No spending data yet</h3>
            <p class="mt-2 max-w-sm text-sm leading-6 text-slate-500">
              Expense categories will populate from your completed outgoing transfers.
            </p>
          </div>
        </ng-template>
      </div>
    </section>
  `
})
export class SpendingChartComponent {
  @Input() set analytics(val: any) {
    this.categories = val?.categories || [];
    this.totalExpense = val?.totalExpense || 0;
    this.updateGradient();
  }

  protected categories: any[] = [];
  protected totalExpense = 0;
  protected conicGradient = '#E2E8F0 0deg 360deg';

  private updateGradient() {
    const total = this.categories.reduce((sum, cat) => sum + Number(cat.amount || 0), 0);
    if (!total) {
      this.conicGradient = '#E2E8F0 0deg 360deg';
      return;
    }

    let current = 0;
    const parts = this.categories.map((cat) => {
      const start = current;
      const angle = (Number(cat.amount || 0) / total) * 360;
      current += angle;
      return `${cat.color} ${start}deg ${current}deg`;
    });

    this.conicGradient = `conic-gradient(${parts.join(', ')})`;
  }
}
