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
import { ProductsService } from '../services/products.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { AuthService } from '../../auth/services/auth.service';
import {
  PUBLIC_VISIBILITY_FIELD_META,
  type PublicVisibilityKey,
  resolvePublicVisibility,
} from '../../../core/config/public-visibility';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { ProductSegmentsService } from '../services/product-segments.service';
import { CreateSegmentDialogComponent } from '../create-segment-dialog/create-segment-dialog.component';
import type { ProductSegment } from '../../../core/models/product-segment.model';
import type { CreateProductPayload } from '../../../core/models/product.model';

@Component({
  selector: 'app-product-form',
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
    MatSlideToggleModule,
    MatSelectModule,
    PageHeaderComponent,
  ],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.scss',
})
export class ProductFormComponent implements OnInit {
  @Input() id?: string;

  private fb = inject(FormBuilder);
  private productsService = inject(ProductsService);
  private router = inject(Router);
  private snackbar = inject(SnackbarService);
  private transloco = inject(TranslocoService);
  private auth = inject(AuthService);
  private segmentsService = inject(ProductSegmentsService);
  private dialog = inject(MatDialog);

  isEditMode = computed(() => !!this.id);
  segments = signal<ProductSegment[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);
  isSavingVis = signal(false);
  readonly isAdmin = this.auth.isAdmin;
  readonly visibilityFields = PUBLIC_VISIBILITY_FIELD_META;
  vis = signal<Record<PublicVisibilityKey, boolean>>(resolvePublicVisibility(null));

  form = this.fb.group({
    sku: ['', Validators.required],
    name: ['', Validators.required],
    description: [''],
    category: [''],
    segmentId: [null as string | null],
  });

  ngOnInit(): void {
    this.loadSegments();
    if (this.isEditMode()) {
      this.isLoading.set(true);
      this.productsService.getById(this.id!).subscribe({
        next: (res) => {
          this.form.patchValue({
            ...res.data,
            segmentId: res.data.segmentId ?? res.data.segment?.id ?? null,
          });
          this.form.controls.sku.disable();
          this.vis.set(resolvePublicVisibility(res.data.publicVisibilityDefaults));
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
    }
  }

  loadSegments(): void {
    this.segmentsService.getAll().subscribe({
      next: (res) => this.segments.set(res.data),
    });
  }

  openCreateSegmentDialog(): void {
    const ref = this.dialog.open(CreateSegmentDialogComponent, { width: '22rem' });
    ref.afterClosed().subscribe((created: ProductSegment | undefined) => {
      if (!created) return;
      this.segments.update((list) =>
        [...list, created].sort((a, b) => a.name.localeCompare(b.name)),
      );
      this.form.patchValue({ segmentId: created.id });
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.isSaving.set(true);
    const raw = this.form.getRawValue();
    const payload: CreateProductPayload = {
      sku: raw.sku!,
      name: raw.name!,
      description: raw.description?.trim() || undefined,
      category: raw.category?.trim() || undefined,
      segmentId: raw.segmentId || null,
    };

    const request$ = this.isEditMode()
      ? this.productsService.update(this.id!, payload)
      : this.productsService.create(payload);

    request$.subscribe({
      next: () => {
        this.snackbar.success(
          this.transloco.translate(
            this.isEditMode() ? 'form.toast.productUpdated' : 'form.toast.productCreated',
          ),
        );
        this.router.navigate(['/products']);
      },
      error: () => this.isSaving.set(false),
    });
  }

  onCancel(): void {
    this.router.navigate(['/products']);
  }

  onVisibilityToggle(key: PublicVisibilityKey, checked: boolean): void {
    this.vis.update((s) => ({ ...s, [key]: checked }));
  }

  savePublicVisibilityDefaults(): void {
    if (!this.id) return;
    this.isSavingVis.set(true);
    this.productsService.patchPublicVisibilityDefaults(this.id, this.vis()).subscribe({
      next: () => {
        this.snackbar.success(this.transloco.translate('publicVisibility.saved'));
        this.isSavingVis.set(false);
      },
      error: () => this.isSavingVis.set(false),
    });
  }
}
