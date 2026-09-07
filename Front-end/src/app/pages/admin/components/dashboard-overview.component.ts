import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { CustomerRow, DashboardData } from '../../../services/admin.service';
import { formatUsPhone } from './phone-format';

@Component({
  selector: 'app-dashboard-overview', standalone: true, imports: [CommonModule],
  templateUrl: './dashboard-overview.component.html', styleUrl: '../admin.component.scss', encapsulation: ViewEncapsulation.None
})
export class DashboardOverviewComponent {
  @Input() data?: DashboardData;
  @Input() loading = false;
  @Input() error = '';
  @Output() retry = new EventEmitter<void>();
  @Output() selectCustomer = new EventEmitter<{ customer: CustomerRow; event: Event }>();
  selectedDays: 7 | 15 | 30 = 30;
  readonly chartColors = ['#ff5b5b', '#ff8178', '#315df5', '#5872f6', '#5367dc', '#9b841b', '#b5b526', '#c8dc27', '#e87519', '#ff7a00', '#ffa126', '#4a2d2d', '#69453b', '#876052', '#26333a'];

  get filteredTrend(): { label: string; shortLabel: string; value: number; color: string }[] {
    const values = new Map((this.data?.trends.daily ?? []).map(item => [item.label, item.value]));
    const result = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let offset = this.selectedDays - 1; offset >= 0; offset--) {
      const date = new Date(today);
      date.setDate(today.getDate() - offset);
      const label = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
      result.push({
        label,
        shortLabel: date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
        value: values.get(label) ?? 0,
        color: this.chartColors[result.length % this.chartColors.length]
      });
    }
    return result;
  }

  setDays(days: 7 | 15 | 30): void { this.selectedDays = days; }
  maxTrend(): number { return Math.max(...this.filteredTrend.map(item => item.value), 1); }
  phone(value: string): string { return formatUsPhone(value); }
}
