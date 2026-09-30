/** Exclusive IVA helper (mirrors API payphone-amounts.util). */
export const DEFAULT_TAX_RATE_BPS = 1500;

export function taxCentsFromSubtotalExclusive(
  subtotalCents: number,
  rateBps: number = DEFAULT_TAX_RATE_BPS,
): number {
  const base = Math.max(0, Math.floor(Number(subtotalCents)) || 0);
  const bps = Math.max(0, Math.floor(Number(rateBps)) || 0);
  if (base === 0 || bps === 0) return 0;
  return Math.round((base * bps) / 10000);
}

export function totalWithExclusiveTax(
  subtotalCents: number,
  rateBps: number = DEFAULT_TAX_RATE_BPS,
): number {
  return (
    Math.max(0, Math.floor(Number(subtotalCents)) || 0) +
    taxCentsFromSubtotalExclusive(subtotalCents, rateBps)
  );
}
