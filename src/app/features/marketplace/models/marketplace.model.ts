export interface MarketplaceProductImage {
  id: string;
  productId: string;
  url: string;
  key: string;
  sortOrder: number;
  isPrimary: boolean;
  createdAt?: string;
}

export interface MarketplaceProduct {
  id: string;
  sku: string;
  slug: string;
  name: string;
  description?: string | null;
  category?: string | null;
  priceCents: number;
  currency: string;
  stockQty: number;
  published: boolean;
  traceProductId?: string | null;
  traceProduct?: { id: string; sku: string; name: string } | null;
  images: MarketplaceProductImage[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateMarketplaceProductPayload {
  sku: string;
  slug?: string;
  name: string;
  description?: string;
  category?: string;
  priceCents: number;
  currency?: string;
  stockQty?: number;
  published?: boolean;
  traceProductId?: string | null;
}

export interface MarketplaceSettings {
  id: string;
  orderNotificationEmail?: string | null;
  storeEnabled: boolean;
  fromName?: string | null;
  updatedAt?: string;
}

export interface PublicStoreSettings {
  storeEnabled: boolean;
}

export interface MarketplaceOrderItem {
  id?: string;
  productId?: string | null;
  name: string;
  sku: string;
  unitPriceCents: number;
  qty: number;
  imageUrl?: string | null;
}

export interface MarketplaceOrder {
  id: string;
  orderNumber: string;
  status: 'PENDING' | 'EMAILED' | 'CANCELLED';
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  customerAddress?: string | null;
  notes?: string | null;
  subtotalCents: number;
  currency: string;
  emailError?: string | null;
  items: MarketplaceOrderItem[];
  createdAt: string;
  updatedAt?: string;
}

export interface PublicOrderConfirmation {
  orderNumber: string;
  status: string;
  customerName: string;
  subtotalCents: number;
  currency: string;
  items: MarketplaceOrderItem[];
  createdAt: string;
}

export interface CreateOrderPayload {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerAddress?: string;
  notes?: string;
  items: Array<{ productId: string; qty: number }>;
}

export interface CartLine {
  productId: string;
  slug: string;
  name: string;
  sku: string;
  unitPriceCents: number;
  currency: string;
  qty: number;
  imageUrl?: string | null;
  stockQty: number;
}

export interface PublicCatalogPage {
  items: MarketplaceProduct[];
  total: number;
  page: number;
  limit: number;
  storeEnabled: boolean;
}
