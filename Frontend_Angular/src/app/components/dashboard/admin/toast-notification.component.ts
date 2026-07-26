import { Component, Injectable, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  show(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration = 4000) {
    const id = crypto.randomUUID();
    this.toasts.update(t => [...t, { id, message, type, duration }]);
    setTimeout(() => this.dismiss(id), duration);
  }

  success(message: string) { this.show(message, 'success'); }
  error(message: string) { this.show(message, 'error'); }
  warning(message: string) { this.show(message, 'warning'); }
  info(message: string) { this.show(message, 'info'); }

  dismiss(id: string) {
    this.toasts.update(t => t.filter(toast => toast.id !== id));
  }
}

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <div
        *ngFor="let toast of toastService.toasts()"
        [ngClass]="{
          'border-emerald-200 bg-white text-emerald-950 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-300': toast.type === 'success',
          'border-rose-200 bg-white text-rose-950 dark:border-rose-800 dark:bg-slate-900 dark:text-rose-300': toast.type === 'error',
          'border-amber-200 bg-white text-amber-950 dark:border-amber-800 dark:bg-slate-900 dark:text-amber-300': toast.type === 'warning',
          'border-indigo-200 bg-white text-indigo-950 dark:border-indigo-800 dark:bg-slate-900 dark:text-indigo-300': toast.type === 'info'
        }"
        class="pointer-events-auto flex items-center justify-between rounded-xl border p-4 shadow-lg backdrop-blur-md transition-all duration-300 transform translate-x-0"
      >
        <div class="flex items-center gap-3">
          <span
            [ngClass]="{
              'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400': toast.type === 'success',
              'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400': toast.type === 'error',
              'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400': toast.type === 'warning',
              'bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400': toast.type === 'info'
            }"
            class="flex size-7 items-center justify-center rounded-lg text-xs font-bold shrink-0"
          >
            <span *ngIf="toast.type === 'success'">✓</span>
            <span *ngIf="toast.type === 'error'">✕</span>
            <span *ngIf="toast.type === 'warning'">⚠️</span>
            <span *ngIf="toast.type === 'info'">ℹ️</span>
          </span>
          <p class="text-xs font-bold leading-snug">{{ toast.message }}</p>
        </div>

        <button
          (click)="toastService.dismiss(toast.id)"
          class="ml-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold cursor-pointer"
        >
          ✕
        </button>
      </div>
    </div>
  `
})
export class ToastContainerComponent {
  constructor(public readonly toastService: ToastService) {}
}
