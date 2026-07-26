import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  const stored = sessionStorage.getItem('YONO AppUser');
  
  if (stored) {
    try {
      const user = JSON.parse(stored);
      if (user && (user.role === 'admin' || user.role === 'systemUser')) {
        return true;
      }
    } catch {}
  }
  
  router.navigate(['/home']);
  return false;
};
