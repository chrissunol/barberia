import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const isAdminRequest = request.url.startsWith(`${environment.apiUrl}/api/admin`);
  const isLoginRequest = request.url === `${environment.apiUrl}/api/admin/login`;
  const token = auth.token();

  const authenticatedRequest = isAdminRequest && !isLoginRequest && token
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(authenticatedRequest).pipe(
    catchError((error: unknown) => {
      if (isAdminRequest && !isLoginRequest && error instanceof HttpErrorResponse && error.status === 401) {
        auth.handleUnauthorized();
      }
      return throwError(() => error);
    })
  );
};
