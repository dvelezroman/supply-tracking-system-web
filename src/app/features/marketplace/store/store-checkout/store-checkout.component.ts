import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { MarketplacePublicApiService } from '../../services/marketplace-api.service';
import { CartService } from '../../services/cart.service';
import { formatMoney } from '../../utils/money';

@Component({
  selector: 'app-store-checkout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    TranslocoPipe,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './store-checkout.component.html',
  styleUrl: './store-checkout.component.scss',
})
export class StoreCheckoutComponent {
  private fb = inject(FormBuilder);
  private api = inject(MarketplacePublicApiService);
  private cart = inject(CartService);
  private router = inject(Router);
  private snackbar = inject(SnackbarService);
  private transloco = inject(TranslocoService);

  isSubmitting = signal(false);
  readonly lines = this.cart.lines;
  readonly subtotalCents = this.cart.subtotalCents;
  readonly formatMoney = formatMoney;

  form = this.fb.group({
    customerName: ['', [Validators.required, Validators.minLength(2)]],
    customerEmail: ['', [Validators.required, Validators.email]],
    customerPhone: [''],
    customerAddress: [''],
    notes: [''],
  });

  submit(): void {
    if (this.form.invalid || this.lines().length === 0) return;
    this.isSubmitting.set(true);
    const raw = this.form.getRawValue();
    this.api
      .placeOrder({
        customerName: raw.customerName!.trim(),
        customerEmail: raw.customerEmail!.trim(),
        customerPhone: raw.customerPhone?.trim() || undefined,
        customerAddress: raw.customerAddress?.trim() || undefined,
        notes: raw.notes?.trim() || undefined,
        items: this.lines().map((l) => ({
          productId: l.productId,
          qty: l.qty,
        })),
      })
      .subscribe({
        next: (res) => {
          this.cart.clear();
          this.router.navigate(['/tienda/pedido', res.data.orderNumber]);
        },
        error: (err: HttpErrorResponse) => {
          this.isSubmitting.set(false);
          const body = err.error as {
            message?: string;
            details?: Array<{ productId: string; available: number; name: string }>;
          } | null;
          if (err.status === 409 && body?.details?.length) {
            for (const d of body.details) {
              this.cart.setQty(d.productId, Math.max(0, d.available));
            }
            this.snackbar.error(
              this.transloco.translate('marketplace.store.stockConflict'),
            );
          }
        },
      });
  }
}
