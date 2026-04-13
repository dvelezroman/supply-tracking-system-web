import {
  Component,
  Input,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { TraceabilityService } from '../services/traceability.service';
import { LotTraceTimelineComponent } from '../lot-trace-timeline/lot-trace-timeline.component';
import type { TraceabilityEvent } from '../../../core/models/traceability.model';

@Component({
  selector: 'app-product-history',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LotTraceTimelineComponent],
  templateUrl: './product-history.component.html',
})
export class ProductHistoryComponent implements OnInit {
  @Input() productId!: string;

  private traceabilityService = inject(TraceabilityService);

  isLoading = signal(true);
  history = signal<TraceabilityEvent[]>([]);

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
