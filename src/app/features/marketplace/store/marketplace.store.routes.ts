import { Routes } from '@angular/router';

export const MARKETPLACE_STORE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./store-shell/store-shell.component').then(
        (m) => m.StoreShellComponent,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./store-catalog/store-catalog.component').then(
            (m) => m.StoreCatalogComponent,
          ),
      },
      {
        path: 'carrito',
        loadComponent: () =>
          import('./store-cart/store-cart.component').then(
            (m) => m.StoreCartComponent,
          ),
      },
      {
        path: 'checkout',
        loadComponent: () =>
          import('./store-checkout/store-checkout.component').then(
            (m) => m.StoreCheckoutComponent,
          ),
      },
      {
        path: 'pedido/:orderNumber',
        loadComponent: () =>
          import('./store-order-confirmation/store-order-confirmation.component').then(
            (m) => m.StoreOrderConfirmationComponent,
          ),
      },
      {
        path: ':slug',
        loadComponent: () =>
          import('./store-product-detail/store-product-detail.component').then(
            (m) => m.StoreProductDetailComponent,
          ),
      },
    ],
  },
];
