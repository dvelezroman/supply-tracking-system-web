import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import type { ApiResponse, PaginatedData } from '../../../core/models/api-response.model';

/** List row — API omits `menuQrCodeDataUrl` for size */
export interface RestaurantListItem {
  id: string;
  name: string;
  slug: string;
  location: string | null;
  contact: string | null;
  publicMenuTraceUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface Restaurant extends RestaurantListItem {
  menuQrCodeDataUrl: string;
}

export type CreateRestaurantPayload = {
  name: string;
  slug: string;
  location?: string;
  contact?: string;
};

@Injectable({ providedIn: 'root' })
export class RestaurantsService {
  private http = inject(HttpClient);
  private base = `${environment.apiBase}/restaurants`;

  getAll(page = 1, limit = 20, search?: string) {
    let params = new HttpParams().set('page', page).set('limit', limit);
    const q = search?.trim();
    if (q) params = params.set('search', q);
    return this.http.get<ApiResponse<PaginatedData<RestaurantListItem>>>(this.base, {
      params,
    });
  }

  getById(id: string) {
    return this.http.get<ApiResponse<Restaurant>>(`${this.base}/${id}`);
  }

  create(payload: CreateRestaurantPayload) {
    return this.http.post<ApiResponse<Restaurant>>(this.base, payload);
  }

  update(id: string, payload: Partial<CreateRestaurantPayload>) {
    return this.http.put<ApiResponse<Restaurant>>(`${this.base}/${id}`, payload);
  }

  delete(id: string) {
    return this.http.delete<ApiResponse<Restaurant>>(`${this.base}/${id}`);
  }
}
