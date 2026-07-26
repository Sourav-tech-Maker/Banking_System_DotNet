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
      <div *ngIf="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
        <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
          <h2 class="text-lg font-bold text-slate-900 dark:text-white">Create Savings Goal</h2>
          <form (ngSubmit)="saveNewGoal()" class="mt-4 space-y-4">
            <div>
              <label class="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Goal Title</label>
              <input
                type="text"
                [(ngModel)]="newGoal.title"
                name="title"
                required
                placeholder="e.g. New Laptop, Vacation"
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
                (click)="showCreateModal = false"
                class="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
              >
                Save Goal
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Add Funds Modal -->
      <div *ngIf="showAddFundsModal" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
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
                (click)="showAddFundsModal = false"
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
    </div>
  `
})
export class GoalsViewComponent implements OnInit {
  private api = inject(ApiService);

  goals = signal<any[]>([]);
  loading = signal<boolean>(true);

  showCreateModal = false;
  showAddFundsModal = false;

  selectedGoal: any = null;
  fundAmount = 0;

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
        const mapped = (res || []).map((g: any) => ({
          ...g,
          progressPercentage: Math.min(100, (g.currentAmount / g.targetAmount) * 100)
        }));
        this.goals.set(mapped);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  openCreateModal() {
    this.newGoal = { title: '', category: 'Emergency', targetAmount: 50000, targetDate: '' };
    this.showCreateModal = true;
  }

  saveNewGoal() {
    if (!this.newGoal.title || !this.newGoal.targetAmount) return;
    this.api.createGoal(this.newGoal).subscribe({
      next: () => {
        this.showCreateModal = false;
        this.fetchGoals();
      }
    });
  }

  openAddFundsModal(goal: any) {
    this.selectedGoal = goal;
    this.fundAmount = 1000;
    this.showAddFundsModal = true;
  }

  depositFunds() {
    if (!this.selectedGoal || this.fundAmount <= 0) return;
    this.api.depositToGoal(this.selectedGoal.id, this.fundAmount).subscribe({
      next: () => {
        this.showAddFundsModal = false;
        this.fetchGoals();
      }
    });
  }

  confirmDelete(goal: any) {
    if (confirm(`Delete savings goal "${goal.title}"?`)) {
      this.api.deleteGoal(goal.id).subscribe({
        next: () => this.fetchGoals()
      });
    }
  }

  openHistoryModal(goal: any) {
    alert(`Goal deposit history for "${goal.title}" coming soon! Current balance: ₹${goal.currentAmount}`);
  }
}
