import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
  DestroyRef,
  effect,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { DatePipe, DecimalPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { finalize, take } from 'rxjs/operators';
import { LotsAdminService, type LotSummary } from '../services/lots.service';
import { TraceabilityService } from '../../traceability/services/traceability.service';
import { ProductsService } from '../../products/services/products.service';
import type { Product } from '../../../core/models/product.model';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { QrPdfDownloadComponent } from '../../../shared/components/qr-pdf-download/qr-pdf-download.component';
import { LotTraceTimelineComponent } from '../../traceability/lot-trace-timeline/lot-trace-timeline.component';
import type { TraceabilityEvent } from '../../../core/models/traceability.model';

@Component({
  selector: 'app-lots-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    TranslocoPipe,
    DatePipe,
    DecimalPipe,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTabsModule,
    MatExpansionModule,
    PageHeaderComponent,
    QrPdfDownloadComponent,
    LotTraceTimelineComponent,
  ],
  templateUrl: './lots-list.component.html',
  styleUrl: './lots-list.component.scss',
})
export class LotsListComponent implements OnInit {
  private lotsService = inject(LotsAdminService);
  private traceabilityService = inject(TraceabilityService);
  private router = inject(Router);
  private productsService = inject(ProductsService);
  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);
  private snackbar = inject(SnackbarService);
  private transloco = inject(TranslocoService);

  isLoading = signal(false);
  lots = signal<LotSummary[]>([]);
  totalItems = signal(0);
  currentPage = signal(1);
  pageSize = signal(20);
  /** Lot code for the expanded panel below the table (null = closed). */
  expandedLotCode = signal<string | null>(null);
  /** Active tab in the panel: 0 = traceability, 1 = PDF labels. */
  lotPanelTabIndex = signal(0);
  /** Desplegar / retraer el bloque de historial de trazabilidad (pestaña Trazabilidad). */
  traceHistoryPanelExpanded = signal(true);
  historyEvents = signal<TraceabilityEvent[]>([]);
  historyLoading = signal(false);

  /** Applied filters (also sent to API). */
  filterSearch = signal('');
  filterProductId = signal<string | null>(null);
  filterHarvestFrom = signal<string | undefined>(undefined);
  filterHarvestTo = signal<string | undefined>(undefined);

  productOptions = signal<Product[]>([]);

  readonly columns = ['lotCode', 'product', 'presentation', 'colorSalmoFan', 'harvestDate', 'lotSizeLbs', 'actions'];

  constructor() {
    effect(
      () => {
        const code = this.expandedLotCode();
        if (!code) {
          this.historyEvents.set([]);
          this.historyLoading.set(false);
          return;
        }
        this.fetchHistoryForLotCode(code);
      },
      { allowSignalWrites: true },
    );
  }

  private fetchHistoryForLotCode(lotCode: string): void {
    this.historyLoading.set(true);
    this.lotsService.getHistory(lotCode).subscribe({
      next: (res) => {
        const lot = res.data.lot;
        const mapped = (res.data.events as TraceabilityEvent[]).map((e: TraceabilityEvent) => ({
          ...e,
          productId: lot.product.id,
          lotCode: lot.lotCode,
          timestamp:
            typeof e.timestamp === 'string'
              ? e.timestamp
              : (e.timestamp as unknown as Date).toISOString?.() ?? String(e.timestamp),
        }));
        this.historyEvents.set(mapped);
        this.historyLoading.set(false);
      },
      error: () => {
        this.historyEvents.set([]);
        this.historyLoading.set(false);
      },
    });
  }

  onTraceEdit(e: TraceabilityEvent): void {
    void this.router.navigate(['/traceability/events', e.id, 'edit'], {
      queryParams: { returnUrl: '/lots' },
    });
  }

  onTraceDelete(e: TraceabilityEvent): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: this.transloco.translate('traceability.deleteEventTitle'),
        message: this.transloco.translate('traceability.deleteEventConfirm'),
        confirmLabel: this.transloco.translate('common.delete'),
      },
    });
    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((confirmed) => {
      if (!confirmed) return;
      this.traceabilityService.deleteEvent(e.id).subscribe({
        next: () => {
          this.snackbar.success(this.transloco.translate('form.toast.eventDeleted'));
          const code = this.expandedLotCode();
          if (code) this.fetchHistoryForLotCode(code);
        },
      });
    });
  }

  ngOnInit(): void {
    this.productsService
      .getAll(1, 500)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => this.productOptions.set(res.data.items),
        error: () => this.productOptions.set([]),
      });
    this.loadLots();
  }

  loadLots(): void {
    this.isLoading.set(true);
    this.lotsService
      .getAll({
        page: this.currentPage(),
        limit: this.pageSize(),
        productId: this.filterProductId() ?? undefined,
        search: this.filterSearch() || undefined,
        harvestFrom: this.filterHarvestFrom(),
        harvestTo: this.filterHarvestTo(),
      })
      .pipe(
        take(1),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (res) => {
          this.lots.set(res.data.items);
          this.totalItems.set(res.data.total);
        },
        error: () => {},
      });
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.loadLots();
  }

  clearFilters(): void {
    this.filterSearch.set('');
    this.filterProductId.set(null);
    this.filterHarvestFrom.set(undefined);
    this.filterHarvestTo.set(undefined);
    this.currentPage.set(1);
    this.loadLots();
  }

  hasActiveFilters(): boolean {
    return !!(
      this.filterSearch().trim() ||
      this.filterProductId() ||
      this.filterHarvestFrom() ||
      this.filterHarvestTo()
    );
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
    this.loadLots();
  }

  lotByCode(code: string): LotSummary | undefined {
    return this.lots().find((l) => l.lotCode === code);
  }

  openLotPanel(lotCode: string, tabIndex: number): void {
    const cur = this.expandedLotCode();
    if (cur === lotCode && this.lotPanelTabIndex() === tabIndex) {
      this.expandedLotCode.set(null);
    } else {
      const isNewLot = cur !== lotCode;
      this.expandedLotCode.set(lotCode);
      this.lotPanelTabIndex.set(tabIndex);
      // Solo expandir historial al elegir otro lote; si el usuario lo minimizó,
      // no forzar al cambiar de pestaña ni al volver a Trazabilidad del mismo lote.
      if (isNewLot) {
        this.traceHistoryPanelExpanded.set(true);
      }
    }
  }

  onLotTabChange(index: number): void {
    if (!this.expandedLotCode()) return;
    this.lotPanelTabIndex.set(index);
  }

  onTraceHistoryExpandedChange(expanded: boolean): void {
    this.traceHistoryPanelExpanded.set(expanded);
  }

  registerEventQuery(lotCode: string): Record<string, string> {
    const l = this.lotByCode(lotCode);
    if (!l) return { returnUrl: '/lots' };
    return { lotId: l.id, returnUrl: '/lots' };
  }

  deleteLot(lot: LotSummary): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: this.transloco.translate('lots.deleteTitle'),
        message: this.transloco.translate('lots.deleteConfirm', { lotCode: lot.lotCode }),
        confirmLabel: this.transloco.translate('common.delete'),
      },
    });
    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((confirmed) => {
      if (!confirmed) return;
      this.lotsService.delete(lot.id).subscribe({
        next: () => {
          this.snackbar.success(this.transloco.translate('form.toast.lotDeleted'));
          if (this.expandedLotCode() === lot.lotCode) {
            this.expandedLotCode.set(null);
          }
          this.loadLots();
        },
      });
    });
  }
}
