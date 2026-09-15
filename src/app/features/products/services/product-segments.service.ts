import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import type { ApiResponse } from '../../../core/models/api-response.model';
import type {
  ProductSegment,
  CreateProductSegmentPayload,
} from '../../../core/models/product-segment.model';

@Injectable({ providedIn: 'root' })
export class ProductSegmentsService {
  private http = inject(HttpClient);
  private base = `${environment.apiBase}/product-segments`;

  getAll() {
    return this.http.get<ApiResponse<ProductSegment[]>>(this.base);
  }

  getById(id: string) {
    return this.http.get<ApiResponse<ProductSegment>>(`${this.base}/${id}`);
  }

  create(payload: CreateProductSegmentPayload) {
    return this.http.post<ApiResponse<ProductSegment>>(this.base, payload);
  }

  update(id: string, payload: Partial<CreateProductSegmentPayload>) {
    return this.http.put<ApiResponse<ProductSegment>>(`${this.base}/${id}`, payload);
  }

  delete(id: string) {
    return this.http.delete<ApiResponse<ProductSegment>>(`${this.base}/${id}`);
  }
}
