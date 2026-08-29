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
import { TranslocoPipe } from '@jsverse/transloco';
import type { RecipeListItem } from '../../models/recipe.model';
import { RecipesPublicApiService } from '../../services/recipes-api.service';

@Component({
  selector: 'app-marea-recipes-trending',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslocoPipe, MatButtonModule, MatIconModule],
  template: `
    <section class="trending" aria-labelledby="recipes-trending-title">
      <div class="head">
        <div>
          <h2 id="recipes-trending-title">
            {{ 'recipes.public.trendingTitle' | transloco }}
          </h2>
          <p>{{ 'recipes.public.trendingSubtitle' | transloco }}</p>
        </div>
        <a mat-stroked-button routerLink="/recetas">
          <mat-icon>search</mat-icon>
          {{ 'recipes.public.searchAll' | transloco }}
        </a>
      </div>

      <div class="grid">
        @for (item of items(); track item.id) {
          <a class="card-link" [routerLink]="['/recetas', item.slug]">
            <h3>{{ item.name }}</h3>
            <p>{{ item.category }}</p>
            <span class="likes">
              <mat-icon>favorite</mat-icon>
              {{ item.likeCount }}
            </span>
          </a>
        } @empty {
          <p class="empty">{{ 'recipes.public.empty' | transloco }}</p>
        }
      </div>
    </section>
  `,
  styles: [
    `
      .trending {
        max-width: 1100px;
        margin: 0 auto;
        padding: 2.5rem 1rem;
      }
      .head {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        gap: 1rem;
        align-items: flex-end;
        margin-bottom: 1.25rem;
      }
      h2 {
        margin: 0 0 0.35rem;
      }
      .head p {
        margin: 0;
        opacity: 0.75;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 0.85rem;
      }
      .card-link {
        display: block;
        padding: 1rem;
        text-decoration: none;
        color: inherit;
        border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
        border-radius: 8px;
      }
      .card-link h3 {
        margin: 0 0 0.35rem;
        font-size: 1.05rem;
      }
      .card-link p {
        margin: 0 0 0.75rem;
        opacity: 0.7;
        font-size: 0.85rem;
      }
      .likes {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.9rem;
      }
      .likes mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
      .empty {
        opacity: 0.7;
      }
    `,
  ],
})
export class MareaRecipesTrendingComponent implements OnInit {
  private api = inject(RecipesPublicApiService);
  items = signal<RecipeListItem[]>([]);

  ngOnInit(): void {
    this.api.trending(6).subscribe({
      next: (res) => this.items.set(res.data ?? []),
      error: () => this.items.set([]),
    });
  }
}
