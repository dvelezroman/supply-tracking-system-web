import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import type { ApiResponse } from '../../../core/models/api-response.model';

export type WhatsappOccasion =
  | 'MARKETPLACE_PENDING_ADMIN'
  | 'MARKETPLACE_ORDER_RECEIVED_CUSTOMER'
  | 'MARKETPLACE_PAYMENT_APPROVED_CUSTOMER'
  | 'CUSTOM';

export interface WhatsappLogItem {
  id: string;
  sentAt: string;
  occasion: string;
  occasionLabel: string;
  occasionKey: string;
  recipientKey: string;
  recipientLabel: string | null;
  source: 'AUTO' | 'STAFF';
  actor: { id: string; email: string; name: string } | null;
  marketplaceOrder: {
    id: string;
    orderNumber: string;
    customerName: string;
    status: string;
  } | null;
}

export interface WhatsappLogsPage {
  page: number;
  limit: number;
  total: number;
  items: WhatsappLogItem[];
}

@Injectable({ providedIn: 'root' })
export class WhatsappAdminApiService {
  private http = inject(HttpClient);
  private base = `${environment.apiBase}/whatsapp`;

  getStatus() {
    return this.http.get<
      ApiResponse<{
        enabled: boolean;
        configured: boolean;
        hasCredentials: boolean;
        hasDefaultTemplate: boolean;
      }>
    >(`${this.base}/status`);
  }

  listLogs(opts: {
    page?: number;
    limit?: number;
    marketplaceOrderId?: string;
    occasion?: string;
  }) {
    let params = new HttpParams()
      .set('page', opts.page ?? 1)
      .set('limit', opts.limit ?? 25);
    if (opts.marketplaceOrderId) {
      params = params.set('marketplaceOrderId', opts.marketplaceOrderId);
    }
    if (opts.occasion) {
      params = params.set('occasion', opts.occasion);
    }
    return this.http.get<ApiResponse<WhatsappLogsPage>>(`${this.base}/logs`, {
      params,
    });
  }

  resend(orderId: string, occasion: WhatsappOccasion, force = true) {
    return this.http.post<ApiResponse<unknown>>(`${this.base}/resend`, {
      orderId,
      occasion,
      force,
    });
  }
}
