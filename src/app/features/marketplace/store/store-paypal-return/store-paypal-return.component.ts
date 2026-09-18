import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { MarketplacePublicApiService } from '../../services/marketplace-api.service';
import { CartService } from '../../services/cart.service';
import { PaypalLogoComponent } from '../shared/paypal-logo.component';

@Component({
  selector: 'app-store-paypal-return',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    TranslocoPipe,
    MatProgressSpinnerModule,
    PaypalLogoComponent,
  ],
  templateUrl: './store-paypal-return.component.html',
  styleUrl: './store-paypal-return.component.scss',
})
export class StorePaypalReturnComponent implements OnInit {
  @Input() orderNumber!: string;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(MarketplacePublicApiService);
  private cart = inject(CartService);
  private snackbar = inject(SnackbarService);
  private transloco = inject(TranslocoService);

  isCapturing = signal(true);
  failed = signal(false);

  ngOnInit(): void {
    const token =
      this.route.snapshot.queryParamMap.get('token') ||
      this.route.snapshot.queryParamMap.get('paypalOrderId') ||
      '';
    const sig = this.route.snapshot.queryParamMap.get('sig') || undefined;
    if (!this.orderNumber || !token) {
      this.isCapturing.set(false);
      this.failed.set(true);
      return;
    }

    this.api.capturePayPalOrder(this.orderNumber, token, sig).subscribe({
      next: () => {
        this.cart.clear();
        this.isCapturing.set(false);
        void this.router.navigate(['/tienda/pedido', this.orderNumber], {
          replaceUrl: true,
        });
      },
      error: () => {
        this.isCapturing.set(false);
        this.failed.set(true);
        this.snackbar.error(
          this.transloco.translate('marketplace.store.paypalCaptureFailed'),
        );
      },
    });
  }
}
