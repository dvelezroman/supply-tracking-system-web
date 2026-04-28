import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
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
    MatButtonModule,
    MatProgressBarModule,
    MatChipsModule,
    MatTooltipModule,
    TranslocoPipe,
  ],
  templateUrl: './lot-trace-timeline.component.html',
  styleUrl: './lot-trace-timeline.component.scss',
})
export class LotTraceTimelineComponent {
  @Input() isLoading = false;
  @Input() events: TraceabilityEvent[] = [];
  /** Show edit / soft-delete controls (authenticated operator UI). */
  @Input() manageActions = false;

  @Output() editRequested = new EventEmitter<TraceabilityEvent>();
  @Output() deleteRequested = new EventEmitter<TraceabilityEvent>();

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
