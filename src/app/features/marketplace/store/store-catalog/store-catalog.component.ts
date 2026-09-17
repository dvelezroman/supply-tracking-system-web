import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { TranslocoPipe } from '@jsverse/transloco';
import { MatIconModule } from '@angular/material/icon';
import { MarketplacePublicApiService } from '../../services/marketplace-api.service';
import { CartService } from '../../services/cart.service';
import type { MarketplaceProduct } from '../../models/marketplace.model';
import {
  STORE_API_PAGE_LIMIT,
  STORE_PAGE_SIZE,
  type AvailabilityFilter,
  type SortOption,
  availabilityCounts,
  categoryCounts,
  distinctCategories,
  filterProducts,
  paginateProducts,
  sortProducts,
} from '../utils/catalog.util';
import { StoreHeroComponent } from '../components/store-hero/store-hero.component';
import { StoreCatalogFiltersComponent } from '../components/store-catalog-filters/store-catalog-filters.component';
import { StoreProductCardComponent } from '../components/store-product-card/store-product-card.component';
import { StoreProductCardSkeletonComponent } from '../components/store-product-card-skeleton/store-product-card-skeleton.component';
import { StorePaginationComponent } from '../components/store-pagination/store-pagination.component';
import { StoreEmptyCatalogComponent } from '../components/store-empty-catalog/store-empty-catalog.component';

@Component({
  selector: 'app-store-catalog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    FormsModule,
    TranslocoPipe,
    MatIconModule,
    StoreHeroComponent,
    StoreCatalogFiltersComponent,
    StoreProductCardComponent,
    StoreProductCardSkeletonComponent,
    StorePaginationComponent,
    StoreEmptyCatalogComponent,
  ],
  templateUrl: './store-catalog.component.html',
  styleUrl: './store-catalog.component.scss',
})
export class StoreCatalogComponent implements OnInit {
  private api = inject(MarketplacePublicApiService);
  protected cart = inject(CartService);

  isLoading = signal(true);
  loadError = signal<string | null>(null);
  storeEnabled = signal(true);
  allProducts = signal<MarketplaceProduct[]>([]);

  query = signal('');
  category = signal<string | null>(null);
  availability = signal<AvailabilityFilter>('ALL');
  sort = signal<SortOption>('DEFAULT');
  page = signal(1);

  readonly skeletonSlots = Array.from({ length: 8 }, (_, i) => i);
  readonly desktopSkeletonSlots = Array.from({ length: 12 }, (_, i) => i);

  readonly categories = computed(() => distinctCategories(this.allProducts()));
  readonly catCounts = computed(() => categoryCounts(this.allProducts()));
  readonly availCounts = computed(() => availabilityCounts(this.allProducts()));

  readonly filtered = computed(() => {
    const filtered = filterProducts(this.allProducts(), {
      query: this.query(),
      category: this.category(),
      availability: this.availability(),
    });
    return sortProducts(filtered, this.sort());
  });

  readonly pageView = computed(() =>
    paginateProducts(this.filtered(), this.page(), STORE_PAGE_SIZE),
  );

  readonly hasActiveFilters = computed(() => {
    return (
      Boolean(this.query().trim()) ||
      this.category() !== null ||
      this.availability() !== 'ALL' ||
      this.sort() !== 'DEFAULT'
    );
  });

  readonly availabilityOptions: Array<{
    id: AvailabilityFilter;
    labelKey: string;
  }> = [
    { id: 'ALL', labelKey: 'marketplace.store.filterAllProducts' },
    { id: 'IN_STOCK', labelKey: 'marketplace.store.filterInStock' },
    { id: 'LOW_STOCK', labelKey: 'marketplace.store.filterLowStock' },
    { id: 'OUT_OF_STOCK', labelKey: 'marketplace.store.filterOutOfStock' },
  ];

  ngOnInit(): void {
    void this.loadAll();
  }

  onQuery(value: string): void {
    this.query.set(value);
    this.page.set(1);
  }

  onCategory(value: string | null): void {
    this.category.set(value);
    this.page.set(1);
  }

  onAvailability(value: AvailabilityFilter): void {
    this.availability.set(value);
    this.page.set(1);
  }

  onSort(value: SortOption | string): void {
    this.sort.set(value as SortOption);
    this.page.set(1);
  }

  clearFilters(): void {
    this.query.set('');
    this.category.set(null);
    this.availability.set('ALL');
    this.sort.set('DEFAULT');
    this.page.set(1);
  }

  onPageChange(next: number): void {
    this.page.set(next);
    document.getElementById('tienda-catalogo')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  availabilityLabelKey(id: AvailabilityFilter): string {
    return (
      this.availabilityOptions.find((o) => o.id === id)?.labelKey ??
      'marketplace.store.filterAllProducts'
    );
  }

  /**
   * Load all published products via paginated API (limit=100).
   * Client-side filter/sort/paginate mirrors ruta593 UX.
   */
  private async loadAll(): Promise<void> {
    this.isLoading.set(true);
    this.loadError.set(null);

    try {
      const first = await firstValueFrom(
        this.api.listProducts(1, STORE_API_PAGE_LIMIT),
      );
      const data = first.data;
      this.storeEnabled.set(data.storeEnabled !== false);

      if (!data.storeEnabled) {
        this.allProducts.set([]);
        this.isLoading.set(false);
        return;
      }

      const items = [...data.items];
      const total = data.total;
      let page = 1;
      const limit = data.limit || STORE_API_PAGE_LIMIT;

      while (items.length < total) {
        page += 1;
        const next = await firstValueFrom(
          this.api.listProducts(page, limit),
        );
        if (!next.data.items.length) break;
        items.push(...next.data.items);
        if (next.data.items.length < limit) break;
      }

      this.allProducts.set(items);
    } catch {
      this.loadError.set('marketplace.store.loadError');
      this.allProducts.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }
}
