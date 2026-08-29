import { Routes } from '@angular/router';

export const RECIPES_PUBLIC_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./recipe-search/recipe-search.component').then(
        (m) => m.RecipeSearchComponent,
      ),
  },
  {
    path: ':slug',
    loadComponent: () =>
      import('./recipe-detail/recipe-detail.component').then(
        (m) => m.RecipeDetailComponent,
      ),
  },
];
