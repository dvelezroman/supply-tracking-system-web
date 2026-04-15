import { Injectable, signal, computed } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface PublicBrandingDto {
  logoUrl: string | null;
  /** Landing toolbar — brand only */
  headerTitle: string;
  /** Main shell — brand + Supply Tracking */
  platformTitle: string;
}

const FALLBACK_LANDING = 'MAREA ALTA';
const FALLBACK_PLATFORM = 'MAREA ALTA Supply Tracking';

@Injectable({ providedIn: 'root' })
export class PublicBrandingService {
  private branding = signal<PublicBrandingDto | null>(null);
  private loadPromise: Promise<void> | null = null;

  readonly landingTitle = computed(
    () => this.branding()?.headerTitle?.trim() || FALLBACK_LANDING,
  );
  readonly platformTitle = computed(
    () => this.branding()?.platformTitle?.trim() || FALLBACK_PLATFORM,
  );
  readonly logoUrl = computed(() => this.branding()?.logoUrl ?? null);

  constructor() {
    void this.ensureLoaded();
  }

  /** Idempotent: single fetch shared by landing and main shell. */
  ensureLoaded(): Promise<void> {
    if (!this.loadPromise) {
      this.loadPromise = this.load();
    }
    return this.loadPromise;
  }

  private async load(): Promise<void> {
    try {
      const url = `${environment.apiBase}/public/branding`;
      const res = await fetch(url, { credentials: 'omit' });
      if (!res.ok) return;
      const data = (await res.json()) as PublicBrandingDto;
      if (typeof data?.headerTitle !== 'string' || typeof data?.platformTitle !== 'string') {
        return;
      }
      this.branding.set({
        logoUrl: typeof data.logoUrl === 'string' ? data.logoUrl : null,
        headerTitle: data.headerTitle.trim() || FALLBACK_LANDING,
        platformTitle: data.platformTitle.trim() || FALLBACK_PLATFORM,
      });
    } catch {
      /* API unreachable — fallbacks above */
    }
  }
}
