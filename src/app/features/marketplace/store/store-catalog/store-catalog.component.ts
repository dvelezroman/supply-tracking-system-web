import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
  DestroyRef,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { TranslocoPipe } from '@jsverse/transloco';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MarketplacePublicApiService } from '../../services/marketplace-api.service';
import { formatMoney } from '../../utils/money';
import type { MarketplaceProduct } from '../../models/marketplace.model';

@Component({
  selector: 'app-store-catalog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    FormsModule,
    TranslocoPipe,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressBarModule,
    MatButtonModule,
  ],
  templateUrl: './store-catalog.component.html',
  styleUrl: './store-catalog.component.scss',
})
export class StoreCatalogComponent implements OnInit {
  private api = inject(MarketplacePublicApiService);
  private destroyRef = inject(DestroyRef);

  isLoading = signal(false);
  storeEnabled = signal(true);
  products = signal<MarketplaceProduct[]>([]);
  total = signal(0);
  searchTerm = signal('');
  readonly formatMoney = formatMoney;
  private search$ = new Subject<string>();

  ngOnInit(): void {
    this.search$
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.load());
    this.load();
  }

  onSearch(value: string): void {
    this.searchTerm.set(value);
    this.search$.next(value);
  }

  load(): void {
    this.isLoading.set(true);
    this.api.listProducts(1, 48, this.searchTerm() || undefined).subscribe({
      next: (res) => {
        this.storeEnabled.set(res.data.storeEnabled !== false);
        this.products.set(res.data.items);
        this.total.set(res.data.total);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  imageOf(p: MarketplaceProduct): string | null {
    return p.images.find((i) => i.isPrimary)?.url ?? p.images[0]?.url ?? null;
  }
}
