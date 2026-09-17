import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  input,
  output,
  signal,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { MatIconModule } from '@angular/material/icon';
import type {
  MarketplaceProduct,
  MarketplaceProductImage,
} from '../../../models/marketplace.model';
import {
  marketplaceProductImageSrc,
  primaryMarketplaceImageSrc,
} from '../../../utils/marketplace-media';

@Component({
  selector: 'app-store-image-lightbox',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe, MatIconModule],
  templateUrl: './store-image-lightbox.component.html',
  styleUrl: './store-image-lightbox.component.scss',
})
export class StoreImageLightboxComponent implements OnInit, OnDestroy {
  readonly product = input.required<MarketplaceProduct>();
  readonly closed = output<void>();

  readonly activeSrc = signal<string | null>(null);

  ngOnInit(): void {
    document.body.style.overflow = 'hidden';
    this.activeSrc.set(primaryMarketplaceImageSrc(this.product().images));
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }

  imageSrc(img: MarketplaceProductImage): string {
    return marketplaceProductImageSrc(img);
  }

  select(img: MarketplaceProductImage): void {
    this.activeSrc.set(marketplaceProductImageSrc(img));
  }

  close(): void {
    this.closed.emit();
  }

  onBackdrop(event: Event): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }
}
