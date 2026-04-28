import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { LanguageToggleComponent } from '../../shared/components/language-toggle/language-toggle.component';
import { PublicBrandingService } from '../../core/services/public-branding.service';
import { MareaHeroSectionComponent } from './components/marea-hero-section/marea-hero-section.component';
import { MareaStoryOriginComponent } from './components/marea-story-origin/marea-story-origin.component';
import { MareaLegacyTimelineComponent } from './components/marea-legacy-timeline/marea-legacy-timeline.component';
import { MareaTraceabilityFlowComponent } from './components/marea-traceability-flow/marea-traceability-flow.component';
import { MareaValuesGridComponent } from './components/marea-values-grid/marea-values-grid.component';
import { MareaTestimonialsComponent } from './components/marea-testimonials/marea-testimonials.component';
import { MareaFinalCtaComponent } from './components/marea-final-cta/marea-final-cta.component';
import { MareaLandingImages } from './marea-landing-images';

@Component({
  selector: 'app-landing',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    TranslocoPipe,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
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
export class LandingComponent implements OnInit, OnDestroy {
  private doc = inject(DOCUMENT);
  protected brand = inject(PublicBrandingService);

  /** Full-screen intro video on each visit (autoplay policies require muted until user unmutes). */
  readonly INTRO_VIDEO_URL =
    'https://marea-alta.s3.us-east-1.amazonaws.com/landing-images/Video-intro.mp4';

  readonly CONSUMER_PACKAGE_EXAMPLE_URL = MareaLandingImages.consumerPackageExample;

  introVisible = signal(true);
  introMuted = signal(true);
  private introVideoEl = viewChild<ElementRef<HTMLVideoElement>>('introVideo');

  ngOnInit(): void {
    this.lockBodyScroll();
  }

  ngOnDestroy(): void {
    this.unlockBodyScroll();
  }

  dismissIntro(): void {
    const v = this.introVideoEl()?.nativeElement;
    if (v) {
      v.pause();
    }
    this.introVisible.set(false);
    this.unlockBodyScroll();
  }

  toggleIntroSound(): void {
    const v = this.introVideoEl()?.nativeElement;
    if (!v) return;
    v.muted = !v.muted;
    this.introMuted.set(v.muted);
    void v.play().catch(() => {});
  }

  private lockBodyScroll(): void {
    if (this.introVisible()) {
      this.doc.body.style.overflow = 'hidden';
    }
  }

  private unlockBodyScroll(): void {
    this.doc.body.style.overflow = '';
  }
}
