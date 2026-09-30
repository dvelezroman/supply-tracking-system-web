import { Injectable } from '@angular/core';

const PAYPHONE_CSS =
  'https://cdn.payphonetodoesposible.com/box/v2.0/payphone-payment-box.css';
const PAYPHONE_JS =
  'https://cdn.payphonetodoesposible.com/box/v2.0/payphone-payment-box.js';

@Injectable({ providedIn: 'root' })
export class PayphoneSdkLoaderService {
  private loadPromise: Promise<void> | null = null;

  load(): Promise<void> {
    if (typeof window === 'undefined') {
      return Promise.reject(new Error('Payphone SDK requires a browser'));
    }
    if (window.PPaymentButtonBox) {
      return Promise.resolve();
    }
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = new Promise<void>((resolve, reject) => {
      if (!document.querySelector(`link[href="${PAYPHONE_CSS}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = PAYPHONE_CSS;
        document.head.appendChild(link);
      }

      const existing = document.querySelector(
        `script[src="${PAYPHONE_JS}"]`,
      ) as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () =>
          reject(new Error('Failed to load Payphone SDK')),
        );
        // Already loaded
        if (window.PPaymentButtonBox) resolve();
        return;
      }

      const script = document.createElement('script');
      script.type = 'module';
      script.src = PAYPHONE_JS;
      script.onload = () => {
        // Module may expose constructor slightly after load
        const tryReady = (attempts: number) => {
          if (window.PPaymentButtonBox) {
            resolve();
            return;
          }
          if (attempts <= 0) {
            reject(new Error('Payphone PPaymentButtonBox not available'));
            return;
          }
          setTimeout(() => tryReady(attempts - 1), 50);
        };
        tryReady(40);
      };
      script.onerror = () => reject(new Error('Failed to load Payphone SDK'));
      document.head.appendChild(script);
    }).catch((err) => {
      this.loadPromise = null;
      throw err;
    });

    return this.loadPromise;
  }
}
