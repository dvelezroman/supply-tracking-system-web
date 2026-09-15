export interface ProductSegment {
  id: string;
  name: string;
  productCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductSegmentPayload {
  name: string;
}
