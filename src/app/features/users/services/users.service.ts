import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import type { ApiResponse, PaginatedData } from '../../../core/models/api-response.model';
import type {
  AdminCreateUserPayload,
  AdminUpdateUserPayload,
  User,
} from '../../../core/models/auth.model';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient);
  private base = `${environment.apiBase}/users`;

  getAll(page = 1, limit = 20) {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<ApiResponse<PaginatedData<User>>>(this.base, { params });
  }

  getById(id: string) {
    return this.http.get<ApiResponse<User>>(`${this.base}/${id}`);
  }

  create(payload: AdminCreateUserPayload) {
    return this.http.post<ApiResponse<User>>(this.base, payload);
  }

  update(id: string, payload: AdminUpdateUserPayload) {
    return this.http.patch<ApiResponse<User>>(`${this.base}/${id}`, payload);
  }

  delete(id: string) {
    return this.http.delete<ApiResponse<{ id: string }>>(`${this.base}/${id}`);
  }
}
