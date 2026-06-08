import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { LandingImageFallbackDirective } from '../../directives/landing-image-fallback.directive';
import { MareaLandingImages } from '../../marea-landing-images';

@Component({
  selector: 'app-marea-story-origin',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe, LandingImageFallbackDirective],
  templateUrl: './marea-story-origin.component.html',
  styleUrl: './marea-story-origin.component.scss',
})
export class MareaStoryOriginComponent {
  readonly img = MareaLandingImages;
}
