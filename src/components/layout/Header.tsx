import { Bell, Search, Menu, LogOut, User } from 'lucide-react';
import { useSidebar } from '../../store/useSidebar';
import { useStore } from '../../store/useStore';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showUser?: boolean;
}

export default function Header({ title, subtitle, showUser }: HeaderProps) {
  const toggleSidebar = useSidebar((s) => s.toggle);
  const currentUser = useStore((s) => s.currentUser);
  const logout = useStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-border px-4 lg:px-6 py-3 lg:py-4 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {showUser ? (
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center">
              <User className="w-4.5 h-4.5 text-primary-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-primary">{title}</h1>
              {subtitle && <p className="text-sm text-text-secondary mt-0.5">{subtitle}</p>}
            </div>
          </div>
        ) : (
          <>
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-xl hover:bg-surface-secondary transition-colors lg:hidden"
            >
              <Menu className="w-5 h-5 text-text-secondary" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-text-primary">{title}</h1>
              {subtitle && <p className="text-sm text-text-secondary mt-0.5">{subtitle}</p>}
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        {showUser ? (
          <>
            {currentUser && (
              <span className="text-sm font-medium text-text-secondary hidden sm:block">
                {currentUser.name}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 bg-danger-50 text-danger-600 hover:bg-danger-100 rounded-xl text-sm font-medium transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Çıxış</span>
            </button>
          </>
        ) : (
          <>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Axtar..."
                className="pl-9 pr-4 py-2 bg-surface-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64 transition-all"
              />
            </div>
            <button className="relative p-2 hover:bg-surface-secondary rounded-xl transition-colors">
              <Bell className="w-5 h-5 text-text-secondary" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger-500 rounded-full"></span>
            </button>
          </>
        )}
      </div>
    </header>
  );
}
