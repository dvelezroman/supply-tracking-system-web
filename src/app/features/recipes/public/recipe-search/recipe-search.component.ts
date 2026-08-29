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
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { TranslocoPipe } from '@jsverse/transloco';
import { Subject, debounceTime, distinctUntilChanged, forkJoin } from 'rxjs';
import type { RecipeListItem } from '../../models/recipe.model';
import {
  RecipesPublicApiService,
  getRecipeClientKey,
} from '../../services/recipes-api.service';
import { RecipeCardComponent } from '../shared/recipe-card/recipe-card.component';
import { MAREA_CHAT_OPEN_EVENT } from '../../../landing/components/marea-mary-section/marea-mary-section.component';

const CATEGORY_CHIPS = [
  { id: 'all', labelKey: 'recipes.public.filterAll', category: undefined as string | undefined },
  { id: 'entrada', labelKey: 'recipes.public.filterEntrada', category: 'Entrada / Coctel' },
  { id: 'fuerte', labelKey: 'recipes.public.filterFuerte', category: 'Plato fuerte' },
  {
    id: 'transicion',
    labelKey: 'recipes.public.filterTransicion',
    category: 'Entrada / Transición',
  },
] as const;

@Component({
  selector: 'app-recipe-search',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    RouterLink,
    TranslocoPipe,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatProgressBarModule,
    MatPaginatorModule,
    RecipeCardComponent,
  ],
  templateUrl: './recipe-search.component.html',
  styleUrl: './recipe-search.component.scss',
})
export class RecipeSearchComponent implements OnInit {
  private api = inject(RecipesPublicApiService);
  private destroyRef = inject(DestroyRef);

  readonly categoryChips = CATEGORY_CHIPS;

  q = signal('');
  sort = signal<'relevance' | 'popular' | 'recent'>('popular');
  categoryId = signal<(typeof CATEGORY_CHIPS)[number]['id']>('all');
  isLoading = signal(false);
  items = signal<RecipeListItem[]>([]);
  popular = signal<RecipeListItem[]>([]);
  recommended = signal<RecipeListItem[]>([]);
  total = signal(0);
  page = signal(1);
  pageSize = signal(12);
  private search$ = new Subject<string>();

  ngOnInit(): void {
    this.search$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.page.set(1);
        this.load();
      });
    this.loadRails();
    this.load();
  }

  onSearch(value: string): void {
    this.q.set(value);
    this.search$.next(value);
  }

  onSort(value: 'relevance' | 'popular' | 'recent'): void {
    this.sort.set(value);
    this.page.set(1);
    this.load();
  }

  setCategory(id: (typeof CATEGORY_CHIPS)[number]['id']): void {
    this.categoryId.set(id);
    this.page.set(1);
    this.load();
  }

  onPage(ev: PageEvent): void {
    this.page.set(ev.pageIndex + 1);
    this.pageSize.set(ev.pageSize);
    this.load();
  }

  openMary(): void {
    window.dispatchEvent(new CustomEvent(MAREA_CHAT_OPEN_EVENT, { detail: {} }));
  }

  showRails(): boolean {
    return !this.q().trim() && this.categoryId() === 'all' && this.page() === 1;
  }

  load(): void {
    this.isLoading.set(true);
    const q = this.q().trim();
    const chip = CATEGORY_CHIPS.find((c) => c.id === this.categoryId());
    this.api
      .search({
        page: this.page(),
        limit: this.pageSize(),
        q: q || undefined,
        category: chip?.category,
        sort: q ? (this.sort() === 'popular' ? 'relevance' : this.sort()) : this.sort(),
      })
      .subscribe({
        next: (res) => {
          this.items.set(res.data.items);
          this.total.set(res.data.total);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
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

  private loadRails(): void {
    forkJoin({
      popular: this.api.popular(4),
      trending: this.api.trending(4),
    }).subscribe({
      next: ({ popular, trending }) => {
        this.popular.set(popular.data ?? []);
        this.recommended.set(trending.data ?? []);
      },
      error: () => {
        this.popular.set([]);
        this.recommended.set([]);
      },
    });
  }

  private patchLike(id: string, likeCount: number): void {
    const patch = (list: RecipeListItem[]) =>
      list.map((r) => (r.id === id ? { ...r, likeCount } : r));
    this.items.update(patch);
    this.popular.update(patch);
    this.recommended.update(patch);
  }
}
