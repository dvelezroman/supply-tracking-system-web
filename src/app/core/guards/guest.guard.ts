import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

/** Send users who already have a session to the app shell (skip login / marketing). */
export const guestGuard: CanActivateFn = () => {
  const router = inject(Router);
  return localStorage.getItem('access_token')
    ? router.createUrlTree(['/dashboard'])
    : true;
};
