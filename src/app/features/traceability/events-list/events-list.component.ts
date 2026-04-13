import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
  DestroyRef,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, switchMap } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { TraceabilityService, type TraceabilityEventsFilters } from '../services/traceability.service';
import { ProductsService } from '../../products/services/products.service';
import { LotsAdminService, type LotSummary } from '../../lots/services/lots.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { TranslocoService } from '@jsverse/transloco';
import type { TraceabilityEvent } from '../../../core/models/traceability.model';
import {
  TRACEABILITY_FILTER_EVENT_TYPES,
  EVENT_TYPE_COLORS,
} from '../../../core/models/traceability.model';
import type { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-events-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    FormsModule,
    TranslocoPipe,
    DatePipe,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    PageHeaderComponent,
  ],
  templateUrl: './events-list.component.html',
  styleUrl: './events-list.component.scss',
})
export class EventsListComponent implements OnInit {
  private traceabilityService = inject(TraceabilityService);
  private productsService = inject(ProductsService);
  private lotsService = inject(LotsAdminService);
  private destroyRef = inject(DestroyRef);
  private transloco = inject(TranslocoService);

  private readonly load$ = new Subject<void>();

  isLoading = signal(false);
  events = signal<TraceabilityEvent[]>([]);
  totalItems = signal(0);
  currentPage = signal(1);
  pageSize = signal(20);

  products = signal<Product[]>([]);
  lotFilterOptions = signal<LotSummary[]>([]);

  filterProductId = signal('');
  filterLotId = signal('');
  filterEventDateFrom = signal('');
  filterEventDateTo = signal('');
  filterHarvestDateFrom = signal('');
  filterHarvestDateTo = signal('');
  filterEventType = signal<string>('');

  readonly eventTypeFilterOptions = TRACEABILITY_FILTER_EVENT_TYPES;
  readonly eventTypeColors = EVENT_TYPE_COLORS;

  readonly columns = ['timestamp', 'eventType', 'product', 'lot', 'actor', 'location', 'notes'];

  eventTypeLabel(type: string): string {
    const key = `eventTypes.${type}`;
    const out = this.transloco.translate(key);
    return out === key ? type.replace(/_/g, ' ') : out;
  }

  ngOnInit(): void {
    this.productsService.getAll(1, 100).subscribe((res) => {
      this.products.set(res.data.items);
    });

    this.load$
      .pipe(
        switchMap(() =>
          this.traceabilityService.getEvents(
            this.currentPage(),
            this.pageSize(),
            this.buildFilters(),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (res) => {
          this.events.set(res.data.items);
          this.totalItems.set(res.data.total);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });

    this.triggerLoad();
  }

  onProductFilterChange(pid: string): void {
    this.filterProductId.set(pid);
    this.filterLotId.set('');
    if (!pid) {
      this.lotFilterOptions.set([]);
      return;
    }
    this.lotsService.getAll({ productId: pid, page: 1, limit: 200 }).subscribe({
      next: (res) => this.lotFilterOptions.set(res.data.items),
      error: () => this.lotFilterOptions.set([]),
    });
  }

  private buildFilters(): TraceabilityEventsFilters {
    const f: TraceabilityEventsFilters = {};
    const pid = this.filterProductId().trim();
    const lid = this.filterLotId().trim();
    const df = this.filterEventDateFrom().trim();
    const dt = this.filterEventDateTo().trim();
    const hf = this.filterHarvestDateFrom().trim();
    const ht = this.filterHarvestDateTo().trim();
    const et = this.filterEventType().trim();
    if (pid) f.productId = pid;
    if (lid) f.lotId = lid;
    if (df) f.dateFrom = df;
    if (dt) f.dateTo = dt;
    if (hf) f.harvestDateFrom = hf;
    if (ht) f.harvestDateTo = ht;
    if (et) f.eventType = et;
    return f;
  }

  triggerLoad(): void {
    this.isLoading.set(true);
    this.load$.next();
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.triggerLoad();
  }

  clearFilters(): void {
    this.filterProductId.set('');
    this.filterLotId.set('');
    this.lotFilterOptions.set([]);
    this.filterEventDateFrom.set('');
    this.filterEventDateTo.set('');
    this.filterHarvestDateFrom.set('');
    this.filterHarvestDateTo.set('');
    this.filterEventType.set('');
    this.currentPage.set(1);
    this.triggerLoad();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
    this.triggerLoad();
  }
}
