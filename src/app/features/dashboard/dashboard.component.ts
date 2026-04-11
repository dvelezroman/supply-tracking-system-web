import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { ProductsService } from '../products/services/products.service';
import { ActorsService } from '../actors/services/actors.service';
import { TraceabilityService } from '../traceability/services/traceability.service';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import type { TraceabilityEvent } from '../../core/models/traceability.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    TranslocoPipe,
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressBarModule,
    MatChipsModule,
    PageHeaderComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private productsService = inject(ProductsService);
  private actorsService = inject(ActorsService);
  private traceabilityService = inject(TraceabilityService);
  private transloco = inject(TranslocoService);

  isLoading = signal(true);
  stats = signal({ products: 0, actors: 0, events: 0 });
  recentEvents = signal<TraceabilityEvent[]>([]);

  readonly recentColumns = ['timestamp', 'eventType', 'product', 'actor', 'location'];

  readonly statCards = [
    {
      key: 'products' as const,
      labelKey: 'dashboard.statProducts',
      icon: 'inventory_2',
      color: '#3f51b5',
      route: '/products',
    },
    {
      key: 'actors' as const,
      labelKey: 'dashboard.statActors',
      icon: 'groups',
      color: '#7b1fa2',
      route: '/actors',
    },
    {
      key: 'events' as const,
      labelKey: 'dashboard.statEvents',
      icon: 'route',
      color: '#388e3c',
      route: '/traceability',
    },
  ];

  eventTypeLabel(type: string): string {
    const key = `eventTypes.${type}`;
    const out = this.transloco.translate(key);
    return out === key ? type.replace(/_/g, ' ') : out;
  }

  ngOnInit(): void {
    forkJoin({
      products: this.productsService.getAll(1, 1),
      actors: this.actorsService.getAll(1, 1),
      events: this.traceabilityService.getEvents(1, 5),
    }).subscribe({
      next: ({ products, actors, events }) => {
        this.stats.set({
          products: products.data.total,
          actors: actors.data.total,
          events: events.data.total,
        });
        this.recentEvents.set(events.data.items);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }
}
