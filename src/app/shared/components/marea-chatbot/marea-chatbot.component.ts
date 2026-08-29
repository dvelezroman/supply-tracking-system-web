import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { fromEvent } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { RecipesPublicApiService } from '../../../features/recipes/services/recipes-api.service';
import { MAREA_CHAT_OPEN_EVENT } from '../../../features/landing/components/marea-mary-section/marea-mary-section.component';
import { RECIPE_CONTENT_EN } from '../../../features/recipes/public/shared/recipe-content-i18n';

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
  textKey?: string;
  plain?: string;
  recipeRefs?: { slug: string; name: string }[];
}

const CHAT_OPTIONS: {
  id: MareaChatOptionId;
  labelKey: string;
  icon: string;
  replyKey?: string;
  /** Transloco key for the RAG prompt sent when this chip is picked. */
  promptKey?: string;
}[] = [
  {
    id: 'site',
    labelKey: 'chatbot.options.site',
    icon: 'travel_explore',
    replyKey: 'chatbot.replies.site',
  },
  {
    id: 'product',
    labelKey: 'chatbot.options.product',
    icon: 'set_meal',
    replyKey: 'chatbot.replies.product',
  },
  {
    id: 'qr',
    labelKey: 'chatbot.options.qr',
    icon: 'qr_code_scanner',
    replyKey: 'chatbot.replies.qr',
  },
  {
    id: 'info',
    labelKey: 'chatbot.options.info',
    icon: 'info',
    replyKey: 'chatbot.replies.info',
  },
  {
    id: 'restaurants',
    labelKey: 'chatbot.options.restaurants',
    icon: 'restaurant',
    replyKey: 'chatbot.replies.restaurants',
  },
  {
    id: 'recipes',
    labelKey: 'chatbot.options.recipes',
    icon: 'menu_book',
    promptKey: 'chatbot.prompts.recipes',
  },
  {
    id: 'contact',
    labelKey: 'chatbot.options.contact',
    icon: 'chat',
    replyKey: 'chatbot.replies.contact',
  },
];

@Component({
  selector: 'app-marea-chatbot',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, TranslocoPipe, MatButtonModule, MatIconModule],
  templateUrl: './marea-chatbot.component.html',
  styleUrl: './marea-chatbot.component.scss',
})
export class MareaChatbotComponent implements OnInit, AfterViewChecked {
  private api = inject(RecipesPublicApiService);
  private transloco = inject(TranslocoService);
  private destroyRef = inject(DestroyRef);

  private messagesEl = viewChild<ElementRef<HTMLElement>>('messages');
  private shouldScroll = false;

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

  ngAfterViewChecked(): void {
    if (!this.shouldScroll) return;
    this.shouldScroll = false;
    const el = this.messagesEl()?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }

  toggle(): void {
    const next = !this.open();
    this.open.set(next);
    if (next && this.lines().length === 0) {
      this.lines.set([{ role: 'bot', textKey: 'chatbot.welcome' }]);
      this.shouldScroll = true;
    }
  }

  private openFromLanding(promptKey?: string): void {
    this.open.set(true);
    if (this.lines().length === 0) {
      this.lines.set([{ role: 'bot', textKey: 'chatbot.welcome' }]);
      this.shouldScroll = true;
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
    if (!opt || this.busy()) return;

    if (opt.promptKey) {
      const prompt = this.transloco.translate(opt.promptKey);
      this.sendMessage(prompt, this.transloco.translate(opt.labelKey));
      return;
    }

    this.lines.update((prev) => [
      ...prev,
      { role: 'user', textKey: opt.labelKey },
      { role: 'bot', textKey: opt.replyKey! },
    ]);
    this.shouldScroll = true;
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
    this.shouldScroll = true;
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
        this.shouldScroll = true;
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
        this.shouldScroll = true;
      },
    });
  }

  reset(): void {
    this.lines.set([{ role: 'bot', textKey: 'chatbot.welcome' }]);
    this.draft.set('');
    this.shouldScroll = true;
  }

  isContactReply(line: MareaChatLine): boolean {
    return line.textKey === 'chatbot.replies.contact';
  }

  recipeRefName(ref: { slug: string; name: string }): string {
    if (this.transloco.getActiveLang() !== 'en') return ref.name;
    return RECIPE_CONTENT_EN[ref.slug]?.name ?? ref.name;
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
