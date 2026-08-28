import {
  Component,
  Input,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { MarketplacePublicApiService } from '../../services/marketplace-api.service';
import { CartService } from '../../services/cart.service';
import { formatMoney } from '../../utils/money';
import type { MarketplaceProduct } from '../../models/marketplace.model';

@Component({
  selector: 'app-store-product-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    FormsModule,
    TranslocoPipe,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './store-product-detail.component.html',
  styleUrl: './store-product-detail.component.scss',
})
export class StoreProductDetailComponent implements OnInit {
  @Input() slug!: string;

  private api = inject(MarketplacePublicApiService);
  private cart = inject(CartService);
  private snackbar = inject(SnackbarService);
  private transloco = inject(TranslocoService);

  isLoading = signal(false);
  product = signal<MarketplaceProduct | null>(null);
  qty = signal(1);
  activeImage = signal<string | null>(null);
  readonly formatMoney = formatMoney;

  ngOnInit(): void {
    this.isLoading.set(true);
    this.api.getBySlug(this.slug).subscribe({
      next: (res) => {
        this.product.set(res.data);
        const img =
          res.data.images.find((i) => i.isPrimary)?.url ??
          res.data.images[0]?.url ??
          null;
        this.activeImage.set(img);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  addToCart(): void {
    const p = this.product();
    if (!p || p.stockQty < 1) return;
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
    this.snackbar.success(
      this.transloco.translate('marketplace.store.addedToCart'),
    );
  }
}
