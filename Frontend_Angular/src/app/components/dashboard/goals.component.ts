import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-goals-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Savings Goals</h1>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Plan, track and save money for your targets</p>
        </div>
        <button
          type="button"
          (click)="openCreateModal()"
          class="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:bg-indigo-800 cursor-pointer"
        >
          + Create Goal
        </button>
      </div>

      <!-- Goals Grid -->
      <div *ngIf="loading()" class="py-12 flex justify-center">
        <svg class="animate-spin h-8 w-8 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>

      <div *ngIf="!loading()" class="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <div *ngFor="let goal of goals()" class="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4 flex flex-col justify-between dark:border-slate-800 dark:bg-slate-950">
          <div>
            <div class="flex items-start justify-between gap-3">
              <div>
                <span class="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-extrabold text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 tracking-wider uppercase">
                  {{ goal.category }}
                </span>
                <h3 class="mt-2 text-lg font-extrabold text-slate-900 dark:text-white">{{ goal.title }}</h3>
              </div>
              <button
                type="button"
                (click)="confirmDelete(goal)"
                class="text-xs text-rose-500 hover:text-rose-700 dark:text-rose-400 font-semibold cursor-pointer"
              >
                Delete
              </button>
            </div>

            <!-- Progress Bar -->
            <div class="mt-4 space-y-1.5">
              <div class="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                <span>Progress</span>
                <span>{{ goal.progressPercentage | number:'1.0-0' }}%</span>
              </div>
              <div class="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  class="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all duration-500"
                  [style.width.%]="goal.progressPercentage"
                ></div>
              </div>
            </div>

            <!-- Amounts -->
            <div class="mt-4 grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800/80 pt-4 text-sm font-semibold">
              <div>
                <span class="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Saved</span>
                <span class="text-slate-900 dark:text-white font-extrabold text-base">₹{{ goal.currentAmount | number:'1.2-2' }}</span>
              </div>
              <div>
                <span class="block text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Target</span>
                <span class="text-slate-950 dark:text-slate-200 font-extrabold text-base">₹{{ goal.targetAmount | number:'1.2-2' }}</span>
              </div>
            </div>

            <p class="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Target Date: {{ goal.targetDate | date:'dd MMM yyyy' }}
            </p>
          </div>

          <div class="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex gap-2">
            <button
              type="button"
              (click)="openAddFundsModal(goal)"
              class="flex-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 dark:text-indigo-300 py-2 text-xs font-bold transition cursor-pointer"
            >
              + Add Funds
            </button>
            <button
              type="button"
              (click)="openHistoryModal(goal)"
              class="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300 py-2 text-xs font-bold transition cursor-pointer"
            >
              History
            </button>
          </div>
        </div>

        <div *ngIf="goals().length === 0" class="col-span-full py-12 text-center text-slate-400 dark:text-slate-500">
          <div class="flex flex-col items-center justify-center space-y-2">
            <div class="size-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-500 dark:text-indigo-400 flex items-center justify-center text-2xl">
              🎯
            </div>
            <p class="text-sm font-bold text-slate-700 dark:text-slate-300">No savings goals created yet.</p>
            <p class="text-xs text-slate-400 dark:text-slate-500">Click "Create Goal" to set target amounts and timelines.</p>
          </div>
        </div>
      </div>

      <!-- Create Goal Modal -->
      <div *ngIf="showCreateModal()" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
        <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
          <h2 class="text-lg font-bold text-slate-900 dark:text-white">Create Savings Goal</h2>

          <div *ngIf="createError()" class="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/50 dark:text-rose-300">
            {{ createError() }}
          </div>

          <form (ngSubmit)="saveNewGoal()" class="mt-4 space-y-4">
            <div>
              <label class="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Goal Title</label>
              <input
                type="text"
                [(ngModel)]="newGoal.title"
                name="title"
                required
                placeholder="e.g. Emergency Fund, New Laptop, Vacation"
                class="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-semibold text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label class="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Category</label>
              <select
                [(ngModel)]="newGoal.category"
                name="category"
                class="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-semibold text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-hidden"
              >
                <option value="Emergency">Emergency</option>
                <option value="Electronics">Electronics</option>
                <option value="Travel">Travel</option>
                <option value="Vehicle">Vehicle</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Target Amount (₹)</label>
              <input
                type="number"
                [(ngModel)]="newGoal.targetAmount"
                name="targetAmount"
                required
                min="100"
                class="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-semibold text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label class="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Target Date</label>
              <input
                type="date"
                [(ngModel)]="newGoal.targetDate"
                name="targetDate"
                required
                class="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-semibold text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
            <div class="mt-6 flex justify-end gap-3">
              <button
                type="button"
                (click)="showCreateModal.set(false)"
                class="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="createLoading() || !newGoal.title || !newGoal.targetAmount || !newGoal.targetDate"
                class="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {{ createLoading() ? 'Saving...' : 'Save Goal' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Add Funds Modal -->
      <div *ngIf="showAddFundsModal()" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
        <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
          <h2 class="text-lg font-bold text-slate-900 dark:text-white">Deposit to {{ selectedGoal?.title }}</h2>
          <form (ngSubmit)="depositFunds()" class="mt-4 space-y-4">
            <div>
              <label class="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Deposit Amount (₹)</label>
              <input
                type="number"
                [(ngModel)]="fundAmount"
                name="fundAmount"
                required
                min="1"
                class="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-semibold text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
            <div class="mt-6 flex justify-end gap-3">
              <button
                type="button"
                (click)="showAddFundsModal.set(false)"
                class="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
              >
                Confirm Deposit
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Goal Deposit History Modal -->
      <div *ngIf="showHistoryModal()" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
        <div class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-950 border border-slate-200 dark:border-slate-800 max-h-[85vh] flex flex-col">
          <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 class="text-lg font-bold text-slate-900 dark:text-white">Deposit History</h2>
              <p class="text-xs text-slate-500 dark:text-slate-400">{{ historyGoal()?.title }} (Target: ₹{{ historyGoal()?.targetAmount | number:'1.0-0' }})</p>
            </div>
            <button
              type="button"
              (click)="showHistoryModal.set(false)"
              class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-bold"
            >
              ✕
            </button>
          </div>

          <div class="my-4 flex-1 overflow-y-auto">
            <div *ngIf="historyLoading()" class="py-8 flex justify-center">
              <svg class="animate-spin h-6 w-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>

            <div *ngIf="!historyLoading() && historyLogs().length === 0" class="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
              No deposit records found for this goal yet.
            </div>

            <div *ngIf="!historyLoading() && historyLogs().length > 0" class="space-y-2">
              <div *ngFor="let log of historyLogs()" class="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
                <div>
                  <span class="text-xs font-bold text-slate-900 dark:text-white capitalize">{{ log.type || 'Manual Deposit' }}</span>
                  <span class="block text-[10px] text-slate-400 dark:text-slate-500">{{ log.createdAt | date:'medium' }}</span>
                </div>
                <span class="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">+₹{{ log.amountAdded | number:'1.2-2' }}</span>
              </div>
            </div>
          </div>

          <div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              type="button"
              (click)="showHistoryModal.set(false)"
              class="rounded-xl bg-slate-100 dark:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class GoalsViewComponent implements OnInit {
  private api = inject(ApiService);

  goals = signal<any[]>([]);
  loading = signal<boolean>(true);

  showCreateModal = signal<boolean>(false);
  showAddFundsModal = signal<boolean>(false);
  showHistoryModal = signal<boolean>(false);

  selectedGoal: any = null;
  fundAmount = 0;

  historyLoading = signal<boolean>(false);
  historyLogs = signal<any[]>([]);
  historyGoal = signal<any>(null);

  createError = signal<string>('');
  createLoading = signal<boolean>(false);

  newGoal = {
    title: '',
    category: 'Emergency',
    targetAmount: 50000,
    targetDate: ''
  };

  ngOnInit() {
    this.fetchGoals();
  }

  fetchGoals() {
    this.loading.set(true);
    this.api.getGoals().subscribe({
      next: (res: any) => {
        try {
          const rawList = Array.isArray(res) ? res : (res?.goals || []);
          const mapped = rawList.map((g: any) => {
            const cur = Number(g.currentAmount ?? g.current_amount ?? 0);
            const tgt = Number(g.targetAmount ?? g.target_amount ?? 1);
            const pct = g.progressPercentage !== undefined && g.progressPercentage !== null
              ? Number(g.progressPercentage)
              : (tgt > 0 ? (cur / tgt) * 100 : 0);

            return {
              ...g,
              id: g.id || g._id,
              currentAmount: cur,
              targetAmount: tgt,
              progressPercentage: Math.min(100, Math.max(0, isNaN(pct) ? 0 : pct))
            };
          });
          this.goals.set(mapped);
        } catch (e) {
          console.error('Error parsing goals:', e);
        } finally {
          this.loading.set(false);
        }
      },
      error: (err) => {
        console.error('Error fetching goals:', err);
        this.loading.set(false);
      }
    });
  }

  openCreateModal() {
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 6);

    this.newGoal = {
      title: '',
      category: 'Emergency',
      targetAmount: 50000,
      targetDate: futureDate.toISOString().split('T')[0]
    };
    this.createError.set('');
    this.createLoading.set(false);
    this.showCreateModal.set(true);
  }

  saveNewGoal() {
    if (!this.newGoal.title || !this.newGoal.targetAmount || !this.newGoal.targetDate) {
      this.createError.set('All fields (Title, Category, Target Amount, Target Date) are required.');
      return;
    }

    this.createLoading.set(true);
    this.createError.set('');

    this.api.createGoal(this.newGoal).subscribe({
      next: () => {
        this.createLoading.set(false);
        this.showCreateModal.set(false);
        this.fetchGoals();
      },
      error: (err: any) => {
        this.createLoading.set(false);
        const errorMsg = err.error?.message || err.message || 'Failed to create goal. Check if title is unique.';
        this.createError.set(errorMsg);
      }
    });
  }

  openAddFundsModal(goal: any) {
    this.selectedGoal = goal;
    this.fundAmount = 1000;
    this.showAddFundsModal.set(true);
  }

  depositFunds() {
    if (!this.selectedGoal || this.fundAmount <= 0) return;
    this.api.depositToGoal(this.selectedGoal.id, this.fundAmount).subscribe({
      next: () => {
        this.showAddFundsModal.set(false);
        this.fetchGoals();
      },
      error: (err: any) => {
        alert(err.error?.message || 'Deposit failed');
      }
    });
  }

  confirmDelete(goal: any) {
    if (confirm(`Delete savings goal "${goal.title}"?`)) {
      this.api.deleteGoal(goal.id).subscribe({
        next: () => {
          this.goals.update((current) => current.filter((g) => g.id !== goal.id));
          this.fetchGoals();
        },
        error: (err: any) => alert(err.error?.message || 'Failed to delete goal.')
      });
    }
  }

  openHistoryModal(goal: any) {
    this.historyGoal.set(goal);
    this.historyLogs.set([]);
    this.historyLoading.set(true);
    this.showHistoryModal.set(true);

    this.api.getGoalHistory(goal.id).subscribe({
      next: (res: any) => {
        this.historyLogs.set(res.history || []);
        this.historyLoading.set(false);
      },
      error: () => this.historyLoading.set(false)
    });
  }
}


