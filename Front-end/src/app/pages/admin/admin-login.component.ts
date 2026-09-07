import { Component, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <main class="login-shell">
      <section class="visual-panel" aria-label="Alibaba Barber">
        <div class="visual-glow"></div>
        <div class="brand"><img src="assets/alibaba-barber.png" alt=""><span><b>ALIBABA</b><small>BARBER</small></span></div>
        <div class="message"><p>GESTIÓN INTELIGENTE</p><h2>Tu barbería,<br><em>en una mirada.</em></h2><span>Clientes, visitas y crecimiento. Todo bajo control.</span></div>
        <small class="copyright">© Alibaba Barber · Panel administrativo</small>
      </section>
      <section class="login-panel">
        <div class="mobile-brand"><img src="assets/alibaba-barber.png" alt=""><b>ALIBABA BARBER</b></div>
        <div class="form-wrap">
          <span class="badge">ACCESO ADMINISTRATIVO</span>
          <h1>Bienvenido<br>de nuevo.</h1>
          <p class="intro">Ingresa tus credenciales para acceder al panel.</p>
          <form [formGroup]="form" (ngSubmit)="submit()">
            <label>Correo electrónico<div class="input-wrap"><span>✉</span><input type="email" formControlName="email" autocomplete="username" placeholder="admin@barberia.com"></div></label>
            <label>Contraseña<div class="input-wrap"><span>⌑</span><input type="password" formControlName="password" autocomplete="current-password" placeholder="••••••••"></div></label>
            @if (error) { <p class="error" role="alert">{{ error }}</p> }
            <button type="submit" [disabled]="form.invalid || loading"><span>{{ loading ? 'Validando...' : 'Entrar al panel' }}</span><b aria-hidden="true">→</b></button>
          </form>
          <p class="secure">◆ Conexión segura y protegida</p>
        </div>
      </section>
    </main>
  `,
  styles: [`
    :host { display:block; min-height:100vh; background:#080e19; color:#f5f7fa; font-family:Inter,Segoe UI,Arial,sans-serif; }
    .login-shell { min-height:100vh; display:grid; grid-template-columns:minmax(420px,1.08fr) minmax(420px,.92fr); }
    .visual-panel { position:relative; min-height:100vh; overflow:hidden; display:flex; flex-direction:column; justify-content:space-between; padding:42px 54px; box-sizing:border-box; background:linear-gradient(135deg,#060b14dd,#08101bee),url('/assets/alibaba-barber.png') center/cover; border-right:1px solid #273142; }
    .visual-panel::after { content:''; position:absolute; inset:0; background:linear-gradient(0deg,#070d18 0%,transparent 45%); pointer-events:none; }
    .visual-glow { position:absolute; width:420px;height:420px;left:12%;top:20%;border-radius:50%;background:#d6a83d18;filter:blur(80px); }
    .brand,.message,.copyright { position:relative;z-index:1; }.brand { display:flex;align-items:center;gap:13px; }.brand img,.mobile-brand img { width:58px;height:58px;object-fit:cover;object-position:50% 35%;border:1px solid #9a722a;border-radius:50%;filter:sepia(1) saturate(.7); }.brand b { display:block;color:#e2ba55;font:700 18px Georgia;letter-spacing:3px; }.brand small { display:block;margin-top:5px;color:#bd9b50;font-size:8px;letter-spacing:5px; }
    .message { margin-bottom:8vh; }.message p,.badge { color:#d6a83d;font-size:9px;font-weight:800;letter-spacing:2.5px; }.message h2 { margin:18px 0 22px;font:500 clamp(46px,5.5vw,78px)/.96 Georgia,serif;letter-spacing:-2px; }.message em { color:#e0b64e;font-weight:400; }.message>span { color:#9aa4b3;font-size:14px; }.copyright { color:#626d7d;font-size:9px; }
    .login-panel { min-height:100vh; display:grid;place-items:center;padding:45px;box-sizing:border-box;background:radial-gradient(circle at 30% 25%,#182237 0,transparent 35%),#0a111e; }.form-wrap { width:min(390px,100%); }.badge { display:inline-block;padding:8px 11px;border:1px solid #5f4a26;border-radius:5px;background:#d6a83d0c; }.form-wrap h1 { margin:28px 0 12px;font:500 clamp(42px,5vw,58px)/1 Georgia,serif;letter-spacing:-1px; }.intro { margin:0 0 40px;color:#8490a2;font-size:13px; }
    form { display:grid;gap:21px; }label { display:grid;gap:9px;color:#c5cbd4;font-size:11px;font-weight:700; }.input-wrap { display:flex;align-items:center;border:1px solid #29364a;border-radius:8px;background:#0d1625;transition:.2s; }.input-wrap:focus-within { border-color:#bd8f32;box-shadow:0 0 0 3px #d6a83d12; }.input-wrap span { width:46px;color:#7f8a9b;text-align:center; }.input-wrap input { width:100%;padding:14px 14px 14px 0;border:0;outline:0;background:transparent;color:#fff;font-size:13px; }.input-wrap input::placeholder { color:#4f5b6c; }
    form>button { display:flex;align-items:center;justify-content:space-between;margin-top:9px;padding:15px 18px;border:1px solid #e3bd56;border-radius:8px;background:linear-gradient(135deg,#dbae45,#b47e22);color:#11100c;font-weight:800;cursor:pointer;box-shadow:0 10px 28px #b47e2230; }.form-wrap button:hover:not(:disabled) { filter:brightness(1.08);transform:translateY(-1px); }.form-wrap button:disabled { opacity:.48;cursor:not-allowed; }.form-wrap button b { font-size:19px; }.error { margin:0;padding:10px 12px;border:1px solid #7c3535;border-radius:6px;background:#ef444412;color:#ff9b92;font-size:11px; }.secure { margin-top:25px;color:#566276;font-size:9px;text-align:center;letter-spacing:.5px; }.mobile-brand { display:none; }
    @media (max-width:800px) { .login-shell { grid-template-columns:1fr; }.visual-panel { display:none; }.login-panel { padding:28px 22px; }.mobile-brand { display:flex;align-items:center;gap:10px;margin-bottom:45px;color:#dfb551;font:700 13px Georgia;letter-spacing:2px; }.mobile-brand img { width:42px;height:42px; }.form-wrap h1 { font-size:45px; } }
    @media (prefers-reduced-motion:reduce) { .form-wrap button { transition:none; } }
  `]
})
export class AdminLoginComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly form = this.formBuilder.nonNullable.group({ email: ['', [Validators.required, Validators.email]], password: ['', Validators.required] });
  loading = false;
  error = this.route.snapshot.queryParamMap.get('session') === 'ended' ? 'Tu sesión terminó. Inicia sesión de nuevo.' : '';

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true; this.error = '';
    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: () => this.router.navigate(['/admin']),
      error: (response: HttpErrorResponse) => {
        if (response.status === 503) this.error = 'El acceso administrativo no está configurado en el servidor.';
        else if (response.status === 429) this.error = 'Demasiados intentos. Espera un minuto y vuelve a intentarlo.';
        else if (response.status === 0) this.error = 'No se pudo conectar con el servidor.';
        else this.error = 'Las credenciales no son válidas.';
        this.loading = false;
      }
    });
  }
}
