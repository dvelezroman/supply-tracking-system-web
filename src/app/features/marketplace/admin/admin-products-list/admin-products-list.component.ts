import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
  DestroyRef,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { MarketplaceAdminApiService } from '../../services/marketplace-api.service';
import { formatMoney } from '../../utils/money';
import type { MarketplaceProduct } from '../../models/marketplace.model';

@Component({
  selector: 'app-admin-products-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    TranslocoPipe,
    DatePipe,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressBarModule,
    MatChipsModule,
    MatTooltipModule,
    PageHeaderComponent,
  ],
  templateUrl: './admin-products-list.component.html',
  styleUrl: './admin-products-list.component.scss',
})
export class AdminProductsListComponent implements OnInit {
  private api = inject(MarketplaceAdminApiService);
  private dialog = inject(MatDialog);
  private snackbar = inject(SnackbarService);
  private destroyRef = inject(DestroyRef);
  private transloco = inject(TranslocoService);

  isLoading = signal(false);
  products = signal<MarketplaceProduct[]>([]);
  totalItems = signal(0);
  currentPage = signal(1);
  pageSize = signal(20);
  searchTerm = signal('');
  readonly formatMoney = formatMoney;
  readonly columns = [
    'image',
    'sku',
    'name',
    'price',
    'stock',
    'published',
    'updatedAt',
    'actions',
  ];
  private search$ = new Subject<string>();

  ngOnInit(): void {
    this.search$
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.currentPage.set(1);
        this.load();
      });
    this.load();
  }

  onSearch(value: string): void {
    this.searchTerm.set(value);
    this.search$.next(value);
  }

  onPage(ev: PageEvent): void {
    this.currentPage.set(ev.pageIndex + 1);
    this.pageSize.set(ev.pageSize);
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.api
      .listProducts(this.currentPage(), this.pageSize(), this.searchTerm() || undefined)
      .subscribe({
        next: (res) => {
          this.products.set(res.data.items);
          this.totalItems.set(res.data.total);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  primaryImage(p: MarketplaceProduct): string | null {
    return p.images.find((i) => i.isPrimary)?.url ?? p.images[0]?.url ?? null;
  }

  confirmDelete(p: MarketplaceProduct): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: this.transloco.translate('marketplace.admin.deleteTitle'),
          message: this.transloco.translate('marketplace.admin.deleteMsg', {
            name: p.name,
          }),
        },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (!ok) return;
        this.api.deleteProduct(p.id).subscribe({
          next: () => {
            this.snackbar.success(
              this.transloco.translate('marketplace.admin.deleted'),
            );
            this.load();
          },
        });
      });
  }
}
