/** Presentation segment codes printed on packaging labels (matches API lot-code.generator). */
export const LOT_LOOKUP_PRESENTATION_SEGMENTS = ['SO', 'BF', 'PD', 'PT'] as const;
export type LotLookupPresentationSegment = (typeof LOT_LOOKUP_PRESENTATION_SEGMENTS)[number];

/** Packaging segment codes on labels (CAJAS → CBX). */
export const LOT_LOOKUP_PACKAGING_SEGMENTS = ['IQF', 'CBX'] as const;
export type LotLookupPackagingSegment = (typeof LOT_LOOKUP_PACKAGING_SEGMENTS)[number];

export const LOT_LOOKUP_POOL_NUMBERS = Array.from({ length: 20 }, (_, i) => i + 1);

/** Build `P{pool}-{MMYY}-{PRE}-{PKG}` from label segments. */
export function buildLotCodeBaseFromLookup(params: {
  poolNumber: number;
  harvestMmyy: string;
  presentationSegment: LotLookupPresentationSegment;
  packagingSegment: LotLookupPackagingSegment;
}): string {
  const mmyy = params.harvestMmyy.trim();
  return `P${params.poolNumber}-${mmyy}-${params.presentationSegment}-${params.packagingSegment}`;
}

export function harvestMmyyFromParts(month: number, year: number): string {
  const mm = String(month).padStart(2, '0');
  const yy = String(year).slice(-2);
  return `${mm}${yy}`;
}

export function isCompleteLookupSelection(params: {
  poolNumber: number | null;
  harvestMonth: number | null;
  harvestYear: number | null;
  presentationSegment: LotLookupPresentationSegment | '';
  packagingSegment: LotLookupPackagingSegment | '';
}): boolean {
  return (
    params.poolNumber != null &&
    params.poolNumber >= 1 &&
    params.harvestMonth != null &&
    params.harvestMonth >= 1 &&
    params.harvestMonth <= 12 &&
    params.harvestYear != null &&
    params.presentationSegment !== '' &&
    params.packagingSegment !== ''
  );
}
