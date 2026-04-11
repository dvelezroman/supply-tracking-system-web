export interface ProductLotSummary {
  id: string;
  lotCode: string;
  harvestDate: string;
  lotSizeLbs: number;
  presentation: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category?: string;
  metadata?: Record<string, unknown>;
  /** Default public `/trace` fields for new lots (admin; copied into each new lot). */
  publicVisibilityDefaults?: Record<string, boolean> | null;
  createdAt: string;
  updatedAt: string;
  /** From list endpoint — number of production lots for this SKU */
  lotCount?: number;
  /** From detail endpoint — lots linked to this product */
  lots?: ProductLotSummary[];
}

export interface CreateProductPayload {
  sku: string;
  name: string;
  description?: string;
  category?: string;
  metadata?: Record<string, unknown>;
}
