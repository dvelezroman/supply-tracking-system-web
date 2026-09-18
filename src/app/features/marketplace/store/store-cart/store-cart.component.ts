import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { MatIconModule } from '@angular/material/icon';
import { CartService } from '../../services/cart.service';
import { formatMoney } from '../../utils/money';
import type { CartLine } from '../../models/marketplace.model';
import {
  hasLineDiscount,
  lineDiscountCents,
  lineTotalDiscountPercent,
} from '../../utils/marketplace-pricing.util';

@Component({
  selector: 'app-store-cart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslocoPipe, MatIconModule],
  templateUrl: './store-cart.component.html',
  styleUrl: './store-cart.component.scss',
})
export class StoreCartComponent {
  protected cart = inject(CartService);
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
}
