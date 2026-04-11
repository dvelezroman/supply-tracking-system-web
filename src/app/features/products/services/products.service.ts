import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import type { ApiResponse, PaginatedData } from '../../../core/models/api-response.model';
import type { Product, CreateProductPayload } from '../../../core/models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private http = inject(HttpClient);
  private base = `${environment.apiBase}/products`;

  getAll(page = 1, limit = 20, search?: string) {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (search) params = params.set('search', search);
    return this.http.get<ApiResponse<PaginatedData<Product>>>(this.base, { params });
  }

  getById(id: string) {
    return this.http.get<ApiResponse<Product>>(`${this.base}/${id}`);
  }

  create(payload: CreateProductPayload) {
    return this.http.post<ApiResponse<Product>>(this.base, payload);
  }

  update(id: string, payload: Partial<CreateProductPayload>) {
    return this.http.put<ApiResponse<Product>>(`${this.base}/${id}`, payload);
  }

  delete(id: string) {
    return this.http.delete<ApiResponse<Product>>(`${this.base}/${id}`);
  }

  patchPublicVisibilityDefaults(id: string, patch: Record<string, boolean>) {
    return this.http.patch<ApiResponse<Product>>(
      `${this.base}/${id}/public-visibility-defaults`,
      { patch },
    );
  }
}
