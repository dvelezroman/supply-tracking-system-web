import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MareaChatbotComponent } from './shared/components/marea-chatbot/marea-chatbot.component';
import { AuthService } from './features/auth/services/auth.service';

/**
 * Root shell: only hosts the router. Public routes render without the operator sidenav;
 * authenticated app lives under {@link MainShellComponent}.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, MareaChatbotComponent],
  template: `
    <router-outlet />
    @if (!auth.isAuthenticated()) {
      <app-marea-chatbot />
    }
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100%;
      }
    `,
  ],
})
export class AppComponent {
  protected auth = inject(AuthService);
}
