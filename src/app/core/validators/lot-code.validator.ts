/** Canonical lot code: P{pool}-{MMYY}-{presentation}-{packaging}[-suffix] */
export const LOT_CODE_REGEX = /^P\d+-\d{4}-[A-Z]+-[A-Z]+(-[A-Z0-9]+)?$/;

/** Presentations are 2 letters (SO, BF, PD, PT); packaging is 3 (IQF, CBX). */
const PRESENTATION_LEN = 2;
const PACKAGING_LEN = 3;
/** Minimum digits after P: 1 pool + 4 MMYY */
const MIN_DIGITS_FOR_SPLIT = 5;

/**
 * Formats as user types: only letters/digits matter; hyphens inserted automatically.
 *
 * Examples while typing:
 *   P1 → P1
 *   P10726 → P1-0726
 *   P10726PD → P1-0726-PD
 *   P10726PDIQF → P1-0726-PD-IQF
 *   P10726PDIQF01 → P1-0726-PD-IQF-01
 *   P1-0726-PD-IQF (paste) → P1-0726-PD-IQF
 */
export function formatLotCodeAsTyped(raw: string): string {
  const alnum = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!alnum) return '';

  if (!alnum.startsWith('P')) {
    return alnum;
  }

  const afterP = alnum.slice(1);
  const digitMatch = afterP.match(/^(\d*)(.*)$/);
  const digits = digitMatch?.[1] ?? '';
  const afterDigits = digitMatch?.[2] ?? '';

  if (digits.length < MIN_DIGITS_FOR_SPLIT) {
    if (!afterDigits) {
      return `P${digits}`;
    }
    // Letters early: keep digits as-is, still insert segment hyphens
    return appendLetterSegments(`P${digits}`, afterDigits);
  }

  const mmyy = digits.slice(-4);
  const pool = digits.slice(0, -4);
  const base = `P${pool}-${mmyy}`;

  if (!afterDigits) {
    return base;
  }

  return appendLetterSegments(base, afterDigits);
}

function appendLetterSegments(base: string, afterDigits: string): string {
  const presentation = afterDigits.slice(0, Math.min(PRESENTATION_LEN, afterDigits.length));
  const afterPres = afterDigits.slice(presentation.length);

  if (!afterPres) {
    return `${base}-${presentation}`;
  }

  const packaging = afterPres.slice(0, Math.min(PACKAGING_LEN, afterPres.length));
  const suffix = afterPres.slice(PACKAGING_LEN);

  let out = `${base}-${presentation}-${packaging}`;
  if (suffix) {
    out += `-${suffix}`;
  }
  return out;
}

/** Normalize pasted or typed input into canonical lot code segments. */
export function normalizeLotCodeInput(raw: string): string {
  return formatLotCodeAsTyped(raw);
}

export function isValidLotCode(value: string): boolean {
  return LOT_CODE_REGEX.test(formatLotCodeAsTyped(value));
}
