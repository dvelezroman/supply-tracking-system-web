import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import type { ApiResponse, PaginatedData } from '../../../core/models/api-response.model';

export interface LotSummary {
  id: string;
  lotCode: string;
  presentation: string;
  packaging: string;
  weightKg: number;
  sizeClassification: string;
  colorSalmoFan: string;
  texture: string | null;
  certifications: string[];
  lotSizeLbs: number;
  harvestDate: string;
  poolNumber: number;
  harvestWeightGrams: number;
  createdAt: string;
  /** Snapshot of flags for the public `/trace/:lotCode` page (admin-editable). */
  publicVisibility?: Record<string, boolean> | null;
  product: { id: string; name: string; sku: string; category: string | null };
  farm: { id: string; name: string; location: string | null };
  lab: { id: string; name: string; location: string | null };
  maturation: { id: string; name: string; location: string | null };
  coPacker: { id: string; name: string; location: string | null };
}

@Injectable({ providedIn: 'root' })
export class LotsAdminService {
  private http = inject(HttpClient);
  private base = `${environment.apiBase}/lots`;

  create(payload: Record<string, unknown>) {
    return this.http.post<ApiResponse<LotSummary>>(this.base, payload);
  }

  getSuggestedLotCode(params: {
    productId: string;
    poolNumber: number;
    harvestDate: string;
    presentation: string;
    packaging: string;
  }) {
    let httpParams = new HttpParams()
      .set('productId', params.productId)
      .set('poolNumber', params.poolNumber)
      .set('harvestDate', params.harvestDate)
      .set('presentation', params.presentation)
      .set('packaging', params.packaging);
    return this.http.get<ApiResponse<{ lotCode: string }>>(`${this.base}/suggest-lot-code`, {
      params: httpParams,
    });
  }

  getAll(params: {
    page?: number;
    limit?: number;
    productId?: string;
    search?: string;
    harvestFrom?: string;
    harvestTo?: string;
  } = {}) {
    const {
      page = 1,
      limit = 20,
      productId,
      search,
      harvestFrom,
      harvestTo,
    } = params;
    let httpParams = new HttpParams().set('page', page).set('limit', limit);
    if (productId) httpParams = httpParams.set('productId', productId);
    const q = search?.trim();
    if (q) httpParams = httpParams.set('search', q);
    if (harvestFrom) httpParams = httpParams.set('harvestFrom', harvestFrom);
    if (harvestTo) httpParams = httpParams.set('harvestTo', harvestTo);
    return this.http.get<ApiResponse<PaginatedData<LotSummary>>>(this.base, {
      params: httpParams,
    });
  }

  getById(id: string) {
    return this.http.get<ApiResponse<LotSummary>>(`${this.base}/${id}`);
  }

  getByCode(lotCode: string) {
    const encoded = encodeURIComponent(lotCode);
    return this.http.get<ApiResponse<LotSummary>>(`${this.base}/code/${encoded}`);
  }

  getHistory(lotCode: string) {
    const encoded = encodeURIComponent(lotCode);
    return this.http.get<ApiResponse<{ lot: LotSummary; events: any[] }>>(
      `${this.base}/code/${encoded}/history`
    );
  }

  /** Returns the PDF download URL — used to trigger browser download directly */
  getQrPdfUrl(lotCode: string, copies: number): string {
    const encoded = encodeURIComponent(lotCode);
    return `${this.base}/code/${encoded}/qr/pdf?copies=${copies}`;
  }

  patchPublicVisibility(id: string, patch: Record<string, boolean>) {
    return this.http.patch<ApiResponse<LotSummary>>(
      `${this.base}/${id}/public-visibility`,
      { patch },
    );
  }
}
