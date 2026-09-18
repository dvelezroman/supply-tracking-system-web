import type { MarketplaceProduct } from '../../models/marketplace.model';
import { effectiveUnitPriceCents } from '../../utils/marketplace-pricing.util';

export const STORE_PAGE_SIZE = 12;
export const STORE_API_PAGE_LIMIT = 100;

export type AvailabilityFilter =
  | 'ALL'
  | 'IN_STOCK'
  | 'LOW_STOCK'
  | 'OUT_OF_STOCK';

export type SortOption = 'DEFAULT' | 'PRICE_ASC' | 'PRICE_DESC' | 'NAME_ASC';

export type CatalogFilters = {
  query?: string;
  category?: string | null;
  availability?: AvailabilityFilter;
};

export type PaginatedCatalog<T> = {
  items: T[];
  total: number;
  page: number;
  pageCount: number;
};

export function productStock(product: MarketplaceProduct): number {
  return Math.max(0, Math.floor(Number(product.stockQty)) || 0);
}

export function isInStock(product: MarketplaceProduct): boolean {
  return productStock(product) > 2;
}

export function isLowStock(product: MarketplaceProduct): boolean {
  const qty = productStock(product);
  return qty > 0 && qty <= 2;
}

export function isOutOfStock(product: MarketplaceProduct): boolean {
  return productStock(product) === 0;
}

export function matchesAvailability(
  product: MarketplaceProduct,
  availability: AvailabilityFilter,
): boolean {
  if (availability === 'ALL') return true;
  if (availability === 'IN_STOCK') return isInStock(product);
  if (availability === 'LOW_STOCK') return isLowStock(product);
  return isOutOfStock(product);
}

export function distinctCategories(
  products: MarketplaceProduct[],
): string[] {
  const set = new Set<string>();
  for (const product of products) {
    const category = product.category?.trim();
    if (category) set.add(category);
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'es'));
}

export function filterProducts(
  products: MarketplaceProduct[],
  filters: CatalogFilters,
): MarketplaceProduct[] {
  const query = filters.query?.trim().toLowerCase() ?? '';
  const category = filters.category?.trim() || null;
  const availability = filters.availability ?? 'ALL';

  return products.filter((product) => {
    if (category && (product.category?.trim() ?? '') !== category) {
      return false;
    }
    if (!matchesAvailability(product, availability)) {
      return false;
    }
    if (!query) return true;

    const haystack = [
      product.name,
      product.sku,
      product.category ?? '',
      product.description ?? '',
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(query);
  });
}

export function sortProducts(
  products: MarketplaceProduct[],
  sort: SortOption,
): MarketplaceProduct[] {
  const next = [...products];

  if (sort === 'PRICE_ASC') {
    next.sort(
      (a, b) => effectiveUnitPriceCents(a) - effectiveUnitPriceCents(b),
    );
  } else if (sort === 'PRICE_DESC') {
    next.sort(
      (a, b) => effectiveUnitPriceCents(b) - effectiveUnitPriceCents(a),
    );
  } else if (sort === 'NAME_ASC') {
    next.sort((a, b) => a.name.localeCompare(b.name, 'es'));
  } else {
    // DEFAULT: newest first (createdAt desc)
    next.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  return next;
}

export function paginateProducts<T>(
  items: T[],
  page: number,
  pageSize: number = STORE_PAGE_SIZE,
): PaginatedCatalog<T> {
  const total = items.length;
  const size = Math.max(1, pageSize);
  const pageCount = total === 0 ? 0 : Math.ceil(total / size);
  const safePage =
    pageCount === 0 ? 1 : Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * size;

  return {
    items: items.slice(start, start + size),
    total,
    page: safePage,
    pageCount,
  };
}

/** Compact window of page numbers around current page (with edges handled by UI). */
export function visiblePageNumbers(
  page: number,
  pageCount: number,
  windowSize = 3,
): number[] {
  if (pageCount <= 0) return [];
  const half = Math.floor(windowSize / 2);
  let start = Math.max(1, page - half);
  let end = Math.min(pageCount, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);
  const pages: number[] = [];
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
}

export function availabilityCounts(products: MarketplaceProduct[]): Record<
  AvailabilityFilter,
  number
> {
  return {
    ALL: products.length,
    IN_STOCK: products.filter(isInStock).length,
    LOW_STOCK: products.filter(isLowStock).length,
    OUT_OF_STOCK: products.filter(isOutOfStock).length,
  };
}

export function categoryCounts(
  products: MarketplaceProduct[],
): Record<string, number> {
  const counts: Record<string, number> = { ALL: products.length };
  for (const product of products) {
    const category = product.category?.trim();
    if (!category) continue;
    counts[category] = (counts[category] ?? 0) + 1;
  }
  return counts;
}
