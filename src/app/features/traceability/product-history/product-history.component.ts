import {
  Component,
  Input,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { TraceabilityService } from '../services/traceability.service';
import {
  EVENT_TYPE_LABELS,
  EVENT_TYPE_COLORS,
  type TraceabilityEvent,
} from '../../../core/models/traceability.model';

@Component({
  selector: 'app-product-history',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatDividerModule,
    MatChipsModule,
  ],
  templateUrl: './product-history.component.html',
  styleUrl: './product-history.component.scss',
})
export class ProductHistoryComponent implements OnInit {
  @Input() productId!: string;

  private traceabilityService = inject(TraceabilityService);

  isLoading = signal(true);
  history = signal<TraceabilityEvent[]>([]);

  readonly eventTypeLabels = EVENT_TYPE_LABELS;
  readonly eventTypeColors = EVENT_TYPE_COLORS;

  ngOnInit(): void {
    this.traceabilityService.getProductHistory(this.productId).subscribe({
      next: (res) => {
        this.history.set(res.data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }
}
