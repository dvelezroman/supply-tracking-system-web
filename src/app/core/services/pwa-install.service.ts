import { Injectable, NgZone, inject, signal } from '@angular/core';

/** Chromium `beforeinstallprompt` event (not in lib.dom typings on all targets). */
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

const DISMISS_KEY = 'marea_pwa_install_dismissed_at';
/** Re-show install toast after this many days if user dismissed. */
const DISMISS_DAYS = 14;

@Injectable({ providedIn: 'root' })
export class PwaInstallService {
  private zone = inject(NgZone);

  /** Deferred native install prompt (Chrome/Edge/Android). */
  private deferred: BeforeInstallPromptEvent | null = null;

  /** True when custom toast should be visible. */
  readonly promptVisible = signal(false);

  /** iOS Safari has no beforeinstallprompt — show Add-to-Home-Screen tip. */
  readonly iosHint = signal(false);

  private listening = false;

  /** Call once from root shell. */
  start(): void {
    if (this.listening || typeof window === 'undefined') {
      return;
    }
    this.listening = true;

    if (this.isStandalone()) {
      return;
    }

    if (this.isDismissedRecently()) {
      return;
    }

    window.addEventListener('beforeinstallprompt', (event: Event) => {
      event.preventDefault();
      this.zone.run(() => {
        this.deferred = event as BeforeInstallPromptEvent;
        this.iosHint.set(false);
        this.promptVisible.set(true);
      });
    });

    window.addEventListener('appinstalled', () => {
      this.zone.run(() => {
        this.deferred = null;
        this.promptVisible.set(false);
        this.clearDismiss();
      });
    });

    // Soft tip for iOS (no native install event).
    if (this.isIos() && !this.isStandalone()) {
      window.setTimeout(() => {
        this.zone.run(() => {
          if (!this.deferred && !this.isDismissedRecently()) {
            this.iosHint.set(true);
            this.promptVisible.set(true);
          }
        });
      }, 2500);
    }
  }

  async install(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
    if (!this.deferred) {
      return 'unavailable';
    }
    const event = this.deferred;
    this.deferred = null;
    try {
      await event.prompt();
      const { outcome } = await event.userChoice;
      this.promptVisible.set(false);
      if (outcome === 'dismissed') {
        this.rememberDismiss();
      }
      return outcome;
    } catch {
      this.promptVisible.set(false);
      return 'unavailable';
    }
  }

  dismiss(): void {
    this.promptVisible.set(false);
    this.rememberDismiss();
  }

  private isStandalone(): boolean {
    const nav = window.navigator as Navigator & { standalone?: boolean };
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      nav.standalone === true
    );
  }

  private isIos(): boolean {
    const ua = window.navigator.userAgent;
    return /iPad|iPhone|iPod/.test(ua) ||
      (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
  }

  private isDismissedRecently(): boolean {
    try {
      const raw = localStorage.getItem(DISMISS_KEY);
      if (!raw) {
        return false;
      }
      const at = Number(raw);
      if (!Number.isFinite(at)) {
        return false;
      }
      const ms = DISMISS_DAYS * 24 * 60 * 60 * 1000;
      return Date.now() - at < ms;
    } catch {
      return false;
    }
  }

  private rememberDismiss(): void {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore quota / private mode */
    }
  }

  private clearDismiss(): void {
    try {
      localStorage.removeItem(DISMISS_KEY);
    } catch {
      /* ignore */
    }
  }
}
