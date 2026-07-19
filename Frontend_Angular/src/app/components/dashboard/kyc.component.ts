import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-kyc-verification-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="mx-auto max-w-2xl space-y-6 pt-2">
      <!-- Success State -->
      <div *ngIf="success()" class="rounded-xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
        <div class="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-3xl">
          ✓
        </div>
        <h2 class="mt-5 text-xl font-bold text-slate-950">KYC Submitted Successfully!</h2>
        <p class="mt-2 text-sm leading-6 text-slate-500">
          Your KYC application is now under review. Our team will verify your documents and approve your application. This typically takes 24-48 hours.
        </p>
        <div class="mt-6 rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700 font-bold">
          Status: Pending Admin Approval
        </div>
      </div>

      <!-- Registration Form -->
      <div *ngIf="!success()" class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h2 class="text-xl font-bold text-slate-950">KYC verification</h2>
          <p class="text-sm text-slate-500 mt-1">Submit your identification details to activate banking transactions.</p>
        </div>

        <div *ngIf="error()" class="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {{ error() }}
        </div>

        <form (submit)="handleSubmit($event)" class="mt-6 space-y-5">
          <!-- Full Name -->
          <div>
            <label for="fullName" class="block text-sm font-medium text-slate-700">Full Name (as in Document)</label>
            <input
              id="fullName"
              type="text"
              name="FullName"
              required
              [(ngModel)]="formData.FullName"
              class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
              placeholder="John Doe"
            />
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <!-- Date of Birth -->
            <div>
              <label for="dob" class="block text-sm font-medium text-slate-700">Date of Birth</label>
              <input
                id="dob"
                type="date"
                name="dateOfBirth"
                required
                [(ngModel)]="formData.dateOfBirth"
                class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>

            <!-- Gender -->
            <div>
              <label for="gender" class="block text-sm font-medium text-slate-700">Gender</label>
              <select
                id="gender"
                name="gender"
                required
                [(ngModel)]="formData.gender"
                class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition bg-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <!-- Address -->
          <div class="border-t border-slate-100 pt-4 space-y-4">
            <h3 class="text-sm font-bold text-slate-900">Permanent Address</h3>
            
            <div>
              <label for="street" class="block text-sm font-medium text-slate-700">Street Address</label>
              <input
                id="street"
                type="text"
                name="street"
                required
                [(ngModel)]="formData.permanentAddress.street"
                class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                placeholder="123 Main St"
              />
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label for="city" class="block text-sm font-medium text-slate-700">City</label>
                <input
                  id="city"
                  type="text"
                  name="city"
                  required
                  [(ngModel)]="formData.permanentAddress.city"
                  class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                  placeholder="Mumbai"
                />
              </div>

              <div>
                <label for="state" class="block text-sm font-medium text-slate-700">State / Province</label>
                <input
                  id="state"
                  type="text"
                  name="state"
                  required
                  [(ngModel)]="formData.permanentAddress.state"
                  class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                  placeholder="Maharashtra"
                />
              </div>
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label for="country" class="block text-sm font-medium text-slate-700">Country</label>
                <input
                  id="country"
                  type="text"
                  name="country"
                  required
                  [(ngModel)]="formData.permanentAddress.country"
                  class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                  placeholder="India"
                />
              </div>

              <div>
                <label for="postalCode" class="block text-sm font-medium text-slate-700">Postal / Zip Code</label>
                <input
                  id="postalCode"
                  type="text"
                  name="postalCode"
                  required
                  [(ngModel)]="formData.permanentAddress.postalCode"
                  class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                  placeholder="400001"
                />
              </div>
            </div>
          </div>

          <!-- Document Upload -->
          <div class="border-t border-slate-100 pt-4 space-y-4">
            <h3 class="text-sm font-bold text-slate-900">Identification Document</h3>

            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label for="docType" class="block text-sm font-medium text-slate-700">Document Type</label>
                <select
                  id="docType"
                  name="documentType"
                  required
                  [(ngModel)]="formData.documentType"
                  class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition bg-white"
                >
                  <option value="Passport">Passport</option>
                  <option value="Aadhar-card">Aadhaar Card</option>
                  <option value="Driver License">Driver's License</option>
                  <option value="Pan-Card">PAN Card</option>
                </select>
              </div>

              <div>
                <label for="docNumber" class="block text-sm font-medium text-slate-700">Document Number</label>
                <input
                  id="docNumber"
                  type="text"
                  name="documentNumber"
                  required
                  [(ngModel)]="formData.documentNumber"
                  class="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                  placeholder="Enter unique ID number"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700">Upload Document Copy (JPG/PNG, max 5MB)</label>
              <input
                type="file"
                (change)="onFileSelected($event)"
                required
                accept="image/jpeg,image/png,image/webp"
                class="mt-1.5 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>
          </div>

          <div class="pt-2">
            <button
              type="submit"
              [disabled]="loading() || !documentFile"
              class="w-full rounded-lg bg-indigo-600 py-3 text-white font-semibold shadow-sm transition hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <svg *ngIf="loading()" class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ loading() ? 'Submitting KYC...' : 'Submit Verification' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class KycVerificationViewComponent {
  private readonly apiService = inject(ApiService);

  protected loading = signal(false);
  protected success = signal(false);
  protected error = signal('');
  protected documentFile: File | null = null;

  protected formData = {
    FullName: '',
    dateOfBirth: '',
    gender: 'Male',
    permanentAddress: {
      street: '',
      city: '',
      state: '',
      country: '',
      postalCode: ''
    },
    documentType: 'Aadhar-card',
    documentNumber: ''
  };

  protected onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.documentFile = file;
    }
  }

  protected handleSubmit(event: Event) {
    event.preventDefault();
    if (!this.documentFile) {
      this.error.set('Please upload a document image');
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.success.set(false);

    const payload = new FormData();
    payload.append('fullName', this.formData.FullName);
    payload.append('dateOfBirth', this.formData.dateOfBirth);
    payload.append('gender', this.formData.gender);
    payload.append('permanentAddress', JSON.stringify(this.formData.permanentAddress));
    payload.append('documentType', this.formData.documentType);
    payload.append('documentNumber', this.formData.documentNumber);
    payload.append('documentImg', this.documentFile);

    this.apiService.registerKyc(payload).subscribe({
      next: () => {
        this.success.set(true);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Failed to submit KYC. Please try again.');
      }
    });
  }
}
