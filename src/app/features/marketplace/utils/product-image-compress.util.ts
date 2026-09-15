/** Matches API `PRODUCT_IMAGE_MAX_BYTES` — uploads stay under nginx limits. */
export const MARKETPLACE_PRODUCT_IMAGE_MAX_BYTES = 512 * 1024;

/** Longest edge after resize (catalog photos). */
export const MARKETPLACE_PRODUCT_IMAGE_MAX_DIMENSION = 1920;

const JPEG_MIME = 'image/jpeg';

function fitDimensions(
  width: number,
  height: number,
  maxDim: number,
): { w: number; h: number } {
  if (width <= maxDim && height <= maxDim) {
    return { w: width, h: height };
  }
  const ratio = Math.min(maxDim / width, maxDim / height);
  return {
    w: Math.max(1, Math.round(width * ratio)),
    h: Math.max(1, Math.round(height * ratio)),
  };
}

function canvasToJpegBlob(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error('Image encoding failed')),
      JPEG_MIME,
      quality,
    );
  });
}

function fileBaseName(name: string): string {
  const trimmed = name.trim() || 'product-image';
  const dot = trimmed.lastIndexOf('.');
  return dot > 0 ? trimmed.slice(0, dot) : trimmed;
}

async function loadBitmap(file: File): Promise<ImageBitmap> {
  return createImageBitmap(file);
}

async function encodeJpegUnderLimit(
  bitmap: ImageBitmap,
  maxBytes: number,
  maxDimension: number,
): Promise<Blob> {
  const srcW = bitmap.width;
  const srcH = bitmap.height;
  let edgeCap = maxDimension;

  while (edgeCap >= 320) {
    const { w, h } = fitDimensions(srcW, srcH, edgeCap);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas not available');
    }
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);

    for (let quality = 0.88; quality >= 0.42; quality -= 0.06) {
      const blob = await canvasToJpegBlob(canvas, quality);
      if (blob.size <= maxBytes) {
        return blob;
      }
    }
    edgeCap = Math.floor(edgeCap * 0.82);
  }

  throw new Error('Image could not be compressed under 512 KB');
}

/**
 * Resizes and re-encodes product photos before upload (target ≤512 KB JPEG).
 * Files already within the limit are returned unchanged.
 */
export async function compressProductImageForUpload(
  file: File,
  maxBytes = MARKETPLACE_PRODUCT_IMAGE_MAX_BYTES,
  maxDimension = MARKETPLACE_PRODUCT_IMAGE_MAX_DIMENSION,
): Promise<File> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Not an image file');
  }
  if (file.size <= maxBytes) {
    return file;
  }

  const bitmap = await loadBitmap(file);
  try {
    const blob = await encodeJpegUnderLimit(bitmap, maxBytes, maxDimension);
    const name = `${fileBaseName(file.name)}.jpg`;
    return new File([blob], name, { type: JPEG_MIME, lastModified: Date.now() });
  } finally {
    bitmap.close();
  }
}
