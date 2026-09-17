import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-store-empty-catalog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe, MatIconModule],
  template: `
    <div class="empty">
      <mat-icon class="empty__icon" aria-hidden="true">search</mat-icon>
      <p class="empty__title">{{ 'marketplace.store.emptyFilteredTitle' | transloco }}</p>
      <p class="empty__body">
        {{
          (hasFilters()
            ? 'marketplace.store.emptyFilteredBody'
            : 'marketplace.store.empty'
          ) | transloco
        }}
      </p>
      @if (hasFilters()) {
        <button type="button" class="marea-btn marea-btn--ghost" (click)="clear.emit()">
          {{ 'marketplace.store.clearFilters' | transloco }}
        </button>
      }
    </div>
  `,
  styleUrl: './store-empty-catalog.component.scss',
})
export class StoreEmptyCatalogComponent {
  readonly hasFilters = input(false);
  readonly clear = output<void>();
}
