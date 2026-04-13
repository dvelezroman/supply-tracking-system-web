import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { TraceabilityService } from '../services/traceability.service';
import { ProductsService } from '../../products/services/products.service';
import { ActorsService } from '../../actors/services/actors.service';
import { LotsAdminService, type LotSummary } from '../../lots/services/lots.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { SnackbarService } from '../../../core/services/snackbar.service';
import {
  TRACEABILITY_FILTER_EVENT_TYPES,
  type EventType,
} from '../../../core/models/traceability.model';
import type { Product } from '../../../core/models/product.model';
import type { Actor } from '../../../core/models/actor.model';

@Component({
  selector: 'app-event-form',
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
    MatProgressSpinnerModule,
    MatChipsModule,
    PageHeaderComponent,
  ],
  templateUrl: './event-form.component.html',
  styleUrl: './event-form.component.scss',
})
export class EventFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private traceabilityService = inject(TraceabilityService);
  private productsService = inject(ProductsService);
  private actorsService = inject(ActorsService);
  private lotsService = inject(LotsAdminService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackbar = inject(SnackbarService);
  private transloco = inject(TranslocoService);

  products = signal<Product[]>([]);
  actors = signal<Actor[]>([]);
  lotsForProduct = signal<LotSummary[]>([]);
  isSaving = signal(false);
  isContextual = signal(false);
  contextualLot = signal<LotSummary | null>(null);
  private returnUrl = signal<string | null>(null);

  readonly eventTypeOptions = TRACEABILITY_FILTER_EVENT_TYPES;
  readonly backRoute = computed(() => this.returnUrl() ?? '/traceability');

  form = this.fb.group({
    coldProductId: [''],
    coldLotId: [''],
    actorId: ['', Validators.required],
    eventType: ['' as EventType, Validators.required],
    location: [''],
    notes: [''],
    boxCount: [''],
    consumerChannel: [''],
  });

  ngOnInit(): void {
    const qp = this.route.snapshot.queryParamMap;
    const lotId = qp.get('lotId');
    const ru = qp.get('returnUrl');
    if (ru && ru.startsWith('/') && !ru.startsWith('//')) {
      this.returnUrl.set(ru);
    }

    if (lotId) {
      this.isContextual.set(true);
      this.form.get('coldProductId')?.clearValidators();
      this.form.get('coldLotId')?.clearValidators();
      this.lotsService.getById(lotId).subscribe({
        next: (res) => {
          this.contextualLot.set(res.data);
        },
        error: () => {
          this.snackbar.error(this.transloco.translate('traceability.recordForm.lotLoadError'));
          void this.router.navigateByUrl(this.backRoute());
        },
      });
    } else {
      this.form.get('coldProductId')?.setValidators(Validators.required);
      this.form.get('coldLotId')?.setValidators(Validators.required);
    }
    this.form.get('coldProductId')?.updateValueAndValidity({ emitEvent: false });
    this.form.get('coldLotId')?.updateValueAndValidity({ emitEvent: false });

    this.productsService.getAll(1, 100).subscribe((res) => this.products.set(res.data.items));
    this.actorsService.getAll(1, 100).subscribe((res) => this.actors.set(res.data.items));

    this.form.get('coldProductId')?.valueChanges.subscribe((pid) => {
      this.form.patchValue({ coldLotId: '' }, { emitEvent: false });
      if (!pid) {
        this.lotsForProduct.set([]);
        return;
      }
      this.lotsService.getAll({ productId: pid, page: 1, limit: 200 }).subscribe({
        next: (res) => this.lotsForProduct.set(res.data.items),
        error: () => this.lotsForProduct.set([]),
      });
    });
  }

  resolvedLotId(): string | null {
    if (this.isContextual()) {
      return this.contextualLot()?.id ?? this.route.snapshot.queryParamMap.get('lotId');
    }
    const id = this.form.get('coldLotId')?.value;
    return id?.trim() || null;
  }

  onSubmit(): void {
    const lotId = this.resolvedLotId();
    if (!lotId) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.form.invalid) return;

    const raw = this.form.getRawValue();
    const metadata = this.buildMetadata(raw.boxCount ?? '', raw.consumerChannel ?? '');
    this.isSaving.set(true);
    this.traceabilityService
      .createEvent({
        lotId,
        actorId: raw.actorId as string,
        eventType: raw.eventType as EventType,
        location: raw.location?.trim() || undefined,
        notes: raw.notes?.trim() || undefined,
        metadata,
      })
      .subscribe({
        next: () => {
          this.snackbar.success(this.transloco.translate('form.toast.eventRecorded'));
          void this.router.navigateByUrl(this.backRoute());
        },
        error: () => this.isSaving.set(false),
      });
  }

  private buildMetadata(
    boxCount: string,
    consumerChannel: string,
  ): Record<string, unknown> | undefined {
    const m: Record<string, unknown> = {};
    const n = String(boxCount ?? '').trim();
    if (n !== '' && !Number.isNaN(Number(n))) {
      m['quantity'] = Number(n);
      m['unit'] = 'cajas';
    }
    const ch = String(consumerChannel ?? '').trim();
    if (ch) m['channel'] = ch;
    return Object.keys(m).length ? m : undefined;
  }

  onCancel(): void {
    void this.router.navigateByUrl(this.backRoute());
  }
}
