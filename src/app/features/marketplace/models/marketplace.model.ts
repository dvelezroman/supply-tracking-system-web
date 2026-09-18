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
  discountPercent: number;
  promoDiscountPercent: number;
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
  discountPercent?: number;
  promoDiscountPercent?: number;
  currency?: string;
  stockQty?: number;
  published?: boolean;
  traceProductId?: string | null;
}

export interface MarketplaceSettings {
  id: string;
  orderNotificationEmail?: string | null;
  storeEnabled: boolean;
  onlinePaymentsEnabled?: boolean;
  fromName?: string | null;
  updatedAt?: string;
}

export interface PublicStoreSettings {
  storeEnabled: boolean;
  onlinePaymentsEnabled?: boolean;
  paypalAvailable?: boolean;
  paypalMode?: 'mock' | 'live' | 'off';
}

export interface MarketplaceOrderItem {
  id?: string;
  productId?: string | null;
  name: string;
  sku: string;
  listUnitPriceCents: number;
  discountPercent: number;
  promoDiscountPercent: number;
  unitPriceCents: number;
  qty: number;
  imageUrl?: string | null;
}

export type MarketplaceOrderStatus =
  | 'PENDING'
  | 'EMAILED'
  | 'CANCELLED'
  | 'AWAITING_PAYMENT'
  | 'PAID'
  | 'PAYMENT_FAILED';

export type MarketplacePaymentMethod = 'EMAIL' | 'PAYPAL';

export interface MarketplaceOrder {
  id: string;
  orderNumber: string;
  status: MarketplaceOrderStatus;
  paymentMethod?: MarketplacePaymentMethod;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  customerAddress?: string | null;
  notes?: string | null;
  subtotalCents: number;
  listSubtotalCents: number;
  discountTotalCents: number;
  currency: string;
  emailError?: string | null;
  paypalOrderId?: string | null;
  paypalCaptureId?: string | null;
  paidAt?: string | null;
  paymentError?: string | null;
  approveUrl?: string;
  paypalMode?: 'mock' | 'live' | 'off';
  items: MarketplaceOrderItem[];
  createdAt: string;
  updatedAt?: string;
}

export interface PublicOrderConfirmation {
  orderNumber: string;
  status: string;
  paymentMethod?: MarketplacePaymentMethod;
  customerName: string;
  subtotalCents: number;
  listSubtotalCents: number;
  discountTotalCents: number;
  currency: string;
  paidAt?: string | null;
  items: MarketplaceOrderItem[];
  createdAt: string;
}

export interface CreateOrderPayload {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerAddress?: string;
  notes?: string;
  paymentMethod?: MarketplacePaymentMethod;
  items: Array<{ productId: string; qty: number }>;
}

export interface CartLine {
  productId: string;
  slug: string;
  name: string;
  sku: string;
  /** PVP per unit when added to cart. */
  listUnitPriceCents: number;
  discountPercent: number;
  promoDiscountPercent: number;
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
