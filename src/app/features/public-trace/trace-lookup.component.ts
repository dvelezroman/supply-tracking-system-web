import {
  Component,
  AfterViewInit,
  ViewChild,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe } from '@jsverse/transloco';
import { LanguageToggleComponent } from '../../shared/components/language-toggle/language-toggle.component';
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component';
import { PublicBrandingService } from '../../core/services/public-branding.service';
import { LotCodeInputComponent } from '../../shared/components/lot-code-input/lot-code-input.component';
import { isValidLotCode } from '../../core/validators/lot-code.validator';

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
    LotCodeInputComponent,
  ],
  templateUrl: './trace-lookup.component.html',
  styleUrl: './trace-lookup.component.scss',
})
export class TraceLookupComponent implements AfterViewInit {
  private router = inject(Router);
  protected branding = inject(PublicBrandingService);

  @ViewChild(LotCodeInputComponent) lotCodeInput?: LotCodeInputComponent;

  lotCode = signal('');

  ngAfterViewInit(): void {
    setTimeout(() => {
      const el = document.getElementById('lot-code-input');
      el?.focus();
    }, 100);
  }

  onLotCodeChange(code: string): void {
    this.lotCode.set(code);
  }

  canSubmit(): boolean {
    return isValidLotCode(this.lotCode());
  }

  submit(): void {
    const code = this.lotCode().trim();
    if (!isValidLotCode(code)) return;
    void this.router.navigate(['/trace', code]);
  }

  useExample(code: string): void {
    this.lotCode.set(code);
    this.lotCodeInput?.writeValue(code);
  }
}
