import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AdminLoginResponse {
  access_token: string;
  token_type: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly tokenKey = 'barber_admin_token';
  private expirationTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    this.restoreSession();
  }

  login(email: string, password: string): Observable<AdminLoginResponse> {
    return this.http.post<AdminLoginResponse>(`${environment.apiUrl}/api/admin/login`, { email, password }).pipe(
      tap(({ access_token }) => {
        localStorage.setItem(this.tokenKey, access_token);
        this.scheduleExpiration(access_token);
      })
    );
  }

  isAuthenticated(): boolean {
    const token = this.token();
    if (!token || this.isExpired(token)) {
      this.logout();
      return false;
    }
    return true;
  }

  token(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    if (this.expirationTimer) {
      clearTimeout(this.expirationTimer);
      this.expirationTimer = undefined;
    }
  }

  handleUnauthorized(): void {
    this.logout();
    if (this.router.url !== '/admin/login') {
      void this.router.navigate(['/admin/login'], { queryParams: { session: 'ended' } });
    }
  }

  private restoreSession(): void {
    const token = this.token();
    if (!token || this.isExpired(token)) {
      this.logout();
      return;
    }
    this.scheduleExpiration(token);
  }

  private scheduleExpiration(token: string): void {
    const expiresAt = this.expirationTime(token);
    if (!expiresAt) {
      this.logout();
      return;
    }
    if (this.expirationTimer) clearTimeout(this.expirationTimer);
    const remaining = expiresAt - Date.now();
    this.expirationTimer = setTimeout(() => this.handleUnauthorized(), Math.max(remaining, 0));
  }

  private isExpired(token: string): boolean {
    const expiresAt = this.expirationTime(token);
    return expiresAt === null || expiresAt <= Date.now();
  }

  private expirationTime(token: string): number | null {
    try {
      const [payload] = token.split('.', 1);
      if (!payload) return null;
      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
      const decoded = JSON.parse(atob(padded)) as { exp?: unknown };
      return typeof decoded.exp === 'number' ? decoded.exp * 1000 : null;
    } catch {
      return null;
    }
  }
}
