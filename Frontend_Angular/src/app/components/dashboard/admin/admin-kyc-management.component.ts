import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { ToastService } from './toast-notification.component';

@Component({
  selector: 'app-admin-kyc-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Top Bar: Filter & Title -->
      <div class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4 dark:border-slate-800">
        <div>
          <h2 class="text-xl font-extrabold text-slate-900 dark:text-white">KYC Verification Management</h2>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Review, approve, or reject customer identity submissions</p>
        </div>

        <div class="flex items-center gap-2">
          <button
            (click)="setFilter('all')"
            [ngClass]="filter === 'all' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'"
            class="rounded-xl px-3.5 py-1.5 text-xs font-bold transition cursor-pointer"
          >
            All
          </button>
          <button
            (click)="setFilter('PENDING')"
            [ngClass]="filter === 'PENDING' ? 'bg-amber-500 text-white font-extrabold' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'"
            class="rounded-xl px-3.5 py-1.5 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
          >
            <span class="size-2 rounded-full bg-amber-300"></span>
            Pending
          </button>
          <button
            (click)="setFilter('APPROVED')"
            [ngClass]="filter === 'APPROVED' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'"
            class="rounded-xl px-3.5 py-1.5 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
          >
            <span class="size-2 rounded-full bg-emerald-300"></span>
            Approved
          </button>
          <button
            (click)="setFilter('REJECTED')"
            [ngClass]="filter === 'REJECTED' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'"
            class="rounded-xl px-3.5 py-1.5 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
          >
            <span class="size-2 rounded-full bg-rose-300"></span>
            Rejected
          </button>
        </div>
      </div>

      <!-- Loading Spinner -->
      <div *ngIf="loading()" class="py-12 flex justify-center">
        <svg class="animate-spin h-8 w-8 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>

      <!-- Applications List -->
      <div *ngIf="!loading()" class="space-y-4">
        <div *ngFor="let kyc of filteredApplications()" class="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 transition hover:border-slate-300 dark:hover:border-slate-700">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <h3 class="text-base font-extrabold text-slate-900 dark:text-white">{{ kyc.fullName }}</h3>
                <span
                  [ngClass]="{
                    'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300': kyc.status === 'PENDING' || kyc.status === 'Pending',
                    'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300': kyc.status === 'APPROVED' || kyc.status === 'Approved',
                    'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300': kyc.status === 'REJECTED' || kyc.status === 'Rejected'
                  }"
                  class="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                >
                  {{ kyc.status }}
                </span>
              </div>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                User: <strong>{{ (kyc.userName && kyc.userName !== 'N/A') ? kyc.userName : (kyc.username || kyc.fullName || 'N/A') }}</strong>
                <span *ngIf="kyc.email && kyc.email !== 'N/A' && kyc.email !== ''">({{ kyc.email }})</span>
              </p>
              <p class="text-[11px] text-slate-400 dark:text-slate-500">
                Submitted: {{ (kyc.submittedAt || kyc.createdAt) | date:'medium' }}
              </p>
            </div>

            <div class="flex items-center gap-2">
              <!-- Approve/Reject buttons for Pending -->
              <ng-container *ngIf="kyc.status === 'PENDING' || kyc.status === 'Pending'">
                <button
                  (click)="approveKyc(kyc)"
                  class="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition cursor-pointer"
                >
                  ✓ Approve
                </button>
                <button
                  (click)="openRejectModal(kyc)"
                  class="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700 transition cursor-pointer"
                >
                  ✕ Reject
                </button>
              </ng-container>

              <!-- Delete button for Approved/Rejected -->
              <ng-container *ngIf="kyc.status !== 'PENDING' && kyc.status !== 'Pending'">
                <button
                  (click)="deleteKyc(kyc)"
                  class="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/60 dark:text-rose-300 transition cursor-pointer"
                >
                  🗑️ Delete / Allow Resubmit
                </button>
              </ng-container>
            </div>
          </div>

          <!-- Document details grid -->
          <div class="mt-4 grid gap-4 sm:grid-cols-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 text-xs dark:border-slate-800/80 dark:bg-slate-900/50">
            <div>
              <span class="block text-[10px] font-bold text-slate-400 uppercase">Document Type</span>
              <span class="font-bold text-slate-800 dark:text-slate-200">{{ kyc.documentType }}</span>
            </div>
            <div>
              <span class="block text-[10px] font-bold text-slate-400 uppercase">Document Number</span>
              <span class="font-bold text-slate-800 dark:text-slate-200">{{ kyc.documentNumber }}</span>
            </div>
            <div>
              <span class="block text-[10px] font-bold text-slate-400 uppercase">Date of Birth & Gender</span>
              <span class="font-bold text-slate-800 dark:text-slate-200">{{ kyc.dateOfBirth }} · {{ kyc.gender }}</span>
            </div>
          </div>

          <!-- Address -->
          <div *ngIf="kyc.address || kyc.permanentAddress" class="mt-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900/30 dark:text-slate-300">
            <span class="font-bold text-slate-900 dark:text-white">📍 Permanent Address: </span>
            <span>
              {{ (kyc.address || kyc.permanentAddress)?.street }},
              {{ (kyc.address || kyc.permanentAddress)?.city }},
              {{ (kyc.address || kyc.permanentAddress)?.state }},
              {{ (kyc.address || kyc.permanentAddress)?.country }} -
              {{ (kyc.address || kyc.permanentAddress)?.postalCode }}
            </span>
          </div>

          <!-- Rejection Reason Note -->
          <div *ngIf="kyc.rejectionReason || kyc.rejectReason" class="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
            <strong>Rejection Reason:</strong> {{ kyc.rejectionReason || kyc.rejectReason }}
          </div>

          <!-- Uploaded Documents & Image Attachments Section -->
          <div class="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
            <h4 class="text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-2.5 flex items-center gap-1.5">
              <span>📎</span> Customer Uploaded Verification Documents
            </h4>

            <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <!-- Identity Document -->
              <div *ngIf="kyc.documentImageUrl || kyc.documentImg" class="rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-900/60 space-y-2">
                <span class="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Proof of Identity/Address</span>
                <div class="aspect-video w-full overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-800 relative group cursor-pointer" (click)="previewImage.set(kyc.documentImageUrl || kyc.documentImg)">
                  <img [src]="kyc.documentImageUrl || kyc.documentImg" alt="Identity Document" class="h-full w-full object-cover transition group-hover:scale-105" />
                  <div class="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white text-xs font-bold">🔍 Expand</div>
                </div>
                <button (click)="previewImage.set(kyc.documentImageUrl || kyc.documentImg)" class="w-full text-center text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
                  🖼️ View Document
                </button>
              </div>

              <!-- Passport Photo -->
              <div *ngIf="kyc.photoUrl" class="rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-900/60 space-y-2">
                <span class="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Passport Size Photo</span>
                <div class="aspect-video w-full overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-800 relative group cursor-pointer" (click)="previewImage.set(kyc.photoUrl)">
                  <img [src]="kyc.photoUrl" alt="Passport Photo" class="h-full w-full object-contain transition group-hover:scale-105" />
                  <div class="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white text-xs font-bold">🔍 Expand</div>
                </div>
                <button (click)="previewImage.set(kyc.photoUrl)" class="w-full text-center text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
                  👤 View Photo
                </button>
              </div>

              <!-- Specimen Signature -->
              <div *ngIf="kyc.signatureUrl" class="rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-900/60 space-y-2">
                <span class="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Specimen Signature</span>
                <div class="aspect-video w-full overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-800 relative group cursor-pointer" (click)="previewImage.set(kyc.signatureUrl)">
                  <img [src]="kyc.signatureUrl" alt="Specimen Signature" class="h-full w-full object-contain transition group-hover:scale-105" />
                  <div class="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white text-xs font-bold">🔍 Expand</div>
                </div>
                <button (click)="previewImage.set(kyc.signatureUrl)" class="w-full text-center text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
                  ✍️ View Signature
                </button>
              </div>

              <!-- PAN / Form 60 Document -->
              <div *ngIf="kyc.panImageUrl || kyc.panNumber" class="rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-900/60 space-y-2">
                <span class="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">PAN / Tax Document</span>
                <div *ngIf="kyc.panImageUrl" class="aspect-video w-full overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-800 relative group cursor-pointer" (click)="previewImage.set(kyc.panImageUrl)">
                  <img [src]="kyc.panImageUrl" alt="PAN Card" class="h-full w-full object-cover transition group-hover:scale-105" />
                  <div class="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white text-xs font-bold">🔍 Expand</div>
                </div>
                <p *ngIf="kyc.panNumber" class="text-[11px] font-bold text-slate-800 dark:text-slate-200">PAN: {{ kyc.panNumber }}</p>
                <button *ngIf="kyc.panImageUrl" (click)="previewImage.set(kyc.panImageUrl)" class="w-full text-center text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
                  💳 View PAN Image
                </button>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="filteredApplications().length === 0" class="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-950">
          <p class="text-sm font-bold text-slate-500 dark:text-slate-400">No KYC applications match the selected filter.</p>
        </div>
      </div>

      <!-- Reject Modal -->
      <div *ngIf="rejectingKyc()" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
        <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 class="text-lg font-bold text-slate-950 dark:text-white">Reject KYC Application</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400">Specify the reason for rejecting <strong>{{ rejectingKyc()?.fullName }}</strong>'s submission.</p>

          <textarea
            [(ngModel)]="rejectReason"
            rows="3"
            class="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
            placeholder="e.g. Blur document image, details mismatch, invalid document number..."
          ></textarea>

          <div class="flex justify-end gap-2">
            <button (click)="rejectingKyc.set(null)" class="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer">Cancel</button>
            <button (click)="confirmReject()" class="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 cursor-pointer">Confirm Rejection</button>
          </div>
        </div>
      </div>

      <!-- Image Preview Modal -->
      <div *ngIf="previewImage()" (click)="previewImage.set(null)" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 cursor-pointer">
        <div class="relative max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 p-2 shadow-2xl" (click)="$event.stopPropagation()">
          <img [src]="previewImage()" alt="KYC Document" class="max-h-[80vh] w-auto object-contain rounded-xl" />
          <button (click)="previewImage.set(null)" class="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full bg-slate-950/80 text-white text-sm font-bold border border-slate-700 cursor-pointer">✕</button>
        </div>
      </div>
    </div>
  `
})
export class AdminKycManagementComponent implements OnInit, OnChanges {
  @Input() filter = 'all';
  @Output() dataChanged = new EventEmitter<void>();

  private readonly apiService = inject(ApiService);
  private readonly toast = inject(ToastService);

  protected loading = signal(true);
  protected applications = signal<any[]>([]);
  protected rejectingKyc = signal<any>(null);
  protected rejectReason = '';
  protected previewImage = signal<string | null>(null);

  ngOnInit() {
    this.loadApplications();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['filter']) {
      this.filter = changes['filter'].currentValue || 'all';
      this.loadApplications();
    }
  }

  setFilter(f: string) {
    this.filter = f;
    this.loadApplications();
  }

  protected loadApplications() {
    this.loading.set(true);
    this.apiService.getAdminKycApplications(this.filter).subscribe({
      next: (res) => {
        const list = res.applications || (Array.isArray(res) ? res : []);
        this.applications.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(err.error?.message || 'Failed to load KYC applications');
      }
    });
  }

  protected filteredApplications() {
    const apps = this.applications();
    const currentFilter = (this.filter || 'all').trim().toUpperCase();
    if (currentFilter === 'ALL') return apps;

    return apps.filter(a => {
      const s = (a.status || a.kycStatus || '').toString().trim().toUpperCase();
      if (currentFilter === 'PENDING') {
        return s === 'PENDING' || s === 'UNDER_REVIEW' || s === 'UNDER COMPLIANCE REVIEW' || s === 'SUBMITTED' || s.includes('PENDING');
      }
      if (currentFilter === 'APPROVED') {
        return s === 'APPROVED' || s === 'VERIFIED';
      }
      if (currentFilter === 'REJECTED') {
        return s === 'REJECTED' || s === 'REJECT';
      }
      return s === currentFilter;
    });
  }

  protected approveKyc(kyc: any) {
    const userId = kyc.userId || kyc.user?.id;
    this.apiService.verifyKyc({ userId, status: 'Approve' }).subscribe({
      next: (res) => {
        this.toast.success(`KYC approved for ${kyc.fullName}!`);
        this.loadApplications();
        this.dataChanged.emit();
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to approve KYC.');
      }
    });
  }

  protected openRejectModal(kyc: any) {
    this.rejectReason = '';
    this.rejectingKyc.set(kyc);
  }

  protected confirmReject() {
    const kyc = this.rejectingKyc();
    if (!kyc || !this.rejectReason.trim()) {
      this.toast.warning('Please enter a rejection reason.');
      return;
    }

    const userId = kyc.userId || kyc.user?.id;
    this.apiService.verifyKyc({ userId, status: 'Rejected', rejectReason: this.rejectReason }).subscribe({
      next: () => {
        this.toast.success(`KYC rejected for ${kyc.fullName}. Notification email queued.`);
        this.rejectingKyc.set(null);
        this.loadApplications();
        this.dataChanged.emit();
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to reject KYC.');
      }
    });
  }

  protected deleteKyc(kyc: any) {
    const id = kyc.id || kyc._id || kyc.kycApplicationId;
    if (!confirm(`Are you sure you want to delete ${kyc.fullName}'s KYC application? This will allow them to resubmit.`)) {
      return;
    }

    this.apiService.deleteKycApplication(id).subscribe({
      next: () => {
        this.toast.success('KYC application deleted. User can now resubmit.');
        this.loadApplications();
        this.dataChanged.emit();
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to delete KYC application.');
      }
    });
  }
}
