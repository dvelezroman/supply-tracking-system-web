import { Directive, ElementRef, HostListener, Input, inject } from '@angular/core';
import { resolveMareaLandingImageFallback } from '../marea-landing-images';

/**
 * Swaps a landing <img> to a bundled fallback when the remote src fails to load.
 * Usage: appLandingImageFallback="heroProduct" or appLandingImageFallback="timeline.e1"
 */
@Directive({
  selector: 'img[appLandingImageFallback]',
  standalone: true,
})
export class LandingImageFallbackDirective {
  private readonly el = inject(ElementRef<HTMLImageElement>);

  @Input({ required: true }) appLandingImageFallback!: string;

  @HostListener('error')
  onError(): void {
    const img = this.el.nativeElement;
    if (img.dataset['landingFallback'] === '1') return;
    const fallback = resolveMareaLandingImageFallback(this.appLandingImageFallback);
    if (!fallback) return;
    img.dataset['landingFallback'] = '1';
    img.src = fallback;
  }
}
