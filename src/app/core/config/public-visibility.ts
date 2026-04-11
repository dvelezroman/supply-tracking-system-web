/** Must match `PUBLIC_VISIBILITY_KEYS` in the API. */
export const PUBLIC_VISIBILITY_KEYS = [
  'showProductName',
  'showProductSku',
  'showProductCategory',
  'showPresentation',
  'showPackaging',
  'showWeightKg',
  'showSizeClassification',
  'showColorSalmoFan',
  'showTexture',
  'showCertifications',
  'showLotSizeLbs',
  'showLotCode',
  'showHarvestDate',
  'showPoolNumber',
  'showHarvestWeightGrams',
  'showFarmName',
  'showFarmLocation',
  'showParticipantLab',
  'showParticipantMaturation',
  'showParticipantCoPacker',
  'showTraceTimeline',
  'showEventLocation',
  'showEventNotes',
  'showEventActorType',
  'showEventMetadata',
  'showPublicQrBlock',
] as const;

export type PublicVisibilityKey = (typeof PUBLIC_VISIBILITY_KEYS)[number];

export const DEFAULT_PUBLIC_VISIBILITY: Record<PublicVisibilityKey, boolean> =
  PUBLIC_VISIBILITY_KEYS.reduce(
    (acc, k) => {
      acc[k] = true;
      return acc;
    },
    {} as Record<PublicVisibilityKey, boolean>,
  );

export function resolvePublicVisibility(
  stored: unknown,
): Record<PublicVisibilityKey, boolean> {
  if (!stored || typeof stored !== 'object' || Array.isArray(stored)) {
    return { ...DEFAULT_PUBLIC_VISIBILITY };
  }
  const o = stored as Record<string, boolean>;
  const out = { ...DEFAULT_PUBLIC_VISIBILITY };
  for (const k of PUBLIC_VISIBILITY_KEYS) {
    if (typeof o[k] === 'boolean') out[k] = o[k];
  }
  return out;
}

/** UI rows — label keys under `publicVisibility.fields.*` in i18n */
export const PUBLIC_VISIBILITY_FIELD_META: {
  key: PublicVisibilityKey;
  labelKey: string;
}[] = PUBLIC_VISIBILITY_KEYS.map((key) => ({
  key,
  labelKey: `publicVisibility.fields.${key}`,
}));
