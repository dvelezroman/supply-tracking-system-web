import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../../../environments/environment';

export type MareaChatOptionId =
  | 'site'
  | 'product'
  | 'qr'
  | 'info'
  | 'restaurants'
  | 'contact';

export interface MareaChatLine {
  role: 'user' | 'bot';
  textKey: string;
}

const CHAT_OPTIONS: { id: MareaChatOptionId; labelKey: string; replyKey: string }[] = [
  { id: 'site', labelKey: 'chatbot.options.site', replyKey: 'chatbot.replies.site' },
  { id: 'product', labelKey: 'chatbot.options.product', replyKey: 'chatbot.replies.product' },
  { id: 'qr', labelKey: 'chatbot.options.qr', replyKey: 'chatbot.replies.qr' },
  { id: 'info', labelKey: 'chatbot.options.info', replyKey: 'chatbot.replies.info' },
  {
    id: 'restaurants',
    labelKey: 'chatbot.options.restaurants',
    replyKey: 'chatbot.replies.restaurants',
  },
  { id: 'contact', labelKey: 'chatbot.options.contact', replyKey: 'chatbot.replies.contact' },
];

@Component({
  selector: 'app-marea-chatbot',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe, MatButtonModule, MatIconModule],
  templateUrl: './marea-chatbot.component.html',
  styleUrl: './marea-chatbot.component.scss',
})
export class MareaChatbotComponent {
  readonly logoUrl = environment.labelLogoUrl;
  readonly optionRows = CHAT_OPTIONS;

  readonly open = signal(false);
  readonly lines = signal<MareaChatLine[]>([]);

  toggle(): void {
    const next = !this.open();
    this.open.set(next);
    if (next && this.lines().length === 0) {
      this.lines.set([{ role: 'bot', textKey: 'chatbot.welcome' }]);
    }
  }

  close(): void {
    this.open.set(false);
  }

  pick(id: MareaChatOptionId): void {
    const opt = CHAT_OPTIONS.find((o) => o.id === id);
    if (!opt) return;

    this.lines.update((prev) => [
      ...prev,
      { role: 'user', textKey: opt.labelKey },
      { role: 'bot', textKey: opt.replyKey },
    ]);
  }

  reset(): void {
    this.lines.set([{ role: 'bot', textKey: 'chatbot.welcome' }]);
  }

  isContactReply(key: string): boolean {
    return key === 'chatbot.replies.contact';
  }
}
