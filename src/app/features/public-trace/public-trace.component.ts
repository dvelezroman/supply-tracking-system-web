import {
  Component,
  Input,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  PublicTraceService,
  type PublicTraceResponse,
} from './services/public-trace.service';
import { EVENT_TYPE_COLORS } from '../../core/models/traceability.model';
import { LanguageToggleComponent } from '../../shared/components/language-toggle/language-toggle.component';

const SIZE_LABELS: Record<string, string | undefined> = {
  S16_20: '16/20',
  S21_25: '21/25',
  S26_30: '26/30',
  S31_35: '31/35',
  S36_40: '36/40',
  S41_50: '41/50',
};

@Component({
  selector: 'app-public-trace',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    TranslocoPipe,
    LanguageToggleComponent,
    DatePipe,
    DecimalPipe,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressBarModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './public-trace.component.html',
  styleUrl: './public-trace.component.scss',
})
export class PublicTraceComponent implements OnInit {
  @Input() lotCode!: string;

  private publicTraceService = inject(PublicTraceService);
  private transloco = inject(TranslocoService);

  isLoading = signal(true);
  hasError = signal(false);
  trace = signal<PublicTraceResponse | null>(null);

  readonly eventTypeColors = EVENT_TYPE_COLORS;
  readonly sizeLabels = SIZE_LABELS;

  ngOnInit(): void {
    this.publicTraceService.getTrace(this.lotCode).subscribe({
      next: (res) => {
        this.trace.set(res);
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      },
    });
  }

  eventTypeLabel(type: string): string {
    const key = `eventTypes.${type}`;
    const out = this.transloco.translate(key);
    return out === key ? type.replace(/_/g, ' ') : out;
  }

  actorTypeLabel(type: string | null | undefined): string {
    if (type == null || type === '') return '—';
    const key = `actorTypes.${type}`;
    const out = this.transloco.translate(key);
    return out === key ? type.replace(/_/g, ' ') : out;
  }

  presentationLabel(code: string | null | undefined): string {
    if (code == null || code === '') return '—';
    const key = `presentation.${code}`;
    const out = this.transloco.translate(key);
    return out === key ? code : out;
  }

  packagingLabel(code: string | null | undefined): string {
    if (code == null || code === '') return '—';
    const key = `packaging.${code}`;
    const out = this.transloco.translate(key);
    return out === key ? code : out;
  }

  sizeLabelDisplay(classification: string | null | undefined): string {
    if (classification == null || classification === '') return '—';
    return this.sizeLabels[classification] ?? classification;
  }

  participantSlots(t: PublicTraceResponse) {
    return [
      {
        roleKey: 'publicTrace.roles.lab',
        icon: 'science',
        data: t.lot.origin.lab,
      },
      {
        roleKey: 'publicTrace.roles.maturation',
        icon: 'water',
        data: t.lot.origin.maturation,
      },
      {
        roleKey: 'publicTrace.roles.coPacker',
        icon: 'factory',
        data: t.lot.origin.coPacker,
      },
    ].filter((s) => s.data.name);
  }

  downloadQr(): void {
    const t = this.trace();
    if (!t?.qrCode) return;
    const link = document.createElement('a');
    link.href = t.qrCode!;
    link.download = `qr-${t.lot.lotCode}.png`;
    link.click();
  }

  printPage(): void {
    window.print();
  }

  /** Human-readable dispatch line when operators store quantity/unit/channel in metadata. */
  dispatchMetaLine(meta: Record<string, unknown> | null | undefined): string | null {
    if (!meta || typeof meta !== 'object') return null;
    const qty = meta['quantity'];
    const unit = meta['unit'];
    if (qty == null || qty === '' || unit == null || unit === '') return null;
    const channel = meta['channel'];
    const base = `${qty} ${unit}`;
    return channel ? `${base} · ${channel}` : base;
  }
}
