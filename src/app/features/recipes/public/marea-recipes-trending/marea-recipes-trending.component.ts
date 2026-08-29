import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { forkJoin } from 'rxjs';
import type { RecipeListItem } from '../../models/recipe.model';
import {
  RecipesPublicApiService,
  getRecipeClientKey,
} from '../../services/recipes-api.service';
import { RecipeCardComponent } from '../shared/recipe-card/recipe-card.component';

export type RecipesRail = 'recommended' | 'popular';

const CATEGORY_FILTERS = [
  { id: 'all', labelKey: 'recipes.public.filterAll', category: null as string | null },
  {
    id: 'entrada',
    labelKey: 'recipes.public.filterEntrada',
    category: 'Entrada / Coctel',
  },
  {
    id: 'fuerte',
    labelKey: 'recipes.public.filterFuerte',
    category: 'Plato fuerte',
  },
  {
    id: 'transicion',
    labelKey: 'recipes.public.filterTransicion',
    category: 'Entrada / Transición',
  },
] as const;

@Component({
  selector: 'app-marea-recipes-trending',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    TranslocoPipe,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    RecipeCardComponent,
  ],
  templateUrl: './marea-recipes-trending.component.html',
  styleUrl: './marea-recipes-trending.component.scss',
})
export class MareaRecipesTrendingComponent implements OnInit {
  private api = inject(RecipesPublicApiService);
  private i18n = inject(TranslocoService);

  readonly filters = CATEGORY_FILTERS;
  rail = signal<RecipesRail>('recommended');
  filterId = signal<(typeof CATEGORY_FILTERS)[number]['id']>('all');
  isLoading = signal(true);
  recommended = signal<RecipeListItem[]>([]);
  popular = signal<RecipeListItem[]>([]);
  filtered = signal<RecipeListItem[]>([]);

  ngOnInit(): void {
    this.loadRails();
  }

  setRail(rail: RecipesRail): void {
    this.rail.set(rail);
    this.applyFilter();
  }

  setFilter(id: (typeof CATEGORY_FILTERS)[number]['id']): void {
    this.filterId.set(id);
    this.applyFilter();
  }

  toggleLike(item: RecipeListItem): void {
    const key = getRecipeClientKey();
    this.api.like(item.slug, key).subscribe({
      next: (res) => this.patchLike(item.id, res.data.likeCount),
      error: () => {
        this.api.unlike(item.slug, key).subscribe({
          next: (res) => this.patchLike(item.id, res.data.likeCount),
        });
      },
    });
  }

  badgeFor(item: RecipeListItem): string | null {
    if (this.rail() === 'recommended') {
      return this.i18n.translate('recipes.public.badgeRecommended');
    }
    if (item.likeCount > 0) {
      return this.i18n.translate('recipes.public.badgePopular');
    }
    return null;
  }

  private loadRails(): void {
    this.isLoading.set(true);
    forkJoin({
      trending: this.api.trending(8),
      popular: this.api.popular(8),
    }).subscribe({
      next: ({ trending, popular }) => {
        this.recommended.set(trending.data ?? []);
        this.popular.set(popular.data ?? []);
        this.isLoading.set(false);
        this.applyFilter();
      },
      error: () => {
        this.recommended.set([]);
        this.popular.set([]);
        this.isLoading.set(false);
        this.applyFilter();
      },
    });
  }

  private applyFilter(): void {
    const base =
      this.rail() === 'recommended' ? this.recommended() : this.popular();
    const id = this.filterId();
    if (id === 'all') {
      this.filtered.set(base);
      return;
    }
    this.filtered.set(
      base.filter((r) => this.matchesCategory(r.category, id)),
    );
  }

  private matchesCategory(
    category: string | null | undefined,
    filterId: string,
  ): boolean {
    const c = (category ?? '').toLowerCase();
    if (filterId === 'entrada') {
      return c.includes('coctel') || c.includes('cóctel') || (c.includes('entrada') && !c.includes('transici'));
    }
    if (filterId === 'fuerte') {
      return c.includes('plato fuerte') || c.includes('fuerte');
    }
    if (filterId === 'transicion') {
      return c.includes('transici');
    }
    return true;
  }

  private patchLike(id: string, likeCount: number): void {
    const patch = (list: RecipeListItem[]) =>
      list.map((r) => (r.id === id ? { ...r, likeCount } : r));
    this.recommended.update(patch);
    this.popular.update(patch);
    this.filtered.update(patch);
  }
}
