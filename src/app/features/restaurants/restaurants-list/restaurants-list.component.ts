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
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import {
  RestaurantsService,
  type RestaurantListItem,
} from '../services/restaurants.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { TranslocoService } from '@jsverse/transloco';

@Component({
  selector: 'app-restaurants-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    TranslocoPipe,
    DatePipe,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    PageHeaderComponent,
  ],
  templateUrl: './restaurants-list.component.html',
  styleUrl: './restaurants-list.component.scss',
})
export class RestaurantsListComponent implements OnInit {
  private restaurantsService = inject(RestaurantsService);
  private dialog = inject(MatDialog);
  private snackbar = inject(SnackbarService);
  private destroyRef = inject(DestroyRef);
  private transloco = inject(TranslocoService);

  isLoading = signal(false);
  restaurants = signal<RestaurantListItem[]>([]);
  totalItems = signal(0);
  currentPage = signal(1);
  pageSize = signal(20);

  readonly columns = ['name', 'slug', 'menuQr', 'location', 'createdAt', 'actions'];

  ngOnInit(): void {
    this.loadRestaurants();
  }

  loadRestaurants(): void {
    this.isLoading.set(true);
    this.restaurantsService
      .getAll(this.currentPage(), this.pageSize())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.restaurants.set(res.data.items);
          this.totalItems.set(res.data.total);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
    this.loadRestaurants();
  }

  deleteRestaurant(r: RestaurantListItem): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: this.transloco.translate('restaurants.deleteTitle'),
        message: this.transloco.translate('restaurants.deleteConfirm', { name: r.name }),
      },
    });

    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((confirmed) => {
      if (!confirmed) return;
      this.restaurantsService.delete(r.id).subscribe({
        next: () => {
          this.snackbar.success(this.transloco.translate('restaurants.deleteSuccess'));
          this.loadRestaurants();
        },
      });
    });
  }
}
