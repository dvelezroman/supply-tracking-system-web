import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { MatIconModule } from '@angular/material/icon';
import { PwaInstallService } from '../../../core/services/pwa-install.service';

@Component({
  selector: 'app-marea-pwa-install-toast',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe, MatIconModule],
  templateUrl: './marea-pwa-install-toast.component.html',
  styleUrl: './marea-pwa-install-toast.component.scss',
})
export class MareaPwaInstallToastComponent implements OnInit {
  protected readonly pwa = inject(PwaInstallService);

  ngOnInit(): void {
    this.pwa.start();
  }

  async onInstall(): Promise<void> {
    if (this.pwa.iosHint()) {
      // iOS: tip already explains Share → Add to Home Screen; keep toast open until dismiss.
      return;
    }
    await this.pwa.install();
  }

  onDismiss(): void {
    this.pwa.dismiss();
  }
}
