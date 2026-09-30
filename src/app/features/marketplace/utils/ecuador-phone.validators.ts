import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import {
  ecuadorNationalDigits,
  isValidEcuadorWhatsappPhone,
  toEcuadorWhatsappE164,
} from './ecuador-phone.util';

/** Validator: Ecuador WhatsApp (+593 + 9 digits starting with 9). */
export function ecuadorWhatsappPhoneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const v = control.value;
    if (v == null || String(v).trim() === '') {
      return null; // use Validators.required separately
    }
    return isValidEcuadorWhatsappPhone(String(v))
      ? null
      : { ecuadorPhone: true };
  };
}

export { ecuadorNationalDigits, toEcuadorWhatsappE164 };
