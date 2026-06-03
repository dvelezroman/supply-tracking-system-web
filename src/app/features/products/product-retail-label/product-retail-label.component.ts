import {
  Component,
  Input,
  OnChanges,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { ProductsService } from '../services/products.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { AuthService } from '../../auth/services/auth.service';
import type { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-product-retail-label',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    TranslocoPipe,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
  ],
  template: `
    <mat-card class="retail-card">
      <mat-card-header>
        <mat-icon mat-card-avatar>local_offer</mat-icon>
        <mat-card-title>{{ 'products.retailLabel.title' | transloco }}</mat-card-title>
        <mat-card-subtitle>{{ 'products.retailLabel.subtitle' | transloco }}</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <p class="retail-hint">{{ 'products.retailLabel.lotsHint' | transloco }}</p>

        @if (auth.isAdmin()) {
          <div class="retail-form">
            <mat-form-field appearance="outline" class="full">
              <mat-label>{{ 'products.retailLabel.labelTitle' | transloco }}</mat-label>
              <input matInput [(ngModel)]="labelTitle" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full">
              <mat-label>{{ 'products.retailLabel.gtin' | transloco }}</mat-label>
              <input matInput [(ngModel)]="labelGtin13" maxlength="13" />
            </mat-form-field>
            <div class="row">
              <mat-form-field appearance="outline">
                <mat-label>{{ 'products.retailLabel.oz' | transloco }}</mat-label>
                <input matInput type="number" [(ngModel)]="labelNetWeightOz" min="0" step="0.1" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>{{ 'products.retailLabel.lbs' | transloco }}</mat-label>
                <input matInput type="number" [(ngModel)]="labelNetWeightLbs" min="0" step="0.01" />
              </mat-form-field>
            </div>
            <mat-form-field appearance="outline" class="full">
              <mat-label>{{ 'products.retailLabel.arcsa' | transloco }}</mat-label>
              <input matInput [(ngModel)]="labelSanitaryArcsa" />
            </mat-form-field>
            <button mat-flat-button color="primary" (click)="save()" [disabled]="saving()">
              {{ 'products.retailLabel.save' | transloco }}
            </button>
          </div>
        } @else {
          <dl class="retail-readonly">
            <dt>{{ 'products.retailLabel.labelTitle' | transloco }}</dt>
            <dd>{{ product.labelTitle ?? '—' }}</dd>
            <dt>{{ 'products.retailLabel.gtin' | transloco }}</dt>
            <dd><code>{{ product.labelGtin13 ?? '—' }}</code></dd>
            <dt>{{ 'products.retailLabel.netWeight' | transloco }}</dt>
            <dd>
              @if (product.labelNetWeightOz != null && product.labelNetWeightLbs != null) {
                {{ product.labelNetWeightOz }} oz / {{ product.labelNetWeightLbs }} lbs
              } @else {
                —
              }
            </dd>
            <dt>{{ 'products.retailLabel.arcsa' | transloco }}</dt>
            <dd>{{ product.labelSanitaryArcsa ?? '—' }}</dd>
          </dl>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .retail-hint {
      color: var(--mat-sys-on-surface-variant, #666);
      font-size: 0.875rem;
      margin: 0 0 16px;
    }
    .retail-form {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .full { width: 100%; }
    .row {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    .row mat-form-field { flex: 1; min-width: 120px; }
    .retail-readonly {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 8px 16px;
      margin: 0;
    }
    .retail-readonly dt { font-weight: 600; }
    .retail-readonly dd { margin: 0; }
  `],
})
export class ProductRetailLabelComponent implements OnChanges {
  @Input({ required: true }) product!: Product;

  private productsService = inject(ProductsService);
  private snackbar = inject(SnackbarService);
  private transloco = inject(TranslocoService);
  readonly auth = inject(AuthService);

  saving = signal(false);

  labelTitle = '';
  labelGtin13 = '';
  labelNetWeightOz: number | null = null;
  labelNetWeightLbs: number | null = null;
  labelSanitaryArcsa = '';

  ngOnChanges(): void {
    this.syncFromProduct();
  }

  private syncFromProduct(): void {
    this.labelTitle = this.product.labelTitle ?? '';
    this.labelGtin13 = this.product.labelGtin13 ?? '';
    this.labelNetWeightOz = this.product.labelNetWeightOz ?? null;
    this.labelNetWeightLbs = this.product.labelNetWeightLbs ?? null;
    this.labelSanitaryArcsa = this.product.labelSanitaryArcsa ?? '';
  }

  save(): void {
    if (!this.auth.isAdmin()) return;
    this.saving.set(true);
    this.productsService
      .patchRetailLabel(this.product.id, {
        labelTitle: this.labelTitle.trim() || null,
        labelGtin13: this.labelGtin13.trim() || null,
        labelNetWeightOz: this.labelNetWeightOz,
        labelNetWeightLbs: this.labelNetWeightLbs,
        labelSanitaryArcsa: this.labelSanitaryArcsa.trim() || null,
      })
      .subscribe({
        next: (res) => {
          Object.assign(this.product, res.data);
          this.syncFromProduct();
          this.saving.set(false);
          this.snackbar.success(this.transloco.translate('products.retailLabel.saveSuccess'));
        },
        error: () => this.saving.set(false),
      });
  }
}
