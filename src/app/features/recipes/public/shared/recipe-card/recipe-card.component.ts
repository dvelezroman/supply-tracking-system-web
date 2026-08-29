import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe } from '@jsverse/transloco';
import type { RecipeListItem } from '../../../models/recipe.model';

@Component({
  selector: 'app-recipe-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatButtonModule, MatIconModule, TranslocoPipe],
  template: `
    <a class="recipe-card" [routerLink]="['/recetas', item().slug]">
      <div
        class="recipe-card__media"
        [class.recipe-card__media--empty]="!item().imageUrl"
        [style.background-image]="item().imageUrl ? 'url(' + item().imageUrl + ')' : null"
        role="img"
        [attr.aria-label]="item().name"
      >
        @if (!item().imageUrl) {
          <mat-icon aria-hidden="true">restaurant</mat-icon>
        }
        @if (badge()) {
          <span class="recipe-card__badge">{{ badge() }}</span>
        }
      </div>
      <div class="recipe-card__body">
        @if (item().category) {
          <p class="recipe-card__cat">{{ item().category }}</p>
        }
        <h3 class="recipe-card__title">{{ item().name }}</h3>
        @if (item().description) {
          <p class="recipe-card__desc">{{ item().description }}</p>
        }
        <div class="recipe-card__meta">
          @if (item().difficulty) {
            <span class="recipe-card__chip">
              <mat-icon>signal_cellular_alt</mat-icon>
              {{ item().difficulty }}
            </span>
          }
          @if (item().prepMinutes || item().cookMinutes) {
            <span class="recipe-card__chip">
              <mat-icon>schedule</mat-icon>
              {{ (item().prepMinutes ?? 0) + (item().cookMinutes ?? 0) }} min
            </span>
          }
          <button
            type="button"
            class="recipe-card__like"
            mat-stroked-button
            (click)="onLike($event)"
            [attr.aria-label]="'recipes.public.like' | transloco"
          >
            <mat-icon>favorite</mat-icon>
            {{ item().likeCount }}
          </button>
        </div>
      </div>
    </a>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
      .recipe-card {
        display: flex;
        flex-direction: column;
        height: 100%;
        text-decoration: none;
        color: inherit;
        border-radius: 16px;
        overflow: hidden;
        border: 1px solid rgba(20, 66, 114, 0.12);
        background: #fff;
        box-shadow: 0 4px 18px rgba(10, 38, 71, 0.06);
        transition:
          transform 0.28s ease,
          box-shadow 0.28s ease;
      }
      .recipe-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 14px 32px rgba(10, 38, 71, 0.14);
      }
      .recipe-card__media {
        position: relative;
        aspect-ratio: 16 / 10;
        background: linear-gradient(145deg, #144272 0%, #2c74b3 55%, #205295 100%);
        background-size: cover;
        background-position: center;
        display: grid;
        place-items: center;
      }
      .recipe-card__media--empty mat-icon {
        font-size: 42px;
        width: 42px;
        height: 42px;
        color: rgba(255, 255, 255, 0.85);
      }
      .recipe-card__badge {
        position: absolute;
        top: 0.65rem;
        left: 0.65rem;
        padding: 0.2rem 0.55rem;
        border-radius: 999px;
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        background: rgba(255, 107, 107, 0.95);
        color: #fff;
      }
      .recipe-card__body {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        padding: 1rem 1.05rem 1.1rem;
        flex: 1;
      }
      .recipe-card__cat {
        margin: 0;
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: #2c74b3;
      }
      .recipe-card__title {
        margin: 0;
        font-family: Montserrat, Roboto, system-ui, sans-serif;
        font-size: 1.05rem;
        font-weight: 700;
        color: #0a2647;
        line-height: 1.3;
      }
      .recipe-card__desc {
        margin: 0;
        font-size: 0.88rem;
        line-height: 1.45;
        color: #718096;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .recipe-card__meta {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.45rem;
        margin-top: auto;
        padding-top: 0.65rem;
      }
      .recipe-card__chip {
        display: inline-flex;
        align-items: center;
        gap: 0.2rem;
        font-size: 0.78rem;
        color: #2d3748;
        opacity: 0.85;
      }
      .recipe-card__chip mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }
      .recipe-card__like {
        margin-left: auto;
        min-height: 32px;
        line-height: 32px;
        padding: 0 0.65rem;
        font-size: 0.8rem;
      }
      .recipe-card__like mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        margin-right: 0.15rem;
        color: #ff6b6b;
      }
    `,
  ],
})
export class RecipeCardComponent {
  item = input.required<RecipeListItem>();
  badge = input<string | null>(null);
  like = output<RecipeListItem>();

  onLike(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.like.emit(this.item());
  }
}
