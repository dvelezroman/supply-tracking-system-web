import {
  Component,
  OnInit,
  inject,
  signal,
  effect,
  ChangeDetectionStrategy,
  DestroyRef,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { ProductsService } from '../services/products.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { SnackbarService } from '../../../core/services/snackbar.service';
import type { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-products-list',
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
    MatTooltipModule,
    PageHeaderComponent,
  ],
  templateUrl: './products-list.component.html',
  styleUrl: './products-list.component.scss',
})
export class ProductsListComponent implements OnInit {
  private productsService = inject(ProductsService);
  private dialog = inject(MatDialog);
  private snackbar = inject(SnackbarService);
  private destroyRef = inject(DestroyRef);
  private transloco = inject(TranslocoService);

  isLoading = signal(false);
  products = signal<Product[]>([]);
  totalItems = signal(0);
  currentPage = signal(1);
  pageSize = signal(20);
  searchTerm = signal('');

  private search$ = new Subject<string>();

  readonly columns = ['sku', 'name', 'category', 'lotCount', 'createdAt', 'actions'];

  ngOnInit(): void {
    this.search$
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.currentPage.set(1);
        this.loadProducts();
      });

    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading.set(true);
    this.productsService
      .getAll(this.currentPage(), this.pageSize(), this.searchTerm() || undefined)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.products.set(res.data.items);
          this.totalItems.set(res.data.total);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
    this.search$.next(term);
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
    this.loadProducts();
  }

  deleteProduct(product: Product): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: this.transloco.translate('products.deleteTitle'),
        message: this.transloco.translate('products.deleteConfirm', { name: product.name }),
      },
    });

    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((confirmed) => {
      if (!confirmed) return;
      this.productsService.delete(product.id).subscribe({
        next: () => {
          this.snackbar.success(this.transloco.translate('products.deleteSuccess'));
          this.loadProducts();
        },
      });
    });
  }
}
