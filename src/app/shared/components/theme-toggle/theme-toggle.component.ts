import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { MatIconModule } from '@angular/material/icon';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, TranslocoPipe],
  template: `
    <button
      type="button"
      class="theme-toggle"
      [class.theme-toggle--dark]="theme.mode() === 'dark'"
      (click)="theme.toggle()"
      [attr.aria-label]="
        (theme.mode() === 'dark'
          ? 'common.themeToLight'
          : 'common.themeToDark'
        ) | transloco
      "
      [attr.aria-pressed]="theme.mode() === 'dark'"
      [attr.title]="
        (theme.mode() === 'dark'
          ? 'common.themeToLight'
          : 'common.themeToDark'
        ) | transloco
      "
    >
      <span class="theme-toggle__track" aria-hidden="true">
        <mat-icon class="theme-toggle__icon theme-toggle__icon--sun"
          >light_mode</mat-icon
        >
        <mat-icon class="theme-toggle__icon theme-toggle__icon--moon"
          >dark_mode</mat-icon
        >
        <span class="theme-toggle__thumb"></span>
      </span>
    </button>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        vertical-align: middle;
      }

      .theme-toggle {
        --tt-track: color-mix(in srgb, currentColor 18%, transparent);
        --tt-track-border: color-mix(in srgb, currentColor 32%, transparent);
        --tt-thumb: #fff;
        --tt-sun: #fbbf24;
        --tt-moon: #a5b4fc;
        --tt-icon-idle: color-mix(in srgb, currentColor 45%, transparent);

        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin: 0;
        padding: 6px;
        border: 0;
        background: transparent;
        color: inherit;
        cursor: pointer;
        border-radius: 999px;
        min-width: 44px;
        min-height: 44px;
        -webkit-tap-highlight-color: transparent;
        transition: background-color 160ms ease;
      }

      .theme-toggle:hover {
        background: color-mix(in srgb, currentColor 10%, transparent);
      }

      .theme-toggle:focus-visible {
        outline: 2px solid color-mix(in srgb, currentColor 70%, transparent);
        outline-offset: 2px;
      }

      .theme-toggle:active .theme-toggle__thumb {
        transform: translateX(var(--tt-x, 2px)) scale(0.92);
      }

      .theme-toggle__track {
        position: relative;
        display: grid;
        grid-template-columns: 1fr 1fr;
        align-items: center;
        width: 52px;
        height: 28px;
        padding: 0 4px;
        box-sizing: border-box;
        border-radius: 999px;
        background: var(--tt-track);
        border: 1px solid var(--tt-track-border);
        box-shadow: inset 0 1px 2px color-mix(in srgb, #000 12%, transparent);
        transition:
          background-color 220ms ease,
          border-color 220ms ease,
          box-shadow 220ms ease;
      }

      .theme-toggle__icon {
        position: relative;
        z-index: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        justify-self: center;
        width: 14px;
        height: 14px;
        font-size: 14px;
        line-height: 14px;
        overflow: hidden;
        color: var(--tt-icon-idle);
        transition:
          color 220ms ease,
          opacity 220ms ease,
          transform 220ms ease;
        pointer-events: none;
      }

      .theme-toggle__icon--sun {
        color: var(--tt-sun);
        opacity: 1;
        transform: scale(1);
      }

      .theme-toggle__icon--moon {
        opacity: 0.55;
        transform: scale(0.9);
      }

      .theme-toggle__thumb {
        --tt-x: 2px;
        position: absolute;
        top: 2px;
        left: 0;
        z-index: 2;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: var(--tt-thumb);
        box-shadow:
          0 1px 3px color-mix(in srgb, #000 28%, transparent),
          0 0 0 1px color-mix(in srgb, #000 6%, transparent);
        transform: translateX(var(--tt-x));
        transition:
          transform 240ms cubic-bezier(0.34, 1.4, 0.64, 1),
          background-color 220ms ease,
          box-shadow 220ms ease;
        pointer-events: none;
      }

      .theme-toggle--dark {
        --tt-track: color-mix(in srgb, currentColor 22%, #1e293b 40%);
        --tt-track-border: color-mix(in srgb, currentColor 28%, transparent);
      }

      .theme-toggle--dark .theme-toggle__thumb {
        --tt-x: 26px;
        background: #0f172a;
        box-shadow:
          0 1px 4px color-mix(in srgb, #000 45%, transparent),
          0 0 0 1px color-mix(in srgb, #fff 8%, transparent);
      }

      .theme-toggle--dark .theme-toggle__icon--sun {
        opacity: 0.5;
        transform: scale(0.9);
        color: var(--tt-icon-idle);
      }

      .theme-toggle--dark .theme-toggle__icon--moon {
        opacity: 1;
        transform: scale(1);
        color: var(--tt-moon);
      }

      @media (prefers-reduced-motion: reduce) {
        .theme-toggle,
        .theme-toggle__track,
        .theme-toggle__icon,
        .theme-toggle__thumb {
          transition: none;
        }
      }
    `,
  ],
})
export class ThemeToggleComponent {
  protected theme = inject(ThemeService);
}
