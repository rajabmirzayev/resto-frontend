import { useState } from 'react';
import { Globe, Sun, Moon, ArrowLeft } from 'lucide-react';
import { useTheme } from '../../store/useTheme';
import { useTranslation, type Locale } from '../../i18n';
import azFlag from '../../assets/azerbaijan-flag.png';
import enFlag from '../../assets/united-kingdom-flag.png';
import ruFlag from '../../assets/russian-flag.png';

const LANGUAGES: { code: Locale; label: string; flag: string }[] = [
  { code: 'az', label: 'Azərbaycanca', flag: azFlag },
  { code: 'en', label: 'English', flag: enFlag },
  { code: 'ru', label: 'Русский', flag: ruFlag },
];

interface CustomerHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export default function CustomerHeader({ title, subtitle, showBack, onBack, rightAction }: CustomerHeaderProps) {
  const { isDark, toggleDark } = useTheme();
  const { locale, setLocale, t } = useTranslation();
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  const currentLang = LANGUAGES.find((l) => l.code === locale);

  return (
    <header className="bg-white dark:bg-surface border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {showBack && onBack && (
          <button
            onClick={onBack}
            className="p-2 hover:bg-surface-secondary rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </button>
        )}
        <div>
          <h1 className="text-xl font-bold text-text-primary">{title}</h1>
          {subtitle && <p className="text-sm text-text-secondary mt-0.5">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {rightAction}

        <div className="relative">
          <button
            onClick={() => setShowLanguageMenu(!showLanguageMenu)}
            className="flex items-center gap-1.5 px-2.5 py-2 hover:bg-surface-secondary rounded-xl transition-colors text-sm"
            title={t('header.language')}
          >
            <Globe className="w-4 h-4 text-text-secondary" />
            <img src={currentLang?.flag} alt="" className="hidden lg:inline w-4 h-3 rounded-sm object-cover" />
          </button>
          {showLanguageMenu && (
            <div className="absolute right-0 top-full mt-2 bg-white dark:bg-surface rounded-xl border border-border shadow-xl py-1.5 w-44 z-50">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => { setLocale(lang.code); setShowLanguageMenu(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                    locale === lang.code
                      ? 'bg-primary-50 dark:bg-primary-100 text-primary-700 dark:text-primary-300 font-semibold'
                      : 'text-text-secondary hover:bg-surface-secondary'
                  }`}
                >
                  <img src={lang.flag} alt="" className="w-5 h-3.5 rounded-sm object-cover" />
                  <span>{lang.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={toggleDark}
          className="p-2 hover:bg-surface-secondary rounded-xl transition-colors"
          title={isDark ? t('header.light_mode') : t('header.dark_mode')}
        >
          {isDark ? (
            <Sun className="w-5 h-5 text-warning-500" />
          ) : (
            <Moon className="w-5 h-5 text-text-secondary" />
          )}
        </button>
      </div>
    </header>
  );
}
