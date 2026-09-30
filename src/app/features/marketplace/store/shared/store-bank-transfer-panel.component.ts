import {
  ChangeDetectionStrategy,
  Component,
  Input,
  inject,
  signal,
} from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { MatIconModule } from '@angular/material/icon';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { formatMoney } from '../../utils/money';
import type { BankTransferDetails } from '../../models/marketplace.model';

@Component({
  selector: 'app-store-bank-transfer-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe, MatIconModule],
  templateUrl: './store-bank-transfer-panel.component.html',
  styleUrl: './store-bank-transfer-panel.component.scss',
})
export class StoreBankTransferPanelComponent {
  @Input({ required: true }) bank!: BankTransferDetails;
  @Input({ required: true }) amountCents!: number;
  @Input() currency = 'USD';
  /** When set, show order number as transfer reference (confirmation). */
  @Input() orderNumber?: string | null;
  @Input() customerName?: string | null;
  @Input() showSteps = false;
  @Input() whatsappUrl = 'https://wa.me/593999530981';

  private snackbar = inject(SnackbarService);
  private transloco = inject(TranslocoService);

  readonly formatMoney = formatMoney;
  copiedKey = signal<string | null>(null);

  async copy(value: string, key: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(value);
      this.copiedKey.set(key);
      this.snackbar.success(
        this.transloco.translate('marketplace.store.bankCopied'),
      );
      setTimeout(() => {
        if (this.copiedKey() === key) this.copiedKey.set(null);
      }, 2000);
    } catch {
      this.snackbar.error(
        this.transloco.translate('marketplace.store.bankCopyFailed'),
      );
    }
  }

  amountLabel(): string {
    return formatMoney(this.amountCents, this.currency);
  }

  whatsappHref(): string {
    const base = this.whatsappUrl.split('?')[0];
    const msg = this.transloco.translate(
      'marketplace.store.bankWhatsappMessage',
      {
        order: this.orderNumber ?? '',
        amount: this.amountLabel(),
        name: this.customerName ?? '',
      },
    );
    return `${base}?text=${encodeURIComponent(msg)}`;
  }
}
