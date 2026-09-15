import { environment } from '../../../../environments/environment';

/** Product images always load via the public API media proxy (never direct S3/CDN). */
export function marketplaceProductImageSrc(
  image: { id: string; url?: string | null },
  apiBase: string = environment.apiBase,
): string {
  return `${apiBase.replace(/\/$/, '')}/marketplace/media/${image.id}`;
}

export function primaryMarketplaceImageSrc(
  images: Array<{ id: string; url?: string | null; isPrimary?: boolean }>,
  apiBase: string = environment.apiBase,
): string | null {
  if (!images?.length) return null;
  const primary = images.find((i) => i.isPrimary) ?? images[0];
  return marketplaceProductImageSrc(primary, apiBase);
}
