import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { CheckInService } from '../../services/check-in.service';

@Component({
  selector: 'app-check-in',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './check-in.component.html',
  styleUrl: './check-in.component.scss'
})
export class CheckInComponent implements OnDestroy {
  language: 'es' | 'en' = 'en';
  loading = false;
  successMessage = '';
  errorMessage = '';
  private successTimeout?: ReturnType<typeof setTimeout>;

  readonly translations = {
    es: {
      language: 'Idioma', barberShop: 'BARBERIA', welcome: 'Bienvenido',
      subtitle: 'Regístrate por favor. Solo tomará unos segundos.', firstName: 'Nombre',
      lastName: 'Apellido', phone: 'Número de teléfono', email: 'Correo electrónico',
      howHeard: '¿Cómo te enteraste de nosotros?', howHeardPlaceholder: 'Selecciona una opción',
      heardOptions: [
        { value: 'Google', label: 'Google' }, { value: 'Facebook', label: 'Facebook' },
        { value: 'TikTok', label: 'TikTok' }, { value: 'Instagram', label: 'Instagram' },
        { value: 'YouTube', label: 'YouTube' }
      ],
      firstNamePlaceholder: 'Nombre', lastNamePlaceholder: 'Apellido', phonePlaceholder: '(832) 555-1234',
      emailPlaceholder: 'example@gmail.com', firstNameError: 'Ingresa tu nombre.',
      lastNameError: 'Ingresa tu apellido.', phoneError: 'Ingresa un número de teléfono válido.',
      emailError: 'Ingresa un correo electrónico válido.', checkingIn: 'REGISTRANDO...',
      checkIn: 'REGISTRAR ENTRADA', success: (name: string) => `Registro completado. ¡Bienvenido, ${name}!`,
      requestError: 'No se pudo completar el registro. Inténtalo de nuevo.'
    },
    en: {
      language: 'Language', barberShop: 'BARBER SHOP', welcome: 'Welcome',
      subtitle: 'Please register. It will only take a few seconds.', firstName: 'First name',
      lastName: 'Last name', phone: 'Phone number', email: 'Email',
      howHeard: 'How did you hear about us?', howHeardPlaceholder: 'Select an option',
      heardOptions: [
        { value: 'Google', label: 'Google' }, { value: 'Facebook', label: 'Facebook' },
        { value: 'TikTok', label: 'TikTok' }, { value: 'Instagram', label: 'Instagram' },
        { value: 'YouTube', label: 'YouTube' }
      ],
      firstNamePlaceholder: 'Name', lastNamePlaceholder: 'Last name', phonePlaceholder: '(832) 555-1234',
      emailPlaceholder: 'example@gmail.com', firstNameError: 'Please enter your first name.',
      lastNameError: 'Please enter your last name.', phoneError: 'Please enter a valid phone number.',
      emailError: 'Please enter a valid email address.', checkingIn: 'CHECKING IN...',
      checkIn: 'CHECK IN', success: (name: string) => `Check-in complete. Welcome, ${name}!`,
      requestError: 'Unable to complete check-in. Please try again.'
    }
  } as const;

  get text() {
    return this.translations[this.language];
  }

  formatPhone(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 10);
    let formatted = digits;

    if (digits.length > 6) {
      formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    } else if (digits.length > 3) {
      formatted = `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else if (digits.length > 0) {
      formatted = `(${digits}`;
    }

    this.form.controls.phone.setValue(formatted, { emitEvent: false });
  }

  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^\(\d{3}\) \d{3}-\d{4}$/)]],
    howHeard: ['', Validators.required]
  });

  constructor(
    private fb: FormBuilder,
    private checkInService: CheckInService
  ) {}

  submit(): void {
    if (this.successTimeout) {
      clearTimeout(this.successTimeout);
      this.successTimeout = undefined;
    }
    this.successMessage = '';
    this.errorMessage = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const value = this.form.getRawValue();

    this.checkInService.create({
      first_name: value.firstName.trim(),
      last_name: value.lastName.trim(),
      email: value.email.trim(),
      phone: value.phone.trim(),
      how_heard: value.howHeard
    })
    .pipe(finalize(() => this.loading = false))
    .subscribe({
      next: () => {
        this.successMessage = this.text.success(value.firstName);
        this.form.reset();
        this.successTimeout = setTimeout(() => {
          this.successMessage = '';
          this.successTimeout = undefined;
        }, 5000);
      },
      error: (error) => {
        this.errorMessage = error?.error?.detail || this.text.requestError;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.successTimeout) {
      clearTimeout(this.successTimeout);
    }
  }
}
