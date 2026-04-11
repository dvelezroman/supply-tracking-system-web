import { Routes } from '@angular/router';

export const LOTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./lots-list/lots-list.component').then((m) => m.LotsListComponent),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./lot-form/lot-form.component').then((m) => m.LotFormComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./lot-detail/lot-detail.component').then((m) => m.LotDetailComponent),
  },
];
