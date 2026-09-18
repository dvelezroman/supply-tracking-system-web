import type { MarketplaceProduct } from '../models/marketplace.model';
import type { CartLine } from '../models/marketplace.model';

export function clampDiscountPercent(value: number | null | undefined): number {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (n >= 100) return 100;
  return n;
}

export function totalDiscountPercent(parts: {
  discountPercent?: number | null;
  promoDiscountPercent?: number | null;
}): number {
  return Math.min(
    100,
    clampDiscountPercent(parts.discountPercent) +
      clampDiscountPercent(parts.promoDiscountPercent),
  );
}

export function effectiveUnitPriceCents(product: {
  priceCents: number;
  discountPercent?: number | null;
  promoDiscountPercent?: number | null;
}): number {
  const pvp = Math.max(0, Math.floor(Number(product.priceCents)) || 0);
  const pct = totalDiscountPercent(product);
  if (pct <= 0) return pvp;
  if (pct >= 100) return 0;
  return Math.round((pvp * (100 - pct)) / 100);
}

export function cartLineFromProduct(
  product: MarketplaceProduct,
  imageUrl?: string | null,
): Omit<CartLine, 'qty'> {
  const discountPercent = clampDiscountPercent(product.discountPercent);
  const promoDiscountPercent = clampDiscountPercent(product.promoDiscountPercent);
  const listUnitPriceCents = product.priceCents;
  return {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    sku: product.sku,
    listUnitPriceCents,
    discountPercent,
    promoDiscountPercent,
    unitPriceCents: effectiveUnitPriceCents(product),
    currency: product.currency,
    stockQty: product.stockQty,
    imageUrl: imageUrl ?? null,
  };
}

export function lineDiscountCents(line: CartLine): number {
  const list =
    typeof line.listUnitPriceCents === 'number'
      ? line.listUnitPriceCents
      : line.unitPriceCents;
  return Math.max(0, (list - line.unitPriceCents) * line.qty);
}

export function hasLineDiscount(line: CartLine): boolean {
  return lineDiscountCents(line) > 0;
}

export function lineTotalDiscountPercent(line: CartLine): number {
  return totalDiscountPercent(line);
}
