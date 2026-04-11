import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import type { ApiResponse, PaginatedData } from '../../../core/models/api-response.model';
import type { Actor, CreateActorPayload } from '../../../core/models/actor.model';

@Injectable({ providedIn: 'root' })
export class ActorsService {
  private http = inject(HttpClient);
  private base = `${environment.apiBase}/actors`;

  getAll(page = 1, limit = 100) {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<ApiResponse<PaginatedData<Actor>>>(this.base, { params });
  }

  getById(id: string) {
    return this.http.get<ApiResponse<Actor>>(`${this.base}/${id}`);
  }

  create(payload: CreateActorPayload) {
    return this.http.post<ApiResponse<Actor>>(this.base, payload);
  }

  update(id: string, payload: Partial<CreateActorPayload>) {
    return this.http.put<ApiResponse<Actor>>(`${this.base}/${id}`, payload);
  }

  delete(id: string) {
    return this.http.delete<ApiResponse<Actor>>(`${this.base}/${id}`);
  }
}
