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
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import type { RecipeListItem } from '../../models/recipe.model';
import {
  RecipesPublicApiService,
  getRecipeClientKey,
} from '../../services/recipes-api.service';

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
  ],
  templateUrl: './recipe-search.component.html',
  styleUrl: './recipe-search.component.scss',
})
export class RecipeSearchComponent implements OnInit {
  private api = inject(RecipesPublicApiService);
  private destroyRef = inject(DestroyRef);

  q = signal('');
  sort = signal<'relevance' | 'popular' | 'recent'>('popular');
  isLoading = signal(false);
  items = signal<RecipeListItem[]>([]);
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

  onPage(ev: PageEvent): void {
    this.page.set(ev.pageIndex + 1);
    this.pageSize.set(ev.pageSize);
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    const q = this.q().trim();
    this.api
      .search({
        page: this.page(),
        limit: this.pageSize(),
        q: q || undefined,
        sort: q ? this.sort() === 'popular' ? 'relevance' : this.sort() : this.sort(),
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

  toggleLike(item: RecipeListItem, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const key = getRecipeClientKey();
    this.api.like(item.slug, key).subscribe({
      next: (res) => {
        this.items.update((list) =>
          list.map((r) =>
            r.id === item.id ? { ...r, likeCount: res.data.likeCount } : r,
          ),
        );
      },
      error: () => {
        this.api.unlike(item.slug, key).subscribe({
          next: (res) => {
            this.items.update((list) =>
              list.map((r) =>
                r.id === item.id ? { ...r, likeCount: res.data.likeCount } : r,
              ),
            );
          },
        });
      },
    });
  }
}
