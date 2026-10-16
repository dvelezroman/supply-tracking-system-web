import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MarketplacePublicApiService } from '../../services/marketplace-api.service';
import { CartService } from '../../services/cart.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';

@Component({
  selector: 'app-store-payphone-return',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslocoPipe, MatProgressSpinnerModule, MatIconModule],
  templateUrl: './store-payphone-return.component.html',
  styleUrl: './store-payphone-return.component.scss',
})
export class StorePayphoneReturnComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(MarketplacePublicApiService);
  private cart = inject(CartService);
  private snackbar = inject(SnackbarService);
  private transloco = inject(TranslocoService);

  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const q = this.route.snapshot.queryParamMap;
    const idRaw = q.get('id');
    const clientTransactionId = q.get('clientTransactionId')?.trim() || '';
    const payphoneId = idRaw ? Number(idRaw) : NaN;

    if (!Number.isFinite(payphoneId) || payphoneId < 1 || !clientTransactionId) {
      this.goCheckoutChooseOther(
        this.transloco.translate('marketplace.store.payphoneMissingParams'),
      );
      return;
    }

    this.api.confirmPayphonePayment(payphoneId, clientTransactionId).subscribe({
      next: (res) => {
        this.cart.clear();
        const orderNumber = res.data?.orderNumber;
        if (!orderNumber) {
          this.goCheckoutChooseOther(
            this.transloco.translate('errors.unexpected'),
          );
          return;
        }
        this.snackbar.success(
          this.transloco.translate('marketplace.store.payphonePaid'),
        );
        void this.router.navigate(['/tienda/pedido', orderNumber]);
      },
      error: () => {
        // Backend discards unpaid CARD draft; keep cart and ask another method.
        this.goCheckoutChooseOther(
          this.transloco.translate('marketplace.store.payphoneChooseOther'),
        );
      },
    });
  }

  private goCheckoutChooseOther(message: string): void {
    this.isLoading.set(false);
    this.errorMessage.set(message);
    this.snackbar.error(message);
    void this.router.navigate(['/tienda/checkout'], {
      queryParams: { payphoneFailed: '1' },
      replaceUrl: true,
    });
  }
}
