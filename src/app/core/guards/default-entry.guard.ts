import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { redirectToDashboardIfAuthed } from './auth-session.util';

/**
 * Ruta raíz `/`: sin token → landing; con token (sesión activa) → `/dashboard`.
 */
export const defaultEntryGuard: CanActivateFn = () =>
  redirectToDashboardIfAuthed(inject(Router));
