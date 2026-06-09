import {
  Component,
  Input,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { environment } from '../../../../environments/environment';
import { SnackbarService } from '../../../core/services/snackbar.service';

type QrPdfLayout = 'grid' | 'fullPage';

@Component({
  selector: 'app-qr-pdf-download',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSelectModule,
    TranslocoPipe,
  ],
  template: `
    <div class="qr-pdf-container">
      <mat-form-field appearance="outline" class="field">
        <mat-label>{{ 'qrPdf.layout' | transloco }}</mat-label>
        <mat-select [ngModel]="layout" (ngModelChange)="onLayoutChange($event)">
          <mat-option value="grid">{{ 'qrPdf.layoutGrid' | transloco }}</mat-option>
          <mat-option value="fullPage">{{ 'qrPdf.layoutFullPage' | transloco }}</mat-option>
        </mat-select>
        <mat-hint>{{ layoutHintKey() | transloco: { pages: pagesNeeded() } }}</mat-hint>
      </mat-form-field>

      <mat-form-field appearance="outline" class="field">
        <mat-label>{{ 'qrPdf.copies' | transloco }}</mat-label>
        <input
          matInput
          type="number"
          [(ngModel)]="copies"
          [min]="1"
          [max]="500"
        />
      </mat-form-field>

      <button
        class="download-btn"
        mat-flat-button
        color="primary"
        (click)="download()"
        [disabled]="isDownloading() || copies < 1 || copies > 500"
        [matTooltip]="tooltipKey() | transloco: { n: copies, lotCode: lotCode }"
      >
        @if (isDownloading()) {
          <mat-spinner diameter="18" />
        } @else {
          <mat-icon>picture_as_pdf</mat-icon>
        }
        {{ 'qrPdf.download' | transloco }}
      </button>
    </div>
  `,
  styles: [`
    .qr-pdf-container {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 32px;
      max-width: 420px;
    }
    .field {
      width: 100%;
      max-width: 320px;
    }
    .qr-pdf-container > button {
      margin-top: 8px;
    }
    .download-btn {
      width: 100%;
      min-height: 56px;
      padding: 12px 20px;
      font-size: 18px;
      line-height: 1.25;
      white-space: normal;
      text-align: center;
    }
    .download-btn .mdc-button__label {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }
    .download-btn mat-icon {
      margin: 0;
      flex-shrink: 0;
    }
    button mat-spinner { display: inline-block; }
  `],
})
export class QrPdfDownloadComponent {
  @Input({ required: true }) lotCode!: string;

  private http = inject(HttpClient);
  private snackbar = inject(SnackbarService);
  private transloco = inject(TranslocoService);

  copies = 4;
  layout: QrPdfLayout = 'grid';
  isDownloading = signal(false);

  /** Must match API `QR_PER_PAGE` in pdf.service.ts */
  readonly QR_PER_PAGE = 4;
  pagesNeeded = () =>
    this.layout === 'fullPage' ? this.copies : Math.ceil(this.copies / this.QR_PER_PAGE);

  layoutHintKey = () => (this.layout === 'fullPage' ? 'qrPdf.hintFullPage' : 'qrPdf.hintGrid');
  tooltipKey = () => (this.layout === 'fullPage' ? 'qrPdf.tooltipFullPage' : 'qrPdf.tooltipGrid');

  onLayoutChange(value: QrPdfLayout): void {
    this.layout = value;
    this.copies = value === 'fullPage' ? 1 : 4;
  }

  download(): void {
    if (this.copies < 1 || this.copies > 500) return;
    this.isDownloading.set(true);

    const encoded = encodeURIComponent(this.lotCode);
    const url = `${environment.apiBase}/lots/code/${encoded}/qr/pdf?copies=${this.copies}&layout=${this.layout}`;

    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        const layoutSuffix = this.layout === 'fullPage' ? '-fullpage' : '';
        link.download = `qr-labels-${this.lotCode}-x${this.copies}${layoutSuffix}.pdf`;
        link.click();
        URL.revokeObjectURL(objectUrl);
        this.isDownloading.set(false);
        this.snackbar.success(
          this.transloco.translate(
            this.layout === 'fullPage' ? 'qrPdf.successFullPage' : 'qrPdf.successGrid',
            { n: this.copies },
          ),
        );
      },
      error: () => {
        // Message shown by errorInterceptor (errors.pdfDownloadFailed)
        this.isDownloading.set(false);
      },
    });
  }
}
