import { Routes } from '@angular/router';

export const PUBLIC_TRACE_ROUTES: Routes = [
  {
    path: ':lotCode',
    loadComponent: () =>
      import('./public-trace.component').then((m) => m.PublicTraceComponent),
  },
];
