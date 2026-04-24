import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormControl,
  AbstractControl,
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { forkJoin, merge, EMPTY, Subject, of, firstValueFrom } from 'rxjs';
import { debounceTime, switchMap, map, catchError, finalize, take } from 'rxjs/operators';
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
import { MatTooltipModule } from '@angular/material/tooltip';
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
    MatTooltipModule,
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
  /** True while checking lot code uniqueness after leaving the input. */
  lotCodeCheckPending = signal(false);
  /** True while fetching the next suggested code from the API. */
  lotCodeGenerating = signal(false);

  private readonly lotCodeBlur$ = new Subject<void>();

  products = signal<Product[]>([]);
  actors = signal<Actor[]>([]);

  /** Options for each chain role — must match `ActorType` in the API schema. */
  readonly farmActors = computed(() =>
    this.actors().filter((a) => a.type === 'FARM'),
  );
  readonly labActors = computed(() =>
    this.actors().filter((a) => a.type === 'LAB'),
  );
  readonly maturationActors = computed(() =>
    this.actors().filter((a) => a.type === 'MATURATION'),
  );
  readonly coPackerActors = computed(() =>
    this.actors().filter((a) => a.type === 'CO_PACKER'),
  );

  private static readonly LOT_CODE_REGEX =
    /^P\d+-\d{4}-[A-Z]+-[A-Z]+(-[A-Z0-9]+)?$/;

  /** Matches Prisma `@default(uuid())` values — keeps chain IDs aligned with API `@IsUUID()`. */
  private static readonly UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  private static readonly chainIdValidators = [
    Validators.required,
    Validators.pattern(LotFormComponent.UUID_REGEX),
  ];

  readonly presentationValues = ['SHELL_ON', 'BUTTERFLY', 'PD_TAIL_OFF', 'PD_TAIL_ON'] as const;
  readonly packagingValues = ['IQF', 'CAJAS'] as const;
  readonly sizeValues = ['S16_20', 'S21_25', 'S26_30', 'S31_35', 'S36_40', 'S41_50'] as const;
  readonly colorValues = ['A1', 'A2', 'A3', 'A4'] as const;

  certInput = new FormControl('');

  form = this.fb.group({
    lotCode: [
      '',
      [
        Validators.pattern(
          /^($|P\d+-\d{4}-[A-Z]+-[A-Z]+(-[A-Z0-9]+)?)$/,
        ),
      ],
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
    farmId:             ['', LotFormComponent.chainIdValidators],
    labId:              ['', LotFormComponent.chainIdValidators],
    maturationId:       ['', LotFormComponent.chainIdValidators],
    coPackerId:         ['', LotFormComponent.chainIdValidators],
  });

  ngOnInit(): void {
    forkJoin({
      products: this.productsService.getAll(1, 100),
      actors: this.actorsService.getAll(1, 100),
    }).subscribe({
      next: ({ products, actors }) => {
        this.products.set(products.data.items ?? []);
        const items = actors.data.items ?? [];
        this.actors.set(
          items.filter((a): a is Actor => typeof a?.id === 'string' && a.id.length > 0),
        );
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });

    this.form.controls.lotCode.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.form.controls.lotCode.hasError('lotCodeTaken')) {
          this.stripLotCodeTakenError(this.form.controls.lotCode);
        }
      });

    this.lotCodeBlur$
      .pipe(
        switchMap(() => {
          const ctrl = this.form.controls.lotCode;
          ctrl.updateValueAndValidity({ onlySelf: true, emitEvent: false });
          const code = String(ctrl.value ?? '').trim();
          if (!code || !LotFormComponent.LOT_CODE_REGEX.test(code)) {
            this.stripLotCodeTakenError(ctrl);
            return EMPTY;
          }
          this.lotCodeCheckPending.set(true);
          return this.lotsService.getByCode(code).pipe(
            finalize(() => this.lotCodeCheckPending.set(false)),
            map(() => 'taken' as const),
            catchError((err: unknown) => {
              if (err instanceof HttpErrorResponse && err.status === 404) {
                return of('free' as const);
              }
              return of('unknown' as const);
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((status) => {
        if (!status || status === 'unknown') return;
        const ctrl = this.form.controls.lotCode;
        ctrl.updateValueAndValidity({ onlySelf: true, emitEvent: false });
        if (status === 'taken') {
          ctrl.setErrors({ ...ctrl.errors, lotCodeTaken: true });
        } else {
          this.stripLotCodeTakenError(ctrl);
        }
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

  async onSubmit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.isSaving()) return;

    const raw = this.form.getRawValue();
    const lotCodeRaw = String(raw.lotCode ?? '').trim();

    if (lotCodeRaw && LotFormComponent.LOT_CODE_REGEX.test(lotCodeRaw)) {
      this.lotCodeCheckPending.set(true);
      try {
        await firstValueFrom(this.lotsService.getByCode(lotCodeRaw));
        const ctrl = this.form.controls.lotCode;
        ctrl.setErrors({ ...ctrl.errors, lotCodeTaken: true });
        return;
      } catch (e) {
        if (!(e instanceof HttpErrorResponse) || e.status !== 404) {
          return;
        }
      } finally {
        this.lotCodeCheckPending.set(false);
      }
    }

    if (this.form.invalid) return;

    this.isSaving.set(true);

    const harvestDate = (raw.harvestDate as Date).toISOString().split('T')[0];
    const farmId = String(raw.farmId ?? '').trim();
    const labId = String(raw.labId ?? '').trim();
    const maturationId = String(raw.maturationId ?? '').trim();
    const coPackerId = String(raw.coPackerId ?? '').trim();

    const payload: Record<string, unknown> = {
      productId: String(raw.productId ?? '').trim(),
      presentation: raw.presentation,
      packaging: raw.packaging,
      weightKg: Number(raw.weightKg),
      sizeClassification: raw.sizeClassification,
      colorSalmoFan: raw.colorSalmoFan,
      lotSizeLbs: Number(raw.lotSizeLbs),
      harvestDate,
      poolNumber: Number.parseInt(String(raw.poolNumber ?? ''), 10),
      harvestWeightGrams: Number(raw.harvestWeightGrams),
      farmId,
      labId,
      maturationId,
      coPackerId,
      certifications: raw.certifications ?? [],
    };

    const texture = String(raw.texture ?? '').trim();
    if (texture) payload['texture'] = texture;

    const lotCode = String(raw.lotCode ?? '').trim();
    if (lotCode) payload['lotCode'] = lotCode;

    this.lotsService.create(payload).subscribe({
      next: () => {
        this.snackbar.success(this.transloco.translate('form.toast.lotCreated'));
        this.router.navigate(['/lots']);
      },
      error: () => this.isSaving.set(false),
    });
  }

  onLotCodeBlur(): void {
    this.lotCodeBlur$.next();
  }

  /** Next free canonical code for this product / pool / harvest month / presentation / packaging. */
  generateSuggestedLotCode(): void {
    const v = this.form.getRawValue();
    if (
      !v.productId ||
      v.poolNumber == null ||
      !v.harvestDate ||
      !v.presentation ||
      !v.packaging
    ) {
      this.snackbar.error(this.transloco.translate('lots.form.lotCodeGenerateMissingDeps'));
      return;
    }
    this.lotCodeGenerating.set(true);
    const harvest = (v.harvestDate as Date).toISOString().split('T')[0];
    this.lotsService
      .getSuggestedLotCode({
        productId: v.productId,
        poolNumber: v.poolNumber,
        harvestDate: harvest,
        presentation: v.presentation,
        packaging: v.packaging,
      })
      .pipe(take(1), finalize(() => this.lotCodeGenerating.set(false)))
      .subscribe({
        next: (res) => {
          const code = res.data.lotCode;
          const ctrl = this.form.controls.lotCode;
          ctrl.patchValue(code ?? '', { emitEvent: true });
          ctrl.markAsPristine();
          this.stripLotCodeTakenError(ctrl);
        },
        error: () => {
          this.snackbar.error(this.transloco.translate('lots.form.lotCodeGenerateFailed'));
        },
      });
  }

  canSuggestLotCode(): boolean {
    const v = this.form.getRawValue();
    return !!(
      v.productId &&
      v.poolNumber != null &&
      v.harvestDate &&
      v.presentation &&
      v.packaging
    );
  }

  private stripLotCodeTakenError(ctrl: AbstractControl): void {
    const err = ctrl.errors;
    if (!err?.['lotCodeTaken']) return;
    const { lotCodeTaken: _, ...rest } = err;
    ctrl.setErrors(Object.keys(rest).length ? rest : null);
  }

  onCancel(): void {
    this.router.navigate(['/lots']);
  }
}
