import { Injectable, signal, computed } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface PublicBrandingDto {
  logoUrl: string | null;
  /** Landing toolbar — brand only */
  headerTitle: string;
  /** Main shell — brand + Supply Tracking */
  platformTitle: string;
  developer?: {
    name?: string;
    logoUrl?: string | null;
    siteUrl?: string | null;
    contactEmail?: string | null;
  };
}

const FALLBACK_LANDING = 'MAREA ALTA';
const FALLBACK_PLATFORM = 'MAREA ALTA Supply Tracking';
const FALLBACK_DEVELOPER_NAME = 'BITFLOW';
const SUPPLY_TRACKING_SUFFIX = 'Supply Tracking';

@Injectable({ providedIn: 'root' })
export class PublicBrandingService {
  private readonly branding = signal<PublicBrandingDto>(this.loadFromEnvironment());

  readonly landingTitle = computed(
    () => this.branding()?.headerTitle?.trim() || FALLBACK_LANDING,
  );
  readonly platformTitle = computed(
    () => this.branding()?.platformTitle?.trim() || FALLBACK_PLATFORM,
  );
  readonly logoUrl = computed(() => this.branding()?.logoUrl ?? null);
  readonly developerName = computed(
    () => this.branding()?.developer?.name?.trim() || FALLBACK_DEVELOPER_NAME,
  );
  readonly developerLogoUrl = computed(
    () => this.branding()?.developer?.logoUrl?.trim() || null,
  );
  readonly developerSiteUrl = computed(
    () => this.branding()?.developer?.siteUrl?.trim() || null,
  );
  readonly developerContactEmail = computed(
    () => this.branding()?.developer?.contactEmail?.trim() || null,
  );

  /** Keeps existing API but branding now comes directly from environment.ts. */
  ensureLoaded(): Promise<void> {
    return Promise.resolve();
  }

  private loadFromEnvironment(): PublicBrandingDto {
    const brandName = environment.labelBrandName?.trim() || FALLBACK_LANDING;
    const logoUrl = environment.labelLogoUrl?.trim() || null;
    return {
      logoUrl,
      headerTitle: brandName.toUpperCase(),
      platformTitle: `${brandName.toUpperCase()} ${SUPPLY_TRACKING_SUFFIX}`.trim(),
      developer: {
        name: FALLBACK_DEVELOPER_NAME,
        logoUrl: environment.bitflowLogoUrl?.trim() || null,
        siteUrl: environment.bitflowSiteUrl?.trim() || null,
        contactEmail: environment.contactEmail?.trim() || null,
      },
    };
  }
}
