import {
  Component,
  Input,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router } from '@angular/router';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { UsersService } from '../services/users.service';
import { ActorsService } from '../../actors/services/actors.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { SnackbarService } from '../../../core/services/snackbar.service';
import type {
  AdminUpdateUserPayload,
  UserRole,
} from '../../../core/models/auth.model';
import type { Actor } from '../../../core/models/actor.model';

@Component({
  selector: 'app-user-form',
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
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss',
})
export class UserFormComponent implements OnInit {
  @Input() id?: string;

  private fb = inject(FormBuilder);
  private usersService = inject(UsersService);
  private actorsService = inject(ActorsService);
  private router = inject(Router);
  private snackbar = inject(SnackbarService);
  private transloco = inject(TranslocoService);

  isEditMode = computed(() => !!this.id);
  isLoading = signal(false);
  isSaving = signal(false);
  actors = signal<Actor[]>([]);

  readonly roleKeys: UserRole[] = ['ADMIN', 'ACTOR', 'VIEWER'];

  form = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', (c: AbstractControl) => this.validatePassword(c)],
    role: ['VIEWER' as UserRole, Validators.required],
    actorId: ['' as string],
  });

  /** Uses `this.id` at validate time (after route input is set), not at form construction. */
  private validatePassword(control: AbstractControl): ValidationErrors | null {
    const v = control.value;
    const edit = !!this.id;
    if (!edit && (!v || String(v).length < 6)) {
      return v ? { minlength: true } : { required: true };
    }
    if (v && String(v).length > 0 && String(v).length < 6) {
      return { minlength: true };
    }
    return null;
  }

  ngOnInit(): void {
    this.actorsService.getAll(1, 500).subscribe({
      next: (res) => this.actors.set(res.data.items),
    });

    if (this.isEditMode()) {
      this.isLoading.set(true);
      this.usersService.getById(this.id!).subscribe({
        next: (res) => {
          const u = res.data;
          this.form.patchValue({
            name: u.name,
            email: u.email,
            password: '',
            role: u.role,
            actorId: u.actorId ?? '',
          });
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.isSaving.set(true);
    const v = this.form.getRawValue() as {
      name: string;
      email: string;
      password: string;
      role: UserRole;
      actorId: string;
    };

    if (this.isEditMode()) {
      const payload: AdminUpdateUserPayload = {
        email: v.email,
        name: v.name,
        role: v.role,
        actorId: v.actorId ? v.actorId : null,
      };
      if (v.password && String(v.password).trim().length > 0) {
        payload.password = v.password.trim();
      }
      this.usersService.update(this.id!, payload).subscribe({
        next: () => {
          this.snackbar.success(
            this.transloco.translate('form.toast.userUpdated'),
          );
          this.router.navigate(['/users']);
        },
        error: () => this.isSaving.set(false),
      });
    } else {
      this.usersService
        .create({
          email: v.email,
          password: v.password,
          name: v.name,
          role: v.role,
          ...(v.actorId ? { actorId: v.actorId } : {}),
        })
        .subscribe({
          next: () => {
            this.snackbar.success(
              this.transloco.translate('form.toast.userCreated'),
            );
            this.router.navigate(['/users']);
          },
          error: () => this.isSaving.set(false),
        });
    }
  }

  onCancel(): void {
    this.router.navigate(['/users']);
  }
}
