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
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { environment } from '../../../../environments/environment';
import { SnackbarService } from '../../../core/services/snackbar.service';

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
    TranslocoPipe,
  ],
  template: `
    <div class="qr-pdf-container">
      <mat-form-field appearance="outline" class="copies-field">
        <mat-label>{{ 'qrPdf.copies' | transloco }}</mat-label>
        <input
          matInput
          type="number"
          [(ngModel)]="copies"
          [min]="1"
          [max]="500"
        />
        <mat-hint>{{ 'qrPdf.hint' | transloco: { pages: pagesNeeded() } }}</mat-hint>
      </mat-form-field>

      <button
        mat-flat-button
        color="primary"
        (click)="download()"
        [disabled]="isDownloading() || copies < 1 || copies > 500"
        [matTooltip]="'qrPdf.tooltip' | transloco: { n: copies, lotCode: lotCode }"
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
    .copies-field {
      width: 100%;
      max-width: 200px;
    }
    button mat-spinner { display: inline-block; }
  `],
})
export class QrPdfDownloadComponent {
  @Input({ required: true }) lotCode!: string;

  private http = inject(HttpClient);
  private snackbar = inject(SnackbarService);
  private transloco = inject(TranslocoService);

  copies = 25;               // default: one full page (5×5 packaging labels)
  isDownloading = signal(false);

  /** Must match API `QR_PER_PAGE` in pdf.service.ts */
  readonly QR_PER_PAGE = 25;
  pagesNeeded = () => Math.ceil(this.copies / this.QR_PER_PAGE);

  download(): void {
    if (this.copies < 1 || this.copies > 500) return;
    this.isDownloading.set(true);

    const url = `${environment.apiBase}/lots/code/${this.lotCode}/qr/pdf?copies=${this.copies}`;

    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = `qr-labels-${this.lotCode}-x${this.copies}.pdf`;
        link.click();
        URL.revokeObjectURL(objectUrl);
        this.isDownloading.set(false);
        this.snackbar.success(
          this.transloco.translate('qrPdf.success', { n: this.copies }),
        );
      },
      error: () => {
        // Message shown by errorInterceptor (errors.pdfDownloadFailed)
        this.isDownloading.set(false);
      },
    });
  }
}
