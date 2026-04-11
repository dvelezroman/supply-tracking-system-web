import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-page-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, RouterLink],
  template: `
    <div class="page-header">
      <div class="page-header__title">
        @if (backRoute) {
          <a mat-icon-button [routerLink]="backRoute" class="back-btn">
            <mat-icon>arrow_back</mat-icon>
          </a>
        }
        <div>
          <h1>{{ title }}</h1>
          @if (subtitle) {
            <p class="subtitle">{{ subtitle }}</p>
          }
        </div>
      </div>
      <div class="page-header__actions">
        <ng-content />
      </div>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .page-header__title {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .back-btn { margin-right: 4px; }
    h1 { margin: 0; font-size: 24px; font-weight: 500; }
    .subtitle { margin: 4px 0 0; color: rgba(0,0,0,0.54); font-size: 14px; }
    .page-header__actions { display: flex; gap: 8px; align-items: center; }
  `],
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() subtitle?: string;
  @Input() backRoute?: string;
}
