/**
 * i18n configuration for Uhuru Safi.
 *
 * Supported languages: English (default) and Kiswahili — Kenya's two
 * official languages per Article 7 of the Constitution. Detection order:
 *   1. localStorage (`uhuru-safi-language`) — explicit user choice wins
 *   2. browser `navigator.language` — sensible default
 *   3. fallback to English
 *
 * Translations are scaffolded with the most-used UI strings (nav, common
 * actions, error states). Feature-specific strings can be added to the
 * dictionaries incrementally without touching this config.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import sw from './locales/sw.json';

export const SUPPORTED_LANGUAGES = ['en', 'sw'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_STORAGE_KEY = 'uhuru-safi-language';

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      sw: { translation: sw },
    },
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES,
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ['localStorage'],
    },
    returnNull: false,
  });

export default i18n;
