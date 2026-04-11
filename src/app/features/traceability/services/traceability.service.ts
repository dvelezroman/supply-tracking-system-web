import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import type { ApiResponse, PaginatedData } from '../../../core/models/api-response.model';
import type { TraceabilityEvent, CreateEventPayload } from '../../../core/models/traceability.model';

export interface TraceabilityEventsFilters {
  productId?: string | null;
  lotId?: string | null;
  /** Event recorded-at range (ISO date or datetime). */
  dateFrom?: string | null;
  dateTo?: string | null;
  /** Lot harvest date range (filters by batch harvest date). */
  harvestDateFrom?: string | null;
  harvestDateTo?: string | null;
  eventType?: string | null;
}

@Injectable({ providedIn: 'root' })
export class TraceabilityService {
  private http = inject(HttpClient);
  private base = `${environment.apiBase}/traceability`;

  getEvents(page = 1, limit = 20, filters?: TraceabilityEventsFilters | null) {
    let params = new HttpParams().set('page', String(page)).set('limit', String(limit));
    const f = filters ?? {};
    if (f.productId) params = params.set('productId', f.productId);
    if (f.lotId) params = params.set('lotId', f.lotId);
    if (f.dateFrom) params = params.set('dateFrom', f.dateFrom);
    if (f.dateTo) params = params.set('dateTo', f.dateTo);
    if (f.harvestDateFrom) params = params.set('harvestDateFrom', f.harvestDateFrom);
    if (f.harvestDateTo) params = params.set('harvestDateTo', f.harvestDateTo);
    if (f.eventType) params = params.set('eventType', f.eventType);
    return this.http.get<ApiResponse<PaginatedData<TraceabilityEvent>>>(
      `${this.base}/events`,
      { params }
    );
  }

  createEvent(payload: CreateEventPayload) {
    return this.http.post<ApiResponse<TraceabilityEvent>>(
      `${this.base}/events`,
      payload
    );
  }

  getProductHistory(productId: string) {
    return this.http.get<ApiResponse<TraceabilityEvent[]>>(
      `${this.base}/products/${productId}/history`
    );
  }
}
