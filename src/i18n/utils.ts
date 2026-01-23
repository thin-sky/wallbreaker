import en from './en.json';
import es from './es.json';
import fr from './fr.json';

const translations = {
  en,
  es,
  fr,
} as const;

export type Locale = keyof typeof translations;
export type TranslationKey = keyof typeof en;

export function getTranslations(locale: string | undefined): typeof en {
  const normalizedLocale = (locale || 'en') as Locale;
  return translations[normalizedLocale] || translations.en;
}

export function t(locale: string | undefined, key: string): string {
  const translations = getTranslations(locale);
  const keys = key.split('.');
  let value: any = translations;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return key; // Return key if translation not found
    }
  }
  
  return typeof value === 'string' ? value : key;
}
