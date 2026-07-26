import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const stored = sessionStorage.getItem('YONO AppUser');
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  
  if (stored) {
    try {
      const user = JSON.parse(stored);
      if (user && (user.id || user.email || user.username || user.accessToken || token)) {
        return true;
      }
    } catch {}
  }

  if (token) {
    return true;
  }
  
  router.navigate(['/login']);
  return false;
};
