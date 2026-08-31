import { Injectable, NgZone, inject, signal } from '@angular/core';

/** Chromium `beforeinstallprompt` event (not in lib.dom typings on all targets). */
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

const DISMISS_KEY = 'marea_pwa_install_dismissed';
/** Same delay as rotary-club InstallPrompt. */
const SHOW_DELAY_MS = 1800;

@Injectable({ providedIn: 'root' })
export class PwaInstallService {
  private zone = inject(NgZone);

  private deferred: BeforeInstallPromptEvent | null = null;
  private showTimer: number | undefined;
  private listening = false;

  readonly promptVisible = signal(false);
  readonly iosHint = signal(false);

  /** Call once from root shell. */
  start(): void {
    if (this.listening || typeof window === 'undefined') {
      return;
    }
    this.listening = true;

    if (this.isStandalone() || this.isDismissed()) {
      return;
    }

    window.addEventListener('beforeinstallprompt', (event: Event) => {
      event.preventDefault();
      this.zone.run(() => {
        this.deferred = event as BeforeInstallPromptEvent;
        this.iosHint.set(false);
        this.scheduleShow();
      });
    });

    window.addEventListener('appinstalled', () => {
      this.zone.run(() => {
        this.clearShowTimer();
        this.deferred = null;
        this.promptVisible.set(false);
        this.rememberDismiss();
      });
    });

    if (this.isIos()) {
      this.iosHint.set(true);
      this.scheduleShow();
    }
  }

  async install(): Promise<void> {
    if (!this.deferred) {
      return;
    }
    const event = this.deferred;
    this.deferred = null;
    try {
      await event.prompt();
      await event.userChoice;
    } finally {
      this.promptVisible.set(false);
    }
  }

  dismiss(): void {
    this.clearShowTimer();
    this.deferred = null;
    this.promptVisible.set(false);
    this.rememberDismiss();
  }

  private scheduleShow(): void {
    if (this.isStandalone() || this.isDismissed()) {
      return;
    }
    this.clearShowTimer();
    this.showTimer = window.setTimeout(() => {
      this.zone.run(() => this.promptVisible.set(true));
    }, SHOW_DELAY_MS);
  }

  private clearShowTimer(): void {
    if (this.showTimer !== undefined) {
      window.clearTimeout(this.showTimer);
      this.showTimer = undefined;
    }
  }

  private isStandalone(): boolean {
    const nav = window.navigator as Navigator & { standalone?: boolean };
    const standaloneDisplay =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches;
    return standaloneDisplay || nav.standalone === true;
  }

  private isIos(): boolean {
    const ua = window.navigator.userAgent;
    return (
      /iPad|iPhone|iPod/i.test(ua) ||
      (window.navigator.platform === 'MacIntel' &&
        window.navigator.maxTouchPoints > 1)
    );
  }

  private isDismissed(): boolean {
    try {
      return localStorage.getItem(DISMISS_KEY) === 'true';
    } catch {
      return false;
    }
  }

  private rememberDismiss(): void {
    try {
      localStorage.setItem(DISMISS_KEY, 'true');
    } catch {
      /* ignore quota / private mode */
    }
  }
}
