import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { PublicBrandingService } from '../../../../../core/services/public-branding.service';
import { MareaLandingImages } from '../../../../landing/marea-landing-images';

@Component({
  selector: 'app-store-hero',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe],
  templateUrl: './store-hero.component.html',
  styleUrl: './store-hero.component.scss',
})
export class StoreHeroComponent {
  protected brand = inject(PublicBrandingService);
  protected readonly heroImage = MareaLandingImages.heroProduct;
}
