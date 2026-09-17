import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { MatIconModule } from '@angular/material/icon';
import { MarketplacePublicApiService } from '../../services/marketplace-api.service';
import { CartService } from '../../services/cart.service';
import type {
  MarketplaceProduct,
  MarketplaceProductImage,
} from '../../models/marketplace.model';
import {
  marketplaceProductImageSrc,
  primaryMarketplaceImageSrc,
} from '../../utils/marketplace-media';
import { formatMoney } from '../../utils/money';
import { StoreImageLightboxComponent } from '../components/store-image-lightbox/store-image-lightbox.component';

@Component({
  selector: 'app-store-product-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    TranslocoPipe,
    MatIconModule,
    StoreImageLightboxComponent,
  ],
  templateUrl: './store-product-detail.component.html',
  styleUrl: './store-product-detail.component.scss',
})
export class StoreProductDetailComponent implements OnInit, OnDestroy {
  @Input() slug!: string;

  private api = inject(MarketplacePublicApiService);
  private cart = inject(CartService);
  private addedTimer: ReturnType<typeof setTimeout> | null = null;

  isLoading = signal(false);
  product = signal<MarketplaceProduct | null>(null);
  qty = signal(1);
  activeImage = signal<string | null>(null);
  isAdding = signal(false);
  added = signal(false);
  lightboxOpen = signal(false);
  readonly formatMoney = formatMoney;

  ngOnInit(): void {
    this.isLoading.set(true);
    this.api.getBySlug(this.slug).subscribe({
      next: (res) => {
        this.product.set(res.data);
        this.activeImage.set(primaryMarketplaceImageSrc(res.data.images));
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  ngOnDestroy(): void {
    if (this.addedTimer) clearTimeout(this.addedTimer);
  }

  imageSrc(img: MarketplaceProductImage): string {
    return marketplaceProductImageSrc(img);
  }

  selectImage(img: MarketplaceProductImage): void {
    this.activeImage.set(marketplaceProductImageSrc(img));
  }

  setQty(next: number): void {
    const p = this.product();
    if (!p) return;
    const safe = Math.min(p.stockQty, Math.max(1, Math.floor(next) || 1));
    this.qty.set(safe);
  }

  openLightbox(): void {
    if (!this.activeImage()) return;
    this.lightboxOpen.set(true);
  }

  closeLightbox(): void {
    this.lightboxOpen.set(false);
  }

  addToCart(): void {
    const p = this.product();
    if (!p || p.stockQty < 1 || this.isAdding() || this.added()) return;

    this.isAdding.set(true);
    this.cart.add(
      {
        productId: p.id,
        slug: p.slug,
        name: p.name,
        sku: p.sku,
        unitPriceCents: p.priceCents,
        currency: p.currency,
        imageUrl: this.activeImage(),
        stockQty: p.stockQty,
      },
      this.qty(),
    );

    window.setTimeout(() => {
      this.isAdding.set(false);
      this.added.set(true);
      if (this.addedTimer) clearTimeout(this.addedTimer);
      this.addedTimer = setTimeout(() => this.added.set(false), 1600);
    }, 180);
  }
}
