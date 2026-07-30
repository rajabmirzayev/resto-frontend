import type { Locale } from '../i18n';
import type { LocalizedString } from '../types';

export function localize(str: LocalizedString | string, locale: Locale): string {
  if (typeof str === 'string') return str;
  return str[locale] || str.az || str.en || '';
}
