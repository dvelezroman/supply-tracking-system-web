import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-paypal-logo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <img
      class="paypal-logo"
      [class.paypal-logo--sm]="size === 'sm'"
      [class.paypal-logo--md]="size === 'md'"
      [class.paypal-logo--lg]="size === 'lg'"
      src="assets/images/paypal/paypal-logo.svg"
      alt="PayPal"
      width="124"
      height="33"
      loading="lazy"
    />
  `,
  styles: `
    .paypal-logo {
      display: inline-block;
      height: auto;
      vertical-align: middle;
    }
    .paypal-logo--sm {
      width: 72px;
    }
    .paypal-logo--md {
      width: 100px;
    }
    .paypal-logo--lg {
      width: 140px;
    }
  `,
})
export class PaypalLogoComponent {
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
}
