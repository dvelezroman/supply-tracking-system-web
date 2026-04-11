import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class SnackbarService {
  private snack = inject(MatSnackBar);

  success(message: string): void {
    this.snack.open(message, 'Close', {
      duration: 3000,
      panelClass: ['snack-success'],
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  error(message: string): void {
    this.snack.open(message, 'Close', {
      duration: 5000,
      panelClass: ['snack-error'],
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }
}
