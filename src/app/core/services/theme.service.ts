import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import { PREF_THEME_COOKIE } from '../preferences/preference-cookies';
import { getCookie, setCookie } from '../utils/cookie.util';

export type ThemeMode = 'light' | 'dark';

const THEME_CLASS = 'theme-dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private document = inject(DOCUMENT);

  /** Active theme; kept in sync with the `theme-dark` class on `documentElement`. */
  readonly mode = signal<ThemeMode>('light');

  constructor() {
    this.syncFromDocument();
  }

  private syncFromDocument(): void {
    const next = this.resolveInitialMode();
    this.applyMode(next, false);
  }

  private resolveInitialMode(): ThemeMode {
    const html = this.document.documentElement;
    const fromCookie = getCookie(PREF_THEME_COOKIE);

    if (fromCookie === 'dark' || fromCookie === 'light') {
      return fromCookie;
    }

    if (html.classList.contains(THEME_CLASS)) {
      return 'dark';
    }

    if (this.systemPrefersDark()) {
      return 'dark';
    }

    return 'light';
  }

  private systemPrefersDark(): boolean {
    const win = this.document.defaultView;
    if (!win?.matchMedia) {
      return false;
    }
    return win.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  setMode(next: ThemeMode): void {
    this.applyMode(next, true);
  }

  toggle(): void {
    this.setMode(this.mode() === 'dark' ? 'light' : 'dark');
  }

  private applyMode(next: ThemeMode, persist: boolean): void {
    const html = this.document.documentElement;
    if (next === 'dark') {
      html.classList.add(THEME_CLASS);
    } else {
      html.classList.remove(THEME_CLASS);
    }
    this.mode.set(next);
    if (persist) {
      setCookie(PREF_THEME_COOKIE, next);
    }
    this.updateMetaThemeColor();
  }

  private updateMetaThemeColor(): void {
    if (typeof document === 'undefined') {
      return;
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute(
        'content',
        this.mode() === 'dark' ? '#0f172a' : '#0a2647',
      );
    }
  }
}
