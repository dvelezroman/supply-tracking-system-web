import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PaypalLogoComponent } from '../shared/paypal-logo.component';
import { formatMoney } from '../../utils/money';

@Component({
  selector: 'app-store-paypal-mock',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    TranslocoPipe,
    MatProgressSpinnerModule,
    PaypalLogoComponent,
  ],
  templateUrl: './store-paypal-mock.component.html',
  styleUrl: './store-paypal-mock.component.scss',
})
export class StorePaypalMockComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  orderNumber = signal('');
  token = signal('');
  sig = signal('');
  amountCents = signal(0);
  currency = signal('USD');
  readonly formatMoney = formatMoney;

  ngOnInit(): void {
    const q = this.route.snapshot.queryParamMap;
    this.orderNumber.set(q.get('orderNumber') ?? '');
    this.token.set(q.get('token') ?? '');
    this.sig.set(q.get('sig') ?? '');
    this.amountCents.set(Number(q.get('amount') ?? '0') || 0);
    this.currency.set((q.get('currency') ?? 'USD').toUpperCase());
  }

  approve(): void {
    const orderNumber = this.orderNumber();
    const token = this.token();
    if (!orderNumber || !token) return;
    const query: Record<string, string> = { token };
    if (this.sig()) query['sig'] = this.sig();
    void this.router.navigate(['/tienda/pedido', orderNumber, 'pago'], {
      queryParams: query,
    });
  }

  cancel(): void {
    void this.router.navigate(['/tienda/checkout'], {
      queryParams: {
        cancelled: '1',
        orderNumber: this.orderNumber() || undefined,
      },
    });
  }
}
