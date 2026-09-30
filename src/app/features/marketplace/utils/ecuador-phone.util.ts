/**
 * Ecuador WhatsApp phone: +593 + 9 national digits starting with 9.
 * Example: +593995710556
 * Trunk 0 (09…) is stripped — never +5930…
 */

export const ECUADOR_DIAL = '593';
export const ECUADOR_DIAL_DISPLAY = '+593';

/** National mobile: 9 digits, starts with 9. */
const NATIONAL_RE = /^9\d{8}$/;

/**
 * Extract Ecuador national mobile digits from any common input shape.
 * Returns '' when empty; may return partial while typing.
 */
export function ecuadorNationalDigits(raw: string | null | undefined): string {
  if (raw == null) return '';
  let digits = String(raw).replace(/\D/g, '');
  if (digits.startsWith(ECUADOR_DIAL)) {
    digits = digits.slice(ECUADOR_DIAL.length);
  }
  digits = digits.replace(/^0+/, '');
  return digits.slice(0, 9);
}

/**
 * Normalize to WhatsApp E.164 for Ecuador only: +5939XXXXXXXX
 * Accepts: 0995710556, 995710556, +593995710556, 593995710556
 */
export function toEcuadorWhatsappE164(
  raw: string | null | undefined,
): string | null {
  if (raw == null) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;
  const national = ecuadorNationalDigits(trimmed);
  if (!NATIONAL_RE.test(national)) return null;
  return `${ECUADOR_DIAL_DISPLAY}${national}`;
}

export function isValidEcuadorWhatsappPhone(
  raw: string | null | undefined,
): boolean {
  return toEcuadorWhatsappE164(raw) !== null;
}
