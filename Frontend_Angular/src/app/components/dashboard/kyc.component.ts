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
                  placeholder="e.g. SORAV"
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

              <!-- IF NO PAN: Show Official Form 60 (Annexure-1 / Rule 114B) Fields -->
              <div *ngIf="!formData.hasPan" class="rounded-2xl border-2 border-amber-300 bg-amber-50/40 p-5 sm:p-6 dark:border-amber-800/80 dark:bg-amber-950/20 space-y-6">
                
                <!-- Form 60 Government Title Header -->
                <div class="border-b border-amber-200/80 pb-4 dark:border-amber-800/60">
                  <div class="inline-flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-800 dark:text-amber-300">
                    📜 FORM NO. 60 [See second proviso to rule 114B]
                  </div>
                  <h4 class="mt-2 text-base font-bold text-slate-900 dark:text-white">
                    Declaration to be filed by an individual who does not have a Permanent Account Number (PAN)
                  </h4>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Enter all 24 required fields specified under Income-tax Rules, 1962.
                  </p>
                </div>

                <!-- 1. Declarant Name Breakdown (Items 1 - 2) -->
                <div class="space-y-3">
                  <h5 class="text-xs font-extrabold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                    1. Name of Declarant & Date of Birth
                  </h5>
                  <div class="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label class="block text-xs font-medium text-slate-700 dark:text-slate-300">First Name*</label>
                      <input
                        type="text"
                        name="f60_firstName"
                        required
                        [(ngModel)]="formData.form60.firstName"
                        class="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        placeholder="SOURAV"
                      />
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-slate-700 dark:text-slate-300">Middle Name</label>
                      <input
                        type="text"
                        name="f60_middleName"
                        [(ngModel)]="formData.form60.middleName"
                        class="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        placeholder="KUMAR"
                      />
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-slate-700 dark:text-slate-300">Surname / Last Name*</label>
                      <input
                        type="text"
                        name="f60_surname"
                        required
                        [(ngModel)]="formData.form60.surname"
                        class="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        placeholder="SHARMA"
                      />
                    </div>
                  </div>

                  <div>
                    <label class="block text-xs font-medium text-slate-700 dark:text-slate-300">2. Date of Birth / Incorporation*</label>
                    <input
                      type="date"
                      name="f60_dob"
                      required
                      [(ngModel)]="formData.form60.dob"
                      class="mt-1 block w-full sm:w-1/2 rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <!-- 2. Father's Name Breakdown (Item 3) -->
                <div class="space-y-3 border-t border-amber-200/50 pt-4 dark:border-amber-900/50">
                  <h5 class="text-xs font-extrabold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                    3. Father's Name (In case of individual)
                  </h5>
                  <div class="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label class="block text-xs font-medium text-slate-700 dark:text-slate-300">Father's First Name*</label>
                      <input
                        type="text"
                        name="f60_fatherFirstName"
                        required
                        [(ngModel)]="formData.form60.fatherFirstName"
                        class="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        placeholder="Father Name"
                      />
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-slate-700 dark:text-slate-300">Father's Middle Name</label>
                      <input
                        type="text"
                        name="f60_fatherMiddleName"
                        [(ngModel)]="formData.form60.fatherMiddleName"
                        class="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        placeholder="CHANDRA"
                      />
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-slate-700 dark:text-slate-300">Father's Surname*</label>
                      <input
                        type="text"
                        name="f60_fatherSurname"
                        required
                        [(ngModel)]="formData.form60.fatherSurname"
                        class="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        placeholder="SHARMA"
                      />
                    </div>
                  </div>
                </div>

                <!-- 3. Address Details (Items 4 - 12) -->
                <div class="space-y-3 border-t border-amber-200/50 pt-4 dark:border-amber-900/50">
                  <h5 class="text-xs font-extrabold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                    4-12. Declarant Address Details
                  </h5>
                  <div class="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label class="block text-xs font-medium text-slate-700 dark:text-slate-300">4. Flat / Room No.*</label>
                      <input
                        type="text"
                        name="f60_flatRoomNo"
                        required
                        [(ngModel)]="formData.form60.flatRoomNo"
                        class="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        placeholder="Flat 402"
                      />
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-slate-700 dark:text-slate-300">5. Name of Premises</label>
                      <input
                        type="text"
                        name="f60_premisesName"
                        [(ngModel)]="formData.form60.premisesName"
                        class="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        placeholder="Green Heights"
                      />
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-slate-700 dark:text-slate-300">6. Block Name / No.</label>
                      <input
                        type="text"
                        name="f60_blockNo"
                        [(ngModel)]="formData.form60.blockNo"
                        class="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        placeholder="Block B"
                      />
                    </div>
                  </div>

                  <div class="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label class="block text-xs font-medium text-slate-700 dark:text-slate-300">7. Road / Street / Lane*</label>
                      <input
                        type="text"
                        name="f60_roadStreetLane"
                        required
                        [(ngModel)]="formData.form60.roadStreetLane"
                        class="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        placeholder="MG Road"
                      />
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-slate-700 dark:text-slate-300">8. Area / Locality*</label>
                      <input
                        type="text"
                        name="f60_areaLocality"
                        required
                        [(ngModel)]="formData.form60.areaLocality"
                        class="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        placeholder="Bandra West"
                      />
                    </div>
                  </div>

                  <div class="grid gap-3 sm:grid-cols-4">
                    <div>
                      <label class="block text-xs font-medium text-slate-700 dark:text-slate-300">9. Town / City*</label>
                      <input
                        type="text"
                        name="f60_townCity"
                        required
                        [(ngModel)]="formData.form60.townCity"
                        class="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        placeholder="Mumbai"
                      />
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-slate-700 dark:text-slate-300">10. District*</label>
                      <input
                        type="text"
                        name="f60_district"
                        required
                        [(ngModel)]="formData.form60.district"
                        class="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        placeholder="Mumbai Suburban"
                      />
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-slate-700 dark:text-slate-300">11. State*</label>
                      <input
                        type="text"
                        name="f60_state"
                        required
                        [(ngModel)]="formData.form60.state"
                        class="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        placeholder="Maharashtra"
                      />
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-slate-700 dark:text-slate-300">12. Pin Code*</label>
                      <input
                        type="text"
                        name="f60_pinCode"
                        required
                        [(ngModel)]="formData.form60.pinCode"
                        class="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        placeholder="400050"
                      />
                    </div>
                  </div>
                </div>

                <!-- 4. Contact Details (Items 13 - 15) -->
                <div class="space-y-3 border-t border-amber-200/50 pt-4 dark:border-amber-900/50">
                  <h5 class="text-xs font-extrabold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                    13-15. Contact Details
                  </h5>
                  <div class="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label class="block text-xs font-medium text-slate-700 dark:text-slate-300">13-14. Telephone No. (With STD Code)</label>
                      <input
                        type="text"
                        name="f60_telephoneStd"
                        [(ngModel)]="formData.form60.telephoneStd"
                        class="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        placeholder="022-26543210"
                      />
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-slate-700 dark:text-slate-300">15. Mobile Number*</label>
                      <input
                        type="text"
                        name="f60_mobileNumber"
                        required
                        [(ngModel)]="formData.form60.mobileNumber"
                        class="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        placeholder="9876543210"
                      />
                    </div>
                  </div>
                </div>

                <!-- 5. Transaction Details (Items 16 - 19) -->
                <div class="space-y-3 border-t border-amber-200/50 pt-4 dark:border-amber-900/50">
                  <h5 class="text-xs font-extrabold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                    16-19. Transaction Particulars
                  </h5>
                  <div class="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label class="block text-xs font-medium text-slate-700 dark:text-slate-300">16. Amount of Transaction (Rs.)*</label>
                      <input
                        type="number"
                        name="f60_transactionAmount"
                        required
                        [(ngModel)]="formData.form60.transactionAmount"
                        class="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        placeholder="50000"
                      />
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-slate-700 dark:text-slate-300">17. Date of Transaction*</label>
                      <input
                        type="date"
                        name="f60_transactionDate"
                        required
                        [(ngModel)]="formData.form60.transactionDate"
                        class="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-slate-700 dark:text-slate-300">18. Number of Joint Persons</label>
                      <input
                        type="number"
                        name="f60_jointPersonsCount"
                        min="1"
                        [(ngModel)]="formData.form60.jointPersonsCount"
                        class="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        placeholder="1"
                      />
                    </div>
                  </div>

                  <div>
                    <label class="block text-xs font-medium text-slate-700 dark:text-slate-300">19. Mode of Transaction*</label>
                    <select
                      name="f60_transactionMode"
                      required
                      [(ngModel)]="formData.form60.transactionMode"
                      class="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    >
                      <option value="Cash">Cash</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Card">Card</option>
                      <option value="Draft/Banker's Cheque">Draft/Banker's Cheque</option>
                      <option value="Online transfer">Online transfer</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <!-- 6. Aadhaar & PAN Application Status (Items 20 - 21) -->
                <div class="space-y-3 border-t border-amber-200/50 pt-4 dark:border-amber-900/50">
                  <h5 class="text-xs font-extrabold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                    20-21. Aadhaar & Pending PAN Application Details
                  </h5>
                  <div>
                    <label class="block text-xs font-medium text-slate-700 dark:text-slate-300">20. Aadhaar Number (Issued by UIDAI, 12 Digits)</label>
                    <input
                      type="text"
                      name="f60_aadhaarNumber"
                      maxlength="12"
                      [(ngModel)]="formData.form60.aadhaarNumber"
                      class="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono tracking-wider text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      placeholder="123456789012"
                    />
                  </div>

                  <div class="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label class="block text-xs font-medium text-slate-700 dark:text-slate-300">21a. PAN Application Date (If applied)</label>
                      <input
                        type="date"
                        name="f60_panAppliedDate"
                        [(ngModel)]="formData.form60.panAppliedDate"
                        class="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-slate-700 dark:text-slate-300">21b. PAN Application Ack Number</label>
                      <input
                        type="text"
                        name="f60_panAckNumber"
                        [(ngModel)]="formData.form60.panAckNumber"
                        class="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        placeholder="N-123456789012345"
                      />
                    </div>
                  </div>
                </div>

                <!-- 7. Income Breakdown (Item 22) -->
                <div class="space-y-3 border-t border-amber-200/50 pt-4 dark:border-amber-900/50">
                  <h5 class="text-xs font-extrabold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                    22. Estimated Financial Year Income (Sec 64 Income-tax Act)
                  </h5>
                  <div class="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label class="block text-xs font-medium text-slate-700 dark:text-slate-300">22a. Agricultural Income (Annual Rs.)*</label>
                      <input
                        type="number"
                        name="f60_agriIncome"
                        required
                        [(ngModel)]="formData.form60.agriIncome"
                        class="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-slate-700 dark:text-slate-300">22b. Non-Agricultural Income (Annual Rs.)*</label>
                      <input
                        type="number"
                        name="f60_otherIncome"
                        required
                        [(ngModel)]="formData.form60.otherIncome"
                        class="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        placeholder="150000"
                      />
                    </div>
                  </div>
                </div>

                <!-- 8. Verification & Legal Declaration -->
                <div class="space-y-3 border-t border-amber-200/50 pt-4 dark:border-amber-900/50">
                  <h5 class="text-xs font-extrabold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                    Official Verification Declaration
                  </h5>
                  <div class="p-3 rounded-xl bg-amber-100/60 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-900/50 text-[11px] leading-relaxed text-amber-950 dark:text-amber-200">
                    I hereby declare that what is stated above is true to the best of my knowledge and belief. I further declare that I do not have a Permanent Account Number (PAN) and my estimated total income for the financial year is less than the maximum amount chargeable to tax.
                  </div>

                  <div class="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label class="block text-xs font-medium text-slate-700 dark:text-slate-300">Verification Place*</label>
                      <input
                        type="text"
                        name="f60_verificationPlace"
                        required
                        [(ngModel)]="formData.form60.verificationPlace"
                        class="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        placeholder="Mumbai"
                      />
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-slate-700 dark:text-slate-300">Verification Date*</label>
                      <input
                        type="date"
                        name="f60_verificationDate"
                        required
                        [(ngModel)]="formData.form60.verificationDate"
                        class="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
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
      firstName: '',
      middleName: '',
      surname: '',
      dob: '',
      fatherFirstName: '',
      fatherMiddleName: '',
      fatherSurname: '',
      flatRoomNo: '',
      premisesName: '',
      blockNo: '',
      roadStreetLane: '',
      areaLocality: '',
      townCity: '',
      district: '',
      state: '',
      pinCode: '',
      telephoneStd: '',
      mobileNumber: '',
      transactionAmount: 50000,
      transactionDate: new Date().toISOString().split('T')[0],
      jointPersonsCount: 1,
      transactionMode: 'Online transfer',
      aadhaarNumber: '',
      panAppliedDate: '',
      panAckNumber: '',
      agriIncome: 0,
      otherIncome: 150000,
      verificationPlace: 'Mumbai',
      verificationDate: new Date().toISOString().split('T')[0]
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
    } else {
      // Auto-sync Form 60 defaults from main form fields if blank
      const parts = (this.formData.FullName || '').trim().split(' ');
      if (!this.formData.form60.firstName && parts.length > 0) this.formData.form60.firstName = parts[0];
      if (!this.formData.form60.surname && parts.length > 1) this.formData.form60.surname = parts[parts.length - 1];
      if (!this.formData.form60.dob) this.formData.form60.dob = this.formData.dateOfBirth;
      if (!this.formData.form60.flatRoomNo) this.formData.form60.flatRoomNo = this.formData.permanentAddress.street;
      if (!this.formData.form60.roadStreetLane) this.formData.form60.roadStreetLane = this.formData.permanentAddress.street;
      if (!this.formData.form60.areaLocality) this.formData.form60.areaLocality = this.formData.permanentAddress.city;
      if (!this.formData.form60.townCity) this.formData.form60.townCity = this.formData.permanentAddress.city;
      if (!this.formData.form60.district) this.formData.form60.district = this.formData.permanentAddress.city;
      if (!this.formData.form60.state) this.formData.form60.state = this.formData.permanentAddress.state;
      if (!this.formData.form60.pinCode) this.formData.form60.pinCode = this.formData.permanentAddress.postalCode;
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
