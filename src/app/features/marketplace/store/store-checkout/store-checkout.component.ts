import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy,
  OnInit,
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
import type { CartLine } from '../../models/marketplace.model';
import {
  effectiveUnitPriceCents,
  hasLineDiscount,
  lineDiscountCents,
  lineTotalDiscountPercent,
} from '../../utils/marketplace-pricing.util';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

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
export class StoreCheckoutComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(MarketplacePublicApiService);
  private cart = inject(CartService);
  private router = inject(Router);
  private snackbar = inject(SnackbarService);
  private transloco = inject(TranslocoService);

  isSubmitting = signal(false);
  isSyncing = signal(false);
  readonly lines = this.cart.lines;
  readonly subtotalCents = this.cart.subtotalCents;
  readonly listSubtotalCents = this.cart.listSubtotalCents;
  readonly discountTotalCents = this.cart.discountTotalCents;
  readonly formatMoney = formatMoney;

  lineHasDiscount(line: CartLine): boolean {
    return hasLineDiscount(line);
  }

  lineDiscount(line: CartLine): number {
    return lineDiscountCents(line);
  }

  listUnitPrice(line: CartLine): number {
    return line.listUnitPriceCents ?? line.unitPriceCents;
  }

  totalDiscountPercent(line: CartLine): number {
    return lineTotalDiscountPercent(line);
  }

  form = this.fb.group({
    customerName: ['', [Validators.required, Validators.minLength(2)]],
    customerEmail: ['', [Validators.required, Validators.email]],
    customerPhone: [''],
    customerAddress: [''],
    notes: [''],
  });

  ngOnInit(): void {
    this.syncCartWithCatalog();
  }

  submit(): void {
    if (this.form.invalid || this.lines().length === 0 || this.isSyncing()) {
      return;
    }
    const currencies = new Set(
      this.lines().map((l) => (l.currency || 'USD').toUpperCase()),
    );
    if (currencies.size > 1) {
      this.snackbar.error(
        this.transloco.translate('marketplace.store.mixedCurrency'),
      );
      return;
    }
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
          qty: Math.max(1, Math.floor(l.qty)),
        })),
      })
      .subscribe({
        next: (res) => {
          const orderNumber = res.data?.orderNumber;
          if (!orderNumber) {
            this.isSubmitting.set(false);
            this.snackbar.error(
              this.transloco.translate('errors.unexpected'),
            );
            return;
          }
          this.cart.clear();
          this.router.navigate(['/tienda/pedido', orderNumber]);
        },
        error: (err: HttpErrorResponse) => {
          this.isSubmitting.set(false);
          this.handleCheckoutError(err);
        },
      });
  }

  private syncCartWithCatalog(): void {
    const lines = this.cart.lines();
    if (lines.length === 0) return;

    const slugs = [...new Set(lines.map((l) => l.slug).filter(Boolean))];
    if (slugs.length === 0) return;

    this.isSyncing.set(true);
    forkJoin(
      slugs.map((slug) =>
        this.api.getBySlug(slug).pipe(catchError(() => of(null))),
      ),
    ).subscribe({
      next: (responses) => {
        let changed = false;
        slugs.forEach((slug, index) => {
          const res = responses[index];
          if (!res?.data) {
            const before = this.cart.lines().length;
            this.cart.removeBySlug(slug);
            if (this.cart.lines().length < before) changed = true;
            return;
          }
          const beforeLen = this.cart.lines().length;
          const beforeQty = this.cart
            .lines()
            .find((l) => l.slug === res.data.slug)?.qty;
          this.cart.upsertFromProduct(res.data);
          const after = this.cart.lines().find((l) => l.slug === res.data.slug);
          if (
            beforeLen !== this.cart.lines().length ||
            (after && beforeQty !== undefined && after.qty !== beforeQty) ||
            after?.unitPriceCents !==
              effectiveUnitPriceCents(res.data) ||
            after?.listUnitPriceCents !== res.data.priceCents ||
            (after?.discountPercent ?? 0) !== (res.data.discountPercent ?? 0) ||
            (after?.promoDiscountPercent ?? 0) !==
              (res.data.promoDiscountPercent ?? 0)
          ) {
            changed = true;
          }
        });
        if (changed) {
          this.snackbar.success(
            this.transloco.translate('marketplace.store.cartUpdated'),
          );
        }
        this.isSyncing.set(false);
      },
      error: () => this.isSyncing.set(false),
    });
  }

  private handleCheckoutError(err: HttpErrorResponse): void {
    const body = err.error as {
      message?: string;
      details?: Array<{
        productId: string;
        available?: number;
        name?: string;
      }>;
    } | null;

    if (err.status === 409 && body?.details?.length) {
      for (const d of body.details) {
        this.cart.applyStockLevel(d.productId, d.available ?? 0);
      }
      this.snackbar.error(
        this.transloco.translate('marketplace.store.stockConflict'),
      );
      return;
    }
    if (
      err.status === 400 &&
      body?.message === 'One or more products are unavailable' &&
      body.details?.length
    ) {
      for (const d of body.details) {
        this.cart.remove(d.productId);
      }
      this.snackbar.error(
        this.transloco.translate('marketplace.store.productUnavailable'),
      );
      return;
    }
    if (err.status === 400 && body?.message === 'Store is currently disabled') {
      this.snackbar.error(
        this.transloco.translate('marketplace.store.storeDisabled'),
      );
      return;
    }
    if (
      err.status === 400 &&
      body?.message === 'Cart contains products with different currencies'
    ) {
      this.snackbar.error(
        this.transloco.translate('marketplace.store.mixedCurrency'),
      );
    }
  }
}
