import { Routes } from '@angular/router';
import { adminGuard } from '../../../core/guards/admin.guard';

export const RECIPES_ADMIN_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'list' },
  {
    path: 'list',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./admin-recipes-list/admin-recipes-list.component').then(
        (m) => m.AdminRecipesListComponent,
      ),
  },
  {
    path: 'new',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./admin-recipe-form/admin-recipe-form.component').then(
        (m) => m.AdminRecipeFormComponent,
      ),
  },
  {
    path: ':id',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./admin-recipe-form/admin-recipe-form.component').then(
        (m) => m.AdminRecipeFormComponent,
      ),
  },
];
