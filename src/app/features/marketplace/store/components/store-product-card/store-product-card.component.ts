import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { MatIconModule } from '@angular/material/icon';
import { CartService } from '../../../services/cart.service';
import type { MarketplaceProduct } from '../../../models/marketplace.model';
import { primaryMarketplaceImageSrc } from '../../../utils/marketplace-media';
import { formatMoney } from '../../../utils/money';
import {
  cartLineFromProduct,
  effectiveUnitPriceCents,
  totalDiscountPercent,
} from '../../../utils/marketplace-pricing.util';
import { isLowStock, isOutOfStock, productStock } from '../../utils/catalog.util';
import { StoreImageLightboxComponent } from '../store-image-lightbox/store-image-lightbox.component';

@Component({
  selector: 'app-store-product-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    TranslocoPipe,
    MatIconModule,
    StoreImageLightboxComponent,
  ],
  templateUrl: './store-product-card.component.html',
  styleUrl: './store-product-card.component.scss',
})
export class StoreProductCardComponent implements OnDestroy {
  private cart = inject(CartService);
  private addedTimer: ReturnType<typeof setTimeout> | null = null;

  readonly product = input.required<MarketplaceProduct>();

  readonly isAdding = signal(false);
  readonly added = signal(false);
  readonly lightboxOpen = signal(false);
  readonly formatMoney = formatMoney;

  imageSrc(): string | null {
    return primaryMarketplaceImageSrc(this.product().images);
  }

  stock(): number {
    return productStock(this.product());
  }

  soldOut(): boolean {
    return isOutOfStock(this.product());
  }

  lowStock(): boolean {
    return isLowStock(this.product());
  }

  salePriceCents(): number {
    return effectiveUnitPriceCents(this.product());
  }

  hasDiscount(): boolean {
    return totalDiscountPercent(this.product()) > 0;
  }

  totalDiscount(): number {
    return totalDiscountPercent(this.product());
  }

  openLightbox(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.imageSrc()) return;
    this.lightboxOpen.set(true);
  }

  closeLightbox(): void {
    this.lightboxOpen.set(false);
  }

  addToCart(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const p = this.product();
    if (this.soldOut() || this.isAdding() || this.added()) return;

    this.isAdding.set(true);
    this.added.set(false);

    this.cart.add(cartLineFromProduct(p, this.imageSrc()), 1);

    // Brief UX delay so the spinner is visible
    window.setTimeout(() => {
      this.isAdding.set(false);
      this.added.set(true);
      if (this.addedTimer) clearTimeout(this.addedTimer);
      this.addedTimer = setTimeout(() => this.added.set(false), 1600);
    }, 180);
  }

  ngOnDestroy(): void {
    if (this.addedTimer) clearTimeout(this.addedTimer);
  }
}
