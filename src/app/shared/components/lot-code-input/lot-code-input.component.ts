import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  ChangeDetectionStrategy,
  signal,
  computed,
  ElementRef,
  ViewChild,
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
  formatLotCodeAsTyped,
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
        #inputEl
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
        font-family: 'Roboto Mono', ui-monospace, monospace;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        font-size: 1.125rem;
      }
      .valid-icon {
        color: #2e7d32;
      }
    `,
  ],
})
export class LotCodeInputComponent implements ControlValueAccessor {
  @ViewChild('inputEl') private inputEl?: ElementRef<HTMLInputElement>;

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
    this.value.set(v ? formatLotCodeAsTyped(v) : '');
  }

  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  onInput(raw: string): void {
    const el = this.inputEl?.nativeElement;
    const prev = this.value();
    const caretBefore = el?.selectionStart ?? raw.length;

    const formatted = formatLotCodeAsTyped(raw);
    this.value.set(formatted);
    this.onChange(formatted);

    // Keep caret stable relative to alphanumeric chars (ignore auto-inserted hyphens)
    queueMicrotask(() => {
      if (!el) return;
      const alnumBefore = countAlnum(raw.slice(0, caretBefore));
      const nextCaret = caretPosForAlnumIndex(formatted, alnumBefore);
      // If user deleted and string shrank, prefer end of new value
      const pos =
        formatted.length < prev.length && alnumBefore >= countAlnum(formatted)
          ? formatted.length
          : nextCaret;
      el.setSelectionRange(pos, pos);
    });
  }

  onBlur(): void {
    this.touched.set(true);
    this.onTouched();
  }
}

function countAlnum(s: string): number {
  return (s.match(/[A-Z0-9]/gi) ?? []).length;
}

/** Map N alphanumeric chars → caret index in formatted string (after those chars). */
function caretPosForAlnumIndex(formatted: string, alnumIndex: number): number {
  if (alnumIndex <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (/[A-Z0-9]/i.test(formatted[i]!)) {
      seen++;
      if (seen === alnumIndex) {
        return i + 1;
      }
    }
  }
  return formatted.length;
}
