import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MareaChatbotComponent } from './shared/components/marea-chatbot/marea-chatbot.component';

/**
 * Root shell: only hosts the router. Public routes render without the operator sidenav;
 * authenticated app lives under {@link MainShellComponent}.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, MareaChatbotComponent],
  template: '<router-outlet /><app-marea-chatbot />',
  styles: [
    `
      :host {
        display: block;
        min-height: 100%;
      }
    `,
  ],
})
export class AppComponent {}
