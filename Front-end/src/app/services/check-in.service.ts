import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CheckInPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  how_heard: string;
}

export interface CheckInResponse {
  success: boolean;
  message: string;
  check_in_id: string;
  customer_id: string;
}

@Injectable({ providedIn: 'root' })
export class CheckInService {
  private readonly apiUrl = `${environment.apiUrl}/api/check-in`;

  constructor(private http: HttpClient) {}

  create(payload: CheckInPayload): Observable<CheckInResponse> {
    return this.http.post<CheckInResponse>(this.apiUrl, payload);
  }
}
