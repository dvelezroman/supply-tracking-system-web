import {
  Component,
  Input,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MarketplacePublicApiService } from '../../services/marketplace-api.service';
import { formatMoney } from '../../utils/money';
import { totalDiscountPercent } from '../../utils/marketplace-pricing.util';
import type { MarketplaceOrderItem } from '../../models/marketplace.model';
import type { PublicOrderConfirmation } from '../../models/marketplace.model';

@Component({
  selector: 'app-store-order-confirmation',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslocoPipe, MatProgressBarModule, MatIconModule],
  templateUrl: './store-order-confirmation.component.html',
  styleUrl: './store-order-confirmation.component.scss',
})
export class StoreOrderConfirmationComponent implements OnInit {
  @Input() orderNumber!: string;

  private api = inject(MarketplacePublicApiService);
  isLoading = signal(false);
  order = signal<PublicOrderConfirmation | null>(null);
  readonly formatMoney = formatMoney;
  readonly totalDiscountPercent = totalDiscountPercent;

  itemSavedCents(item: MarketplaceOrderItem): number {
    return Math.max(
      0,
      (item.listUnitPriceCents - item.unitPriceCents) * item.qty,
    );
  }

  ngOnInit(): void {
    this.isLoading.set(true);
    this.api.getOrderConfirmation(this.orderNumber).subscribe({
      next: (res) => {
        this.order.set(res.data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }
}
