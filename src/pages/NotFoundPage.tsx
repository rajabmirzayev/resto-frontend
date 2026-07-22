import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const currentUser = useStore((s) => s.currentUser);

  const handleGoHome = () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    switch (currentUser.role) {
      case 'admin':
        navigate('/admin');
        break;
      case 'waiter':
        navigate('/waiter');
        break;
      case 'chef':
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
        <h2 className="text-2xl font-bold text-text-primary mb-2">Səhifə tapılmadı</h2>
        <p className="text-text-secondary mb-8">Axtardığınız səhifə mövcud deyil və ya köçürülüb.</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="bg-surface-secondary hover:bg-border text-text-secondary font-medium py-2.5 px-5 rounded-xl transition-colors inline-flex items-center gap-2 border border-border"
          >
            <ArrowLeft className="w-4 h-4" />
            Geri
          </button>
          <button
            onClick={handleGoHome}
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-5 rounded-xl transition-colors inline-flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Əsas Səhifə
          </button>
        </div>
      </div>
    </div>
  );
}
