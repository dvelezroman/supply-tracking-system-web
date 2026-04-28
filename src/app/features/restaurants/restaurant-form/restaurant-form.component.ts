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
import { MatIconModule } from '@angular/material/icon';
import {
  RestaurantsService,
  type Restaurant,
} from '../services/restaurants.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { SnackbarService } from '../../../core/services/snackbar.service';

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

@Component({
  selector: 'app-restaurant-form',
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
    MatIconModule,
    PageHeaderComponent,
  ],
  templateUrl: './restaurant-form.component.html',
  styleUrl: './restaurant-form.component.scss',
})
export class RestaurantFormComponent implements OnInit {
  @Input() id?: string;

  private fb = inject(FormBuilder);
  private restaurantsService = inject(RestaurantsService);
  private router = inject(Router);
  private snackbar = inject(SnackbarService);
  private transloco = inject(TranslocoService);

  isEditMode = computed(() => !!this.id);
  isLoading = signal(false);
  isSaving = signal(false);
  /** After create: show menu QR for handoff */
  handoff = signal<Restaurant | null>(null);
  /** Loaded restaurant in edit mode (for QR) */
  detail = signal<Restaurant | null>(null);

  form = this.fb.group({
    name: ['', Validators.required],
    slug: [
      '',
      [Validators.required, Validators.pattern(SLUG_REGEX)],
    ],
    location: [''],
    contact: [''],
  });

  ngOnInit(): void {
    if (this.isEditMode()) {
      this.isLoading.set(true);
      this.restaurantsService.getById(this.id!).subscribe({
        next: (res) => {
          this.detail.set(res.data);
          this.form.patchValue({
            name: res.data.name,
            slug: res.data.slug,
            location: res.data.location ?? '',
            contact: res.data.contact ?? '',
          });
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
    }
  }

  menuTracePublicUrl(slug: string): string {
    return `${window.location.origin}/trace/restaurant/${encodeURIComponent(slug)}`;
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.isSaving.set(true);
    const raw = this.form.getRawValue();
    const payload = {
      name: raw.name!,
      slug: raw.slug!,
      location: raw.location || undefined,
      contact: raw.contact || undefined,
    };

    const request$ = this.isEditMode()
      ? this.restaurantsService.update(this.id!, payload)
      : this.restaurantsService.create(payload);

    request$.subscribe({
      next: (res) => {
        this.snackbar.success(
          this.transloco.translate(
            this.isEditMode()
              ? 'form.toast.restaurantUpdated'
              : 'form.toast.restaurantCreated',
          ),
        );
        if (this.isEditMode()) {
          this.detail.set(res.data);
        } else {
          this.handoff.set(res.data);
          this.form.reset();
        }
        this.isSaving.set(false);
      },
      error: () => this.isSaving.set(false),
    });
  }

  onCancel(): void {
    this.router.navigate(['/restaurants']);
  }

  finishHandoff(): void {
    this.router.navigate(['/restaurants']);
  }

  downloadMenuQr(dataUrl: string, slug: string): void {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `menu-qr-${slug}.png`;
    link.click();
  }
}
