import {
  Component,
  Input,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LotsAdminService, type LotSummary } from '../services/lots.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { QrPdfDownloadComponent } from '../../../shared/components/qr-pdf-download/qr-pdf-download.component';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../auth/services/auth.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import {
  PUBLIC_VISIBILITY_FIELD_META,
  type PublicVisibilityKey,
  resolvePublicVisibility,
} from '../../../core/config/public-visibility';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { LotTraceTimelineComponent } from '../../traceability/lot-trace-timeline/lot-trace-timeline.component';
import type { TraceabilityEvent } from '../../../core/models/traceability.model';

const PRESENTATION_LABELS: Record<string, string | undefined> = {
  SHELL_ON: 'Shell On', BUTTERFLY: 'Butterfly',
  PD_TAIL_OFF: 'P&D Tail Off', PD_TAIL_ON: 'P&D Tail On',
};
const PACKAGING_LABELS: Record<string, string | undefined> = {
  IQF: 'IQF', CAJAS: 'Cajas',
};
const SIZE_LABELS: Record<string, string | undefined> = {
  S16_20: '16/20', S21_25: '21/25', S26_30: '26/30',
  S31_35: '31/35', S36_40: '36/40', S41_50: '41/50',
};

@Component({
  selector: 'app-lot-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    TranslocoPipe,
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatSlideToggleModule,
    MatExpansionModule,
    PageHeaderComponent,
    QrPdfDownloadComponent,
    LotTraceTimelineComponent,
  ],
  templateUrl: './lot-detail.component.html',
  styleUrl: './lot-detail.component.scss',
})
export class LotDetailComponent implements OnInit {
  @Input() id!: string;

  private lotsService = inject(LotsAdminService);
  private auth = inject(AuthService);
  private snackbar = inject(SnackbarService);
  private transloco = inject(TranslocoService);

  isLoading = signal(true);
  lot = signal<LotSummary | null>(null);
  qrDataUrl = signal<string | null>(null);
  isSavingVis = signal(false);
  historyEvents = signal<TraceabilityEvent[]>([]);
  historyLoading = signal(false);
  /** Colapsado por defecto para que la ficha del lote quede visible sin scroll largo. */
  traceHistoryExpanded = signal(false);

  readonly isAdmin = this.auth.isAdmin;
  readonly visibilityFields = PUBLIC_VISIBILITY_FIELD_META;
  vis = signal<Record<PublicVisibilityKey, boolean>>(
    resolvePublicVisibility(null),
  );

  readonly presentationLabels = PRESENTATION_LABELS;
  readonly packagingLabels = PACKAGING_LABELS;
  readonly sizeLabels = SIZE_LABELS;

  publicTraceUrl = (lotCode: string) =>
    `${window.location.origin}/trace/${lotCode}`;

  ngOnInit(): void {
    this.lotsService.getById(this.id).subscribe({
      next: (res) => {
        this.lot.set(res.data);
        this.vis.set(resolvePublicVisibility(res.data.publicVisibility));
        // Load QR preview as data URL via the PNG endpoint
        this.loadQrPreview(res.data.lotCode);
        this.loadHistory(res.data.lotCode, res.data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  private loadHistory(lotCode: string, lot: LotSummary): void {
    this.historyLoading.set(true);
    this.lotsService.getHistory(lotCode).subscribe({
      next: (res) => {
        const mapped = (res.data.events as TraceabilityEvent[]).map((e) => ({
          ...e,
          productId: lot.product.id,
          lotCode: lot.lotCode,
          timestamp:
            typeof e.timestamp === 'string'
              ? e.timestamp
              : (e.timestamp as unknown as Date).toISOString?.() ?? String(e.timestamp),
        }));
        this.historyEvents.set(mapped);
        this.historyLoading.set(false);
      },
      error: () => {
        this.historyEvents.set([]);
        this.historyLoading.set(false);
      },
    });
  }

  registerEventQuery(): Record<string, string> {
    return { lotId: this.id, returnUrl: `/lots/${this.id}` };
  }

  private loadQrPreview(lotCode: string): void {
    const url = `${environment.apiBase}/lots/code/${lotCode}/qr`;
    // Fetch the PNG and convert to object URL for <img>
    fetch(url, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token') ?? ''}` },
    })
      .then((r) => r.blob())
      .then((blob) => {
        this.qrDataUrl.set(URL.createObjectURL(blob));
      })
      .catch(() => {});
  }

  onVisibilityToggle(key: PublicVisibilityKey, checked: boolean): void {
    this.vis.update((s) => ({ ...s, [key]: checked }));
  }

  onTraceHistoryExpandedChange(expanded: boolean): void {
    this.traceHistoryExpanded.set(expanded);
  }

  savePublicVisibility(): void {
    this.isSavingVis.set(true);
    this.lotsService.patchPublicVisibility(this.id, this.vis()).subscribe({
      next: (res) => {
        this.lot.set(res.data);
        this.vis.set(resolvePublicVisibility(res.data.publicVisibility));
        this.snackbar.success(this.transloco.translate('publicVisibility.saved'));
        this.isSavingVis.set(false);
      },
      error: () => this.isSavingVis.set(false),
    });
  }
}
