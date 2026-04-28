import { ThemeService } from '../services/theme.service';

/** Ensures {@link ThemeService} runs on startup so cookie and DOM class stay aligned. */
export function themeAppInit(theme: ThemeService): () => void {
  return () => undefined;
}
