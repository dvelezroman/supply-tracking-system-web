import { Injectable, computed, inject, signal } from '@angular/core';
import { setCookie } from '../../../core/utils/cookie.util';
import type { CartLine } from '../models/marketplace.model';

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

  add(line: Omit<CartLine, 'qty'>, qty = 1): void {
    const amount = Math.max(1, qty);
    this.linesSignal.update((current) => {
      const idx = current.findIndex((l) => l.productId === line.productId);
      if (idx >= 0) {
        const next = [...current];
        const existing = next[idx]!;
        const newQty = Math.min(existing.stockQty, existing.qty + amount);
        next[idx] = { ...existing, ...line, qty: newQty };
        return next;
      }
      return [
        ...current,
        { ...line, qty: Math.min(line.stockQty, amount) },
      ];
    });
    this.persist();
  }

  setQty(productId: string, qty: number): void {
    this.linesSignal.update((current) =>
      current
        .map((l) =>
          l.productId === productId
            ? { ...l, qty: Math.max(0, Math.min(l.stockQty, qty)) }
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

  clear(): void {
    this.linesSignal.set([]);
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
      return parsed.filter(
        (l) =>
          l &&
          typeof l.productId === 'string' &&
          typeof l.qty === 'number' &&
          l.qty > 0,
      );
    } catch {
      return [];
    }
  }
}
