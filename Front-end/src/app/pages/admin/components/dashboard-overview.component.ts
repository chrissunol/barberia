import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { CustomerRow, DashboardData } from '../../../services/admin.service';

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
  maxTrend(): number { return Math.max(...(this.data?.trends.daily ?? []).map(item => item.value), 1); }
}
