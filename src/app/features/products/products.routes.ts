import { Routes } from '@angular/router';

export const PRODUCTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./products-list/products-list.component').then(
        (m) => m.ProductsListComponent
      ),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./product-form/product-form.component').then(
        (m) => m.ProductFormComponent
      ),
  },
  {
    path: 'segments',
    loadComponent: () =>
      import('./product-segments-list/product-segments-list.component').then(
        (m) => m.ProductSegmentsListComponent,
      ),
  },
  {
    path: 'segments/new',
    loadComponent: () =>
      import('./product-segment-form/product-segment-form.component').then(
        (m) => m.ProductSegmentFormComponent,
      ),
  },
  {
    path: 'segments/:id/edit',
    loadComponent: () =>
      import('./product-segment-form/product-segment-form.component').then(
        (m) => m.ProductSegmentFormComponent,
      ),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./product-form/product-form.component').then(
        (m) => m.ProductFormComponent
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./product-detail/product-detail.component').then(
        (m) => m.ProductDetailComponent
      ),
  },
];
