import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoPipe } from '@jsverse/transloco';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../../../../environments/environment';

/** Dispatched on `window` so FAB chat opens from landing CTAs. */
export const MAREA_CHAT_OPEN_EVENT = 'marea-chat:open';

@Component({
  selector: 'app-marea-mary-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslocoPipe, MatButtonModule, MatIconModule],
  templateUrl: './marea-mary-section.component.html',
  styleUrl: './marea-mary-section.component.scss',
})
export class MareaMarySectionComponent {
  readonly logoUrl = environment.labelLogoUrl;
  private readonly logoFallbackUrl = environment.labelLogoFallbackUrl?.trim() || null;

  readonly features = [
    { icon: 'restaurant_menu', titleKey: 'landing.marea.mary.f1Title', bodyKey: 'landing.marea.mary.f1Body' },
    { icon: 'auto_awesome', titleKey: 'landing.marea.mary.f2Title', bodyKey: 'landing.marea.mary.f2Body' },
    { icon: 'qr_code_scanner', titleKey: 'landing.marea.mary.f3Title', bodyKey: 'landing.marea.mary.f3Body' },
    { icon: 'forum', titleKey: 'landing.marea.mary.f4Title', bodyKey: 'landing.marea.mary.f4Body' },
  ] as const;

  readonly prompts = [
    'landing.marea.mary.prompt1',
    'landing.marea.mary.prompt2',
    'landing.marea.mary.prompt3',
  ] as const;

  openMary(promptKey?: string): void {
    window.dispatchEvent(
      new CustomEvent(MAREA_CHAT_OPEN_EVENT, {
        detail: promptKey ? { promptKey } : {},
      }),
    );
  }

  onLogoError(event: Event): void {
    const fallback = this.logoFallbackUrl;
    if (!fallback) return;
    const img = event.target as HTMLImageElement | null;
    if (!img || img.dataset['logoFallback'] === '1') return;
    img.dataset['logoFallback'] = '1';
    img.src = fallback;
  }
}
