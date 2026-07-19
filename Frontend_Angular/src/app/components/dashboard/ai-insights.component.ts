import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ai-insights',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="rounded-lg border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
      <div>
        <div class="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 class="text-lg font-bold text-slate-950">AI Financial Insights</h2>
            <p class="mt-1 text-sm text-slate-500">Personalized analytics and advice</p>
          </div>
          <span class="rounded-md bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-700 tracking-wide uppercase">
            Smart AI
          </span>
        </div>

        <div class="rounded-lg border border-indigo-100 bg-indigo-50/50 p-4">
          <h3 class="text-base font-bold text-indigo-950 leading-snug">
            {{ insights?.headline }}
          </h3>
          <p class="mt-1.5 text-sm text-slate-600 leading-relaxed">
            {{ insights?.message }}
          </p>
        </div>

        <!-- Insights List -->
        <div *ngIf="insights?.items && insights.items.length > 0" class="mt-5 space-y-4">
          <div *ngFor="let item of insights.items" class="flex gap-3">
            <div class="flex size-6 shrink-0 items-center justify-center rounded bg-slate-100 text-xs">
              {{ item.type === 'insight' ? '💡' : '💡' }}
            </div>
            <div>
              <h4 class="text-sm font-bold text-slate-900 leading-none">{{ item.title }}</h4>
              <p class="mt-1 text-xs text-slate-500 leading-relaxed">{{ item.message }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-6 border-t border-slate-100 pt-4 flex items-center justify-between text-sm">
        <span class="font-medium text-slate-500">Savings potential</span>
        <span class="font-bold text-emerald-600">₹{{ insights?.savingsPotential | number:'1.0-0' }}</span>
      </div>
    </section>
  `
})
export class AiInsightsComponent {
  @Input() insights: any = {};
}
