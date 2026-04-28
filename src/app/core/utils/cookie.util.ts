/**
 * Small cookie helpers for browser-only preferences (language, theme).
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }
  const escaped = name.replace(/[$()*+.?[\\\]^{|}]/g, '\\$&');
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${escaped}=([^;]*)`),
  );
  if (!match) {
    return null;
  }
  try {
    return decodeURIComponent(match[1].replace(/\+/g, ' '));
  } catch {
    return match[1];
  }
}

export function setCookie(
  name: string,
  value: string,
  maxAgeSeconds = 60 * 60 * 24 * 365,
): void {
  if (typeof document === 'undefined') {
    return;
  }
  const secure =
    typeof location !== 'undefined' && location.protocol === 'https:'
      ? '; Secure'
      : '';
  const encoded = encodeURIComponent(value);
  document.cookie = `${encodeURIComponent(
    name,
  )}=${encoded}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}
