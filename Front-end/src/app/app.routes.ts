import { Routes } from '@angular/router';
import { authGuard } from './services/auth.guard';

export const appRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/check-in/check-in.component').then(({ CheckInComponent }) => CheckInComponent)
  },
  {
    path: 'admin/login',
    loadComponent: () => import('./pages/admin/admin-login.component').then(({ AdminLoginComponent }) => AdminLoginComponent)
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/admin/admin.component').then(({ AdminComponent }) => AdminComponent)
  },
  { path: '**', redirectTo: '' }
];