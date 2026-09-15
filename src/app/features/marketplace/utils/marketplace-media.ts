import { environment } from '../../../../environments/environment';

/**
 * Stored S3 objects without a public base URL use the API media proxy.
 * External URLs (and S3 when `url` is set) load directly from `url`.
 */
export function marketplaceProductImageSrc(
  image: { id: string; url?: string | null; key?: string },
  apiBase: string = environment.apiBase,
): string {
  const direct = image.url?.trim();
  if (direct && /^https?:\/\//i.test(direct)) {
    return direct;
  }
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
