import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { LanguageToggleComponent } from '../../../../shared/components/language-toggle/language-toggle.component';
import { ThemeToggleComponent } from '../../../../shared/components/theme-toggle/theme-toggle.component';
import { PublicBrandingService } from '../../../../core/services/public-branding.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-store-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    TranslocoPipe,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    LanguageToggleComponent,
    ThemeToggleComponent,
  ],
  templateUrl: './store-shell.component.html',
  styleUrl: './store-shell.component.scss',
})
export class StoreShellComponent {
  protected brand = inject(PublicBrandingService);
  protected cart = inject(CartService);
}
