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
import { MatExpansionModule } from '@angular/material/expansion';
import { RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import {
  PublicTraceService,
  type PublicTraceResponse,
} from './services/public-trace.service';
import { EVENT_TYPE_COLORS } from '../../core/models/traceability.model';
import { LanguageToggleComponent } from '../../shared/components/language-toggle/language-toggle.component';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { PublicBrandingService } from '../../core/services/public-branding.service';

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
    ThemeToggleComponent,
    DatePipe,
    DecimalPipe,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressBarModule,
    MatButtonModule,
    MatTooltipModule,
    MatExpansionModule,
  ],
  templateUrl: './public-trace.component.html',
  styleUrl: './public-trace.component.scss',
})
export class PublicTraceComponent implements OnInit {
  /** Set when route is `/trace/:lotCode` */
  @Input() lotCode?: string;
  /** Set when route is `/trace/restaurant/:slug` */
  @Input() slug?: string;

  private publicTraceService = inject(PublicTraceService);
  private transloco = inject(TranslocoService);
  protected branding = inject(PublicBrandingService);

  isLoading = signal(true);
  hasError = signal(false);
  trace = signal<PublicTraceResponse | null>(null);

  readonly eventTypeColors = EVENT_TYPE_COLORS;
  readonly sizeLabels = SIZE_LABELS;

  /** For error copy: slug or lot code the user tried to open */
  get traceLookupKey(): string {
    return this.slug ?? this.lotCode ?? '';
  }

  ngOnInit(): void {
    const req =
      this.slug != null && this.slug !== ''
        ? this.publicTraceService.getTraceByRestaurantSlug(this.slug)
        : this.lotCode != null && this.lotCode !== ''
          ? this.publicTraceService.getTrace(this.lotCode)
          : null;
    if (!req) {
      this.hasError.set(true);
      this.isLoading.set(false);
      return;
    }
    req.subscribe({
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
    const fileSlug =
      t.restaurant?.slug ?? t.lot.lotCode ?? this.traceLookupKey ?? 'trace';
    link.download = `qr-${fileSlug}.png`;
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
