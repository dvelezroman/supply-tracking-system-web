import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormControl,
} from '@angular/forms';
import { Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { forkJoin } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { LotsAdminService } from '../services/lots.service';
import { ProductsService } from '../../products/services/products.service';
import { ActorsService } from '../../actors/services/actors.service';
import type { Product } from '../../../core/models/product.model';
import type { Actor } from '../../../core/models/actor.model';

@Component({
  selector: 'app-lot-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TranslocoPipe,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatChipsModule,
    MatIconModule,
    PageHeaderComponent,
  ],
  templateUrl: './lot-form.component.html',
  styleUrl: './lot-form.component.scss',
})
export class LotFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private lotsService = inject(LotsAdminService);
  private productsService = inject(ProductsService);
  private actorsService = inject(ActorsService);
  private router = inject(Router);
  private snackbar = inject(SnackbarService);
  private transloco = inject(TranslocoService);

  isLoading = signal(true);
  isSaving = signal(false);

  products = signal<Product[]>([]);
  actors = signal<Actor[]>([]);

  readonly presentationValues = ['SHELL_ON', 'BUTTERFLY', 'PD_TAIL_OFF', 'PD_TAIL_ON'] as const;
  readonly packagingValues = ['IQF', 'CAJAS'] as const;
  readonly sizeValues = ['S16_20', 'S21_25', 'S26_30', 'S31_35', 'S36_40', 'S41_50'] as const;
  readonly colorValues = ['A1', 'A2', 'A3', 'A4'] as const;

  certInput = new FormControl('');

  form = this.fb.group({
    lotCode:            ['', [Validators.required, Validators.pattern(/^P\d+-\d{4}-[A-Z]+-[A-Z]+(-[A-Z0-9]+)?$/)]],
    productId:          ['', Validators.required],
    presentation:       ['', Validators.required],
    packaging:          ['', Validators.required],
    weightKg:           [null as number | null, [Validators.required, Validators.min(0.01)]],
    sizeClassification: ['', Validators.required],
    colorSalmoFan:      ['', Validators.required],
    texture:            [''],
    certifications:     [[] as string[]],
    lotSizeLbs:         [null as number | null, [Validators.required, Validators.min(0.01)]],
    harvestDate:        [null as Date | null, Validators.required],
    poolNumber:         [null as number | null, [Validators.required, Validators.min(1)]],
    harvestWeightGrams: [null as number | null, [Validators.required, Validators.min(0.01)]],
    farmId:             ['', Validators.required],
    labId:              ['', Validators.required],
    maturationId:       ['', Validators.required],
    coPackerId:         ['', Validators.required],
  });

  ngOnInit(): void {
    forkJoin({
      products: this.productsService.getAll(1, 100),
      actors: this.actorsService.getAll(1, 100),
    }).subscribe({
      next: ({ products, actors }) => {
        this.products.set(products.data.items);
        this.actors.set(actors.data.items);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  addCertification(): void {
    const val = this.certInput.value?.trim();
    if (!val) return;
    const current = this.form.controls.certifications.value ?? [];
    if (!current.includes(val)) {
      this.form.controls.certifications.setValue([...current, val]);
    }
    this.certInput.setValue('');
  }

  removeCertification(cert: string): void {
    const current = this.form.controls.certifications.value ?? [];
    this.form.controls.certifications.setValue(current.filter((c) => c !== cert));
  }

  onCertKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addCertification();
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.isSaving.set(true);

    const raw = this.form.getRawValue();
    const payload = {
      ...raw,
      harvestDate: (raw.harvestDate as Date).toISOString().split('T')[0],
      certifications: raw.certifications ?? [],
    };

    this.lotsService.create(payload as any).subscribe({
      next: () => {
        this.snackbar.success(this.transloco.translate('form.toast.lotCreated'));
        this.router.navigate(['/lots']);
      },
      error: () => this.isSaving.set(false),
    });
  }

  onCancel(): void {
    this.router.navigate(['/lots']);
  }
}
