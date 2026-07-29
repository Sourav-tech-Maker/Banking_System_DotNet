import { Injectable, inject, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class SessionTimeoutService {
  private readonly router = inject(Router);
  private readonly apiService = inject(ApiService);
  private readonly ngZone = inject(NgZone);

  private timeoutMinutes = 15;
  private timerId: any = null;
  private isListening = false;

  private readonly userActivityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];

  constructor() {
    this.initTimeoutValue();
  }

  public updateTimeout(minutes: number) {
    this.timeoutMinutes = Math.max(1, minutes);
    this.resetTimer();
  }

  public startMonitoring() {
    if (this.isListening) return;
    this.isListening = true;

    this.initTimeoutValue();

    this.ngZone.runOutsideAngular(() => {
      this.userActivityEvents.forEach(event => {
        window.addEventListener(event, this.handleUserActivity, { passive: true });
      });
    });

    this.resetTimer();
  }

  public stopMonitoring() {
    if (!this.isListening) return;
    this.isListening = false;

    this.userActivityEvents.forEach(event => {
      window.removeEventListener(event, this.handleUserActivity);
    });

    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  private handleUserActivity = () => {
    this.resetTimer();
  };

  private resetTimer() {
    if (this.timerId) {
      clearTimeout(this.timerId);
    }

    const timeoutMs = this.timeoutMinutes * 60 * 1000;

    this.ngZone.runOutsideAngular(() => {
      this.timerId = setTimeout(() => {
        this.triggerLogout();
      }, timeoutMs);
    });
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

  private initTimeoutValue() {
    const savedSettingsStr = localStorage.getItem('yono_settings');
    if (savedSettingsStr) {
      try {
        const parsed = JSON.parse(savedSettingsStr);
        if (parsed?.sessionTimeout && typeof parsed.sessionTimeout === 'number') {
          this.timeoutMinutes = parsed.sessionTimeout;
        }
      } catch {
        // ignore
      }
    }
  }
}
