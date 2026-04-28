import { Routes } from '@angular/router';

export const RESTAURANTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./restaurants-list/restaurants-list.component').then(
        (m) => m.RestaurantsListComponent,
      ),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./restaurant-form/restaurant-form.component').then(
        (m) => m.RestaurantFormComponent,
      ),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./restaurant-form/restaurant-form.component').then(
        (m) => m.RestaurantFormComponent,
      ),
  },
];
