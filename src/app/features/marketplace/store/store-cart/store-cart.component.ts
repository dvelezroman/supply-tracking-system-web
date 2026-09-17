import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { MatIconModule } from '@angular/material/icon';
import { CartService } from '../../services/cart.service';
import { formatMoney } from '../../utils/money';

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
  readonly formatMoney = formatMoney;
}
