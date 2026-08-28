import { Component, OnInit, ViewEncapsulation, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AdminService, CustomerDetail, CustomerRow, DashboardData } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';
import { DashboardOverviewComponent } from './components/dashboard-overview.component';
import { CustomerDirectoryComponent } from './components/customer-directory.component';
import { CustomerProfileComponent } from './components/customer-profile.component';

@Component({
  standalone: true,
  imports: [DashboardOverviewComponent, CustomerDirectoryComponent, CustomerProfileComponent],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class AdminComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  dashboard?: DashboardData; customers: CustomerRow[] = []; selected?: CustomerDetail;
  search = ''; sort = 'visits'; direction = 'desc'; page = 1; total = 0; readonly pageSize = 8;
  dashboardLoading = true; customersLoading = true; detailLoading = false;
  dashboardError = ''; customersError = ''; detailError = '';
  private modalTrigger?: HTMLElement;
  ngOnInit(): void { this.loadDashboard(); this.loadCustomers(); }
  loadDashboard(): void {
    this.dashboardLoading = true; this.dashboardError = '';
    this.admin.dashboard().subscribe({
      next: data => { this.dashboard = data; this.dashboardLoading = false; },
      error: () => { this.dashboardLoading = false; this.dashboardError = 'No se pudo cargar el resumen.'; }
    });
  }
  loadCustomers(): void {
    this.customersLoading = true; this.customersError = '';
    this.admin.customers({ search: this.search, page: this.page, page_size: this.pageSize, sort: this.sort, direction: this.direction }).subscribe({
      next: data => { this.customers = data.items; this.total = data.total; this.customersLoading = false; },
      error: () => { this.customers = []; this.total = 0; this.customersLoading = false; this.customersError = 'No se pudo cargar el directorio.'; }
    });
  }
  applySearch(): void { this.page = 1; this.loadCustomers(); }
  changeSort(sort: string): void { if (this.sort === sort) this.direction = this.direction === 'desc' ? 'asc' : 'desc'; else { this.sort = sort; this.direction = 'desc'; } this.loadCustomers(); }
  openCustomer(customer: CustomerRow, event?: Event): void {
    this.modalTrigger = event?.currentTarget as HTMLElement | undefined;
    this.detailLoading = true; this.detailError = '';
    this.admin.customer(customer.id).subscribe({
      next: detail => { this.selected = detail; this.detailLoading = false; },
      error: () => { this.detailLoading = false; this.detailError = 'No se pudo abrir el perfil del cliente.'; }
    });
  }
  closeCustomer(): void { this.selected = undefined; setTimeout(() => this.modalTrigger?.focus()); }
  previousPage(): void { if (this.page > 1) { this.page--; this.loadCustomers(); } }
  nextPage(): void { if (this.page * this.pageSize < this.total) { this.page++; this.loadCustomers(); } }
  logout(): void { this.auth.logout(); this.router.navigate(['/admin/login']); }
  maxTrend(period: keyof DashboardData['trends']): number { return Math.max(...(this.dashboard?.trends[period] ?? []).map(item => item.value), 1); }
  date(value: string | null): string { return value ? new Date(value).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : 'Sin visitas'; }
}
