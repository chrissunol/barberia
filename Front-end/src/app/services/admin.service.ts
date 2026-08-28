import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CustomerRow { id: string; name: string; phone: string; created_at: string; visits: number; first_visit: string | null; last_visit: string | null; }
export interface TrendPoint { label: string; value: number; }
export interface DashboardData { metrics: { total_customers: number; total_visits: number; new_customers: number; recurring_customers: number; today_visits: number }; frequent_customers: CustomerRow[]; trends: { daily: TrendPoint[]; weekly: TrendPoint[]; monthly: TrendPoint[]; }; }
export interface CustomerPage { items: CustomerRow[]; total: number; page: number; page_size: number; }
export interface CustomerDetail extends CustomerRow { email: string; history: { id: string; status: string; checked_in_at: string }[]; }

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/admin`;
  dashboard(): Observable<DashboardData> { return this.http.get<DashboardData>(`${this.baseUrl}/dashboard`); }
  customers(params: Record<string, string | number>): Observable<CustomerPage> { return this.http.get<CustomerPage>(`${this.baseUrl}/customers`, { params: params as Record<string, string> }); }
  customer(id: string): Observable<CustomerDetail> { return this.http.get<CustomerDetail>(`${this.baseUrl}/customers/${id}`); }
}
