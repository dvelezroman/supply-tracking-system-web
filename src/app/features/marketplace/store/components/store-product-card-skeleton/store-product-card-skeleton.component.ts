import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-store-product-card-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="skeleton" aria-hidden="true">
      <div class="skeleton__media"></div>
      <div class="skeleton__body">
        <div class="skeleton__line skeleton__line--lg"></div>
        <div class="skeleton__line skeleton__line--sm"></div>
        <div class="skeleton__line skeleton__line--price"></div>
        <div class="skeleton__btn"></div>
      </div>
    </div>
  `,
  styleUrl: './store-product-card-skeleton.component.scss',
})
export class StoreProductCardSkeletonComponent {}
