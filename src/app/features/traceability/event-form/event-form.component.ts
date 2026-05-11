import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { forkJoin } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { TraceabilityService } from '../services/traceability.service';
import { ProductsService } from '../../products/services/products.service';
import { ActorsService } from '../../actors/services/actors.service';
import { LotsAdminService, type LotSummary } from '../../lots/services/lots.service';
import {
  RestaurantsService,
  type RestaurantListItem,
} from '../../restaurants/services/restaurants.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { SnackbarService } from '../../../core/services/snackbar.service';
import {
  TRACEABILITY_FILTER_EVENT_TYPES,
  type EventType,
  type TraceabilityEvent,
  type UpdateEventPayload,
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
    MatProgressBarModule,
    MatChipsModule,
    PageHeaderComponent,
    DecimalPipe,
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
  private restaurantsService = inject(RestaurantsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackbar = inject(SnackbarService);
  private transloco = inject(TranslocoService);

  products = signal<Product[]>([]);
  actors = signal<Actor[]>([]);
  lotsForProduct = signal<LotSummary[]>([]);
  restaurants = signal<RestaurantListItem[]>([]);
  isSaving = signal(false);
  isContextual = signal(false);
  contextualLot = signal<LotSummary | null>(null);
  /** Edit mode: loaded event (banner + PATCH). */
  editEvent = signal<TraceabilityEvent | null>(null);
  editEventId = signal<string | null>(null);
  /** False until initial data is ready (edit mode waits for GET event). */
  isPageReady = signal(true);
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
    /** Local datetime for edit — maps to `timestamp` on save */
    eventAt: [''],
    /** kg entregados en esta línea (opcional; alternativa o complemento a cajas) */
    deliveredWeightKg: [''],
    /** Optional `metadata.restaurantId` for DELIVERED → menu trace scoping */
    restaurantId: [''],
  });

  ngOnInit(): void {
    const qp = this.route.snapshot.queryParamMap;
    const lotIdQp = qp.get('lotId');
    const ru = qp.get('returnUrl');
    if (ru && ru.startsWith('/') && !ru.startsWith('//')) {
      this.returnUrl.set(ru);
    }

    const path = this.route.snapshot.routeConfig?.path ?? '';
    const eventId =
      path === 'events/:eventId/edit' ? this.route.snapshot.paramMap.get('eventId') : null;

    if (eventId) {
      this.editEventId.set(eventId);
      this.isContextual.set(true);
      this.isPageReady.set(false);
      this.form.get('coldProductId')?.clearValidators();
      this.form.get('coldLotId')?.clearValidators();
      forkJoin({
        products: this.productsService.getAll(1, 100),
        actors: this.actorsService.getAll(1, 100),
        ev: this.traceabilityService.getEventById(eventId),
      }).subscribe({
        next: ({ products, actors, ev }) => {
          this.products.set(products.data.items ?? []);
          this.actors.set(actors.data.items ?? []);
          this.editEvent.set(ev.data);
          this.patchFormFromEvent(ev.data);
          this.isPageReady.set(true);
        },
        error: () => {
          this.snackbar.error(this.transloco.translate('traceability.editLoadError'));
          void this.router.navigateByUrl(this.backRoute());
        },
      });
    } else if (lotIdQp) {
      this.isContextual.set(true);
      this.form.get('coldProductId')?.clearValidators();
      this.form.get('coldLotId')?.clearValidators();
      this.lotsService.getById(lotIdQp).subscribe({
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

    if (!eventId) {
      this.productsService.getAll(1, 100).subscribe((res) => this.products.set(res.data.items));
      this.actorsService.getAll(1, 100).subscribe((res) => this.actors.set(res.data.items));
    }

    this.restaurantsService.getAll(1, 500).subscribe({
      next: (res) => this.restaurants.set(res.data.items),
      error: () => this.restaurants.set([]),
    });

    this.form.get('coldProductId')?.valueChanges.subscribe((pid) => {
      this.form.patchValue({ coldLotId: '' }, { emitEvent: false });
      if (!pid) {
        this.lotsForProduct.set([]);
        return;
      }
      this.lotsService.getAll({ productId: pid, page: 1, limit: 100 }).subscribe({
        next: (res) => this.lotsForProduct.set(res.data.items),
        error: () => this.lotsForProduct.set([]),
      });
    });
  }

  resolvedLotId(): string | null {
    if (this.editEventId()) return null;
    if (this.isContextual()) {
      return this.contextualLot()?.id ?? this.route.snapshot.queryParamMap.get('lotId');
    }
    const id = this.form.get('coldLotId')?.value;
    return id?.trim() || null;
  }

  onSubmit(): void {
    if (this.editEventId()) {
      this.form.markAllAsTouched();
      if (this.form.invalid) return;
      const raw = this.form.getRawValue();
      if (this.deliverPayloadInvalid(raw)) {
        this.snackbar.error(
          this.transloco.translate('traceability.recordForm.deliveredRequiresQtyOrWeight'),
        );
        return;
      }
      const metadata = this.buildMetadata(
        raw.boxCount ?? '',
        raw.consumerChannel ?? '',
        raw.deliveredWeightKg ?? '',
        raw.restaurantId ?? '',
      );
      const payload: UpdateEventPayload = {
        actorId: raw.actorId as string,
        eventType: raw.eventType as EventType,
        location: raw.location?.trim() || undefined,
        notes: raw.notes?.trim() || undefined,
        metadata,
      };
      const eventAt = String(raw.eventAt ?? '').trim();
      if (eventAt) {
        payload.timestamp = new Date(eventAt).toISOString();
      }
      this.isSaving.set(true);
      this.traceabilityService.updateEvent(this.editEventId()!, payload).subscribe({
        next: () => {
          this.snackbar.success(this.transloco.translate('form.toast.eventUpdated'));
          void this.router.navigateByUrl(this.backRoute());
        },
        error: () => this.isSaving.set(false),
      });
      return;
    }

    const lotId = this.resolvedLotId();
    if (!lotId) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.form.invalid) return;

    const raw = this.form.getRawValue();
    if (this.deliverPayloadInvalid(raw)) {
      this.snackbar.error(
        this.transloco.translate('traceability.recordForm.deliveredRequiresQtyOrWeight'),
      );
      return;
    }
    const metadata = this.buildMetadata(
      raw.boxCount ?? '',
      raw.consumerChannel ?? '',
      raw.deliveredWeightKg ?? '',
      raw.restaurantId ?? '',
    );
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

  private patchFormFromEvent(e: TraceabilityEvent): void {
    let boxCount = '';
    let consumerChannel = '';
    let deliveredWeightKg = '';
    let restaurantId = '';
    const meta = e.metadata;
    if (meta && typeof meta === 'object') {
      if (meta['quantity'] != null) boxCount = String(meta['quantity']);
      if (typeof meta['channel'] === 'string') consumerChannel = meta['channel'];
      if (meta['deliveredWeightKg'] != null) deliveredWeightKg = String(meta['deliveredWeightKg']);
      if (typeof meta['restaurantId'] === 'string') restaurantId = meta['restaurantId'];
    }
    const d = new Date(e.timestamp);
    const pad = (n: number) => String(n).padStart(2, '0');
    const eventAt = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

    this.form.patchValue({
      actorId: e.actorId,
      eventType: e.eventType,
      location: e.location ?? '',
      notes: e.notes ?? '',
      boxCount,
      consumerChannel,
      deliveredWeightKg,
      restaurantId,
      eventAt,
    });
  }

  private buildMetadata(
    boxCount: string,
    consumerChannel: string,
    deliveredWeightKg: string,
    restaurantId: string,
  ): Record<string, unknown> | undefined {
    const m: Record<string, unknown> = {};
    const n = String(boxCount ?? '').trim();
    if (n !== '' && !Number.isNaN(Number(n)) && Number(n) > 0) {
      m['quantity'] = Number(n);
      m['unit'] = 'cajas';
    }
    const w = String(deliveredWeightKg ?? '').trim();
    if (w !== '' && !Number.isNaN(Number(w)) && Number(w) > 0) {
      m['deliveredWeightKg'] = Number(w);
    }
    const ch = String(consumerChannel ?? '').trim();
    if (ch) m['channel'] = ch;
    const rid = String(restaurantId ?? '').trim();
    if (rid) m['restaurantId'] = rid;
    return Object.keys(m).length ? m : undefined;
  }

  private deliverPayloadInvalid(raw: {
    eventType: EventType | string | null;
    boxCount?: string | null;
    deliveredWeightKg?: string | null;
  }): boolean {
    if (raw.eventType !== 'DELIVERED') return false;
    const bc = String(raw.boxCount ?? '').trim();
    const dw = String(raw.deliveredWeightKg ?? '').trim();
    const hasBox = bc !== '' && !Number.isNaN(Number(bc)) && Number(bc) > 0;
    const hasW = dw !== '' && !Number.isNaN(Number(dw)) && Number(dw) > 0;
    return !hasBox && !hasW;
  }

  onCancel(): void {
    void this.router.navigateByUrl(this.backRoute());
  }
}
