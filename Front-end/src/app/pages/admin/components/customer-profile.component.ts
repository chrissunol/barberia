import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, ViewEncapsulation, AfterViewInit } from '@angular/core';
import { CustomerDetail } from '../../../services/admin.service';
import { formatUsPhone } from './phone-format';

@Component({ selector: 'app-customer-profile', standalone: true, templateUrl: './customer-profile.component.html', styleUrl: '../admin.component.scss', encapsulation: ViewEncapsulation.None })
export class CustomerProfileComponent implements AfterViewInit {
  @Input({ required: true }) customer!: CustomerDetail; @Output() close = new EventEmitter<void>();
  @ViewChild('panel') panel?: ElementRef<HTMLElement>; @ViewChild('closeButton') closeButton?: ElementRef<HTMLButtonElement>;
  ngAfterViewInit(): void { this.closeButton?.nativeElement.focus(); }
  date(value: string | null): string { return value ? new Date(value).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : 'Sin visitas'; }
  phone(value: string): string { return formatUsPhone(value); }
  keydown(event: KeyboardEvent): void { if (event.key === 'Escape') { event.preventDefault(); this.close.emit(); return; } if (event.key !== 'Tab') return; const items = Array.from(this.panel?.nativeElement.querySelectorAll<HTMLElement>('button,[href],[tabindex]:not([tabindex="-1"])') ?? []); const first = items[0], last = items[items.length - 1]; if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); } }
}
