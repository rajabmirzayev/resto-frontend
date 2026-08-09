import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useTranslation } from '../i18n';
import { getUiScope } from '../api/session';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const currentUser = useStore((s) => s.currentUser);

  const handleGoHome = () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    const scope = getUiScope();
    switch (scope) {
      case 'SUPER_ADMIN_PANEL':
        navigate('/super-admin');
        break;
      case 'ADMIN_PANEL':
        navigate('/admin');
        break;
      case 'WAITER_PANEL':
        navigate('/waiter');
        break;
      case 'KITCHEN_PANEL':
        navigate('/kitchen');
        break;
      default:
        navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-surface-secondary flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-8xl font-bold text-primary-200 mb-4">404</div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">{t('error.page_not_found')}</h2>
        <p className="text-text-secondary mb-8">{t('error.page_not_found_detail')}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="bg-surface-secondary hover:bg-border text-text-secondary font-medium py-2.5 px-5 rounded-xl transition-colors inline-flex items-center gap-2 border border-border"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('common.back')}
          </button>
          <button
            onClick={handleGoHome}
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-5 rounded-xl transition-colors inline-flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            {t('common.home')}
          </button>
        </div>
      </div>
    </div>
  );
}
