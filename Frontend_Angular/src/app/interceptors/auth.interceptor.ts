import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { ApiService } from '../services/api.service';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<boolean | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const apiService = inject(ApiService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/refresh-token') && !req.url.includes('/auth/login')) {
        if (!isRefreshing) {
          isRefreshing = true;
          refreshTokenSubject.next(null);

          return apiService.refreshToken().pipe(
            switchMap((res) => {
              isRefreshing = false;
              refreshTokenSubject.next(true);

              if (res?.accessToken) {
                const newToken = res.accessToken;
                localStorage.setItem('token', newToken);
                sessionStorage.setItem('token', newToken);
                const stored = sessionStorage.getItem('YONO AppUser');
                if (stored) {
                  try {
                    const user = JSON.parse(stored);
                    user.accessToken = newToken;
                    sessionStorage.setItem('YONO AppUser', JSON.stringify(user));
                  } catch {}
                }
                const clonedReq = req.clone({
                  setHeaders: { Authorization: `Bearer ${newToken}` }
                });
                return next(clonedReq);
              }

              return next(req);
            }),
            catchError((refreshError) => {
              isRefreshing = false;
              refreshTokenSubject.next(false);

              // Clear ALL auth state to prevent stale-token loops
              sessionStorage.removeItem('YONO AppUser');
              localStorage.removeItem('token');
              sessionStorage.removeItem('token');

              router.navigate(['/login']);
              return throwError(() => refreshError);
            })
          );
        } else {
          // Another refresh is already in progress — wait for it to complete
          // then replay this request
          return refreshTokenSubject.pipe(
            filter((result) => result !== null),
            take(1),
            switchMap((success) => {
              if (success) {
                return next(req);
              }
              return throwError(() => error);
            })
          );
        }
      }
      return throwError(() => error);
    })
  );
};
