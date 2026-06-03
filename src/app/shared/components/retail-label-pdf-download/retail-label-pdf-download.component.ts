import {
  Component,
  Input,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { environment } from '../../../../environments/environment';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { LotsAdminService } from '../../../features/lots/services/lots.service';

type RetailSides = 'both' | 'front' | 'back';

@Component({
  selector: 'app-retail-label-pdf-download',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSelectModule,
    MatCheckboxModule,
    TranslocoPipe,
  ],
  template: `
    <div class="retail-pdf-container">
      @if (readinessLoading()) {
        <p class="readiness-msg">{{ 'retailPdf.checking' | transloco }}</p>
      } @else if (readiness() && !readiness()!.ready) {
        <p class="readiness-msg readiness-msg--warn">
          {{ 'retailPdf.notReady' | transloco: { missing: readiness()!.missing.join(', ') } }}
        </p>
        @if (readiness()!.productId) {
          <a mat-stroked-button [routerLink]="['/products', readiness()!.productId]">
            <mat-icon>settings</mat-icon>
            {{ 'retailPdf.configureProduct' | transloco }}
          </a>
        }
      }

      <mat-form-field appearance="outline" class="field">
        <mat-label>{{ 'retailPdf.copies' | transloco }}</mat-label>
        <input matInput type="number" [(ngModel)]="copies" [min]="1" [max]="500" />
        <mat-hint>{{ 'retailPdf.hint' | transloco }}</mat-hint>
      </mat-form-field>

      <mat-form-field appearance="outline" class="field">
        <mat-label>{{ 'retailPdf.sides' | transloco }}</mat-label>
        <mat-select [(ngModel)]="sides">
          <mat-option value="both">{{ 'retailPdf.sidesBoth' | transloco }}</mat-option>
          <mat-option value="front">{{ 'retailPdf.sidesFront' | transloco }}</mat-option>
          <mat-option value="back">{{ 'retailPdf.sidesBack' | transloco }}</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-checkbox [(ngModel)]="includeTrace">
        {{ 'retailPdf.includeTrace' | transloco }}
      </mat-checkbox>

      <button
        class="download-btn"
        mat-flat-button
        color="accent"
        (click)="download()"
        [disabled]="isDownloading() || copies < 1 || copies > 500 || !canDownload()"
        [matTooltip]="'retailPdf.tooltip' | transloco: { n: copies, lotCode: lotCode }"
      >
        @if (isDownloading()) {
          <mat-spinner diameter="18" />
        } @else {
          <mat-icon>local_offer</mat-icon>
        }
        {{ 'retailPdf.download' | transloco }}
      </button>
    </div>
  `,
  styles: [`
    .retail-pdf-container {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
      max-width: 420px;
    }
    .readiness-msg {
      margin: 0;
      font-size: 0.875rem;
      line-height: 1.4;
    }
    .readiness-msg--warn {
      color: #b45309;
    }
    .field {
      width: 100%;
      max-width: 280px;
    }
    .download-btn {
      width: 100%;
      min-height: 56px;
      padding: 12px 20px;
      font-size: 16px;
      line-height: 1.25;
      white-space: normal;
      text-align: center;
    }
    .download-btn mat-icon {
      margin-right: 8px;
    }
    button mat-spinner {
      display: inline-block;
    }
  `],
})
export class RetailLabelPdfDownloadComponent implements OnInit {
  @Input({ required: true }) lotCode!: string;

  private http = inject(HttpClient);
  private lotsService = inject(LotsAdminService);
  private snackbar = inject(SnackbarService);
  private transloco = inject(TranslocoService);

  copies = 1;
  sides: RetailSides = 'both';
  includeTrace = true;
  isDownloading = signal(false);
  readinessLoading = signal(true);
  readiness = signal<{
    ready: boolean;
    missing: string[];
    productId: string;
    productSku: string;
  } | null>(null);

  ngOnInit(): void {
    this.lotsService.getRetailLabelReadiness(this.lotCode).subscribe({
      next: (res) => {
        this.readiness.set(res.data);
        this.readinessLoading.set(false);
      },
      error: () => this.readinessLoading.set(false),
    });
  }

  canDownload(): boolean {
    if (this.readinessLoading()) return false;
    const r = this.readiness();
    return r == null || r.ready;
  }

  download(): void {
    if (this.copies < 1 || this.copies > 500 || !this.canDownload()) return;
    this.isDownloading.set(true);

    const encoded = encodeURIComponent(this.lotCode);
    const params = new URLSearchParams({
      copies: String(this.copies),
      sides: this.sides,
      includeTrace: String(this.includeTrace),
    });
    const url = `${environment.apiBase}/lots/code/${encoded}/retail-label/pdf?${params}`;

    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = `retail-label-${this.lotCode}-x${this.copies}.pdf`;
        link.click();
        URL.revokeObjectURL(objectUrl);
        this.isDownloading.set(false);
        this.snackbar.success(
          this.transloco.translate('retailPdf.success', { n: this.copies }),
        );
      },
      error: async (err: HttpErrorResponse) => {
        this.isDownloading.set(false);
        if (err.error instanceof Blob) {
          try {
            const text = await err.error.text();
            const body = JSON.parse(text) as { message?: string | { message?: string; missing?: string[] } };
            const msg = body.message;
            if (typeof msg === 'object' && msg?.missing?.length) {
              this.readiness.set({
                ready: false,
                missing: msg.missing,
                productId: (msg as { productId?: string }).productId ?? this.readiness()?.productId ?? '',
                productSku: (msg as { productSku?: string }).productSku ?? '',
              });
              this.snackbar.error(
                this.transloco.translate('retailPdf.notReady', {
                  missing: msg.missing.join(', '),
                }),
              );
              return;
            }
          } catch {
            /* fall through */
          }
        }
      },
    });
  }
}
