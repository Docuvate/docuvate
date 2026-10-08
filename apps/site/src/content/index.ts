import type { SiteLocale } from '../lib/routes';
import type { SiteContent } from './types';
import { deContent } from './de';
import { enContent } from './en';

export function getContent(locale: SiteLocale): SiteContent {
  switch (locale) {
    case 'de':
      return deContent;
    case 'en':
      return enContent;
    default: {
      const _exhaustive: never = locale;
      return _exhaustive;
    }
  }
}
