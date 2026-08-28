import {
  Component,
  Input,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { MarketplaceAdminApiService } from '../../services/marketplace-api.service';
import { formatMoney } from '../../utils/money';
import type { MarketplaceOrder } from '../../models/marketplace.model';

@Component({
  selector: 'app-admin-order-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    TranslocoPipe,
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatChipsModule,
    PageHeaderComponent,
  ],
  templateUrl: './admin-order-detail.component.html',
  styleUrl: './admin-order-detail.component.scss',
})
export class AdminOrderDetailComponent implements OnInit {
  @Input() id!: string;

  private api = inject(MarketplaceAdminApiService);
  private dialog = inject(MatDialog);
  private snackbar = inject(SnackbarService);
  private transloco = inject(TranslocoService);

  isLoading = signal(false);
  isCancelling = signal(false);
  order = signal<MarketplaceOrder | null>(null);
  readonly formatMoney = formatMoney;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.api.getOrder(this.id).subscribe({
      next: (res) => {
        this.order.set(res.data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  cancel(): void {
    const o = this.order();
    if (!o || o.status === 'CANCELLED') return;
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: this.transloco.translate('marketplace.admin.cancelTitle'),
          message: this.transloco.translate('marketplace.admin.cancelMsg', {
            order: o.orderNumber,
          }),
        },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (!ok) return;
        this.isCancelling.set(true);
        this.api.cancelOrder(o.id).subscribe({
          next: (res) => {
            this.order.set(res.data);
            this.isCancelling.set(false);
            this.snackbar.success(
              this.transloco.translate('marketplace.admin.cancelled'),
            );
          },
          error: () => this.isCancelling.set(false),
        });
      });
  }
}
