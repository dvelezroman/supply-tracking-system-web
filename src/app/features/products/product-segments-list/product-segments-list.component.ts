import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
  DestroyRef,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { ProductSegmentsService } from '../services/product-segments.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { SnackbarService } from '../../../core/services/snackbar.service';
import type { ProductSegment } from '../../../core/models/product-segment.model';

@Component({
  selector: 'app-product-segments-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    TranslocoPipe,
    DatePipe,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    PageHeaderComponent,
  ],
  templateUrl: './product-segments-list.component.html',
  styleUrl: './product-segments-list.component.scss',
})
export class ProductSegmentsListComponent implements OnInit {
  private segmentsService = inject(ProductSegmentsService);
  private dialog = inject(MatDialog);
  private snackbar = inject(SnackbarService);
  private destroyRef = inject(DestroyRef);
  private transloco = inject(TranslocoService);

  isLoading = signal(false);
  segments = signal<ProductSegment[]>([]);

  readonly columns = ['name', 'productCount', 'createdAt', 'actions'];

  ngOnInit(): void {
    this.loadSegments();
  }

  loadSegments(): void {
    this.isLoading.set(true);
    this.segmentsService
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.segments.set(res.data);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  deleteSegment(segment: ProductSegment): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: this.transloco.translate('productSegments.deleteTitle'),
        message: this.transloco.translate('productSegments.deleteConfirm', {
          name: segment.name,
        }),
      },
    });

    ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((confirmed) => {
      if (!confirmed) return;
      this.segmentsService.delete(segment.id).subscribe({
        next: () => {
          this.snackbar.success(this.transloco.translate('productSegments.deleteSuccess'));
          this.loadSegments();
        },
      });
    });
  }
}
