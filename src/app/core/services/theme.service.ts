import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import { PREF_THEME_COOKIE } from '../preferences/preference-cookies';
import { getCookie, setCookie } from '../utils/cookie.util';

export type ThemeMode = 'light' | 'dark';

const THEME_CLASS = 'theme-dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private document = inject(DOCUMENT);

  /** Active theme; kept in sync with the `theme-dark` class on `documentElement` and the theme cookie. */
  readonly mode = signal<ThemeMode>('light');

  constructor() {
    this.syncFromDocument();
  }

  private syncFromDocument(): void {
    const html = this.document.documentElement;
    const fromCookie = getCookie(PREF_THEME_COOKIE);
    const preferDark =
      html.classList.contains(THEME_CLASS) || fromCookie === 'dark';
    if (preferDark) {
      html.classList.add(THEME_CLASS);
      this.mode.set('dark');
      if (fromCookie !== 'dark') {
        setCookie(PREF_THEME_COOKIE, 'dark');
      }
    } else {
      html.classList.remove(THEME_CLASS);
      this.mode.set('light');
      if (fromCookie && fromCookie !== 'light') {
        setCookie(PREF_THEME_COOKIE, 'light');
      }
    }
    if (getCookie(PREF_THEME_COOKIE) === null) {
      setCookie(PREF_THEME_COOKIE, this.mode());
    }
    this.updateMetaThemeColor();
  }

  setMode(next: ThemeMode): void {
    const html = this.document.documentElement;
    if (next === 'dark') {
      html.classList.add(THEME_CLASS);
      setCookie(PREF_THEME_COOKIE, 'dark');
    } else {
      html.classList.remove(THEME_CLASS);
      setCookie(PREF_THEME_COOKIE, 'light');
    }
    this.mode.set(next);
    this.updateMetaThemeColor();
  }

  toggle(): void {
    this.setMode(this.mode() === 'dark' ? 'light' : 'dark');
  }

  private updateMetaThemeColor(): void {
    if (typeof document === 'undefined') {
      return;
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute(
        'content',
        this.mode() === 'dark' ? '#121212' : '#0a2647',
      );
    }
  }
}
