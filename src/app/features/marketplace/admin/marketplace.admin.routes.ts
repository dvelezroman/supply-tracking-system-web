import { Routes } from '@angular/router';
import { adminGuard } from '../../../core/guards/admin.guard';

export const MARKETPLACE_ADMIN_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'products' },
  {
    path: 'products',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./admin-products-list/admin-products-list.component').then(
        (m) => m.AdminProductsListComponent,
      ),
  },
  {
    path: 'products/new',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./admin-product-form/admin-product-form.component').then(
        (m) => m.AdminProductFormComponent,
      ),
  },
  {
    path: 'products/:id',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./admin-product-form/admin-product-form.component').then(
        (m) => m.AdminProductFormComponent,
      ),
  },
  {
    path: 'orders',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./admin-orders-list/admin-orders-list.component').then(
        (m) => m.AdminOrdersListComponent,
      ),
  },
  {
    path: 'orders/:id',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./admin-order-detail/admin-order-detail.component').then(
        (m) => m.AdminOrderDetailComponent,
      ),
  },
  {
    path: 'settings',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./admin-settings/admin-settings.component').then(
        (m) => m.AdminSettingsComponent,
      ),
  },
];
