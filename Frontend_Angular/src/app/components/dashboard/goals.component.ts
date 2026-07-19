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
          <h1 class="text-2xl font-extrabold text-slate-900 tracking-tight">Savings Goals</h1>
          <p class="mt-1 text-sm text-slate-500">Plan, track and save money for your targets</p>
        </div>
        <button
          type="button"
          (click)="openCreateModal()"
          class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:bg-indigo-800"
        >
          Create Goal
        </button>
      </div>

      <!-- Goals Grid -->
      <div *ngIf="loading()" class="py-12 flex justify-center">
        <svg class="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>

      <div *ngIf="!loading()" class="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <div *ngFor="let goal of goals()" class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div class="flex items-start justify-between gap-3">
              <div>
                <span class="rounded bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700 tracking-wide uppercase">
                  {{ goal.category }}
                </span>
                <h3 class="mt-2 text-lg font-bold text-slate-900">{{ goal.title }}</h3>
              </div>
              <button
                type="button"
                (click)="confirmDelete(goal)"
                class="text-xs text-rose-500 hover:text-rose-700 font-semibold"
              >
                Delete
              </button>
            </div>

            <!-- Progress Bar -->
            <div class="mt-4 space-y-1.5">
              <div class="flex justify-between text-xs font-bold text-slate-500">
                <span>Progress</span>
                <span>{{ goal.progressPercentage | number:'1.0-0' }}%</span>
              </div>
              <div class="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  class="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all duration-500"
                  [style.width.%]="goal.progressPercentage"
                ></div>
              </div>
            </div>

            <!-- Amounts -->
            <div class="mt-4 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-sm font-semibold">
              <div>
                <span class="block text-xs text-slate-400 font-bold uppercase">Saved</span>
                <span class="text-slate-900 font-extrabold text-base">₹{{ goal.currentAmount | number:'1.2-2' }}</span>
              </div>
              <div>
                <span class="block text-xs text-slate-400 font-bold uppercase">Target</span>
                <span class="text-slate-950 font-extrabold text-base">₹{{ goal.targetAmount | number:'1.2-2' }}</span>
              </div>
            </div>

            <p class="mt-3 text-xs text-slate-500">
              Target Date: {{ goal.targetDate | date:'dd MMM yyyy' }}
            </p>
          </div>

          <div class="pt-4 border-t border-slate-100 flex gap-2">
            <button
              type="button"
              (click)="openAddFundsModal(goal)"
              class="flex-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-2 text-xs font-bold transition"
            >
              Add Funds
            </button>
            <button
              type="button"
              (click)="openHistoryModal(goal)"
              class="flex-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 py-2 text-xs font-bold transition"
            >
              History
            </button>
          </div>
        </div>

        <div *ngIf="goals().length === 0" class="col-span-full py-16 text-center text-slate-400 font-normal">
          You haven't created any savings goals yet.
        </div>
      </div>

      <!-- Create Goal Modal -->
      <div *ngIf="showCreateModal()" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div class="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
          <button
            type="button"
            (click)="showCreateModal.set(false)"
            class="absolute right-4 top-4 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>

          <h2 class="text-lg font-bold text-slate-950 mb-4">Create Savings Goal</h2>

          <div *ngIf="modalError()" class="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {{ modalError() }}
          </div>

          <form (submit)="handleCreateSubmit($event)" class="space-y-4">
            <div>
              <label for="gTitle" class="block text-sm font-medium text-slate-700">Goal Name</label>
              <input
                id="gTitle"
                type="text"
                name="title"
                required
                [(ngModel)]="createForm.title"
                class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="e.g. New Macbook, House Downpayment"
              />
            </div>

            <div>
              <label for="gCategory" class="block text-sm font-medium text-slate-700">Category</label>
              <select
                id="gCategory"
                name="category"
                required
                [(ngModel)]="createForm.category"
                class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
              >
                <option value="Gadgets">Gadgets &amp; Tech</option>
                <option value="Travel">Travel &amp; Vacation</option>
                <option value="Savings">General Savings</option>
                <option value="Education">Education</option>
                <option value="Emergency">Emergency Fund</option>
              </select>
            </div>

            <div class="grid gap-4 grid-cols-2">
              <div>
                <label for="gTarget" class="block text-sm font-medium text-slate-700">Target Amount</label>
                <input
                  id="gTarget"
                  type="number"
                  name="targetAmount"
                  required
                  min="100"
                  [(ngModel)]="createForm.targetAmount"
                  class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                  placeholder="₹10,000"
                />
              </div>

              <div>
                <label for="gInitial" class="block text-sm font-medium text-slate-700">Initial Deposit</label>
                <input
                  id="gInitial"
                  type="number"
                  name="currentAmount"
                  min="0"
                  [(ngModel)]="createForm.currentAmount"
                  class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                  placeholder="₹0"
                />
              </div>
            </div>

            <div>
              <label for="gDate" class="block text-sm font-medium text-slate-700">Target Date</label>
              <input
                id="gDate"
                type="date"
                name="targetDate"
                required
                [(ngModel)]="createForm.targetDate"
                class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500"
              />
            </div>

            <div class="pt-2">
              <button
                type="submit"
                [disabled]="modalLoading()"
                class="w-full rounded-lg bg-indigo-600 py-2.5 text-white font-semibold shadow-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                {{ modalLoading() ? 'Creating...' : 'Create Goal' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Add Funds Modal -->
      <div *ngIf="showAddFundsModal()" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div class="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
          <button
            type="button"
            (click)="showAddFundsModal.set(false)"
            class="absolute right-4 top-4 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>

          <h2 class="text-lg font-bold text-slate-950 mb-1">Add Funds</h2>
          <p class="text-sm text-slate-500 mb-4">Allocate savings to "{{ selectedGoal?.title }}"</p>

          <div *ngIf="modalError()" class="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {{ modalError() }}
          </div>

          <form (submit)="handleAddFundsSubmit($event)" class="space-y-4">
            <div>
              <label for="fundAmount" class="block text-sm font-medium text-slate-700">Amount (INR)</label>
              <input
                id="fundAmount"
                type="number"
                name="amount"
                required
                min="10"
                [(ngModel)]="fundsAmount"
                class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500"
                placeholder="₹1,000"
              />
            </div>

            <div class="pt-2">
              <button
                type="submit"
                [disabled]="modalLoading() || fundsAmount <= 0"
                class="w-full rounded-lg bg-indigo-600 py-2.5 text-white font-semibold shadow-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                {{ modalLoading() ? 'Allocating...' : 'Allocate Funds' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- History Modal -->
      <div *ngIf="showHistoryModal()" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div class="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
          <button
            type="button"
            (click)="showHistoryModal.set(false)"
            class="absolute right-4 top-4 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>

          <h2 class="text-lg font-bold text-slate-950 mb-1">Savings Log</h2>
          <p class="text-sm text-slate-500 mb-4">Deposit history for "{{ selectedGoal?.title }}"</p>

          <div class="max-h-60 overflow-y-auto divide-y divide-slate-100 pr-1">
            <div *ngFor="let log of goalHistory()" class="py-3 flex justify-between text-sm">
              <div>
                <p class="font-bold text-slate-900">₹{{ log.amountAdded | number:'1.2-2' }}</p>
                <p class="text-xs text-slate-400 mt-0.5">Type: {{ log.type }}</p>
              </div>
              <span class="text-xs text-slate-500">{{ log.createdAt | date:'dd MMM yyyy HH:mm' }}</span>
            </div>

            <div *ngIf="goalHistory().length === 0" class="py-8 text-center text-slate-400">
              No deposit history found.
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class GoalsViewComponent implements OnInit {
  private readonly apiService = inject(ApiService);

  protected goals = signal<any[]>([]);
  protected loading = signal(false);

  // Modals state
  protected showCreateModal = signal(false);
  protected showAddFundsModal = signal(false);
  protected showHistoryModal = signal(false);
  protected modalLoading = signal(false);
  protected modalError = signal('');

  protected createForm = {
    title: '',
    category: 'Savings',
    targetAmount: 0,
    currentAmount: 0,
    targetDate: ''
  };

  protected selectedGoal: any = null;
  protected fundsAmount = 0;
  protected goalHistory = signal<any[]>([]);

  ngOnInit() {
    this.fetchGoals();
  }

  protected fetchGoals() {
    this.loading.set(true);
    this.apiService.getGoals().subscribe({
      next: (res) => {
        this.goals.set(res.goals || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  protected openCreateModal() {
    this.createForm.title = '';
    this.createForm.category = 'Savings';
    this.createForm.targetAmount = 0;
    this.createForm.currentAmount = 0;
    this.createForm.targetDate = '';
    this.modalError.set('');
    this.showCreateModal.set(true);
  }

  protected handleCreateSubmit(event: Event) {
    event.preventDefault();
    this.modalLoading.set(true);
    this.modalError.set('');

    this.apiService.createGoal(this.createForm).subscribe({
      next: () => {
        this.modalLoading.set(false);
        this.showCreateModal.set(false);
        this.fetchGoals();
      },
      error: (err) => {
        this.modalLoading.set(false);
        this.modalError.set(err.error?.message || 'Failed to create goal');
      }
    });
  }

  protected openAddFundsModal(goal: any) {
    this.selectedGoal = goal;
    this.fundsAmount = 0;
    this.modalError.set('');
    this.showAddFundsModal.set(true);
  }

  protected handleAddFundsSubmit(event: Event) {
    event.preventDefault();
    this.modalLoading.set(true);
    this.modalError.set('');

    this.apiService.addGoalAmount({
      goalId: this.selectedGoal.id,
      amount: this.fundsAmount
    }).subscribe({
      next: () => {
        this.modalLoading.set(false);
        this.showAddFundsModal.set(false);
        this.fetchGoals();
      },
      error: (err) => {
        this.modalLoading.set(false);
        this.modalError.set(err.error?.message || 'Failed to allocate funds');
      }
    });
  }

  protected openHistoryModal(goal: any) {
    this.selectedGoal = goal;
    this.goalHistory.set([]);
    this.showHistoryModal.set(true);

    this.apiService.getGoalHistory(goal.id).subscribe({
      next: (res) => {
        this.goalHistory.set(res.history || []);
      },
      error: () => {}
    });
  }

  protected confirmDelete(goal: any) {
    if (confirm(`Are you sure you want to delete goal "${goal.title}"?`)) {
      this.apiService.deleteGoal(goal.id).subscribe({
        next: () => {
          this.fetchGoals();
        },
        error: (err) => {
          alert(err.error?.message || 'Failed to delete goal');
        }
      });
    }
  }
}
