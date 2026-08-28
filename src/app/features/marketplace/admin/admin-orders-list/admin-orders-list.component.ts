import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
  DestroyRef,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { TranslocoPipe } from '@jsverse/transloco';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { MarketplaceAdminApiService } from '../../services/marketplace-api.service';
import { formatMoney } from '../../utils/money';
import type { MarketplaceOrder } from '../../models/marketplace.model';

@Component({
  selector: 'app-admin-orders-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    TranslocoPipe,
    DatePipe,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressBarModule,
    MatChipsModule,
    MatTooltipModule,
    PageHeaderComponent,
  ],
  templateUrl: './admin-orders-list.component.html',
  styleUrl: './admin-orders-list.component.scss',
})
export class AdminOrdersListComponent implements OnInit {
  private api = inject(MarketplaceAdminApiService);
  private destroyRef = inject(DestroyRef);

  isLoading = signal(false);
  orders = signal<MarketplaceOrder[]>([]);
  totalItems = signal(0);
  currentPage = signal(1);
  pageSize = signal(20);
  searchTerm = signal('');
  statusFilter = signal('');
  readonly formatMoney = formatMoney;
  readonly columns = [
    'orderNumber',
    'customer',
    'status',
    'subtotal',
    'createdAt',
    'actions',
  ];
  private search$ = new Subject<string>();

  ngOnInit(): void {
    this.search$
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.currentPage.set(1);
        this.load();
      });
    this.load();
  }

  onSearch(value: string): void {
    this.searchTerm.set(value);
    this.search$.next(value);
  }

  onStatus(value: string): void {
    this.statusFilter.set(value);
    this.currentPage.set(1);
    this.load();
  }

  onPage(ev: PageEvent): void {
    this.currentPage.set(ev.pageIndex + 1);
    this.pageSize.set(ev.pageSize);
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.api
      .listOrders(
        this.currentPage(),
        this.pageSize(),
        this.searchTerm() || undefined,
        this.statusFilter() || undefined,
      )
      .subscribe({
        next: (res) => {
          this.orders.set(res.data.items);
          this.totalItems.set(res.data.total);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }
}
