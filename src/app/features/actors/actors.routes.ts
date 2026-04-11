import { Routes } from '@angular/router';

export const ACTORS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./actors-list/actors-list.component').then(
        (m) => m.ActorsListComponent
      ),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./actor-form/actor-form.component').then(
        (m) => m.ActorFormComponent
      ),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./actor-form/actor-form.component').then(
        (m) => m.ActorFormComponent
      ),
  },
];
