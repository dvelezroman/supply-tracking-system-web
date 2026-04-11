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
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ActorsService } from '../services/actors.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { SnackbarService } from '../../../core/services/snackbar.service';
import type { ActorType } from '../../../core/models/actor.model';

@Component({
  selector: 'app-actor-form',
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
    PageHeaderComponent,
  ],
  templateUrl: './actor-form.component.html',
  styleUrl: './actor-form.component.scss',
})
export class ActorFormComponent implements OnInit {
  @Input() id?: string;

  private fb = inject(FormBuilder);
  private actorsService = inject(ActorsService);
  private router = inject(Router);
  private snackbar = inject(SnackbarService);
  private transloco = inject(TranslocoService);

  isEditMode = computed(() => !!this.id);
  isLoading = signal(false);
  isSaving = signal(false);

  readonly actorTypeKeys: ActorType[] = [
    'SUPPLIER',
    'MANUFACTURER',
    'WAREHOUSE',
    'DISTRIBUTOR',
    'RETAILER',
    'CONSUMER',
    'FARM',
    'LAB',
    'MATURATION',
    'CO_PACKER',
  ];

  form = this.fb.group({
    name: ['', Validators.required],
    type: ['' as ActorType, Validators.required],
    location: [''],
    contact: [''],
  });

  ngOnInit(): void {
    if (this.isEditMode()) {
      this.isLoading.set(true);
      this.actorsService.getById(this.id!).subscribe({
        next: (res) => {
          this.form.patchValue(res.data);
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
      ? this.actorsService.update(this.id!, payload)
      : this.actorsService.create(payload);

    request$.subscribe({
      next: () => {
        this.snackbar.success(
          this.transloco.translate(
            this.isEditMode() ? 'form.toast.actorUpdated' : 'form.toast.actorCreated',
          ),
        );
        this.router.navigate(['/actors']);
      },
      error: () => this.isSaving.set(false),
    });
  }

  onCancel(): void {
    this.router.navigate(['/actors']);
  }
}
