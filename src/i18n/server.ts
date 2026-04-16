import { defaultLocale, type Locale } from './config';

export function detectLocaleFromHeader(header: string | null): Locale {
  if (!header) return defaultLocale;

  const normalized = header.toLowerCase();

  if (normalized.includes('zh')) return 'zh';
  if (normalized.includes('en')) return 'en';

  return defaultLocale;
}
