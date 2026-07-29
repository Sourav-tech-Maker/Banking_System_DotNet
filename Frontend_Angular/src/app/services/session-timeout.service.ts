import { Injectable, inject, NgZone, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class SessionTimeoutService {
  private readonly router = inject(Router);
  private readonly apiService = inject(ApiService);
  private readonly ngZone = inject(NgZone);

  public readonly timeoutMinutes = signal<number>(15);
  public readonly remainingSeconds = signal<number>(15 * 60);
  private countdownInterval: any = null;
  private isListening = false;
  private expiryTimestamp: number = 0;

  public readonly isExpiringSoon = computed(() => this.remainingSeconds() <= 60 && this.remainingSeconds() > 0);

  public readonly remainingTimeFormatted = computed(() => {
    const totalSecs = this.remainingSeconds();
    if (totalSecs <= 0) return '00:00';
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const mm = mins < 10 ? `0${mins}` : `${mins}`;
    const ss = secs < 10 ? `0${secs}` : `${secs}`;
    return `${mm}:${ss}`;
  });

  constructor() {
    this.loadSavedSettings();
  }

  public updateTimeout(minutes: number) {
    const validMinutes = Math.max(1, minutes);
    this.timeoutMinutes.set(validMinutes);
    this.resetTimer();
  }

  public resetTimer() {
    this.expiryTimestamp = Date.now() + this.timeoutMinutes() * 60 * 1000;
    sessionStorage.setItem('yono_session_expiry', this.expiryTimestamp.toString());
    this.updateRemainingSeconds();
  }

  public extendSession() {
    this.resetTimer();
  }

  public startMonitoring() {
    this.loadSavedSettings();

    // Check if an existing expiry timestamp is stored in sessionStorage
    const storedExpiry = sessionStorage.getItem('yono_session_expiry');
    if (storedExpiry) {
      const parsedExpiry = parseInt(storedExpiry, 10);
      if (!isNaN(parsedExpiry) && parsedExpiry > Date.now()) {
        this.expiryTimestamp = parsedExpiry;
      } else {
        this.resetTimer();
      }
    } else {
      this.resetTimer();
    }

    this.updateRemainingSeconds();

    if (!this.isListening) {
      this.isListening = true;
      this.startCountdown();
    }
  }

  public stopMonitoring() {
    this.isListening = false;
    this.stopCountdown();
    sessionStorage.removeItem('yono_session_expiry');
  }

  private updateRemainingSeconds() {
    if (this.expiryTimestamp <= 0) return;
    const diffMs = this.expiryTimestamp - Date.now();
    const secs = Math.max(0, Math.floor(diffMs / 1000));
    this.remainingSeconds.set(secs);
  }

  private startCountdown() {
    this.stopCountdown();
    this.countdownInterval = setInterval(() => {
      this.updateRemainingSeconds();
      if (this.remainingSeconds() <= 0) {
        this.stopCountdown();
        this.triggerLogout();
      }
    }, 1000);
  }

  private stopCountdown() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  private triggerLogout() {
    this.ngZone.run(() => {
      this.stopMonitoring();
      this.apiService.logout();
      this.router.navigate(['/login'], {
        queryParams: { timeout: 'true' }
      });
    });
  }

  public loadSavedSettings() {
    const savedSettingsStr = localStorage.getItem('yono_settings');
    if (savedSettingsStr) {
      try {
        const parsed = JSON.parse(savedSettingsStr);
        if (parsed?.sessionTimeout && typeof parsed.sessionTimeout === 'number') {
          this.timeoutMinutes.set(parsed.sessionTimeout);
        }
      } catch {
        // ignore
      }
    }
  }
}
