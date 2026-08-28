/** Format price cents as currency string (es-EC). */
export function formatMoney(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: currency || 'USD',
  }).format((cents || 0) / 100);
}
