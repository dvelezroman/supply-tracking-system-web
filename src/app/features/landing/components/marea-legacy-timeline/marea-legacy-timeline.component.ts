import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { MatIconModule } from '@angular/material/icon';
import { MareaLandingImages } from '../../marea-landing-images';

@Component({
  selector: 'app-marea-legacy-timeline',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe, MatIconModule],
  templateUrl: './marea-legacy-timeline.component.html',
  styleUrl: './marea-legacy-timeline.component.scss',
})
export class MareaLegacyTimelineComponent {
  readonly img = MareaLandingImages.timeline;
}
