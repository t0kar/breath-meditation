import { getLocales } from 'expo-localization';
import { Locale } from '../types';

const deviceLanguage = getLocales()[0]?.languageCode ?? 'en';

const translations = {
  en: {
    tabs: {
      breathe: 'Breathe',
      metronome: 'Metronome',
      meditate: 'Meditate',
      sessions: 'Sessions',
    },
    common: {
      start: 'Start',
      pause: 'Pause',
      resume: 'Resume',
      reset: 'Reset',
      done: 'Done',
    },
    phase: {
      inhale: 'Inhale',
      hold: 'Hold',
      exhale: 'Exhale',
    },
  },
  hr: {
    tabs: {
      breathe: 'Disanje',
      metronome: 'Metronom',
      meditate: 'Meditacija',
      sessions: 'Sesije',
    },
    common: {
      start: 'Pokreni',
      pause: 'Pauza',
      resume: 'Nastavi',
      reset: 'Reset',
      done: 'Gotovo',
    },
    phase: {
      inhale: 'Udah',
      hold: 'Zadrzi',
      exhale: 'Izdah',
    },
  },
} as const;

let activeLocale: Locale = deviceLanguage === 'hr' ? 'hr' : 'en';

const lookup = (locale: Locale, key: string): string => {
  const path = key.split('.');
  let cursor: unknown = translations[locale];

  for (const part of path) {
    if (!cursor || typeof cursor !== 'object' || !(part in cursor)) {
      cursor = undefined;
      break;
    }
    cursor = (cursor as Record<string, unknown>)[part];
  }

  if (typeof cursor === 'string') return cursor;
  if (locale !== 'en') return lookup('en', key);
  return key;
};

export const setLocale = (locale: Locale): void => {
  activeLocale = locale;
};

const i18n = {
  t: (key: string): string => lookup(activeLocale, key),
  locale: (): Locale => activeLocale,
};

export default i18n;
