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
  logoTapped = false;
  private successTimeout?: ReturnType<typeof setTimeout>;
  private logoTimeout?: ReturnType<typeof setTimeout>;

  readonly translations = {
    es: {
      language: 'Idioma', barberShop: 'BARBERIA', welcome: 'Bienvenido',
      subtitle: 'Regístrate por favor. Solo tomará unos segundos.', logoAction: 'Activar animación del logo',
      customerQuestion: '¿Es tu primera visita?', selectOption: 'Selecciona una opción',
      newCustomer: 'Sí, soy cliente nuevo', returningCustomer: 'No, ya he venido antes',
      appointmentQuestion: '¿Vienes con cita?', yesAppointment: 'Sí, tengo cita', noAppointment: 'No, vengo sin cita',
      firstName: 'Nombre',
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
      privacyNotice: 'Tus datos se usarán para gestionar este registro y tu historial de visitas.',
      privacyConsent: 'Acepto el uso de mis datos para estas finalidades.', privacyError: 'Debes aceptar antes de continuar.',
      checkIn: 'REGISTRAR ENTRADA', success: (name: string) => `Registro completado. ¡Bienvenido, ${name}!`,
      requestError: 'No se pudo completar el registro. Inténtalo de nuevo.'
    },
    en: {
      language: 'Language', barberShop: 'BARBER SHOP', welcome: 'Welcome',
      subtitle: 'Please register. It will only take a few seconds.', logoAction: 'Activate logo animation',
      customerQuestion: 'Is this your first visit?', selectOption: 'Select an option',
      newCustomer: 'Yes, I am a new customer', returningCustomer: 'No, I have visited before',
      appointmentQuestion: 'Do you have an appointment?', yesAppointment: 'Yes, I have an appointment', noAppointment: 'No, I am a walk-in',
      firstName: 'First name',
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
      privacyNotice: 'Your information will be used to manage this check-in and your visit history.',
      privacyConsent: 'I agree to the use of my information for these purposes.', privacyError: 'You must agree before continuing.',
      checkIn: 'CHECK IN', success: (name: string) => `Check-in complete. Welcome, ${name}!`,
      requestError: 'Unable to complete check-in. Please try again.'
    }
  } as const;

  get text() {
    return this.translations[this.language];
  }

  setLanguage(language: 'es' | 'en'): void {
    this.language = language;
    document.documentElement.lang = language;
  }

  private updateHowHeardValidation(type: string): void {
    const howHeard = this.form.controls.howHeard;
    if (type === 'new') {
      howHeard.setValidators(Validators.required);
    } else {
      howHeard.clearValidators();
      howHeard.setValue('');
    }
    howHeard.updateValueAndValidity();
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

  onLogoTap(): void {
    this.logoTapped = false;
    if (this.logoTimeout) {
      clearTimeout(this.logoTimeout);
    }

    requestAnimationFrame(() => {
      this.logoTapped = true;
      this.logoTimeout = setTimeout(() => {
        this.logoTapped = false;
        this.logoTimeout = undefined;
      }, 700);
    });
  }

  readonly form = this.fb.nonNullable.group({
    customerType: ['', Validators.required],
    hasAppointment: ['', Validators.required],
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^\(\d{3}\) \d{3}-\d{4}$/)]],
    howHeard: [''],
    privacyConsent: [false, Validators.requiredTrue]
  });

  constructor(
    private fb: FormBuilder,
    private checkInService: CheckInService
  ) {
    this.form.controls.customerType.valueChanges.subscribe(type => this.updateHowHeardValidation(type));
  }

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
      is_new_customer: value.customerType === 'new',
      has_appointment: value.hasAppointment === 'yes',
      how_heard: value.customerType === 'new' ? value.howHeard : null
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
    if (this.logoTimeout) {
      clearTimeout(this.logoTimeout);
    }
  }
}
