import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import type { ApiResponse, PaginatedData } from '../../../core/models/api-response.model';
import type {
  CreateMarketplaceProductPayload,
  MarketplaceOrder,
  MarketplaceProduct,
  MarketplaceProductImage,
  MarketplaceSettings,
  PublicCatalogPage,
  PublicOrderConfirmation,
  PublicStoreSettings,
  CreateOrderPayload,
} from '../models/marketplace.model';

@Injectable({ providedIn: 'root' })
export class MarketplacePublicApiService {
  private http = inject(HttpClient);
  private base = `${environment.apiBase}/marketplace`;

  getSettings() {
    return this.http.get<ApiResponse<PublicStoreSettings>>(`${this.base}/settings`);
  }

  listProducts(page = 1, limit = 20, search?: string, category?: string) {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (search) params = params.set('search', search);
    if (category) params = params.set('category', category);
    return this.http.get<ApiResponse<PublicCatalogPage>>(`${this.base}/products`, {
      params,
    });
  }

  getBySlug(slug: string) {
    return this.http.get<ApiResponse<MarketplaceProduct>>(
      `${this.base}/products/${encodeURIComponent(slug)}`,
    );
  }

  placeOrder(payload: CreateOrderPayload) {
    return this.http.post<ApiResponse<MarketplaceOrder>>(
      `${this.base}/orders`,
      payload,
    );
  }

  getOrderConfirmation(orderNumber: string) {
    return this.http.get<ApiResponse<PublicOrderConfirmation>>(
      `${this.base}/orders/${encodeURIComponent(orderNumber)}`,
    );
  }
}

@Injectable({ providedIn: 'root' })
export class MarketplaceAdminApiService {
  private http = inject(HttpClient);
  private base = `${environment.apiBase}/marketplace/admin`;

  getSettings() {
    return this.http.get<ApiResponse<MarketplaceSettings>>(`${this.base}/settings`);
  }

  updateSettings(body: Partial<MarketplaceSettings>) {
    return this.http.put<ApiResponse<MarketplaceSettings>>(
      `${this.base}/settings`,
      body,
    );
  }

  listProducts(page = 1, limit = 20, search?: string, published?: boolean) {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (search) params = params.set('search', search);
    if (published !== undefined) {
      params = params.set('published', String(published));
    }
    return this.http.get<ApiResponse<PaginatedData<MarketplaceProduct>>>(
      `${this.base}/products`,
      { params },
    );
  }

  getProduct(id: string) {
    return this.http.get<ApiResponse<MarketplaceProduct>>(
      `${this.base}/products/${id}`,
    );
  }

  createProduct(payload: CreateMarketplaceProductPayload) {
    return this.http.post<ApiResponse<MarketplaceProduct>>(
      `${this.base}/products`,
      payload,
    );
  }

  updateProduct(
    id: string,
    payload: Partial<CreateMarketplaceProductPayload> & {
      traceProductId?: string | null;
    },
  ) {
    return this.http.put<ApiResponse<MarketplaceProduct>>(
      `${this.base}/products/${id}`,
      payload,
    );
  }

  deleteProduct(id: string) {
    return this.http.delete<ApiResponse<MarketplaceProduct>>(
      `${this.base}/products/${id}`,
    );
  }

  uploadImage(productId: string, file: File, isPrimary = false) {
    const form = new FormData();
    form.append('file', file);
    if (isPrimary) form.append('isPrimary', 'true');
    return this.http.post<ApiResponse<MarketplaceProductImage>>(
      `${this.base}/products/${productId}/images`,
      form,
    );
  }

  addImageByUrl(productId: string, url: string, isPrimary = false) {
    return this.http.post<ApiResponse<MarketplaceProductImage>>(
      `${this.base}/products/${productId}/images/url`,
      { url, isPrimary },
    );
  }

  deleteImage(productId: string, imageId: string) {
    return this.http.delete<ApiResponse<{ deleted: boolean }>>(
      `${this.base}/products/${productId}/images/${imageId}`,
    );
  }

  setPrimaryImage(productId: string, imageId: string) {
    return this.http.patch<ApiResponse<MarketplaceProduct>>(
      `${this.base}/products/${productId}/images/${imageId}/primary`,
      {},
    );
  }

  listOrders(page = 1, limit = 20, search?: string, status?: string) {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (search) params = params.set('search', search);
    if (status) params = params.set('status', status);
    return this.http.get<ApiResponse<PaginatedData<MarketplaceOrder>>>(
      `${this.base}/orders`,
      { params },
    );
  }

  getOrder(id: string) {
    return this.http.get<ApiResponse<MarketplaceOrder>>(
      `${this.base}/orders/${id}`,
    );
  }

  cancelOrder(id: string) {
    return this.http.post<ApiResponse<MarketplaceOrder>>(
      `${this.base}/orders/${id}/cancel`,
      {},
    );
  }
}
