import {
  Component,
  computed,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslocoPipe } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';
import { LanguageToggleComponent } from '../../shared/components/language-toggle/language-toggle.component';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { PublicBrandingService } from '../../core/services/public-branding.service';
import {
  buildLotCodeBaseFromLookup,
  harvestMmyyFromParts,
  isCompleteLookupSelection,
  LOT_LOOKUP_PACKAGING_SEGMENTS,
  LOT_LOOKUP_POOL_NUMBERS,
  LOT_LOOKUP_PRESENTATION_SEGMENTS,
  type LotLookupPackagingSegment,
  type LotLookupPresentationSegment,
} from '../../core/lot-code/lot-code-segments';
import { PublicTraceService } from './services/public-trace.service';

@Component({
  selector: 'app-trace-lookup',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    RouterLink,
    TranslocoPipe,
    LanguageToggleComponent,
    ThemeToggleComponent,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './trace-lookup.component.html',
  styleUrl: './trace-lookup.component.scss',
})
export class TraceLookupComponent {
  private router = inject(Router);
  private publicTrace = inject(PublicTraceService);
  protected branding = inject(PublicBrandingService);

  readonly poolNumbers = LOT_LOOKUP_POOL_NUMBERS;
  readonly presentationSegments = LOT_LOOKUP_PRESENTATION_SEGMENTS;
  readonly packagingSegments = LOT_LOOKUP_PACKAGING_SEGMENTS;
  readonly harvestMonths = Array.from({ length: 12 }, (_, i) => i + 1);
  readonly harvestYears = this.buildHarvestYearOptions();

  poolNumber = signal<number | null>(null);
  harvestMonth = signal<number | null>(null);
  harvestYear = signal<number | null>(null);
  presentationSegment = signal<LotLookupPresentationSegment | ''>('');
  packagingSegment = signal<LotLookupPackagingSegment | ''>('');
  /** When several lots share the same base code on different suffixes. */
  matchedLotCodes = signal<string[]>([]);
  selectedLotCode = signal('');
  resolveError = signal(false);
  resolving = signal(false);

  previewLotCode = computed(() => {
    if (!this.selectionComplete()) return '';
    return buildLotCodeBaseFromLookup({
      poolNumber: this.poolNumber()!,
      harvestMmyy: harvestMmyyFromParts(this.harvestMonth()!, this.harvestYear()!),
      presentationSegment: this.presentationSegment() as LotLookupPresentationSegment,
      packagingSegment: this.packagingSegment() as LotLookupPackagingSegment,
    });
  });

  selectionComplete = computed(() =>
    isCompleteLookupSelection({
      poolNumber: this.poolNumber(),
      harvestMonth: this.harvestMonth(),
      harvestYear: this.harvestYear(),
      presentationSegment: this.presentationSegment(),
      packagingSegment: this.packagingSegment(),
    }),
  );

  needsVariantPick = computed(
    () => this.matchedLotCodes().length > 1 && !this.selectedLotCode(),
  );

  canSubmit = computed(
    () =>
      this.selectionComplete() &&
      !this.resolving() &&
      !this.needsVariantPick() &&
      (this.matchedLotCodes().length <= 1 || !!this.selectedLotCode()),
  );

  onSegmentChange(): void {
    this.matchedLotCodes.set([]);
    this.selectedLotCode.set('');
    this.resolveError.set(false);
  }

  async submit(): Promise<void> {
    if (!this.selectionComplete() || this.resolving()) return;

    this.resolving.set(true);
    this.resolveError.set(false);

    const poolNumber = this.poolNumber()!;
    const harvestMmyy = harvestMmyyFromParts(this.harvestMonth()!, this.harvestYear()!);
    const presentationSegment = this.presentationSegment() as LotLookupPresentationSegment;
    const packagingSegment = this.packagingSegment() as LotLookupPackagingSegment;

    try {
      const res = await firstValueFrom(
        this.publicTrace.resolveLotCodes({
          poolNumber,
          harvestMmyy,
          presentationSegment,
          packagingSegment,
        }),
      );
      const codes = res.lotCodes ?? [];
      this.matchedLotCodes.set(codes);

      if (codes.length === 0) {
        this.resolveError.set(true);
        return;
      }

      if (codes.length === 1) {
        await this.router.navigate(['/trace', codes[0]]);
        return;
      }

      const picked = this.selectedLotCode();
      if (picked && codes.includes(picked)) {
        await this.router.navigate(['/trace', picked]);
      }
    } finally {
      this.resolving.set(false);
    }
  }

  useExample(): void {
    this.poolNumber.set(1);
    this.harvestMonth.set(7);
    this.harvestYear.set(2026);
    this.presentationSegment.set('PD');
    this.packagingSegment.set('IQF');
    this.matchedLotCodes.set([]);
    this.selectedLotCode.set('');
    this.resolveError.set(false);
  }

  private buildHarvestYearOptions(): number[] {
    const current = new Date().getFullYear();
    const years: number[] = [];
    for (let y = current - 5; y <= current + 2; y++) {
      years.push(y);
    }
    return years;
  }
}
