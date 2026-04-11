import { Routes } from '@angular/router';

export const TRACEABILITY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./events-list/events-list.component').then(
        (m) => m.EventsListComponent
      ),
  },
  {
    path: 'events/new',
    loadComponent: () =>
      import('./event-form/event-form.component').then(
        (m) => m.EventFormComponent
      ),
  },
];
