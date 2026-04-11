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

  isEditMode = computed(() => !!this.id);
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
  });

  ngOnInit(): void {
    if (this.isEditMode()) {
      this.isLoading.set(true);
      this.productsService.getById(this.id!).subscribe({
        next: (res) => {
          this.form.patchValue(res.data);
          this.form.controls.sku.disable();
          this.vis.set(resolvePublicVisibility(res.data.publicVisibilityDefaults));
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.isSaving.set(true);
    const payload = this.form.getRawValue() as any;

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
