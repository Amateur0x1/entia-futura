export const locales = ['zh', 'en'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export function isLocale(value: string | undefined): value is Locale {
  return value === 'zh' || value === 'en';
}

export function pickByLocale<T>(locale: Locale, zh: T, en: T): T {
  return locale === 'zh' ? zh : en;
}

export function stripLocaleFromPath(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);

  if (segments[0] === 'zh' || segments[0] === 'en') {
    const rest = segments.slice(1).join('/');
    return rest ? `/${rest}` : '/';
  }

  return pathname || '/';
}

export function toLocalePath(locale: Locale, pathname = '/'): string {
  const stripped = stripLocaleFromPath(pathname);
  return stripped === '/' ? `/${locale}` : `/${locale}${stripped}`;
}

export function getLocaleFromPath(pathname: string): Locale | null {
  const firstSegment = pathname.split('/').filter(Boolean)[0];
  return isLocale(firstSegment) ? firstSegment : null;
}
