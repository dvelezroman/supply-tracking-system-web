import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { startWith } from 'rxjs';
import type { RecipeDetail, RecipeIngredient, RecipeStep } from '../../models/recipe.model';
import {
  RecipesPublicApiService,
  getRecipeClientKey,
} from '../../services/recipes-api.service';
import { LanguageToggleComponent } from '../../../../shared/components/language-toggle/language-toggle.component';
import {
  recipeCategoryI18nKey,
  recipeDifficultyI18nKey,
} from '../shared/recipe-label.util';
import { localizeRecipeFields } from '../shared/recipe-content-i18n';

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    TranslocoPipe,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    LanguageToggleComponent,
  ],
  templateUrl: './recipe-detail.component.html',
  styleUrl: './recipe-detail.component.scss',
})
export class RecipeDetailComponent implements OnInit {
  @Input() slug!: string;

  private api = inject(RecipesPublicApiService);
  private i18n = inject(TranslocoService);

  readonly categoryKey = recipeCategoryI18nKey;
  readonly difficultyKey = recipeDifficultyI18nKey;

  isLoading = signal(true);
  recipe = signal<RecipeDetail | null>(null);
  liked = signal(false);
  notFound = signal(false);

  private readonly lang = toSignal(
    this.i18n.langChanges$.pipe(startWith(this.i18n.getActiveLang())),
    { initialValue: this.i18n.getActiveLang() },
  );

  readonly view = computed(() => {
    const r = this.recipe();
    return r ? localizeRecipeFields(r, this.lang()) : null;
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.api.getBySlug(this.slug).subscribe({
      next: (res) => {
        this.recipe.set(res.data);
        this.isLoading.set(false);
        const key = getRecipeClientKey();
        this.api.likeStatus(this.slug, key).subscribe({
          next: (s) => this.liked.set(s.data.liked),
          error: () => undefined,
        });
      },
      error: () => {
        this.notFound.set(true);
        this.isLoading.set(false);
      },
    });
  }

  ingredients(): RecipeIngredient[] {
    const r = this.view();
    return Array.isArray(r?.ingredients)
      ? (r!.ingredients as RecipeIngredient[])
      : [];
  }

  steps(): RecipeStep[] {
    const r = this.view();
    const list = Array.isArray(r?.steps) ? (r!.steps as RecipeStep[]) : [];
    return list.slice().sort((a, b) => a.order - b.order);
  }

  toggleLike(): void {
    const r = this.recipe();
    if (!r) return;
    const key = getRecipeClientKey();
    if (this.liked()) {
      this.api.unlike(r.slug, key).subscribe({
        next: (res) => {
          this.liked.set(false);
          this.recipe.set({ ...r, likeCount: res.data.likeCount });
        },
      });
    } else {
      this.api.like(r.slug, key).subscribe({
        next: (res) => {
          this.liked.set(true);
          this.recipe.set({ ...r, likeCount: res.data.likeCount });
        },
      });
    }
  }
}
