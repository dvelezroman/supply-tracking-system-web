import {
  Component,
  Input,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ProductSegmentsService } from '../services/product-segments.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { SnackbarService } from '../../../core/services/snackbar.service';

@Component({
  selector: 'app-product-segment-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TranslocoPipe,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    PageHeaderComponent,
  ],
  templateUrl: './product-segment-form.component.html',
  styleUrl: './product-segment-form.component.scss',
})
export class ProductSegmentFormComponent implements OnInit {
  @Input() id?: string;

  private fb = inject(FormBuilder);
  private segmentsService = inject(ProductSegmentsService);
  private router = inject(Router);
  private snackbar = inject(SnackbarService);
  private transloco = inject(TranslocoService);

  isEditMode = computed(() => !!this.id);
  isLoading = signal(false);
  isSaving = signal(false);

  form = this.fb.group({
    name: ['', Validators.required],
  });

  ngOnInit(): void {
    if (this.isEditMode()) {
      this.isLoading.set(true);
      this.segmentsService.getById(this.id!).subscribe({
        next: (res) => {
          this.form.patchValue({ name: res.data.name });
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.isSaving.set(true);
    const payload = { name: this.form.value.name!.trim() };

    const request$ = this.isEditMode()
      ? this.segmentsService.update(this.id!, payload)
      : this.segmentsService.create(payload);

    request$.subscribe({
      next: () => {
        this.snackbar.success(
          this.transloco.translate(
            this.isEditMode()
              ? 'productSegments.toastUpdated'
              : 'productSegments.toastCreated',
          ),
        );
        this.router.navigate(['/products/segments']);
      },
      error: () => this.isSaving.set(false),
    });
  }

  onCancel(): void {
    this.router.navigate(['/products/segments']);
  }
}
