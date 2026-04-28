import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MareaLandingImages } from '../../marea-landing-images';

@Component({
  selector: 'app-marea-final-cta',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslocoPipe, MatButtonModule, MatIconModule],
  templateUrl: './marea-final-cta.component.html',
  styleUrl: './marea-final-cta.component.scss',
})
export class MareaFinalCtaComponent {
  readonly ctaImageUrl = MareaLandingImages.finalCtaMenu;

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
