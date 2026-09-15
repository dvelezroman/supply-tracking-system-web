import { environment } from '../../../../environments/environment';

/**
 * Resolve display URL for a marketplace product image.
 * When `url` is empty (private S3 / no CDN), fall back to the API media proxy.
 */
export function marketplaceProductImageSrc(
  image: { id: string; url?: string | null },
  apiBase: string = environment.apiBase,
): string {
  const direct = image.url?.trim();
  if (direct) return direct;
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
