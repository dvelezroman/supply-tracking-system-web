import { Injectable, computed, inject, signal } from '@angular/core';
import { setCookie } from '../../../core/utils/cookie.util';
import type { CartLine, MarketplaceProduct } from '../models/marketplace.model';
import { primaryMarketplaceImageSrc } from '../utils/marketplace-media';
import {
  cartLineFromProduct,
  clampDiscountPercent,
  effectiveUnitPriceCents,
  lineDiscountCents,
} from '../utils/marketplace-pricing.util';

const STORAGE_KEY = 'marea_cart_v1';
const CART_COOKIE = 'st_cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly linesSignal = signal<CartLine[]>(this.readStorage());

  readonly lines = this.linesSignal.asReadonly();
  readonly itemCount = computed(() =>
    this.linesSignal().reduce((sum, l) => sum + l.qty, 0),
  );
  readonly subtotalCents = computed(() =>
    this.linesSignal().reduce((sum, l) => sum + l.unitPriceCents * l.qty, 0),
  );
  readonly listSubtotalCents = computed(() =>
    this.linesSignal().reduce(
      (sum, l) => sum + this.listUnitPrice(l) * l.qty,
      0,
    ),
  );
  readonly discountTotalCents = computed(() =>
    this.linesSignal().reduce((sum, l) => sum + lineDiscountCents(l), 0),
  );

  add(line: Omit<CartLine, 'qty'>, qty = 1): void {
    const amount = Math.max(1, qty);
    this.linesSignal.update((current) => {
      const idx = current.findIndex((l) => l.productId === line.productId);
      if (idx >= 0) {
        const next = [...current];
        const existing = next[idx]!;
        const cap = this.effectiveStockQty({ ...existing, ...line });
        const newQty = Math.min(cap, existing.qty + amount);
        next[idx] = { ...existing, ...line, stockQty: cap, qty: newQty };
        return next;
      }
      const cap = this.effectiveStockQty({ ...line, qty: amount });
      return [...current, { ...line, stockQty: cap, qty: Math.min(cap, amount) }];
    });
    this.persist();
  }

  setQty(productId: string, qty: number): void {
    const safeQty = Math.max(0, Math.floor(Number(qty)) || 0);
    this.linesSignal.update((current) =>
      current
        .map((l) =>
          l.productId === productId
            ? {
                ...l,
                qty: Math.max(
                  0,
                  Math.min(this.effectiveStockQty(l), safeQty),
                ),
              }
            : l,
        )
        .filter((l) => l.qty > 0),
    );
    this.persist();
  }

  remove(productId: string): void {
    this.linesSignal.update((current) =>
      current.filter((l) => l.productId !== productId),
    );
    this.persist();
  }

  removeBySlug(slug: string): void {
    if (!slug) return;
    this.linesSignal.update((current) =>
      current.filter((l) => l.slug !== slug),
    );
    this.persist();
  }

  clear(): void {
    this.linesSignal.set([]);
    this.persist();
  }

  /** Clamp qty and update stock cap (e.g. after a 409 stock conflict). */
  applyStockLevel(productId: string, available: number): void {
    const cap = Math.max(0, Math.floor(Number(available)) || 0);
    this.linesSignal.update((current) =>
      current
        .map((l) =>
          l.productId === productId
            ? {
                ...l,
                stockQty: cap,
                qty: cap > 0 ? Math.min(l.qty, cap) : 0,
              }
            : l,
        )
        .filter((l) => l.qty > 0),
    );
    this.persist();
  }

  /** Refresh line from live catalog data (checkout sync). */
  upsertFromProduct(product: MarketplaceProduct, imageUrl?: string | null): void {
    const primary =
      primaryMarketplaceImageSrc(product.images) ?? imageUrl ?? null;
    const line = cartLineFromProduct(product, primary);
    this.linesSignal.update((current) => {
      const idx = current.findIndex(
        (l) => l.productId === product.id || l.slug === product.slug,
      );
      if (idx < 0) return current;
      const existing = current[idx]!;
      const cap = this.effectiveStockQty({ ...line, qty: existing.qty });
      if (cap < 1) {
        return current.filter((_, i) => i !== idx);
      }
      const next = [...current];
      next[idx] = {
        ...line,
        qty: Math.min(existing.qty, cap),
      };
      return next;
    });
    this.persist();
  }

  private persist(): void {
    const lines = this.linesSignal();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* ignore quota */
    }
    setCookie(CART_COOKIE, lines.length > 0 ? '1' : '0');
  }

  private readStorage(): CartLine[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as CartLine[];
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((l) => this.normalizeLine(l))
        .filter((l): l is CartLine => l !== null);
    } catch {
      return [];
    }
  }

  private effectiveStockQty(line: CartLine): number {
    if (
      typeof line.stockQty === 'number' &&
      Number.isFinite(line.stockQty) &&
      line.stockQty > 0
    ) {
      return line.stockQty;
    }
    return Math.max(1, Math.floor(line.qty) || 1);
  }

  private normalizeLine(raw: CartLine): CartLine | null {
    if (!raw || typeof raw.productId !== 'string' || !raw.productId.trim()) {
      return null;
    }
    const qty = Math.max(1, Math.floor(Number(raw.qty)) || 0);
    if (qty < 1) return null;
    const unitPriceCents = Math.max(
      0,
      Math.floor(Number(raw.unitPriceCents)) || 0,
    );
    const stockQty = this.effectiveStockQty({
      ...raw,
      qty,
      unitPriceCents,
    });
    const listUnitPriceCents = Math.max(
      0,
      Math.floor(Number(raw.listUnitPriceCents)) ||
        unitPriceCents,
    );
    const discountPercent = clampDiscountPercent(raw.discountPercent);
    const promoDiscountPercent = clampDiscountPercent(raw.promoDiscountPercent);
    const effectiveUnit =
      discountPercent > 0 || promoDiscountPercent > 0
        ? effectiveUnitPriceCents({
            priceCents: listUnitPriceCents,
            discountPercent,
            promoDiscountPercent,
          })
        : unitPriceCents;

    return {
      ...raw,
      productId: raw.productId.trim(),
      slug: typeof raw.slug === 'string' ? raw.slug : '',
      name: typeof raw.name === 'string' ? raw.name : '',
      sku: typeof raw.sku === 'string' ? raw.sku : '',
      currency: typeof raw.currency === 'string' ? raw.currency : 'USD',
      qty: Math.min(stockQty, qty),
      listUnitPriceCents,
      discountPercent,
      promoDiscountPercent,
      unitPriceCents: effectiveUnit,
      stockQty,
    };
  }

  private listUnitPrice(line: CartLine): number {
    if (
      typeof line.listUnitPriceCents === 'number' &&
      Number.isFinite(line.listUnitPriceCents)
    ) {
      return line.listUnitPriceCents;
    }
    return line.unitPriceCents;
  }
}
