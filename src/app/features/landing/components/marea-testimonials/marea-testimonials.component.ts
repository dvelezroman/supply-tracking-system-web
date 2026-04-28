import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoPipe } from '@jsverse/transloco';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { MareaLandingImages } from '../../marea-landing-images';

@Component({
  selector: 'app-marea-testimonials',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe, MatButtonModule, MatIconModule],
  templateUrl: './marea-testimonials.component.html',
  styleUrl: './marea-testimonials.component.scss',
})
export class MareaTestimonialsComponent implements AfterViewInit, OnDestroy {
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('viewport') viewport?: ElementRef<HTMLElement>;

  readonly stars = [1, 2, 3, 4, 5];
  readonly testimonialIds = ['t1', 't2', 't3', 't4', 't5'] as const;
  readonly avatars = MareaLandingImages.testimonials;

  private readonly autoplayMs = 5500;
  private autoplayId?: ReturnType<typeof setInterval>;
  /** Ignores scroll events fired by programmatic advances so autoplay does not reset itself. */
  private ignoreScrollRescheduleUntil = 0;

  ngAfterViewInit(): void {
    const el = this.viewport?.nativeElement;
    if (el) {
      fromEvent(el, 'scroll')
        .pipe(debounceTime(320), takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          if (performance.now() < this.ignoreScrollRescheduleUntil) return;
          this.scheduleAutoplay();
        });
    }
    this.scheduleAutoplay();
  }

  ngOnDestroy(): void {
    this.clearAutoplay();
  }

  scrollNext(): void {
    this.advanceCarousel('forward');
    this.scheduleAutoplay();
  }

  scrollPrev(): void {
    this.advanceCarousel('back');
    this.scheduleAutoplay();
  }

  onCarouselKeydown(ev: KeyboardEvent): void {
    if (ev.key === 'ArrowLeft') {
      ev.preventDefault();
      this.scrollPrev();
    }
    if (ev.key === 'ArrowRight') {
      ev.preventDefault();
      this.scrollNext();
    }
  }

  private advanceCarousel(direction: 'forward' | 'back'): void {
    const vp = this.viewport?.nativeElement;
    if (!vp) return;
    this.markProgrammaticScroll();
    const step = this.scrollStep(vp);
    const maxScroll = vp.scrollWidth - vp.clientWidth;
    const tol = 6;

    if (direction === 'forward') {
      if (vp.scrollLeft >= maxScroll - tol) {
        vp.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        vp.scrollBy({ left: step, behavior: 'smooth' });
      }
    } else {
      if (vp.scrollLeft <= tol) {
        vp.scrollTo({ left: maxScroll, behavior: 'smooth' });
      } else {
        vp.scrollBy({ left: -step, behavior: 'smooth' });
      }
    }
  }

  /** Smooth scroll can emit many scroll events; block rescheduling briefly after our own scroll calls. */
  private markProgrammaticScroll(): void {
    this.ignoreScrollRescheduleUntil = performance.now() + 900;
  }

  private scrollStep(vp: HTMLElement): number {
    const card = vp.querySelector('.marea-testimonials__card') as HTMLElement | null;
    const track = vp.querySelector('.marea-testimonials__track') as HTMLElement | null;
    if (!card || !track) {
      return Math.round(vp.clientWidth * 0.88);
    }
    const gapCss = getComputedStyle(track).gap;
    const gap = Number.parseFloat(gapCss) || 20;
    return card.getBoundingClientRect().width + gap;
  }

  private scheduleAutoplay(): void {
    this.clearAutoplay();
    if (this.prefersReducedMotion()) return;
    const vp = this.viewport?.nativeElement;
    if (!vp) return;
    this.autoplayId = window.setInterval(() => {
      this.advanceCarousel('forward');
    }, this.autoplayMs);
  }

  private clearAutoplay(): void {
    if (this.autoplayId !== undefined) {
      window.clearInterval(this.autoplayId);
      this.autoplayId = undefined;
    }
  }

  private prefersReducedMotion(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
}
