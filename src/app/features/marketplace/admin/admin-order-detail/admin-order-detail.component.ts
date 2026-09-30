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
import {
  WhatsappAdminApiService,
  type WhatsappLogItem,
  type WhatsappOccasion,
} from '../../services/whatsapp-api.service';
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
  private whatsappApi = inject(WhatsappAdminApiService);
  private dialog = inject(MatDialog);
  private snackbar = inject(SnackbarService);
  private transloco = inject(TranslocoService);

  isLoading = signal(false);
  isCancelling = signal(false);
  isConfirming = signal(false);
  isResending = signal(false);
  order = signal<MarketplaceOrder | null>(null);
  whatsappLogs = signal<WhatsappLogItem[]>([]);
  whatsappConfigured = signal(false);
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
        this.loadWhatsapp(res.data.id);
      },
      error: () => this.isLoading.set(false),
    });
  }

  private loadWhatsapp(orderId: string): void {
    this.whatsappApi.getStatus().subscribe({
      next: (res) => this.whatsappConfigured.set(!!res.data?.configured),
      error: () => this.whatsappConfigured.set(false),
    });
    this.whatsappApi
      .listLogs({ marketplaceOrderId: orderId, limit: 50 })
      .subscribe({
        next: (res) => this.whatsappLogs.set(res.data?.items ?? []),
        error: () => this.whatsappLogs.set([]),
      });
  }

  paymentMethodLabel(method?: string | null): string {
    switch (method) {
      case 'BANK_TRANSFER':
        return this.transloco.translate('marketplace.admin.paymentMethodBank');
      case 'PAYPAL':
        return this.transloco.translate('marketplace.admin.paymentMethodPaypal');
      case 'EMAIL':
        return this.transloco.translate('marketplace.admin.paymentMethodEmail');
      default:
        return method ?? '';
    }
  }

  canConfirmPayment(o: MarketplaceOrder): boolean {
    return (
      o.status === 'AWAITING_PAYMENT' &&
      (o.paymentMethod === 'EMAIL' || o.paymentMethod === 'BANK_TRANSFER')
    );
  }

  confirmPayment(): void {
    const o = this.order();
    if (!o || !this.canConfirmPayment(o)) return;
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: this.transloco.translate(
            'marketplace.admin.confirmPaymentTitle',
          ),
          message: this.transloco.translate(
            'marketplace.admin.confirmPaymentMsg',
            { order: o.orderNumber },
          ),
        },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (!ok) return;
        this.isConfirming.set(true);
        this.api.confirmPayment(o.id).subscribe({
          next: (res) => {
            this.order.set(res.data);
            this.isConfirming.set(false);
            this.snackbar.success(
              this.transloco.translate('marketplace.admin.paymentConfirmed'),
            );
            this.loadWhatsapp(o.id);
          },
          error: () => this.isConfirming.set(false),
        });
      });
  }

  resendWhatsapp(occasion: WhatsappOccasion): void {
    const o = this.order();
    if (!o) return;
    this.isResending.set(true);
    this.whatsappApi.resend(o.id, occasion, true).subscribe({
      next: () => {
        this.isResending.set(false);
        this.snackbar.success(
          this.transloco.translate('marketplace.admin.whatsappResent'),
        );
        this.loadWhatsapp(o.id);
      },
      error: () => {
        this.isResending.set(false);
        this.snackbar.error(
          this.transloco.translate('marketplace.admin.whatsappResendFailed'),
        );
      },
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
