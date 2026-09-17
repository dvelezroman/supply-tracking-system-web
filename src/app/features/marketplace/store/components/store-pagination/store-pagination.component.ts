import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { MatIconModule } from '@angular/material/icon';
import { visiblePageNumbers } from '../../utils/catalog.util';

@Component({
  selector: 'app-store-pagination',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe, MatIconModule],
  templateUrl: './store-pagination.component.html',
  styleUrl: './store-pagination.component.scss',
})
export class StorePaginationComponent {
  readonly page = input.required<number>();
  readonly pageCount = input.required<number>();
  readonly pageChange = output<number>();

  readonly pages = computed(() =>
    visiblePageNumbers(this.page(), this.pageCount()),
  );

  readonly firstVisible = computed(() => this.pages()[0] ?? 1);
  readonly lastVisible = computed(
    () => this.pages()[this.pages().length - 1] ?? 1,
  );

  go(next: number): void {
    const count = this.pageCount();
    if (count <= 1) return;
    const safe = Math.min(Math.max(1, next), count);
    if (safe === this.page()) return;
    this.pageChange.emit(safe);
  }
}
