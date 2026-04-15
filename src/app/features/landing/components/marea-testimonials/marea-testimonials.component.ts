import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { MatIconModule } from '@angular/material/icon';
import { MareaLandingImages } from '../../marea-landing-images';

@Component({
  selector: 'app-marea-testimonials',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe, MatIconModule],
  templateUrl: './marea-testimonials.component.html',
  styleUrl: './marea-testimonials.component.scss',
})
export class MareaTestimonialsComponent {
  readonly stars = [1, 2, 3, 4, 5];
  readonly avatars = MareaLandingImages.testimonials;
}
