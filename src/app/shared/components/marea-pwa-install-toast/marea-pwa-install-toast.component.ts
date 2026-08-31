import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PwaInstallService } from '../../../core/services/pwa-install.service';

/**
 * PWA install snackbar — same UX as rotary-club `InstallPrompt`:
 * delayed Snackbar + “Ahora no” / “Instalar” (manual prompt only).
 */
@Component({
  selector: 'app-marea-pwa-install-toast',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe, MatIconModule, MatButtonModule],
  templateUrl: './marea-pwa-install-toast.component.html',
  styleUrl: './marea-pwa-install-toast.component.scss',
})
export class MareaPwaInstallToastComponent implements OnInit {
  protected readonly pwa = inject(PwaInstallService);

  ngOnInit(): void {
    this.pwa.start();
  }

  async onInstall(): Promise<void> {
    await this.pwa.install();
  }

  onDismiss(): void {
    this.pwa.dismiss();
  }
}
