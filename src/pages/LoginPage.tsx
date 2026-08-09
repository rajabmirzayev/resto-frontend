import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useTheme } from '../store/useTheme';
import { useTranslation, type Locale } from '../i18n';
import { ApiError } from '../api/client';
import { getUiScope } from '../api/session';
import type { UiScope } from '../api/types';
import { LogIn, User, Lock, Loader2, AlertCircle, Globe, Sun, Moon } from 'lucide-react';
import azFlag from '../assets/azerbaijan-flag.png';
import enFlag from '../assets/united-kingdom-flag.png';
import ruFlag from '../assets/russian-flag.png';

const LANGUAGES: { code: Locale; label: string; flag: string }[] = [
  { code: 'az', label: 'Azərbaycanca', flag: azFlag },
  { code: 'en', label: 'English', flag: enFlag },
  { code: 'ru', label: 'Русский', flag: ruFlag },
];

function getRedirectPath(uiScope: UiScope): string {
  switch (uiScope) {
    case 'SUPER_ADMIN_PANEL':
      return '/super-admin';
    case 'WAITER_PANEL':
      return '/waiter';
    case 'KITCHEN_PANEL':
      return '/kitchen';
    default:
      return '/admin';
  }
}

export default function LoginPage() {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const login = useStore((s) => s.login);
  const navigate = useNavigate();
  const { isDark, toggleDark } = useTheme();
  const { locale, setLocale } = useTranslation();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setShowLanguageMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setError('');
    setIsLoading(true);
    try {
      const user = await login(username, password);
      if (!user) {
        setError(t('error.unexpected'));
        return;
      }
      const uiScope = getUiScope() as UiScope | null;
      navigate(getRedirectPath(uiScope ?? 'ADMIN_PANEL'), { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401 || err.key === 'AUTH_001') {
          setError(t('error.invalid_credentials'));
        } else if (err.status === 502 || err.key === 'AUTH_005') {
          setError(t('error.auth_unavailable'));
        } else {
          setError(err.detail || t('error.unexpected'));
        }
      } else {
        setError(t('error.network'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-gradient relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-primary-100 via-white to-violet-100 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="animate-blob-a pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary-300/60 blur-3xl dark:bg-primary-500/25" />
      <div className="animate-blob-b pointer-events-none absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-violet-300/60 blur-3xl dark:bg-violet-600/25" />
      <div className="animate-blob-c pointer-events-none absolute -bottom-28 left-1/4 h-80 w-80 rounded-full bg-rose-300/50 blur-3xl dark:bg-rose-500/20" />
      <div className="animate-blob-d pointer-events-none absolute top-1/4 left-1/3 h-64 w-64 rounded-full bg-amber-300/50 blur-3xl dark:bg-amber-500/20" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-56 w-56 rounded-full bg-fuchsia-300/50 blur-3xl dark:bg-fuchsia-500/20" />

      <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
        <div className="relative" ref={langRef}>
          <button
            onClick={() => setShowLanguageMenu((v) => !v)}
            className="flex items-center gap-1.5 rounded-xl border border-white/60 bg-white/60 p-2.5 text-text-secondary backdrop-blur-xl transition-colors hover:bg-white/80 dark:border-white/10 dark:bg-white/10 dark:text-white"
            title={t('header.language')}
            aria-label={t('header.language')}
          >
            <Globe className="h-5 w-5" />
          </button>
          {showLanguageMenu && (
            <div className="absolute right-0 top-full mt-2 w-44 overflow-hidden rounded-xl border border-border bg-white/95 py-1.5 shadow-xl shadow-slate-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLocale(lang.code);
                    setShowLanguageMenu(false);
                  }}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                    locale === lang.code
                      ? 'bg-primary-50 font-semibold text-primary-700 dark:bg-primary-100 dark:text-primary-300'
                      : 'text-text-secondary hover:bg-surface-secondary'
                  }`}
                >
                  <img src={lang.flag} alt="" className="h-3.5 w-5 rounded-sm object-cover" />
                  <span>{lang.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={toggleDark}
          className="rounded-xl border border-white/60 bg-white/60 p-2.5 text-text-secondary backdrop-blur-xl transition-colors hover:bg-white/80 dark:border-white/10 dark:bg-white/10 dark:text-white"
          title={isDark ? t('header.light_mode') : t('header.dark_mode')}
          aria-label={isDark ? t('header.light_mode') : t('header.dark_mode')}
        >
          {isDark ? <Sun className="h-5 w-5 text-warning-500" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>

      <div className="animate-float-card relative w-full max-w-md">
        <div className="mb-8 text-center">
          <img src="/favicon.svg" alt="RestoFlow" className="mx-auto mb-5 h-24 w-24 object-contain" />
          <h1 className="text-3xl font-bold tracking-tight text-primary-800 dark:text-white">RestoFlow</h1>
          <p className="mt-1 text-sm font-medium text-text-secondary dark:text-text-secondary">{t('login.slogan')}</p>
        </div>

        <div className="rounded-3xl border border-white/60 bg-white/70 p-8 shadow-2xl shadow-slate-900/10 backdrop-blur-2xl sm:p-10 dark:border-white/10 dark:bg-slate-900/70">
          <h2 className="mb-6 text-xl font-semibold text-text-primary dark:text-white">{t('login.title')}</h2>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-2xl border border-danger-500/20 bg-danger-50 px-4 py-3 text-sm text-danger-600 backdrop-blur dark:bg-danger-500/10 dark:text-danger-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="login-username" className="mb-1.5 block text-sm font-medium text-text-primary dark:text-text-primary">
                {t('login.username')}
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-600 dark:text-slate-400 z-1" strokeWidth={2.5} />
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  disabled={isLoading}
                  className="w-full rounded-2xl border border-border bg-white/80 py-3 pl-11 pr-4 text-text-primary placeholder:text-text-muted backdrop-blur transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder:text-text-muted"
                  placeholder={t('login.username_placeholder')}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-text-primary dark:text-text-primary">
                {t('login.password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-600 dark:text-slate-400 z-1" strokeWidth={2.5} />
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={isLoading}
                  className="w-full rounded-2xl border border-border bg-white/80 py-3 pl-11 pr-4 text-text-primary placeholder:text-text-muted backdrop-blur transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500/40 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder:text-text-muted"
                  placeholder={t('login.password_placeholder')}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary-600 to-violet-600 py-3 font-semibold text-white shadow-lg shadow-primary-200 dark:shadow-black/30 transition-all hover:from-primary-500 hover:to-violet-500 hover:shadow-primary-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
              {isLoading ? t('login.loading') : t('login.submit')}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs font-medium text-text-muted dark:text-text-muted">
          © {new Date().getFullYear()} RestoFlow
        </p>
      </div>
    </div>
  );
}
