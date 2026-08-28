import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CustomerRow } from '../../../services/admin.service';

@Component({ selector: 'app-customer-directory', standalone: true, imports: [CommonModule, FormsModule], templateUrl: './customer-directory.component.html', styleUrl: '../admin.component.scss', encapsulation: ViewEncapsulation.None })
export class CustomerDirectoryComponent {
  @Input() customers: CustomerRow[] = []; @Input() loading = false; @Input() error = ''; @Input() total = 0; @Input() page = 1; @Input() pageSize = 8; @Input() search = '';
  @Output() searchChange = new EventEmitter<string>(); @Output() applySearch = new EventEmitter<void>(); @Output() retry = new EventEmitter<void>(); @Output() sort = new EventEmitter<string>(); @Output() previous = new EventEmitter<void>(); @Output() next = new EventEmitter<void>(); @Output() selectCustomer = new EventEmitter<{ customer: CustomerRow; event: Event }>();
  date(value: string | null): string { return value ? new Date(value).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : 'Sin visitas'; }
  clearSearch(): void { this.searchChange.emit(''); this.applySearch.emit(); }
}
