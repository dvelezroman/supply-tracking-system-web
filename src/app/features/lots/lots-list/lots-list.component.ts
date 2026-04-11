import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
  DestroyRef,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { DatePipe, DecimalPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { finalize, take } from 'rxjs/operators';
import { LotsAdminService, type LotSummary } from '../services/lots.service';
import { ProductsService } from '../../products/services/products.service';
import type { Product } from '../../../core/models/product.model';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { QrPdfDownloadComponent } from '../../../shared/components/qr-pdf-download/qr-pdf-download.component';

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
    PageHeaderComponent,
    QrPdfDownloadComponent,
  ],
  templateUrl: './lots-list.component.html',
  styleUrl: './lots-list.component.scss',
})
export class LotsListComponent implements OnInit {
  private lotsService = inject(LotsAdminService);
  private productsService = inject(ProductsService);
  private destroyRef = inject(DestroyRef);

  isLoading = signal(false);
  lots = signal<LotSummary[]>([]);
  totalItems = signal(0);
  currentPage = signal(1);
  pageSize = signal(20);
  expandedLotCode = signal<string | null>(null);

  /** Applied filters (also sent to API). */
  filterSearch = signal('');
  filterProductId = signal<string | null>(null);
  filterHarvestFrom = signal<string | undefined>(undefined);
  filterHarvestTo = signal<string | undefined>(undefined);

  productOptions = signal<Product[]>([]);

  readonly columns = ['lotCode', 'product', 'presentation', 'colorSalmoFan', 'harvestDate', 'lotSizeLbs', 'actions'];

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

  toggleQrPanel(lotCode: string): void {
    this.expandedLotCode.set(
      this.expandedLotCode() === lotCode ? null : lotCode,
    );
  }
}
