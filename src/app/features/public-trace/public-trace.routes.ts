import { Routes } from '@angular/router';

export const PUBLIC_TRACE_ROUTES: Routes = [
  {
    path: 'restaurant/:slug',
    loadComponent: () =>
      import('./public-trace.component').then((m) => m.PublicTraceComponent),
  },
  {
    path: ':lotCode',
    loadComponent: () =>
      import('./public-trace.component').then((m) => m.PublicTraceComponent),
  },
];
