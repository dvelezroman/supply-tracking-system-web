import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { MatIconModule } from '@angular/material/icon';
import type {
  AvailabilityFilter,
  SortOption,
} from '../../utils/catalog.util';

@Component({
  selector: 'app-store-catalog-filters',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, TranslocoPipe, MatIconModule],
  templateUrl: './store-catalog-filters.component.html',
  styleUrl: './store-catalog-filters.component.scss',
})
export class StoreCatalogFiltersComponent {
  readonly query = input('');
  readonly category = input<string | null>(null);
  readonly availability = input<AvailabilityFilter>('ALL');
  readonly sort = input<SortOption>('DEFAULT');
  readonly categories = input<string[]>([]);
  readonly categoryCounts = input<Record<string, number>>({ ALL: 0 });
  readonly availabilityCounts = input<Record<AvailabilityFilter, number>>({
    ALL: 0,
    IN_STOCK: 0,
    LOW_STOCK: 0,
    OUT_OF_STOCK: 0,
  });
  readonly totalFiltered = input(0);
  readonly loading = input(false);
  readonly cartCount = input(0);

  readonly queryChange = output<string>();
  readonly categoryChange = output<string | null>();
  readonly availabilityChange = output<AvailabilityFilter>();
  readonly sortChange = output<SortOption>();
  readonly clearFilters = output<void>();

  readonly availabilityOptions: Array<{
    id: AvailabilityFilter;
    labelKey: string;
  }> = [
    { id: 'ALL', labelKey: 'marketplace.store.filterAllProducts' },
    { id: 'IN_STOCK', labelKey: 'marketplace.store.filterInStock' },
    { id: 'LOW_STOCK', labelKey: 'marketplace.store.filterLowStock' },
    { id: 'OUT_OF_STOCK', labelKey: 'marketplace.store.filterOutOfStock' },
  ];

  readonly hasFilters = computed(() => {
    return (
      Boolean(this.query().trim()) ||
      this.category() !== null ||
      this.availability() !== 'ALL' ||
      this.sort() !== 'DEFAULT'
    );
  });

  readonly mobileCategories = computed(() => [
    { id: null as string | null, label: 'ALL' },
    ...this.categories().map((c) => ({ id: c as string | null, label: c })),
  ]);

  onQuery(value: string): void {
    this.queryChange.emit(value);
  }

  setCategory(value: string | null): void {
    this.categoryChange.emit(value);
  }

  setAvailability(value: AvailabilityFilter): void {
    this.availabilityChange.emit(value);
  }

  setSort(value: string): void {
    this.sortChange.emit(value as SortOption);
  }

  clear(): void {
    this.clearFilters.emit();
  }
}
