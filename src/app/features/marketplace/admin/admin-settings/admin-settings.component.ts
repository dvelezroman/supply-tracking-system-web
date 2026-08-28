import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { MarketplaceAdminApiService } from '../../services/marketplace-api.service';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TranslocoPipe,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatProgressBarModule,
    PageHeaderComponent,
  ],
  templateUrl: './admin-settings.component.html',
  styleUrl: './admin-settings.component.scss',
})
export class AdminSettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(MarketplaceAdminApiService);
  private snackbar = inject(SnackbarService);
  private transloco = inject(TranslocoService);

  isLoading = signal(false);
  isSaving = signal(false);

  form = this.fb.group({
    orderNotificationEmail: ['', [Validators.email]],
    storeEnabled: [true],
    fromName: [''],
  });

  ngOnInit(): void {
    this.isLoading.set(true);
    this.api.getSettings().subscribe({
      next: (res) => {
        this.form.patchValue({
          orderNotificationEmail: res.data.orderNotificationEmail ?? '',
          storeEnabled: res.data.storeEnabled,
          fromName: res.data.fromName ?? '',
        });
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.isSaving.set(true);
    const raw = this.form.getRawValue();
    this.api
      .updateSettings({
        orderNotificationEmail: raw.orderNotificationEmail?.trim() || null,
        storeEnabled: !!raw.storeEnabled,
        fromName: raw.fromName?.trim() || null,
      })
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.snackbar.success(
            this.transloco.translate('marketplace.admin.settingsSaved'),
          );
        },
        error: () => this.isSaving.set(false),
      });
  }
}
