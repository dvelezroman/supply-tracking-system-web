export const environment = {
  production: false,
  /** Same path as Nest `API_PREFIX`/`API_VERSION` (default `api/v0`). Use relative URL so `ng serve` proxy works. */
  apiBase: 'http://localhost:3000/api/v0',
  labelLogoUrl: 'https://bitflow-public.s3.us-east-1.amazonaws.com/LogoCamaronera.png',
  /** Local Marea Alta logo when labelLogoUrl cannot be loaded. */
  labelLogoFallbackUrl: 'assets/images/marea-alta-logo.png',
  introVideoUrl: 'https://marea-alta.s3.us-east-1.amazonaws.com/landing-images/Video-intro-new-2.mp4',
  /** Local intro video when introVideoUrl cannot be loaded. */
  introVideoFallbackUrl: 'assets/images/MareaAlta-INTRO.mp4',
  labelBrandName: 'MAREA ALTA',
  bitflowLogoUrl: 'https://bitflow-public.s3.us-east-1.amazonaws.com/Bitflow-logo.png',
  bitflowSiteUrl: 'https://bitflow.bid',
  contactEmail: 'info@bitflow.bid',
};
