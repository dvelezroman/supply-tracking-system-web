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
  /** Retail packaging label (Ecuador) — shared by all lots of this SKU */
  labelTitle?: string | null;
  labelGtin13?: string | null;
  labelNetWeightOz?: number | null;
  labelNetWeightLbs?: number | null;
  labelSanitaryArcsa?: string | null;
}

export interface PatchRetailLabelPayload {
  labelTitle?: string | null;
  labelGtin13?: string | null;
  labelNetWeightOz?: number | null;
  labelNetWeightLbs?: number | null;
  labelSanitaryArcsa?: string | null;
}

export interface RetailLabelReadiness {
  ready: boolean;
  missing: string[];
  productId: string;
  productSku: string;
}

export interface CreateProductPayload {
  sku: string;
  name: string;
  description?: string;
  category?: string;
  metadata?: Record<string, unknown>;
}
