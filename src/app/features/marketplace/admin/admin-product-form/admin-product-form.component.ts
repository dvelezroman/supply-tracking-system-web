import {
  Component,
  Input,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { MarketplaceAdminApiService } from '../../services/marketplace-api.service';
import type { MarketplaceProductImage } from '../../models/marketplace.model';

@Component({
  selector: 'app-admin-product-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    RouterLink,
    TranslocoPipe,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatSlideToggleModule,
    MatIconModule,
    MatTooltipModule,
    PageHeaderComponent,
  ],
  templateUrl: './admin-product-form.component.html',
  styleUrl: './admin-product-form.component.scss',
})
export class AdminProductFormComponent implements OnInit {
  @Input() id?: string;

  private fb = inject(FormBuilder);
  private api = inject(MarketplaceAdminApiService);
  private router = inject(Router);
  private snackbar = inject(SnackbarService);
  private transloco = inject(TranslocoService);

  isEditMode = computed(() => !!this.id);
  isLoading = signal(false);
  isSaving = signal(false);
  isUploading = signal(false);
  images = signal<MarketplaceProductImage[]>([]);
  imageUrlInput = signal('');

  form = this.fb.group({
    sku: ['', Validators.required],
    slug: [''],
    name: ['', Validators.required],
    description: [''],
    category: [''],
    price: [0, [Validators.required, Validators.min(0)]],
    stockQty: [0, [Validators.required, Validators.min(0)]],
    published: [false],
    traceProductId: [''],
  });

  ngOnInit(): void {
    if (this.isEditMode()) {
      this.isLoading.set(true);
      this.api.getProduct(this.id!).subscribe({
        next: (res) => {
          const p = res.data;
          this.form.patchValue({
            sku: p.sku,
            slug: p.slug,
            name: p.name,
            description: p.description ?? '',
            category: p.category ?? '',
            price: p.priceCents / 100,
            stockQty: p.stockQty,
            published: p.published,
            traceProductId: p.traceProductId ?? '',
          });
          this.images.set(p.images ?? []);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.isSaving.set(true);
    const raw = this.form.getRawValue();
    const payload = {
      sku: raw.sku!.trim(),
      slug: raw.slug?.trim() || undefined,
      name: raw.name!.trim(),
      description: raw.description?.trim() || undefined,
      category: raw.category?.trim() || undefined,
      priceCents: Math.round(Number(raw.price) * 100),
      stockQty: Number(raw.stockQty) || 0,
      published: !!raw.published,
      traceProductId: raw.traceProductId?.trim() || undefined,
    };

    const req$ = this.isEditMode()
      ? this.api.updateProduct(this.id!, {
          ...payload,
          traceProductId: raw.traceProductId?.trim() || null,
        })
      : this.api.createProduct(payload);

    req$.subscribe({
      next: (res) => {
        this.snackbar.success(
          this.transloco.translate(
            this.isEditMode()
              ? 'marketplace.admin.productUpdated'
              : 'marketplace.admin.productCreated',
          ),
        );
        if (!this.isEditMode()) {
          this.router.navigate(['/marketplace/products', res.data.id]);
        } else {
          this.isSaving.set(false);
        }
      },
      error: () => this.isSaving.set(false),
    });
  }

  onFileSelected(ev: Event): void {
    if (!this.id) return;
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.isUploading.set(true);
    this.api.uploadImage(this.id, file, this.images().length === 0).subscribe({
      next: (res) => {
        this.images.update((imgs) => [...imgs, res.data]);
        this.isUploading.set(false);
        input.value = '';
        this.snackbar.success(
          this.transloco.translate('marketplace.admin.imageUploaded'),
        );
      },
      error: () => {
        this.isUploading.set(false);
        input.value = '';
      },
    });
  }

  addImageByUrl(): void {
    if (!this.id) return;
    const url = this.imageUrlInput().trim();
    if (!url) return;
    this.isUploading.set(true);
    this.api.addImageByUrl(this.id, url, this.images().length === 0).subscribe({
      next: (res) => {
        this.images.update((imgs) => [...imgs, res.data]);
        this.imageUrlInput.set('');
        this.isUploading.set(false);
        this.snackbar.success(
          this.transloco.translate('marketplace.admin.imageUrlAdded'),
        );
      },
      error: () => this.isUploading.set(false),
    });
  }

  setPrimary(imageId: string): void {
    if (!this.id) return;
    this.api.setPrimaryImage(this.id, imageId).subscribe({
      next: (res) => this.images.set(res.data.images),
    });
  }

  removeImage(imageId: string): void {
    if (!this.id) return;
    this.api.deleteImage(this.id, imageId).subscribe({
      next: () =>
        this.images.update((imgs) => imgs.filter((i) => i.id !== imageId)),
    });
  }
}
