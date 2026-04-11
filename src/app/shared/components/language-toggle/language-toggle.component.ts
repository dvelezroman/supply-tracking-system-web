import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-language-toggle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatMenuModule, TranslocoPipe],
  template: `
    <button
      type="button"
      mat-icon-button
      [matMenuTriggerFor]="langMenu"
      [attr.aria-label]="'common.languageMenu' | transloco"
    >
      <mat-icon>translate</mat-icon>
    </button>
    <mat-menu #langMenu="matMenu">
      <button mat-menu-item (click)="setLang('es')">
        Español @if (active() === 'es') {
          <span class="check">✓</span>
        }
      </button>
      <button mat-menu-item (click)="setLang('en')">
        English @if (active() === 'en') {
          <span class="check">✓</span>
        }
      </button>
    </mat-menu>
  `,
  styles: [
    `
      .check {
        margin-left: 8px;
        opacity: 0.7;
      }
    `,
  ],
})
export class LanguageToggleComponent {
  private transloco = inject(TranslocoService);

  readonly active = signal(this.transloco.getActiveLang());

  constructor() {
    this.transloco.langChanges$.subscribe((l) => this.active.set(l));
  }

  setLang(code: 'en' | 'es'): void {
    this.transloco.setActiveLang(code);
  }
}
