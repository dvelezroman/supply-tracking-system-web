import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { fromEvent } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RecipesPublicApiService } from '../../../features/recipes/services/recipes-api.service';
import { MAREA_CHAT_OPEN_EVENT } from '../../../features/landing/components/marea-mary-section/marea-mary-section.component';

export type MareaChatOptionId =
  | 'site'
  | 'product'
  | 'qr'
  | 'info'
  | 'restaurants'
  | 'recipes'
  | 'contact';

export interface MareaChatLine {
  role: 'user' | 'bot';
  /** i18n key when plain is absent */
  textKey?: string;
  /** Raw text (RAG replies) */
  plain?: string;
  recipeRefs?: { slug: string; name: string }[];
}

const CHAT_OPTIONS: {
  id: MareaChatOptionId;
  labelKey: string;
  replyKey?: string;
  prompt?: string;
}[] = [
  { id: 'site', labelKey: 'chatbot.options.site', replyKey: 'chatbot.replies.site' },
  {
    id: 'product',
    labelKey: 'chatbot.options.product',
    replyKey: 'chatbot.replies.product',
  },
  { id: 'qr', labelKey: 'chatbot.options.qr', replyKey: 'chatbot.replies.qr' },
  { id: 'info', labelKey: 'chatbot.options.info', replyKey: 'chatbot.replies.info' },
  {
    id: 'restaurants',
    labelKey: 'chatbot.options.restaurants',
    replyKey: 'chatbot.replies.restaurants',
  },
  {
    id: 'recipes',
    labelKey: 'chatbot.options.recipes',
    prompt: 'Sugiere recetas con camarón Marea Alta: ceviche, cóctel o plato fuerte',
  },
  {
    id: 'contact',
    labelKey: 'chatbot.options.contact',
    replyKey: 'chatbot.replies.contact',
  },
];

@Component({
  selector: 'app-marea-chatbot',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    RouterLink,
    TranslocoPipe,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './marea-chatbot.component.html',
  styleUrl: './marea-chatbot.component.scss',
})
export class MareaChatbotComponent implements OnInit {
  private api = inject(RecipesPublicApiService);
  private transloco = inject(TranslocoService);
  private destroyRef = inject(DestroyRef);

  readonly logoUrl = environment.labelLogoUrl;
  private readonly logoFallbackUrl = environment.labelLogoFallbackUrl?.trim() || null;
  readonly optionRows = CHAT_OPTIONS;

  readonly open = signal(false);
  readonly lines = signal<MareaChatLine[]>([]);
  readonly draft = signal('');
  readonly busy = signal(false);

  ngOnInit(): void {
    fromEvent<CustomEvent<{ promptKey?: string }>>(window, MAREA_CHAT_OPEN_EVENT)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((ev) => this.openFromLanding(ev.detail?.promptKey));
  }

  toggle(): void {
    const next = !this.open();
    this.open.set(next);
    if (next && this.lines().length === 0) {
      this.lines.set([{ role: 'bot', textKey: 'chatbot.welcome' }]);
    }
  }

  private openFromLanding(promptKey?: string): void {
    this.open.set(true);
    if (this.lines().length === 0) {
      this.lines.set([{ role: 'bot', textKey: 'chatbot.welcome' }]);
    }
    if (promptKey) {
      const prompt = this.transloco.translate(promptKey);
      if (prompt && !this.busy()) {
        this.sendMessage(prompt);
      }
    }
  }

  close(): void {
    this.open.set(false);
  }

  pick(id: MareaChatOptionId): void {
    const opt = CHAT_OPTIONS.find((o) => o.id === id);
    if (!opt) return;

    if (opt.prompt) {
      this.sendMessage(opt.prompt, this.transloco.translate(opt.labelKey));
      return;
    }

    this.lines.update((prev) => [
      ...prev,
      { role: 'user', textKey: opt.labelKey },
      { role: 'bot', textKey: opt.replyKey! },
    ]);
  }

  submit(): void {
    const text = this.draft().trim();
    if (!text || this.busy()) return;
    this.draft.set('');
    this.sendMessage(text);
  }

  private sendMessage(message: string, userLabel?: string): void {
    this.lines.update((prev) => [
      ...prev,
      { role: 'user', plain: userLabel ?? message },
    ]);
    this.busy.set(true);
    this.api.chat(message).subscribe({
      next: (res) => {
        this.busy.set(false);
        this.lines.update((prev) => [
          ...prev,
          {
            role: 'bot',
            plain: res.data.reply,
            recipeRefs: res.data.recipeRefs ?? [],
          },
        ]);
      },
      error: () => {
        this.busy.set(false);
        this.lines.update((prev) => [
          ...prev,
          {
            role: 'bot',
            plain: this.transloco.translate('chatbot.ragError'),
          },
        ]);
      },
    });
  }

  reset(): void {
    this.lines.set([{ role: 'bot', textKey: 'chatbot.welcome' }]);
    this.draft.set('');
  }

  isContactReply(line: MareaChatLine): boolean {
    return line.textKey === 'chatbot.replies.contact';
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
