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
    let headers = new HttpHeaders();
    const stored = sessionStorage.getItem('YONO AppUser');
    let token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token && stored) {
      try {
        const u = JSON.parse(stored);
        token = u.accessToken || u.token;
      } catch {}
    }
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return {
      headers,
      withCredentials: true
    };
  }

  private getPublicOptions() {
    return { withCredentials: true };
  }

  // --- Auth APIs ---
  register(body: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/auth/register`, body, this.getPublicOptions());
  }

  login(body: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/auth/login`, body, this.getPublicOptions());
  }

  verifyOtp(body: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/auth/verify-otp`, body, this.getPublicOptions());
  }

  resendOtp(body: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/auth/resend-otp`, body, this.getPublicOptions());
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

  // Profile Update
  updateProfile(body: { username: string }): Observable<any> {
    return this.http.put(`${this.baseUrl}/api/user/profile`, body, this.getOptions());
  }

  // Password Change
  changePassword(body: { currentPassword: string; newPassword: string }): Observable<any> {
    return this.http.put(`${this.baseUrl}/api/user/password`, body, this.getOptions());
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
  initiateTransfer(body: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/transaction/initiate-transfer`, body, this.getOptions());
  }

  confirmTransferWithOtp(body: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/transaction/confirm-transfer`, body, this.getOptions());
  }

  resendTransferOtp(body: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/transaction/resend-otp`, body, this.getOptions());
  }

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

  depositToGoal(goalId: string, amount: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/goals/add-amount`, { goalId, amount }, this.getOptions());
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

  getKycStatus(): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/Kyc/status`, this.getOptions());
  }

  resubmitKyc(): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/Kyc/resubmit`, {}, this.getOptions());
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

  // Admin Audit Log
  getAdminAuditLog(page: number = 1): Observable<any> {
    const params = new HttpParams().set('page', page.toString()).set('limit', '20');
    return this.http.get(`${this.baseUrl}/api/admin/audit-log`, { ...this.getOptions(), params });
  }

  // --- SystemUser Console APIs ---
  getSystemHealth(): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/system/health`, this.getOptions());
  }

  getSystemAccounts(): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/system/accounts`, this.getOptions());
  }

  createSystemAccount(body: { accountType?: string; currencyCode?: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/system/accounts`, body, this.getOptions());
  }

  systemInternalTransfer(body: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/system/transactions/internal-transfer`, body, this.getOptions());
  }

  systemOperationalTransfer(body: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/system/transactions/operational-transfer`, body, this.getOptions());
  }

  getSystemLedgerReconciliation(): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/system/ledger`, this.getOptions());
  }

  getSystemSettings(): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/system/settings`, this.getOptions());
  }

  updateSystemSettings(body: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/api/system/settings`, body, this.getOptions());
  }

  getSystemSecurityEvents(page: number = 1, pageSize: number = 20): Observable<any> {
    const params = new HttpParams().set('page', page.toString()).set('pageSize', pageSize.toString());
    return this.http.get(`${this.baseUrl}/api/system/security/events`, { ...this.getOptions(), params });
  }

  unlockCustomerAccount(targetUserId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/system/security/unlock-user/${targetUserId}`, {}, this.getOptions());
  }

  getSystemAuditLogs(action?: string, page: number = 1, pageSize: number = 20): Observable<any> {
    let params = new HttpParams().set('page', page.toString()).set('pageSize', pageSize.toString());
    if (action) params = params.set('action', action);
    return this.http.get(`${this.baseUrl}/api/system/audit`, { ...this.getOptions(), params });
  }
}
