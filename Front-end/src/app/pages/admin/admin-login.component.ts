import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <main class="login-shell">
      <section class="login-panel">
        <p class="eyebrow">BARBERIA / CONTROL</p>
        <h1>Bienvenido de nuevo.</h1>
        <p class="intro">Accede al espacio privado de gestión.</p>
        <form [formGroup]="form" (ngSubmit)="submit()">
          <label>Correo electrónico <input type="email" formControlName="email" autocomplete="username"></label>
          <label>Contraseña <input type="password" formControlName="password" autocomplete="current-password"></label>
          @if (error) { <p class="error" role="alert">{{ error }}</p> }
          <button type="submit" [disabled]="form.invalid || loading">{{ loading ? 'Validando...' : 'Entrar al panel' }}</button>
        </form>
      </section>
      <aside class="login-aside"><span>ADMIN</span><strong>Tu barbería,<br>en una mirada.</strong></aside>
    </main>
  `,
  styles: [`
    :host { display:block; min-height:100vh; background:#f4f0e9; color:#22221f; }
    .login-shell { min-height:100vh; display:grid; grid-template-columns:minmax(320px, 0.9fr) 1.1fr; }
    .login-panel { align-self:center; width:min(380px, calc(100% - 48px)); margin:auto; }
    .eyebrow { color:#b45b38; font-size:12px; letter-spacing:2px; font-weight:700; }
    h1 { font: 500 46px/1.05 Georgia, serif; margin:48px 0 14px; }
    .intro { color:#6f6a60; margin-bottom:42px; }
    form { display:grid; gap:20px; } label { display:grid; gap:8px; font-size:13px; font-weight:700; }
    input { border:0; border-bottom:1px solid #c8c0b3; background:transparent; padding:12px 0; outline:0; }
    input:focus { border-color:#b45b38; } button { margin-top:14px; border:0; padding:15px; background:#22221f; color:#fff; cursor:pointer; } button:disabled { opacity:.5; cursor:not-allowed; }
    .error { color:#a43d2d; font-size:13px; margin:0; } .login-aside { background:#b45b38; color:#f8f2e8; display:flex; flex-direction:column; justify-content:space-between; padding:48px; font:12px Arial,sans-serif; letter-spacing:2px; } .login-aside strong { font:500 clamp(42px, 6vw, 90px)/.95 Georgia,serif; letter-spacing:0; }
    @media (max-width:700px) { .login-shell { grid-template-columns:1fr; } .login-aside { display:none; } h1 { margin-top:36px; font-size:40px; } }
  `]
})
export class AdminLoginComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly form = this.formBuilder.nonNullable.group({ email: ['', [Validators.required, Validators.email]], password: ['', Validators.required] });
  loading = false;
  error = this.route.snapshot.queryParamMap.get('session') === 'ended'
    ? 'Tu sesión terminó. Inicia sesión de nuevo.'
    : '';

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: () => this.router.navigate(['/admin']),
      error: () => { this.error = 'Las credenciales no son válidas.'; this.loading = false; }
    });
  }
}
