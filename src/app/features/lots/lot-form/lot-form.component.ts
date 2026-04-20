import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormControl,
  AsyncValidatorFn,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { forkJoin, merge, EMPTY, Observable, of, timer } from 'rxjs';
import { debounceTime, switchMap, map, catchError } from 'rxjs/operators';
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
  private destroyRef = inject(DestroyRef);

  isLoading = signal(true);
  isSaving = signal(false);

  products = signal<Product[]>([]);
  actors = signal<Actor[]>([]);

  private static readonly LOT_CODE_REGEX =
    /^P\d+-\d{4}-[A-Z]+-[A-Z]+(-[A-Z0-9]+)?$/;

  readonly presentationValues = ['SHELL_ON', 'BUTTERFLY', 'PD_TAIL_OFF', 'PD_TAIL_ON'] as const;
  readonly packagingValues = ['IQF', 'CAJAS'] as const;
  readonly sizeValues = ['S16_20', 'S21_25', 'S26_30', 'S31_35', 'S36_40', 'S41_50'] as const;
  readonly colorValues = ['A1', 'A2', 'A3', 'A4'] as const;

  certInput = new FormControl('');

  private readonly lotCodeAvailabilityValidator: AsyncValidatorFn = (
    control: AbstractControl,
  ): Observable<ValidationErrors | null> =>
    timer(400).pipe(
      switchMap(() => {
        const code = String(control.value ?? '').trim();
        if (!code) return of(null);
        if (!LotFormComponent.LOT_CODE_REGEX.test(code)) return of(null);
        return this.lotsService.getByCode(code).pipe(
          map(() => ({ lotCodeTaken: true })),
          catchError((err: unknown) => {
            if (err instanceof HttpErrorResponse && err.status === 404) return of(null);
            return of(null);
          }),
        );
      }),
    );

  form = this.fb.group({
    lotCode: [
      '',
      [
        Validators.pattern(
          /^($|P\d+-\d{4}-[A-Z]+-[A-Z]+(-[A-Z0-9]+)?)$/,
        ),
      ],
      [this.lotCodeAvailabilityValidator],
    ],
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

    merge(
      this.form.controls.productId.valueChanges,
      this.form.controls.poolNumber.valueChanges,
      this.form.controls.harvestDate.valueChanges,
      this.form.controls.presentation.valueChanges,
      this.form.controls.packaging.valueChanges,
    )
      .pipe(
        debounceTime(400),
        switchMap(() => {
          const v = this.form.getRawValue();
          if (
            !v.productId ||
            v.poolNumber == null ||
            !v.harvestDate ||
            !v.presentation ||
            !v.packaging
          ) {
            return EMPTY;
          }
          const harvest = (v.harvestDate as Date).toISOString().split('T')[0];
          return this.lotsService.getSuggestedLotCode({
            productId: v.productId,
            poolNumber: v.poolNumber,
            harvestDate: harvest,
            presentation: v.presentation,
            packaging: v.packaging,
          });
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (res) => {
          const code = res.data.lotCode;
          if (!code) return;
          const ctrl = this.form.controls.lotCode;
          if (!ctrl.dirty || !String(ctrl.value ?? '').trim()) {
            ctrl.patchValue(code, { emitEvent: false });
            ctrl.markAsPristine();
          }
        },
        error: () => {
          /* keep field as-is; user can type manually */
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
    const payload: Record<string, unknown> = {
      ...raw,
      harvestDate: (raw.harvestDate as Date).toISOString().split('T')[0],
      certifications: raw.certifications ?? [],
    };
    const lotCode = String(payload['lotCode'] ?? '').trim();
    if (lotCode) payload['lotCode'] = lotCode;
    else delete payload['lotCode'];

    this.lotsService.create(payload).subscribe({
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
