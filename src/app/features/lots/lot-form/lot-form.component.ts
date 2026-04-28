import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  DestroyRef,
  afterNextRender,
  Injector,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormControl,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { forkJoin, merge, EMPTY, Subject, of, firstValueFrom } from 'rxjs';
import {
  debounceTime,
  switchMap,
  map,
  catchError,
  finalize,
  take,
  filter,
} from 'rxjs/operators';
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
import { LotsAdminService, type LotSummary } from '../services/lots.service';
import { ProductsService } from '../../products/services/products.service';
import { ActorsService } from '../../actors/services/actors.service';
import type { Product } from '../../../core/models/product.model';
import type { Actor, ActorType } from '../../../core/models/actor.model';

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
  private route = inject(ActivatedRoute);
  private snackbar = inject(SnackbarService);
  private transloco = inject(TranslocoService);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  private injector = inject(Injector);

  isLoading = signal(true);
  isSaving = signal(false);
  /** True while checking lot code uniqueness after leaving the input. */
  lotCodeCheckPending = signal(false);
  /** True while fetching the next suggested code from the API. */
  lotCodeGenerating = signal(false);

  /** Set when route is `lots/:id/edit`. */
  editLotId = signal<string | null>(null);

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

  /** Hide mat-error while the overlay is open (avoids red state while the panel is animating / focusing). */
  farmChainPanelOpen = signal(false);
  labChainPanelOpen = signal(false);
  maturationChainPanelOpen = signal(false);
  coPackerChainPanelOpen = signal(false);

  private static readonly LOT_CODE_REGEX =
    /^P\d+-\d{4}-[A-Z]+-[A-Z]+(-[A-Z0-9]+)?$/;

  /**
   * Chain slots: valid when the value matches an option id for that role (UUID or seed ids like
   * `seed-farm-001`). Anything else is rejected — aligns with API opaque Actor.id strings.
   */
  private validateChainActor(
    control: AbstractControl,
    allowedIds: () => readonly string[],
  ): ValidationErrors | null {
    const raw = control.value;
    if (raw == null) return { required: true };
    const s = LotFormComponent.normalizeChainIdStr(raw);
    if (s === '') return { required: true };
    if (allowedIds().includes(s)) {
      if (typeof raw !== 'string' || raw.trim() !== s) {
        control.setValue(s, { emitEvent: false });
      }
      return null;
    }
    return { pattern: true };
  }

  private chainValidator(allowedIds: () => readonly string[]): ValidatorFn {
    return (control) => this.validateChainActor(control, allowedIds);
  }

  /** Single string UUID for form model + API — never persist objects in chain controls. */
  private static normalizeChainIdStr(value: unknown): string {
    if (value == null) return '';
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'object' && 'id' in (value as object)) {
      return String((value as { id: unknown }).id ?? '').trim();
    }
    return String(value).trim();
  }

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
    farmId: ['', this.chainValidator(() => this.farmActors().map((a) => a.id))],
    labId: ['', this.chainValidator(() => this.labActors().map((a) => a.id))],
    maturationId: ['', this.chainValidator(() => this.maturationActors().map((a) => a.id))],
    coPackerId: ['', this.chainValidator(() => this.coPackerActors().map((a) => a.id))],
  });

  ngOnInit(): void {
    const path = this.route.snapshot.routeConfig?.path ?? '';
    const editId = path === ':id/edit' ? this.route.snapshot.paramMap.get('id') : null;
    if (path === ':id/edit' && !editId) {
      void this.router.navigate(['/lots']);
      return;
    }
    if (editId) this.editLotId.set(editId);

    // OnPush: `canSubmit()` reads form validity — re-render when values/validation change.
    merge(this.form.valueChanges, this.form.statusChanges)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cdr.markForCheck());

    forkJoin({
      products: this.productsService.getAll(1, 100),
      actors: this.actorsService.getAll(1, 500),
    })
      .pipe(
        switchMap(({ products, actors }) => {
          if (!editId) {
            return of({ products, actors, lot: null as LotSummary | null });
          }
          return this.lotsService.getById(editId).pipe(
            map((res) => ({ products, actors, lot: res.data })),
            catchError(() => {
              this.isLoading.set(false);
              this.snackbar.error(this.transloco.translate('lots.editLoadError'));
              void this.router.navigate(['/lots']);
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ products, actors, lot }) => {
          this.products.set(products.data.items ?? []);
          const items = actors.data.items ?? [];
          this.actors.set(
            items.filter((a): a is Actor => typeof a?.id === 'string' && a.id.length > 0),
          );
          if (lot) {
            // Lot may reference a product outside `getAll(1, 100)` — without merging, mat-select has no
            // option and Material can leave the control invalid / empty while other fields still show errors.
            this.syncProductFromLot(lot);
            // Ensure each chain UUID exists with the role type expected by farm/lab/maturation/coPacker
            // filters (fixes MatSelect clearing when actor was missing from page 1 or had wrong type).
            this.syncChainActorsFromLot(lot);
            this.patchFormFromLot(lot);
            // Immutable in edit: disable + drop validators so the group `valid` state follows only
            // editable fields (disabled + required/pattern can keep `form.invalid` true otherwise).
            this.form.controls.productId.clearValidators();
            this.form.controls.lotCode.clearValidators();
            this.form.controls.productId.disable({ emitEvent: false });
            this.form.controls.lotCode.disable({ emitEvent: false });
            this.form.controls.productId.updateValueAndValidity({ emitEvent: false });
            this.form.controls.lotCode.updateValueAndValidity({ emitEvent: false });
            this.form.updateValueAndValidity({ emitEvent: false });
            // #region agent log
            this.agentDebugLotFormSnapshot(
              'afterDisableSync_beforeAfterNextRenderChain',
              'H1-formAggregate-H2-chainBeforeRepatch-H4-numericTypes',
            );
            // #endregion
            this.cdr.markForCheck();
          }
          this.isLoading.set(false);
          if (lot) {
            this.scheduleChainIdsSyncAfterView(lot);
          }
        },
        error: () => this.isLoading.set(false),
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
        filter(() => !this.editLotId()),
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
        filter(() => !this.editLotId()),
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

  /** Save button + edit submit — only enabled controls (lotCode/productId are disabled in edit). */
  enabledControlsValid(): boolean {
    for (const key of Object.keys(this.form.controls)) {
      const c = this.form.get(key);
      if (!c || c.disabled) continue;
      if (c.invalid) return false;
    }
    return true;
  }

  canSubmit(): boolean {
    if (this.isSaving() || this.lotCodeCheckPending() || this.lotCodeGenerating()) return false;
    if (this.editLotId()) return this.enabledControlsValid();
    return !this.form.invalid;
  }

  async onSubmit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.isSaving()) return;

    if (this.editLotId()) {
      if (!this.enabledControlsValid()) return;
      const id = this.editLotId()!;
      this.isSaving.set(true);
      const raw = this.form.getRawValue();
      const harvestDate = (raw.harvestDate as Date).toISOString().split('T')[0];
      const payload: Record<string, unknown> = {
        presentation: raw.presentation,
        packaging: raw.packaging,
        weightKg: Number(raw.weightKg),
        sizeClassification: raw.sizeClassification,
        colorSalmoFan: raw.colorSalmoFan,
        lotSizeLbs: Number(raw.lotSizeLbs),
        harvestDate,
        poolNumber: Number.parseInt(String(raw.poolNumber ?? ''), 10),
        harvestWeightGrams: Number(raw.harvestWeightGrams),
        farmId: String(raw.farmId ?? '').trim(),
        labId: String(raw.labId ?? '').trim(),
        maturationId: String(raw.maturationId ?? '').trim(),
        coPackerId: String(raw.coPackerId ?? '').trim(),
        certifications: raw.certifications ?? [],
      };
      const texture = String(raw.texture ?? '').trim();
      if (texture) payload['texture'] = texture;

      this.lotsService.update(id, payload).subscribe({
        next: () => {
          this.snackbar.success(this.transloco.translate('form.toast.lotUpdated'));
          void this.router.navigate(['/lots', id]);
        },
        error: () => this.isSaving.set(false),
      });
      return;
    }

    if (this.form.invalid) return;

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
    const eid = this.editLotId();
    void this.router.navigate(eid ? ['/lots', eid] : ['/lots']);
  }

  /** Mat-select option vs model — normalize so compare matches trimmed UUID strings (and odd edge values). */
  compareUuid = (a: unknown, b: unknown): boolean => {
    const na = LotFormComponent.normalizeChainIdStr(a);
    const nb = LotFormComponent.normalizeChainIdStr(b);
    return na !== '' && nb !== '' && na === nb;
  };

  /** Ensures the lot's product row exists in `products()` so the mat-select can resolve the model in edit. */
  private syncProductFromLot(lot: LotSummary): void {
    const p = lot.product;
    const hadInPage = this.products().some((x) => x.id === p.id);
    this.products.update((prev) => {
      if (prev.some((x) => x.id === p.id)) return prev;
      const merged: Product = {
        id: p.id,
        sku: p.sku,
        name: p.name,
        category: p.category ?? undefined,
        createdAt: '',
        updatedAt: '',
      };
      return [...prev, merged];
    });
    // #region agent log
    if (!hadInPage) {
      fetch('http://127.0.0.1:7779/ingest/7c365fce-9057-4b97-a540-9427650e1349', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'cb0df7' },
        body: JSON.stringify({
          sessionId: 'cb0df7',
          location: 'lot-form.component.ts:syncProductFromLot',
          message: 'merged lot product into options (was missing from getAll page)',
          hypothesisId: 'P1-productNotInFirst100',
          data: { productId: p.id, runId: 'post-fix' },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
    }
    // #endregion
  }

  /**
   * Merges farm/lab/maturation/co-packer from the lot into `actors()` with the **correct
   * ActorType** for each slot. Otherwise mat-select lists (filtered by type) miss an ID and
   * Material clears the control → `chainIdInvalid` on all chain fields.
   */
  private syncChainActorsFromLot(lot: LotSummary): void {
    const slots: { embed: LotSummary['farm']; type: ActorType }[] = [
      { embed: lot.farm, type: 'FARM' },
      { embed: lot.lab, type: 'LAB' },
      { embed: lot.maturation, type: 'MATURATION' },
      { embed: lot.coPacker, type: 'CO_PACKER' },
    ];

    this.actors.update((prev) => {
      const byId = new Map<string, Actor>();
      for (const a of prev) {
        byId.set(a.id, { ...a });
      }
      for (const { embed, type } of slots) {
        const existing = byId.get(embed.id);
        const merged: Actor = {
          id: embed.id,
          name: embed.name,
          type,
          location: embed.location ?? undefined,
          contact: existing?.contact,
          metadata: existing?.metadata,
          createdAt: existing?.createdAt ?? '',
          updatedAt: existing?.updatedAt ?? '',
        };
        byId.set(embed.id, merged);
      }
      return Array.from(byId.values());
    });
  }

  /**
   * Mat-select applies the bound value only when `mat-option` children exist (`_assignValue` checks
   * `this.options`). We load data while `@if (isLoading)` hides the form, so the first `patchValue`
   * can "miss"; `afterNextRender` runs after the form (and options) mount so IDs sync and validators see UUID strings.
   */
  private scheduleChainIdsSyncAfterView(lot: LotSummary): void {
    afterNextRender(
      () => {
        const ids = {
          farmId: LotFormComponent.normalizeChainIdStr(lot.farm.id),
          labId: LotFormComponent.normalizeChainIdStr(lot.lab.id),
          maturationId: LotFormComponent.normalizeChainIdStr(lot.maturation.id),
          coPackerId: LotFormComponent.normalizeChainIdStr(lot.coPacker.id),
        };
        this.form.patchValue(ids, { emitEvent: true });
        for (const key of ['farmId', 'labId', 'maturationId', 'coPackerId'] as const) {
          this.form.controls[key].updateValueAndValidity({ emitEvent: false });
        }
        // #region agent log
        this.agentDebugLotFormSnapshot(
          'afterNextRender_chainIdsSynced',
          'H3-timing-H4-numericAfterRepatch-H5-enabledValid',
        );
        // #endregion
        this.cdr.markForCheck();
      },
      { injector: this.injector },
    );
  }

  // #region agent log
  /** Debug-mode NDJSON ingest: captures reactive form state while investigating edit-lot validation UI. */
  private agentDebugLotFormSnapshot(phase: string, hypothesisId: string): void {
    const ctrlSnap = (name: string) => {
      const c = this.form.get(name);
      if (!c) return null;
      let v: unknown = c.value;
      if (v instanceof Date) v = v.toISOString();
      return {
        disabled: c.disabled,
        value: v,
        errors: c.errors,
        status: c.status,
        touched: c.touched,
      };
    };
    const data = {
      phase,
      form: {
        valid: this.form.valid,
        invalid: this.form.invalid,
        status: this.form.status,
      },
      enabledControlsValid: this.enabledControlsValid(),
      farmId: ctrlSnap('farmId'),
      labId: ctrlSnap('labId'),
      maturationId: ctrlSnap('maturationId'),
      coPackerId: ctrlSnap('coPackerId'),
      productId: ctrlSnap('productId'),
      lotCode: ctrlSnap('lotCode'),
      weightKg: ctrlSnap('weightKg'),
      lotSizeLbs: ctrlSnap('lotSizeLbs'),
      poolNumber: ctrlSnap('poolNumber'),
      harvestWeightGrams: ctrlSnap('harvestWeightGrams'),
      harvestDate: ctrlSnap('harvestDate'),
      presentation: ctrlSnap('presentation'),
      packaging: ctrlSnap('packaging'),
    };
    fetch('http://127.0.0.1:7779/ingest/7c365fce-9057-4b97-a540-9427650e1349', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'cb0df7' },
      body: JSON.stringify({
        sessionId: 'cb0df7',
        location: 'lot-form.component.ts:agentDebugLotFormSnapshot',
        message: phase,
        hypothesisId,
        data,
        timestamp: Date.now(),
        runId: 'lot-edit-debug-v1',
      }),
    }).catch(() => {});
  }
  // #endregion

  private patchFormFromLot(lot: LotSummary): void {
    this.form.patchValue({
      lotCode: lot.lotCode,
      productId: lot.product.id,
      presentation: lot.presentation,
      packaging: lot.packaging,
      weightKg: lot.weightKg,
      sizeClassification: lot.sizeClassification,
      colorSalmoFan: lot.colorSalmoFan,
      texture: lot.texture ?? '',
      certifications: lot.certifications ?? [],
      lotSizeLbs: lot.lotSizeLbs,
      harvestDate: new Date(lot.harvestDate),
      poolNumber: lot.poolNumber,
      harvestWeightGrams: lot.harvestWeightGrams,
      farmId: LotFormComponent.normalizeChainIdStr(lot.farm.id),
      labId: LotFormComponent.normalizeChainIdStr(lot.lab.id),
      maturationId: LotFormComponent.normalizeChainIdStr(lot.maturation.id),
      coPackerId: LotFormComponent.normalizeChainIdStr(lot.coPacker.id),
    });
  }
}
