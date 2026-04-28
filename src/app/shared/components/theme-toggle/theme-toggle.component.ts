import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, TranslocoPipe],
  template: `
    <button
      type="button"
      mat-icon-button
      (click)="theme.toggle()"
      [attr.aria-label]="'common.themeToggle' | transloco"
    >
      <mat-icon>{{ theme.mode() === 'dark' ? 'dark_mode' : 'light_mode' }}</mat-icon>
    </button>
  `,
})
export class ThemeToggleComponent {
  protected theme = inject(ThemeService);
}
