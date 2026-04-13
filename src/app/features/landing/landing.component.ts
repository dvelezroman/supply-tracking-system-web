import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { environment } from '../../../environments/environment';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { LanguageToggleComponent } from '../../shared/components/language-toggle/language-toggle.component';

export interface PublicBrandingDto {
  logoUrl: string | null;
  headerTitle: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    FormsModule,
    TranslocoPipe,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
    LanguageToggleComponent,
  ],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
})
export class LandingComponent {
  private router = inject(Router);

  /** From API `GET /public/branding` (LABEL_LOGO_URL + PUBLIC_HEADER_TITLE). */
  branding = signal<PublicBrandingDto | null>(null);

  /** Lot code typed by the user (same destination as scanning the QR). */
  lotCode = signal('');

  canLookup = computed(() => this.lotCode().trim().length > 0);

  constructor() {
    void this.loadBranding();
  }

  private async loadBranding(): Promise<void> {
    try {
      const url = `${environment.apiBase}/public/branding`;
      const res = await fetch(url, { credentials: 'omit' });
      if (!res.ok) return;
      const data = (await res.json()) as PublicBrandingDto;
      if (typeof data?.headerTitle !== 'string') return;
      this.branding.set({
        logoUrl: typeof data.logoUrl === 'string' ? data.logoUrl : null,
        headerTitle: data.headerTitle.trim() || 'MAREA ALTA Supply Tracking',
      });
    } catch {
      /* API unreachable — keep toolbar fallback from i18n */
    }
  }

  /**
   * Navigate to public trace — same route as QR: /trace/:lotCode.
   * Accepts a bare code or a pasted URL containing /trace/...
   */
  goToPublicTrace(): void {
    let raw = this.lotCode().trim();
    if (!raw) return;

    const fromUrl = raw.match(/\/trace\/([^/?#]+)/);
    if (fromUrl) {
      try {
        raw = decodeURIComponent(fromUrl[1]);
      } catch {
        raw = fromUrl[1];
      }
    }

    const code = raw.trim();
    if (!code) return;

    void this.router.navigate(['/trace', code]);
  }
}
