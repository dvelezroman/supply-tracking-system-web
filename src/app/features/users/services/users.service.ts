import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import type { ApiResponse, PaginatedData } from '../../../core/models/api-response.model';
import type { User } from '../../../core/models/auth.model';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient);
  private base = `${environment.apiBase}/users`;

  getAll(page = 1, limit = 20) {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<ApiResponse<PaginatedData<User>>>(this.base, { params });
  }
}
