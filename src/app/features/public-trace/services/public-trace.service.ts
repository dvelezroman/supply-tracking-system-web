import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import type { EventType } from '../../../core/models/traceability.model';
import type { ActorType } from '../../../core/models/actor.model';

export interface PublicLot {
  lotCode: string | null;
  product: { name: string | null; sku: string | null; category: string | null };
  presentation: string | null;
  packaging: string | null;
  weightKg: number | null;
  sizeClassification: string | null;
  colorSalmoFan: string | null;
  texture: string | null;
  certifications: string[] | null;
  lotSizeLbs: number | null;
  harvestDate: string | null;
  poolNumber: number | null;
  harvestWeightGrams: number | null;
  origin: {
    farm: { name: string | null; location: string | null };
    lab: { name: string | null; location: string | null };
    maturation: { name: string | null; location: string | null };
    coPacker: { name: string | null; location: string | null };
  };
}

export interface PublicEvent {
  eventType: EventType;
  timestamp: string;
  location: string | null;
  notes: string | null;
  actor: { name: string; type: ActorType | null; location: string | null };
  metadata: Record<string, unknown> | null;
}

export interface PublicTraceResponse {
  lot: PublicLot;
  events: PublicEvent[];
  qrCode: string | null;
  traceUrl: string | null;
  generatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class PublicTraceService {
  private http = inject(HttpClient);

  getTrace(lotCode: string) {
    return this.http.get<PublicTraceResponse>(
      `${environment.apiBase}/public/trace/${lotCode}`,
    );
  }
}
