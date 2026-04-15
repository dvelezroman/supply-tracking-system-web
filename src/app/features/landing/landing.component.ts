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
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { LanguageToggleComponent } from '../../shared/components/language-toggle/language-toggle.component';
import { PublicBrandingService } from '../../core/services/public-branding.service';
import { MareaHeroSectionComponent } from './components/marea-hero-section/marea-hero-section.component';
import { MareaStoryOriginComponent } from './components/marea-story-origin/marea-story-origin.component';
import { MareaLegacyTimelineComponent } from './components/marea-legacy-timeline/marea-legacy-timeline.component';
import { MareaTraceabilityFlowComponent } from './components/marea-traceability-flow/marea-traceability-flow.component';
import { MareaValuesGridComponent } from './components/marea-values-grid/marea-values-grid.component';
import { MareaTestimonialsComponent } from './components/marea-testimonials/marea-testimonials.component';
import { MareaFinalCtaComponent } from './components/marea-final-cta/marea-final-cta.component';

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
    MareaHeroSectionComponent,
    MareaStoryOriginComponent,
    MareaLegacyTimelineComponent,
    MareaTraceabilityFlowComponent,
    MareaValuesGridComponent,
    MareaTestimonialsComponent,
    MareaFinalCtaComponent,
  ],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
})
export class LandingComponent {
  private router = inject(Router);
  protected brand = inject(PublicBrandingService);

  /** Lot code typed by the user (same destination as scanning the QR). */
  lotCode = signal('');

  canLookup = computed(() => this.lotCode().trim().length > 0);

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
