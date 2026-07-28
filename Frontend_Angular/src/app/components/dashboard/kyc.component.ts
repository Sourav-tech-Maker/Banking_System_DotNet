import { Component, signal, inject, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-kyc-verification-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="mx-auto max-w-4xl space-y-6 pt-2">
      <!-- Loading State -->
      <div *ngIf="fetching()" class="py-12 flex flex-col items-center justify-center space-y-3">
        <svg class="animate-spin h-8 w-8 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Loading KYC & CIF Verification Status...</p>
      </div>

      <div *ngIf="!fetching()">
        <!-- 1. NOT SUBMITTED STATE: SBI PART-I CIF CREATION FORM -->
        <div *ngIf="kycStatus() === 'NOT_SUBMITTED'" class="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div class="flex items-center justify-between border-b border-slate-100 pb-5 dark:border-slate-800">
            <div>
              <div class="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                <span>🏛️ Yono Part-I Form</span>
                <span>•</span>
                <span>Customer Information Sheet (CIF Creation)</span>
              </div>
              <h2 class="mt-2 text-2xl font-bold text-slate-950 dark:text-white">KYC Verification & Identity Registration</h2>
              <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Complete your personal details, tax declarations, and document uploads to activate your banking identity.
              </p>
            </div>
          </div>

          <div *ngIf="error()" class="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
            {{ error() }}
          </div>

          <form (submit)="handleSubmit($event)" class="mt-6 space-y-8">
            
            <!-- SECTION 1: Personal & Demographics -->
            <div class="space-y-4">
              <h3 class="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span class="flex size-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">1</span>
                Personal Details
              </h3>

              <div>
                <label for="fullName" class="block text-sm font-medium text-slate-700 dark:text-slate-300">Full Name (As per ID Proof)*</label>
                <input
                  id="fullName"
                  type="text"
                  name="FullName"
                  required
                  [(ngModel)]="formData.FullName"
                  class="mt-1 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  placeholder="e.g. SOURAV SHARMA"
                />
              </div>

              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <label for="dob" class="block text-sm font-medium text-slate-700 dark:text-slate-300">Date of Birth*</label>
                  <input
                    id="dob"
                    type="date"
                    name="dateOfBirth"
                    required
                    [(ngModel)]="formData.dateOfBirth"
                    class="mt-1 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label for="gender" class="block text-sm font-medium text-slate-700 dark:text-slate-300">Gender*</label>
                  <select
                    id="gender"
                    name="gender"
                    required
                    [(ngModel)]="formData.gender"
                    class="mt-1 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Transgender">Transgender</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- SECTION 2: Permanent Address Details -->
            <div class="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-4">
              <h3 class="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span class="flex size-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">2</span>
                Permanent Address Details
              </h3>
              
              <div>
                <label for="street" class="block text-sm font-medium text-slate-700 dark:text-slate-300">Street / House / Flat No.*</label>
                <input
                  id="street"
                  type="text"
                  name="street"
                  required
                  [(ngModel)]="formData.permanentAddress.street"
                  class="mt-1 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  placeholder="Flat 402, Green Avenue, MG Road"
                />
              </div>

              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <label for="city" class="block text-sm font-medium text-slate-700 dark:text-slate-300">City / Village*</label>
                  <input
                    id="city"
                    type="text"
                    name="city"
                    required
                    [(ngModel)]="formData.permanentAddress.city"
                    class="mt-1 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    placeholder="Mumbai"
                  />
                </div>

                <div>
                  <label for="state" class="block text-sm font-medium text-slate-700 dark:text-slate-300">State / District*</label>
                  <input
                    id="state"
                    type="text"
                    name="state"
                    required
                    [(ngModel)]="formData.permanentAddress.state"
                    class="mt-1 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    placeholder="Maharashtra"
                  />
                </div>
              </div>

              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <label for="country" class="block text-sm font-medium text-slate-700 dark:text-slate-300">Country*</label>
                  <input
                    id="country"
                    type="text"
                    name="country"
                    required
                    [(ngModel)]="formData.permanentAddress.country"
                    class="mt-1 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    placeholder="India"
                  />
                </div>

                <div>
                  <label for="postalCode" class="block text-sm font-medium text-slate-700 dark:text-slate-300">PIN / Zip Code*</label>
                  <input
                    id="postalCode"
                    type="text"
                    name="postalCode"
                    required
                    [(ngModel)]="formData.permanentAddress.postalCode"
                    class="mt-1 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    placeholder="400001"
                  />
                </div>
              </div>
            </div>

            <!-- SECTION 3: Tax Identification — PAN Card vs Form 60 Conditional Logic -->
            <div class="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-4">
              <h3 class="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span class="flex size-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">3</span>
                Tax Compliance & Identification (PAN / Form 60)
              </h3>

              <!-- PAN Selection Radio -->
              <div class="rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/60 space-y-3">
                <span class="block text-sm font-semibold text-slate-900 dark:text-slate-200">
                  Do you possess a Permanent Account Number (PAN)?*
                </span>
                
                <div class="flex items-center gap-6">
                  <label class="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-200 cursor-pointer">
                    <input
                      type="radio"
                      name="hasPanToggle"
                      [value]="true"
                      [(ngModel)]="formData.hasPan"
                      class="size-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    Yes, I have a PAN Card
                  </label>

                  <label class="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-200 cursor-pointer">
                    <input
                      type="radio"
                      name="hasPanToggle"
                      [value]="false"
                      [(ngModel)]="formData.hasPan"
                      class="size-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    No, I do not have a PAN Card (Submit Form 60 Annexure-I)
                  </label>
                </div>
              </div>

              <!-- IF HAS PAN: Show PAN Number & Upload -->
              <div *ngIf="formData.hasPan" class="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/20 space-y-4">
                <div>
                  <label for="panNumber" class="block text-sm font-medium text-slate-700 dark:text-slate-300">PAN Card Number (10 Alphanumeric Characters)*</label>
                  <input
                    id="panNumber"
                    type="text"
                    name="panNumber"
                    required
                    maxlength="10"
                    [(ngModel)]="formData.panNumber"
                    (input)="formData.panNumber = formData.panNumber.toUpperCase()"
                    class="mt-1 block w-full uppercase font-mono tracking-widest rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    placeholder="ABCDE1234F"
                  />
                  <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">Format: 5 letters, 4 numbers, 1 letter (e.g., ABCDE1234F)</p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">Upload PAN Card Image Copy (Optional)</label>
                  <input
                    type="file"
                    (change)="onPanFileSelected($event)"
                    accept="image/jpeg,image/png,image/webp"
                    class="mt-1.5 block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 dark:file:bg-indigo-900 dark:file:text-indigo-300"
                  />
                </div>
              </div>

              <!-- IF NO PAN: Show Form 60 Fields -->
              <div *ngIf="!formData.hasPan" class="rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20 space-y-4">
                <div class="flex items-center gap-2 text-amber-800 dark:text-amber-300 text-sm font-bold">
                  <span>📜 Form 60 Declaration (Annexure-1) Required</span>
                </div>
                
                <div class="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label for="agriIncome" class="block text-sm font-medium text-slate-700 dark:text-slate-300">Estimated Agricultural Income (Annual Rs.)*</label>
                    <input
                      id="agriIncome"
                      type="number"
                      name="agriIncome"
                      required
                      [(ngModel)]="formData.form60.agriIncome"
                      class="mt-1 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label for="otherIncome" class="block text-sm font-medium text-slate-700 dark:text-slate-300">Estimated Non-Agricultural Income (Annual Rs.)*</label>
                    <input
                      id="otherIncome"
                      type="number"
                      name="otherIncome"
                      required
                      [(ngModel)]="formData.form60.otherIncome"
                      class="mt-1 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      placeholder="150000"
                    />
                  </div>
                </div>

                <div>
                  <label for="reasonNoPan" class="block text-sm font-medium text-slate-700 dark:text-slate-300">Reason for not having PAN Card*</label>
                  <input
                    id="reasonNoPan"
                    type="text"
                    name="reasonNoPan"
                    required
                    [(ngModel)]="formData.form60.reasonNoPan"
                    class="mt-1 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    placeholder="Income below taxable threshold / PAN application in progress"
                  />
                </div>
              </div>
            </div>

            <!-- SECTION 4: Mandatory Document & Specimen Uploads -->
            <div class="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-4">
              <h3 class="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span class="flex size-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">4</span>
                Identification Documents & Specimen Uploads
              </h3>

              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <label for="docType" class="block text-sm font-medium text-slate-700 dark:text-slate-300">Proof of Identity (OVD Type)*</label>
                  <select
                    id="docType"
                    name="documentType"
                    required
                    [(ngModel)]="formData.documentType"
                    class="mt-1 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="Aadhar-card">Aadhaar Card</option>
                    <option value="Passport">Passport</option>
                    <option value="Voter-Id">Voter Identity Card</option>
                    <option value="Driver-License">Driving License</option>
                    <option value="NREGA-Job-Card">NREGA Job Card</option>
                  </select>
                </div>

                <div>
                  <label for="docNumber" class="block text-sm font-medium text-slate-700 dark:text-slate-300">Document Identification Number*</label>
                  <input
                    id="docNumber"
                    type="text"
                    name="documentNumber"
                    required
                    [(ngModel)]="formData.documentNumber"
                    class="mt-1 block w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    placeholder="Enter document ID number"
                  />
                </div>
              </div>

              <!-- Upload Cards Grid -->
              <div class="grid gap-4 sm:grid-cols-3 pt-2">
                
                <!-- 1. POI Document Image Upload -->
                <div class="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center dark:border-slate-700 dark:bg-slate-900/60">
                  <span class="block text-xs font-bold text-slate-900 dark:text-slate-200">1. POI Document Copy*</span>
                  <div *ngIf="documentPreview" class="my-2 h-20 overflow-hidden rounded border border-slate-200">
                    <img [src]="documentPreview" class="h-full w-full object-cover" alt="Document Preview" />
                  </div>
                  <input
                    type="file"
                    (change)="onFileSelected($event)"
                    required
                    accept="image/jpeg,image/png,image/webp"
                    class="mt-2 block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-indigo-100 file:text-indigo-700"
                  />
                </div>

                <!-- 2. Passport Photo Upload -->
                <div class="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center dark:border-slate-700 dark:bg-slate-900/60">
                  <span class="block text-xs font-bold text-slate-900 dark:text-slate-200">2. Passport Size Photo</span>
                  <div *ngIf="photoPreview" class="my-2 h-20 overflow-hidden rounded border border-slate-200 flex justify-center">
                    <img [src]="photoPreview" class="h-full object-contain" alt="Photo Preview" />
                  </div>
                  <input
                    type="file"
                    (change)="onPhotoSelected($event)"
                    accept="image/jpeg,image/png,image/webp"
                    class="mt-2 block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-indigo-100 file:text-indigo-700"
                  />
                </div>

                <!-- 3. Specimen Signature Upload -->
                <div class="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center dark:border-slate-700 dark:bg-slate-900/60">
                  <span class="block text-xs font-bold text-slate-900 dark:text-slate-200">3. Specimen Signature</span>
                  <div *ngIf="signaturePreview" class="my-2 h-20 overflow-hidden rounded border border-slate-200 flex justify-center">
                    <img [src]="signaturePreview" class="h-full object-contain" alt="Signature Preview" />
                  </div>
                  <input
                    type="file"
                    (change)="onSignatureSelected($event)"
                    accept="image/jpeg,image/png,image/webp"
                    class="mt-2 block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-indigo-100 file:text-indigo-700"
                  />
                </div>

              </div>
            </div>

            <!-- Submit Button -->
            <div class="pt-4">
              <button
                type="submit"
                [disabled]="submitting() || !documentFile"
                class="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 py-3.5 text-white font-bold text-base shadow-md transition hover:brightness-110 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg *ngIf="submitting()" class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ submitting() ? 'Submitting Application & Documents...' : 'Submit Part-I Verification Application' }}
              </button>
            </div>
          </form>
        </div>

        <!-- 2. STATUS TRACKER VIEW (For PENDING, APPROVED, REJECTED) -->
        <div *ngIf="kycStatus() !== 'NOT_SUBMITTED'" class="space-y-6">
          
          <!-- TOP HEADER BAR WITH REFRESH -->
          <div class="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div class="flex items-center gap-3">
              <div class="flex size-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-lg">
                🛡️
              </div>
              <div>
                <h3 class="text-base font-extrabold text-slate-900 dark:text-white">KYC Verification Status Center</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400">Live regulatory compliance & CIF identity status tracker</p>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                (click)="fetchKycStatus()"
                [disabled]="fetching()"
                class="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
              >
                <svg [class.animate-spin]="fetching()" class="size-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh Status</span>
              </button>
            </div>
          </div>

          <!-- PROGRESS TIMELINE STEPPER -->
          <div class="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 space-y-4">
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Verification Lifecycle Progress</h4>
            
            <div class="grid gap-4 md:grid-cols-3 relative">
              
              <!-- STEP 1: Application Filed -->
              <div class="relative flex flex-col items-start rounded-xl border border-slate-100 bg-slate-50/80 p-4 dark:border-slate-800/80 dark:bg-slate-900/40">
                <div class="flex items-center gap-2 mb-2">
                  <span class="flex size-7 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white shadow-xs">
                    ✓
                  </span>
                  <span class="text-xs font-extrabold uppercase text-emerald-700 dark:text-emerald-400">Step 1: Submitted</span>
                </div>
                <h5 class="text-sm font-bold text-slate-900 dark:text-white">Part-I CIF Form Filed</h5>
                <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {{ kycData()?.submittedAt | date:'dd MMM yyyy, hh:mm a' }}
                </p>
              </div>

              <!-- STEP 2: Compliance Review -->
              <div 
                [ngClass]="{
                  'border-amber-300 bg-amber-50/70 dark:border-amber-800 dark:bg-amber-950/30': kycStatus() === 'PENDING',
                  'border-emerald-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/40': kycStatus() === 'APPROVED',
                  'border-rose-200 bg-rose-50/50 dark:border-rose-900/40 dark:bg-rose-950/30': kycStatus() === 'REJECTED'
                }"
                class="relative flex flex-col items-start rounded-xl border p-4 transition"
              >
                <div class="flex items-center gap-2 mb-2">
                  <span 
                    [ngClass]="{
                      'bg-amber-500 text-white animate-pulse': kycStatus() === 'PENDING',
                      'bg-emerald-500 text-white': kycStatus() === 'APPROVED',
                      'bg-rose-500 text-white': kycStatus() === 'REJECTED'
                    }"
                    class="flex size-7 items-center justify-center rounded-full text-xs font-bold shadow-xs"
                  >
                    {{ kycStatus() === 'APPROVED' ? '✓' : kycStatus() === 'REJECTED' ? '✕' : '2' }}
                  </span>
                  <span 
                    [ngClass]="{
                      'text-amber-700 dark:text-amber-300': kycStatus() === 'PENDING',
                      'text-emerald-700 dark:text-emerald-400': kycStatus() === 'APPROVED',
                      'text-rose-700 dark:text-rose-400': kycStatus() === 'REJECTED'
                    }"
                    class="text-xs font-extrabold uppercase"
                  >
                    Step 2: Audit Review
                  </span>
                </div>
                <h5 class="text-sm font-bold text-slate-900 dark:text-white">Document & Identity Check</h5>
                <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {{ kycStatus() === 'PENDING' ? 'Under active compliance verification' : kycStatus() === 'APPROVED' ? 'Verification successfully completed' : 'Application review rejected' }}
                </p>
              </div>

              <!-- STEP 3: Banking Activation -->
              <div 
                [ngClass]="{
                  'border-slate-100 bg-slate-50/40 dark:border-slate-800/50 dark:bg-slate-900/20 opacity-60': kycStatus() === 'PENDING',
                  'border-emerald-300 bg-emerald-50/70 dark:border-emerald-800 dark:bg-emerald-950/30': kycStatus() === 'APPROVED',
                  'border-rose-100 bg-slate-50/40 dark:border-slate-800/50 dark:bg-slate-900/20 opacity-60': kycStatus() === 'REJECTED'
                }"
                class="relative flex flex-col items-start rounded-xl border p-4 transition"
              >
                <div class="flex items-center gap-2 mb-2">
                  <span 
                    [ngClass]="{
                      'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300': kycStatus() === 'PENDING' || kycStatus() === 'REJECTED',
                      'bg-emerald-500 text-white': kycStatus() === 'APPROVED'
                    }"
                    class="flex size-7 items-center justify-center rounded-full text-xs font-bold shadow-xs"
                  >
                    {{ kycStatus() === 'APPROVED' ? '✓' : '🔒' }}
                  </span>
                  <span 
                    [ngClass]="{
                      'text-slate-500 dark:text-slate-400': kycStatus() === 'PENDING' || kycStatus() === 'REJECTED',
                      'text-emerald-700 dark:text-emerald-400': kycStatus() === 'APPROVED'
                    }"
                    class="text-xs font-extrabold uppercase"
                  >
                    Step 3: Activation
                  </span>
                </div>
                <h5 class="text-sm font-bold text-slate-900 dark:text-white">Account Creation Access</h5>
                <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {{ kycStatus() === 'APPROVED' ? 'Unlocked! Full banking rights enabled' : 'Requires approved identity verification' }}
                </p>
              </div>

            </div>
          </div>

          <!-- MAIN STATUS CARD -->
          <div
            [ngClass]="{
              'border-amber-200 bg-amber-50/60 dark:border-amber-900/50 dark:bg-amber-950/30': kycStatus() === 'PENDING',
              'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-emerald-950/30': kycStatus() === 'APPROVED',
              'border-rose-200 bg-rose-50/60 dark:border-rose-900/50 dark:bg-rose-950/30': kycStatus() === 'REJECTED'
            }"
            class="rounded-2xl border p-6 shadow-sm transition-all space-y-5"
          >
            <div class="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div class="flex items-center gap-2">
                  <span
                    [ngClass]="{
                      'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300': kycStatus() === 'PENDING',
                      'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300': kycStatus() === 'APPROVED',
                      'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300': kycStatus() === 'REJECTED'
                    }"
                    class="rounded-full px-3.5 py-1 text-xs font-extrabold uppercase tracking-wide shadow-xs"
                  >
                    {{ kycStatus() === 'PENDING' ? 'Under Compliance Review' : kycStatus() === 'APPROVED' ? 'Verified (CIF Active)' : 'Application Rejected' }}
                  </span>
                </div>

                <h2 class="mt-3 text-2xl font-extrabold text-slate-950 dark:text-white">
                  {{ kycStatus() === 'PENDING' ? 'SBI CIF & KYC Verification Pending' : kycStatus() === 'APPROVED' ? 'Identity & CIF Fully Verified' : 'KYC Application Rejected' }}
                </h2>
                
                <p class="mt-1.5 text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                  {{ kycStatus() === 'PENDING' ? 'Your  Part-I Customer Information Sheet (CIF) documents are safely stored and being reviewed by our compliance officers.' :
                     kycStatus() === 'APPROVED' ? 'Congratulations! Your identity has been verified in compliance with banking regulations. You can now open savings or current accounts.' :
                     'Your previous KYC application was rejected by compliance auditors.' }}
                </p>
              </div>

              <!-- CTA BUTTON FOR APPROVED -->
              <div *ngIf="kycStatus() === 'APPROVED'" class="shrink-0 pt-2 sm:pt-0">
                <button
                  type="button"
                  (click)="openAccount()"
                  class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-extrabold text-white shadow-md transition hover:bg-emerald-700 active:scale-95 cursor-pointer"
                >
                  <span>🏦 Open Bank Account</span>
                  <svg class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- REJECTION REASON & RESUBMISSION FLOW -->
            <div *ngIf="kycStatus() === 'REJECTED'" class="rounded-xl border border-rose-200 bg-rose-100/70 p-4 dark:border-rose-900/60 dark:bg-rose-950/50 space-y-3">
              <div class="flex items-start gap-3">
                <span class="text-lg">⚠️</span>
                <div>
                  <h4 class="text-xs font-bold uppercase tracking-wide text-rose-900 dark:text-rose-200">Rejection Feedback</h4>
                  <p class="mt-0.5 text-sm font-semibold text-rose-800 dark:text-rose-300">
                    {{ kycData()?.rejectReason || 'Document details did not match regulatory records.' }}
                  </p>
                </div>
              </div>

              <!-- Cooldown Status & Action -->
              <div class="pt-2 border-t border-rose-200/80 dark:border-rose-900/60 flex items-center justify-between flex-wrap gap-3">
                <span class="text-xs text-rose-700 dark:text-rose-300 font-medium">
                  <ng-container *ngIf="cooldownData()?.canResubmit">
                    ✅ Cooldown period complete. You can resubmit your application now.
                  </ng-container>
                  <ng-container *ngIf="!cooldownData()?.canResubmit">
                    ⏳ Cooldown active: Resubmission available in ~{{ cooldownData()?.remainingMinutes || 180 }} minutes.
                  </ng-container>
                </span>

                <button
                  type="button"
                  (click)="resubmitKyc()"
                  [disabled]="!cooldownData()?.canResubmit || resubmitting()"
                  class="rounded-xl bg-rose-600 px-4 py-2 text-xs font-extrabold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
                >
                  {{ resubmitting() ? 'Clearing Record...' : 'Clear & Resubmit Application' }}
                </button>
              </div>
            </div>

            <!-- SUBMITTED DETAILS SUMMARY ACCORDION / CARD -->
            <div class="border-t border-slate-200/70 dark:border-slate-800 pt-5 space-y-4">
              <div class="flex items-center justify-between">
                <h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Submitted Applicant Details Summary
                </h4>
                <button
                  type="button"
                  (click)="showDetails.set(!showDetails())"
                  class="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  {{ showDetails() ? 'Hide Details ▲' : 'Show Full Submitted Info ▼' }}
                </button>
              </div>

              <!-- Expanded Details View -->
              <div *ngIf="showDetails()" class="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/90 grid gap-4 sm:grid-cols-2 text-xs">
                <div>
                  <span class="block font-bold text-slate-400 dark:text-slate-500 uppercase text-[10px]">Full Name</span>
                  <span class="font-bold text-slate-900 dark:text-slate-100 text-sm">{{ kycData()?.fullName || 'N/A' }}</span>
                </div>

                <div>
                  <span class="block font-bold text-slate-400 dark:text-slate-500 uppercase text-[10px]">Date of Birth & Gender</span>
                  <span class="font-semibold text-slate-800 dark:text-slate-200">{{ kycData()?.dateOfBirth }} · {{ kycData()?.gender }}</span>
                </div>

                <div *ngIf="kycData()?.address">
                  <span class="block font-bold text-slate-400 dark:text-slate-500 uppercase text-[10px]">Permanent Address</span>
                  <span class="text-slate-700 dark:text-slate-300">
                    {{ kycData()?.address?.street }}, {{ kycData()?.address?.city }}, {{ kycData()?.address?.state }}, {{ kycData()?.address?.country }} - {{ kycData()?.address?.postalCode }}
                  </span>
                </div>

                <div *ngIf="kycData()?.document">
                  <span class="block font-bold text-slate-400 dark:text-slate-500 uppercase text-[10px]">Primary Identity Document</span>
                  <span class="font-bold text-slate-800 dark:text-slate-200">{{ kycData()?.document?.type }}</span>
                  <span class="block font-mono text-slate-600 dark:text-slate-400">{{ kycData()?.document?.number }}</span>
                </div>
              </div>

              <!-- Uploaded Documents Gallery -->
              <div *ngIf="kycData()?.documents?.length" class="pt-2">
                <h4 class="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Submitted Attachments Gallery</h4>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div *ngFor="let doc of kycData()?.documents" class="rounded-xl border border-slate-200 bg-white p-2 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <div class="h-20 overflow-hidden rounded bg-slate-100 flex items-center justify-center dark:bg-slate-950">
                      <img [src]="doc.imageUrl" class="max-h-full max-w-full object-contain" alt="{{ doc.type }}" />
                    </div>
                    <span class="mt-2 block text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">{{ doc.type }}</span>
                    <span class="text-[10px] text-slate-400 block truncate font-mono">{{ doc.number }}</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  `
})
export class KycVerificationViewComponent implements OnInit {
  private readonly apiService = inject(ApiService);

  @Output() navigateToOpenAccount = new EventEmitter<void>();

  fetching = signal(true);
  submitting = signal(false);
  resubmitting = signal(false);
  showDetails = signal(false);
  kycStatus = signal<'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED'>('NOT_SUBMITTED');
  kycData = signal<any>(null);
  cooldownData = signal<any>(null);
  error = signal<string | null>(null);

  documentFile: File | null = null;
  photoFile: File | null = null;
  signatureFile: File | null = null;
  panFile: File | null = null;

  documentPreview: string | null = null;
  photoPreview: string | null = null;
  signaturePreview: string | null = null;

  formData = {
    FullName: '',
    dateOfBirth: '',
    gender: 'Male',
    permanentAddress: {
      street: '',
      city: '',
      state: '',
      country: 'India',
      postalCode: ''
    },
    hasPan: true,
    panNumber: '',
    form60: {
      agriIncome: 0,
      otherIncome: 150000,
      reasonNoPan: 'Income below taxable threshold'
    },
    documentType: 'Aadhar-card',
    documentNumber: ''
  };

  ngOnInit(): void {
    this.fetchKycStatus();
  }

  fetchKycStatus(): void {
    this.fetching.set(true);
    this.apiService.getKycStatus().subscribe({
      next: (res: any) => {
        const rawStatus = (res?.status || 'NOT_SUBMITTED').toUpperCase();
        if (rawStatus === 'APPROVED') this.kycStatus.set('APPROVED');
        else if (rawStatus === 'REJECTED') this.kycStatus.set('REJECTED');
        else if (rawStatus === 'PENDING') this.kycStatus.set('PENDING');
        else this.kycStatus.set('NOT_SUBMITTED');

        this.kycData.set(res?.application || null);
        this.cooldownData.set(res?.cooldown || null);
        this.fetching.set(false);
      },
      error: () => {
        this.kycStatus.set('NOT_SUBMITTED');
        this.fetching.set(false);
      }
    });
  }

  resubmitKyc(): void {
    this.resubmitting.set(true);
    this.apiService.resubmitKyc().subscribe({
      next: () => {
        this.resubmitting.set(false);
        this.fetchKycStatus();
      },
      error: (err: any) => {
        this.resubmitting.set(false);
        this.error.set(err.error?.message || 'Failed to clear previous application.');
      }
    });
  }

  openAccount(): void {
    this.navigateToOpenAccount.emit();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.documentFile = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => this.documentPreview = e.target?.result as string;
      reader.readAsDataURL(this.documentFile);
    }
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.photoFile = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => this.photoPreview = e.target?.result as string;
      reader.readAsDataURL(this.photoFile);
    }
  }

  onSignatureSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.signatureFile = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => this.signaturePreview = e.target?.result as string;
      reader.readAsDataURL(this.signatureFile);
    }
  }

  onPanFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.panFile = input.files[0];
    }
  }

  handleSubmit(event: Event): void {
    event.preventDefault();
    this.error.set(null);

    if (this.formData.hasPan) {
      if (!this.formData.panNumber || this.formData.panNumber.length !== 10) {
        this.error.set('Please provide a valid 10-character PAN Card number.');
        return;
      }
    }

    if (!this.documentFile) {
      this.error.set('Please upload your Proof of Identity document image.');
      return;
    }

    this.submitting.set(true);

    const payload = new FormData();
    payload.append('fullName', this.formData.FullName);
    payload.append('dateOfBirth', this.formData.dateOfBirth);
    payload.append('gender', this.formData.gender);
    payload.append('permanentAddress', JSON.stringify(this.formData.permanentAddress));
    payload.append('documentType', this.formData.documentType);
    payload.append('documentNumber', this.formData.documentNumber);
    payload.append('hasPan', this.formData.hasPan ? 'true' : 'false');

    if (this.formData.hasPan) {
      payload.append('panNumber', this.formData.panNumber);
      if (this.panFile) payload.append('panImg', this.panFile);
    } else {
      payload.append('form60Details', JSON.stringify(this.formData.form60));
    }

    if (this.documentFile) payload.append('documentImg', this.documentFile);
    if (this.photoFile) payload.append('photoImg', this.photoFile);
    if (this.signatureFile) payload.append('signatureImg', this.signatureFile);

    this.apiService.registerKyc(payload).subscribe({
      next: () => {
        this.submitting.set(false);
        this.fetchKycStatus();
      },
      error: (err: any) => {
        this.submitting.set(false);
        this.error.set(err.error?.message || 'Failed to submit KYC verification application.');
      }
    });
  }
}
