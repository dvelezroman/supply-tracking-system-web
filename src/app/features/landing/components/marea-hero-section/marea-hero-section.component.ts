import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { MatIconModule } from '@angular/material/icon';
import { MareaLandingImages } from '../../marea-landing-images';

@Component({
  selector: 'app-marea-hero-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe, MatIconModule],
  templateUrl: './marea-hero-section.component.html',
  styleUrl: './marea-hero-section.component.scss',
})
export class MareaHeroSectionComponent {
  readonly img = MareaLandingImages;

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
