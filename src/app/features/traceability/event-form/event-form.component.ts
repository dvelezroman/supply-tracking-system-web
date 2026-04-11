import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TraceabilityService } from '../services/traceability.service';
import { ProductsService } from '../../products/services/products.service';
import { ActorsService } from '../../actors/services/actors.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { EVENT_TYPE_LABELS, type EventType } from '../../../core/models/traceability.model';
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
  private router = inject(Router);
  private snackbar = inject(SnackbarService);
  private transloco = inject(TranslocoService);

  products = signal<Product[]>([]);
  actors = signal<Actor[]>([]);
  isSaving = signal(false);

  readonly eventTypeKeys = Object.keys(EVENT_TYPE_LABELS) as EventType[];

  form = this.fb.group({
    productId: ['', Validators.required],
    actorId: ['', Validators.required],
    eventType: ['' as EventType, Validators.required],
    location: [''],
    notes: [''],
  });

  ngOnInit(): void {
    this.productsService.getAll(1, 100).subscribe((res) =>
      this.products.set(res.data.items)
    );
    this.actorsService.getAll(1, 100).subscribe((res) =>
      this.actors.set(res.data.items)
    );
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.isSaving.set(true);

    this.traceabilityService
      .createEvent(this.form.getRawValue() as any)
      .subscribe({
        next: () => {
          this.snackbar.success(this.transloco.translate('form.toast.eventRecorded'));
          this.router.navigate(['/traceability']);
        },
        error: () => this.isSaving.set(false),
      });
  }

  onCancel(): void {
    this.router.navigate(['/traceability']);
  }
}
