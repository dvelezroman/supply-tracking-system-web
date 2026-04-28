import { Routes } from '@angular/router';
import { adminGuard } from '../../core/guards/admin.guard';

export const USERS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./users-list/users-list.component').then(
        (m) => m.UsersListComponent,
      ),
  },
  {
    path: 'new',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./user-form/user-form.component').then(
        (m) => m.UserFormComponent,
      ),
  },
  {
    path: ':id/edit',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./user-form/user-form.component').then(
        (m) => m.UserFormComponent,
      ),
  },
];
