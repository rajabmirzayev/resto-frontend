import { createContext, useContext, useCallback, type ReactNode } from 'react';
import { persist } from 'zustand/middleware';
import { create } from 'zustand';
import az from './az';
import en from './en';
import ru from './ru';

export type Locale = 'az' | 'en' | 'ru';

const translations: Record<Locale, Record<string, string>> = { az, en, ru };
const LOCALE_MAP: Record<Locale, string> = { az: 'az-AZ', en: 'en-GB', ru: 'ru-RU' };

interface I18nState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const useI18nStore = create<I18nState>()(
  persist(
    (set) => ({
      locale: 'az',
      setLocale: (locale) => set({ locale }),
    }),
    { name: 'tabler-locale' }
  )
);

export interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatDate: (date: string | Date, options?: Intl.DateTimeFormatOptions) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const { locale, setLocale } = useI18nStore();

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let value = translations[locale][key] || translations['az'][key] || key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          value = value.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        });
      }
      return value;
    },
    [locale]
  );

  const formatDate = useCallback(
    (date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
      const d = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(d.getTime())) return String(date);
      return d.toLocaleString(LOCALE_MAP[locale], options);
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, formatDate }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useTranslation must be used within I18nProvider');
  return ctx;
}
