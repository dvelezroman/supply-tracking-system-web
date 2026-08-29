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

/** Nav CTA extracted from `/recetas` paths (or recipeRefs). */
export type MareaChatNavBtn = {
  key: string;
  label: string;
  commands: string[];
  icon: string;
};

/** `/recetas` or `/recetas/{slug}`, optional surrounding `**markdown**`. */
const RECIPE_PATH_RE =
  /\*\*(\/recetas(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)?)\*\*|(\/recetas(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)?)/gi;

function extractRecipePaths(text: string): { path: string; slug: string | null }[] {
  const out: { path: string; slug: string | null }[] = [];
  const seen = new Set<string>();
  for (const match of text.matchAll(RECIPE_PATH_RE)) {
    const path = match[1] ?? match[2] ?? match[0];
    if (seen.has(path)) continue;
    seen.add(path);
    const slug = path.startsWith('/recetas/')
      ? path.slice('/recetas/'.length)
      : null;
    out.push({ path, slug });
  }
  return out;
}

function stripRecipePaths(text: string): string {
  return text
    .replace(RECIPE_PATH_RE, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/ +\./g, '.')
    .replace(/ +,/g, ',')
    .replace(/:\s*$/gm, '.')
    .trim();
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
  private chipsEl = viewChild<ElementRef<HTMLElement>>('chips');
  private shouldScroll = false;

  readonly logoUrl = environment.labelLogoUrl;
  private readonly logoFallbackUrl = environment.labelLogoFallbackUrl?.trim() || null;
  readonly optionRows = CHAT_OPTIONS;

  readonly open = signal(false);
  readonly lines = signal<MareaChatLine[]>([]);
  readonly draft = signal('');
  readonly busy = signal(false);
  readonly chipsCanPrev = signal(false);
  readonly chipsCanNext = signal(false);

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
    if (next) {
      queueMicrotask(() => this.updateChipsScrollState());
    }
  }

  scrollChips(dir: -1 | 1): void {
    const el = this.chipsEl()?.nativeElement;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(160, el.clientWidth * 0.65), behavior: 'smooth' });
  }

  onChipsScroll(): void {
    this.updateChipsScrollState();
  }

  onChipsWheel(event: WheelEvent): void {
    const el = this.chipsEl()?.nativeElement;
    if (!el) return;
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    if (el.scrollWidth <= el.clientWidth + 2) return;
    event.preventDefault();
    el.scrollLeft += event.deltaY;
    this.updateChipsScrollState();
  }

  private updateChipsScrollState(): void {
    const el = this.chipsEl()?.nativeElement;
    if (!el) {
      this.chipsCanPrev.set(false);
      this.chipsCanNext.set(false);
      return;
    }
    const max = el.scrollWidth - el.clientWidth;
    this.chipsCanPrev.set(el.scrollLeft > 4);
    this.chipsCanNext.set(max - el.scrollLeft > 4);
  }

  private openFromLanding(promptKey?: string): void {
    this.open.set(true);
    if (this.lines().length === 0) {
      this.lines.set([{ role: 'bot', textKey: 'chatbot.welcome' }]);
      this.shouldScroll = true;
    }
    queueMicrotask(() => this.updateChipsScrollState());
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
    const lang = this.transloco.getActiveLang() === 'en' ? 'en' : 'es';
    this.api.chat(message, { lang }).subscribe({
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

  private lineText(line: MareaChatLine): string {
    return (
      line.plain ??
      (line.textKey ? this.transloco.translate(line.textKey) : '') ??
      ''
    );
  }

  /** Bot copy without raw `/recetas…` paths (those become buttons). */
  botPlainText(line: MareaChatLine): string {
    return stripRecipePaths(this.lineText(line));
  }

  /** Path mentions + RAG recipeRefs → unique nav buttons. */
  botNavButtons(line: MareaChatLine): MareaChatNavBtn[] {
    const text = this.lineText(line);
    const buttons: MareaChatNavBtn[] = [];
    const seen = new Set<string>();

    const push = (btn: MareaChatNavBtn) => {
      if (seen.has(btn.key)) return;
      seen.add(btn.key);
      buttons.push(btn);
    };

    for (const { slug } of extractRecipePaths(text)) {
      if (!slug) {
        push({
          key: 'list',
          label: this.transloco.translate('chatbot.openRecipes'),
          commands: ['/recetas'],
          icon: 'menu_book',
        });
        continue;
      }
      const name =
        line.recipeRefs?.find((r) => r.slug === slug)?.name ??
        (this.transloco.getActiveLang() === 'en'
          ? RECIPE_CONTENT_EN[slug]?.name
          : undefined);
      push({
        key: slug,
        label: name
          ? this.recipeRefName({ slug, name })
          : this.transloco.translate('chatbot.openRecipe'),
        commands: ['/recetas', slug],
        icon: 'restaurant_menu',
      });
    }

    for (const ref of line.recipeRefs ?? []) {
      push({
        key: ref.slug,
        label: this.recipeRefName(ref),
        commands: ['/recetas', ref.slug],
        icon: 'restaurant_menu',
      });
    }

    return buttons;
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
