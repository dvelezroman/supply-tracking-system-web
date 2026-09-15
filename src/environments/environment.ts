export const environment = {
  production: false,
  /** Same path as Nest `API_PREFIX`/`API_VERSION` (default `api/v0`). Use relative URL so `ng serve` proxy works. */
  apiBase: 'http://localhost:3000/api/v0',
  labelLogoUrl: '',
  /** Local Marea Alta logo when labelLogoUrl cannot be loaded. */
  labelLogoFallbackUrl: 'assets/images/marea-alta-logo.png',
  introVideoUrl: '',
  /** Local intro video when introVideoUrl cannot be loaded. */
  introVideoFallbackUrl: 'assets/images/MareaAlta-INTRO.mp4',
  labelBrandName: 'MAREA ALTA',
  bitflowLogoUrl: 'assets/images/bitflow-logo.png',
  bitflowSiteUrl: 'https://bitflow.bid',
  contactEmail: 'info@bitflow.bid',
};
