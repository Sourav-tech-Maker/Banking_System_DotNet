import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'register', pathMatch: 'full' },
  {
    path: 'register',
    loadComponent: () => import('./components/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'verify-otp',
    loadComponent: () => import('./components/verify-user.component').then(m => m.VerifyUserComponent)
  },
  {
    path: 'home',
    loadComponent: () => import('./components/home.component').then(m => m.HomeComponent)
  },
  { path: '**', redirectTo: 'home' }
];
