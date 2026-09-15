import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslocoPipe } from '@jsverse/transloco';
import { ProductSegmentsService } from '../services/product-segments.service';

@Component({
  selector: 'app-create-segment-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    TranslocoPipe,
  ],
  template: `
    <h2 mat-dialog-title>{{ 'productSegments.dialogTitle' | transloco }}</h2>
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <mat-dialog-content>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ 'productSegments.form.name' | transloco }}</mat-label>
          <input matInput formControlName="name" />
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>{{ 'common.cancel' | transloco }}</button>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || saving">
          @if (saving) {
            <mat-spinner diameter="20" />
          } @else {
            {{ 'productSegments.createSegment' | transloco }}
          }
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    .full-width {
      width: 100%;
      min-width: 18rem;
    }
  `,
})
export class CreateSegmentDialogComponent {
  private fb = inject(FormBuilder);
  private segmentsService = inject(ProductSegmentsService);
  private dialogRef = inject(MatDialogRef<CreateSegmentDialogComponent>);

  saving = false;

  form = this.fb.group({
    name: ['', Validators.required],
  });

  onSubmit(): void {
    if (this.form.invalid || this.saving) return;
    this.saving = true;
    this.segmentsService.create({ name: this.form.value.name!.trim() }).subscribe({
      next: (res) => this.dialogRef.close(res.data),
      error: () => {
        this.saving = false;
      },
    });
  }
}
