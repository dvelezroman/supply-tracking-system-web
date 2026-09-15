import { environment } from '../../../../environments/environment';

function marketplaceMediaProxyUrl(
  imageId: string,
  apiBase: string = environment.apiBase,
): string {
  return `${apiBase.replace(/\/$/, '')}/marketplace/media/${imageId}`;
}

/** Private S3 objects must not load in the browser (403). */
function isAwsS3HttpUrl(url: string): boolean {
  try {
    const host = new URL(url.trim()).hostname.toLowerCase();
    return (
      /\.s3(?:[.-][a-z0-9-]+)?\.amazonaws\.com$/i.test(host) ||
      host === 's3.amazonaws.com'
    );
  } catch {
    return false;
  }
}

/**
 * S3-owned images always load via the API media proxy (private bucket).
 * External URLs load directly unless they point at S3 (e.g. pasted bucket URL).
 */
export function marketplaceProductImageSrc(
  image: { id: string; url?: string | null; key?: string },
  apiBase: string = environment.apiBase,
): string {
  const key = image.key?.trim() ?? '';
  const url = image.url?.trim() ?? '';

  if (key.startsWith('external:')) {
    const direct = url || key.slice('external:'.length).trim();
    if (/^https?:\/\//i.test(direct) && !isAwsS3HttpUrl(direct)) {
      return direct;
    }
  } else if (url && /^https?:\/\//i.test(url) && !isAwsS3HttpUrl(url)) {
    return url;
  }

  return marketplaceMediaProxyUrl(image.id, apiBase);
}

export function primaryMarketplaceImageSrc(
  images: Array<{
    id: string;
    url?: string | null;
    key?: string;
    isPrimary?: boolean;
  }>,
  apiBase: string = environment.apiBase,
): string | null {
  if (!images?.length) return null;
  const primary = images.find((i) => i.isPrimary) ?? images[0];
  return marketplaceProductImageSrc(primary, apiBase);
}
