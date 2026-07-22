import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { LogIn, User, Lock } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const login = useStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const user = login(username, password);
    if (user) {
      switch (user.role) {
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
          navigate('/');
      }
    } else {
      setError('İstifadəçi adı və ya şifrə yanlışdır');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4 shadow-lg shadow-primary-200">
            <span className="text-2xl font-bold text-white">T</span>
          </div>
          <h1 className="text-3xl font-bold text-text-primary">Tabler</h1>
          <p className="text-text-secondary mt-1">Restoran İdarəetmə Sistemi</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-primary-100/50 p-8 border border-border">
          <h2 className="text-xl font-semibold text-text-primary mb-6">Giriş</h2>

          {error && (
            <div className="bg-danger-50 text-danger-600 text-sm px-4 py-3 rounded-xl mb-4 border border-danger-500/20">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">İstifadəçi adı</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-text-primary"
                  placeholder="istifadəçi adı"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Şifrə</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-secondary border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-text-primary"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-200 hover:shadow-primary-300"
            >
              <LogIn className="w-5 h-5" />
              Daxil ol
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-text-muted text-center mb-3">Demo hesablar:</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                onClick={() => { setUsername('admin'); setPassword('admin123'); }}
                className="bg-surface-secondary hover:bg-primary-50 text-text-secondary py-2 px-3 rounded-lg transition-colors border border-border"
              >
                Admin
              </button>
              <button
                onClick={() => { setUsername('waiter1'); setPassword('waiter123'); }}
                className="bg-surface-secondary hover:bg-primary-50 text-text-secondary py-2 px-3 rounded-lg transition-colors border border-border"
              >
                Ofisant
              </button>
              <button
                onClick={() => { setUsername('chef1'); setPassword('chef123'); }}
                className="bg-surface-secondary hover:bg-primary-50 text-text-secondary py-2 px-3 rounded-lg transition-colors border border-border"
              >
                Aşpaz
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
