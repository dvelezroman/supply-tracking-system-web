import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  ChangeDetectionStrategy,
  signal,
  computed,
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  FormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe } from '@jsverse/transloco';
import {
  isValidLotCode,
  normalizeLotCodeInput,
} from '../../../core/validators/lot-code.validator';

@Component({
  selector: 'app-lot-code-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    TranslocoPipe,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => LotCodeInputComponent),
      multi: true,
    },
  ],
  template: `
    <mat-form-field appearance="outline" class="lot-code-field">
      <mat-label>{{ labelKey | transloco }}</mat-label>
      <input
        matInput
        [id]="inputId"
        [attr.aria-describedby]="hintId"
        [placeholder]="placeholderKey | transloco"
        [ngModel]="displayValue()"
        (ngModelChange)="onInput($event)"
        (blur)="onBlur()"
        (keydown.enter)="enterPressed.emit()"
        autocomplete="off"
        spellcheck="false"
        autocapitalize="characters"
        inputmode="text"
      />
      <mat-icon matPrefix>tag</mat-icon>
      @if (showValidIcon() && isValid()) {
        <mat-icon matSuffix class="valid-icon">check_circle</mat-icon>
      }
      <mat-hint [id]="hintId">{{ hintKey | transloco }}</mat-hint>
      @if (touched() && value() && !isValid()) {
        <mat-error>{{ invalidKey | transloco }}</mat-error>
      }
    </mat-form-field>
  `,
  styles: [
    `
      .lot-code-field {
        width: 100%;
      }
      input {
        font-family: 'Roboto Mono', monospace;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      .valid-icon {
        color: #2e7d32;
      }
    `,
  ],
})
export class LotCodeInputComponent implements ControlValueAccessor {
  @Input() inputId = 'lot-code-input';
  @Input() hintId = 'lot-code-hint';
  @Input() labelKey = 'traceLookup.lotCodeLabel';
  @Input() placeholderKey = 'traceLookup.lotCodePlaceholder';
  @Input() hintKey = 'traceLookup.lotCodeHint';
  @Input() invalidKey = 'traceLookup.lotCodeInvalid';

  @Output() enterPressed = new EventEmitter<void>();

  readonly value = signal('');
  readonly touched = signal(false);
  readonly displayValue = computed(() => this.value());

  showValidIcon = () => this.touched() || this.value().length > 0;

  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  isValid(): boolean {
    return isValidLotCode(this.value());
  }

  writeValue(v: string | null): void {
    this.value.set(v ?? '');
  }

  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  onInput(raw: string): void {
    const normalized = normalizeLotCodeInput(raw);
    this.value.set(normalized);
    this.onChange(normalized);
  }

  onBlur(): void {
    this.touched.set(true);
    this.onTouched();
  }
}
