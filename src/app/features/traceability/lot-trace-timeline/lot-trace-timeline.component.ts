import {
  Component,
  Input,
  ChangeDetectionStrategy,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { TranslocoPipe } from '@jsverse/transloco';
import { EVENT_TYPE_COLORS, type TraceabilityEvent } from '../../../core/models/traceability.model';

@Component({
  selector: 'app-lot-trace-timeline',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatChipsModule,
    TranslocoPipe,
  ],
  templateUrl: './lot-trace-timeline.component.html',
  styleUrl: './lot-trace-timeline.component.scss',
})
export class LotTraceTimelineComponent {
  @Input() isLoading = false;
  @Input() events: TraceabilityEvent[] = [];

  readonly eventTypeColors = EVENT_TYPE_COLORS;

  /** Compact line for dispatch metadata (cajas / canal). */
  metadataLine(meta: Record<string, unknown> | null | undefined): string | null {
    if (!meta || typeof meta !== 'object') return null;
    const qty = meta['quantity'];
    const unit = meta['unit'];
    if (qty == null || qty === '' || unit == null || unit === '') return null;
    const channel = meta['channel'];
    const base = `${qty} ${unit}`;
    return channel ? `${base} · ${channel}` : base;
  }
}
