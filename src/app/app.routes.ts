import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { MainShellComponent } from './layout/main-shell/main-shell.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/landing/landing.component').then(
        (m) => m.LandingComponent,
      ),
  },

  {
    path: 'trace',
    loadChildren: () =>
      import('./features/public-trace/public-trace.routes').then(
        (m) => m.PUBLIC_TRACE_ROUTES,
      ),
  },

  {
    path: 'auth',
    canActivate: [guestGuard],
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },

  {
    path: '',
    component: MainShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: 'products',
        loadChildren: () =>
          import('./features/products/products.routes').then(
            (m) => m.PRODUCTS_ROUTES,
          ),
      },
      {
        path: 'actors',
        loadChildren: () =>
          import('./features/actors/actors.routes').then(
            (m) => m.ACTORS_ROUTES,
          ),
      },
      {
        path: 'lots',
        loadChildren: () =>
          import('./features/lots/lots.routes').then((m) => m.LOTS_ROUTES),
      },
      {
        path: 'traceability',
        loadChildren: () =>
          import('./features/traceability/traceability.routes').then(
            (m) => m.TRACEABILITY_ROUTES,
          ),
      },
      {
        path: 'users',
        loadChildren: () =>
          import('./features/users/users.routes').then((m) => m.USERS_ROUTES),
      },
    ],
  },

  { path: '**', redirectTo: '' },
];
