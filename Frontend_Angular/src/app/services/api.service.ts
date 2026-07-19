import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:5065'; // Matches the C# backend HTTP port


  private getOptions() {
    return {
      withCredentials: true
    };
  }

  // --- Auth APIs ---
  register(body: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/auth/register`, body, this.getOptions());
  }

  login(body: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/auth/login`, body, this.getOptions());
  }

  verifyOtp(body: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/auth/verify-otp`, body, this.getOptions());
  }

  resendOtp(body: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/auth/resend-otp`, body, this.getOptions());
  }

  logout(): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/auth/logout`, {}, this.getOptions());
  }

  refreshToken(): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/auth/refresh-token`, {}, this.getOptions());
  }

  // --- Profile / User ---
  getProfile(): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/user/profile`, this.getOptions());
  }

  // --- Dashboard ---
  getDashboard(): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/dashboard`, this.getOptions());
  }

  // --- Accounts ---
  createAccount(): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/account`, {}, this.getOptions());
  }

  getAccountDetails(): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/account`, this.getOptions());
  }

  getAccountBalance(accountId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/account/balance/${accountId}`, this.getOptions());
  }

  // --- Transactions / Transfers ---
  createTransaction(body: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/transaction`, body, this.getOptions());
  }

  createInitialFunds(body: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/transaction/system/initial-funds`, body, this.getOptions());
  }

  getTransactionHistory(paramsObj: any): Observable<any> {
    let params = new HttpParams();
    if (paramsObj.page) params = params.set('page', paramsObj.page.toString());
    if (paramsObj.limit) params = params.set('limit', paramsObj.limit.toString());
    if (paramsObj.type) params = params.set('type', paramsObj.type);
    if (paramsObj.startDate) params = params.set('startDate', paramsObj.startDate);
    if (paramsObj.endDate) params = params.set('endDate', paramsObj.endDate);

    return this.http.get(`${this.baseUrl}/api/transaction/history`, {
      ...this.getOptions(),
      params
    });
  }

  // --- Beneficiaries ---
  addBeneficiary(body: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/beneficiary/add-beneficiary`, body, this.getOptions());
  }

  verifyBeneficiary(body: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/beneficiary/verify`, body, this.getOptions());
  }

  getBeneficiaries(): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/beneficiary/get-beneficiary`, this.getOptions());
  }

  deleteBeneficiary(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/api/beneficiary/${id}`, this.getOptions());
  }

  // --- Savings Goals ---
  createGoal(body: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/goals`, body, this.getOptions());
  }

  getGoals(): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/goals`, this.getOptions());
  }

  addGoalAmount(body: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/goals/add-amount`, body, this.getOptions());
  }

  getGoalHistory(goalId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/goals/history/${goalId}`, this.getOptions());
  }

  deleteGoal(goalId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/api/goals/${goalId}`, this.getOptions());
  }

  // --- KYC ---
  registerKyc(formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/Kyc/register-kyc`, formData, this.getOptions());
  }

  // --- Admin ---
  getAdminKycApplications(status?: string): Observable<any> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get(`${this.baseUrl}/api/admin/kyc-applications`, {
      ...this.getOptions(),
      params
    });
  }

  getAdminStats(): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/admin/stats`, this.getOptions());
  }

  getAdminUsers(): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/admin/users`, this.getOptions());
  }

  updateUserStatus(userId: string, status: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/api/admin/users/${userId}/status`, { status }, this.getOptions());
  }

  resetUserLogins(userId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/admin/users/${userId}/reset-attempts`, {}, this.getOptions());
  }

  updateAccountStatus(accountId: string, status: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/api/admin/accounts/${accountId}/status`, { status }, this.getOptions());
  }

  getAdminTransactions(): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/admin/transactions`, this.getOptions());
  }

  reverseTransaction(transactionId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/admin/transactions/${transactionId}/reverse`, {}, this.getOptions());
  }

  verifyKyc(body: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/Kyc/verify-kyc`, body, this.getOptions());
  }

  deleteKycApplication(kycId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/api/admin/kyc/${kycId}`, this.getOptions());
  }
}
