import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useTranslation } from '../i18n';
import { ApiError } from '../api/client';
import { LogIn, User, Lock, Loader2 } from 'lucide-react';

function getRedirectPath(role: string): string {
  switch (role) {
    case 'admin':
      return '/super-admin';
    case 'waiter':
      return '/waiter';
    case 'chef':
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
  const login = useStore((s) => s.login);
  const navigate = useNavigate();

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
      navigate(getRedirectPath(user.role), { replace: true });
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 dark:from-primary-900/20 dark:via-surface dark:to-primary-900/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-4">
            <img src="/favicon.svg" alt="RestoFlow" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-text-primary">RestoFlow</h1>
          <p className="text-text-secondary mt-1">{t('login.system_name')}</p>
        </div>

        <div className="bg-white dark:bg-surface rounded-2xl shadow-xl shadow-primary-100/50 p-8 border border-border">
          <h2 className="text-xl font-semibold text-text-primary mb-6">{t('login.title')}</h2>

          {error && (
            <div className="bg-danger-50 text-danger-600 text-sm px-4 py-3 rounded-xl mb-4 border border-danger-500/20">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">{t('login.username')}</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-text-primary disabled:opacity-60"
                  placeholder={t('login.username_placeholder')}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">{t('login.password')}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-text-primary disabled:opacity-60"
                  placeholder={t('login.password_placeholder')}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-200 hover:shadow-primary-300 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
              {isLoading ? t('login.loading') : t('login.submit')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
