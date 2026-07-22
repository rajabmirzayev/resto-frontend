import { useState } from 'react';
import { Bell, Search, Menu, LogOut, Globe, Sun, Moon, ChevronDown } from 'lucide-react';
import { useSidebar } from '../../store/useSidebar';
import { useStore } from '../../store/useStore';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showUser?: boolean;
}

const LANGUAGES = [
  { code: 'az', label: 'Azərbaycanca', flag: '🇦🇿' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
];

export default function Header({ title, subtitle, showUser }: HeaderProps) {
  const toggleSidebar = useSidebar((s) => s.toggle);
  const currentUser = useStore((s) => s.currentUser);
  const logout = useStore((s) => s.logout);
  const navigate = useNavigate();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [selectedLang, setSelectedLang] = useState('az');
  const [isDark, setIsDark] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: 'Admin',
      waiter: 'Ofisant',
      chef: 'Aşpaz',
      customer: 'Müştəri',
    };
    return labels[role] || role;
  };

  const currentLang = LANGUAGES.find((l) => l.code === selectedLang);

  return (
    <header className="bg-white border-b border-border px-4 lg:px-6 py-3 lg:py-4 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {!showUser && (
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-xl hover:bg-surface-secondary transition-colors lg:hidden"
          >
            <Menu className="w-5 h-5 text-text-secondary" />
          </button>
        )}
        <div>
          <h1 className="text-xl font-bold text-text-primary">{title}</h1>
          {subtitle && <p className="text-sm text-text-secondary mt-0.5">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {!showUser && (
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
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger-500 rounded-full" />
            </button>
          </>
        )}

        {showUser && (
          <>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Axtar..."
                className="pl-9 pr-4 py-2 bg-surface-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64 transition-all"
              />
            </div>

            <button className="relative p-2 hover:bg-surface-secondary rounded-xl transition-colors hidden sm:flex">
              <Bell className="w-5 h-5 text-text-secondary" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger-500 rounded-full" />
            </button>

            <div className="relative">
              <button
                onClick={() => { setShowLanguageMenu(!showLanguageMenu); setShowProfileMenu(false); }}
                className="flex items-center gap-1.5 px-2.5 py-2 hover:bg-surface-secondary rounded-xl transition-colors text-sm"
                title="Dil"
              >
                <Globe className="w-4 h-4 text-text-secondary" />
                <span className="hidden lg:inline text-text-secondary font-medium">{currentLang?.flag}</span>
              </button>
              {showLanguageMenu && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-xl border border-border shadow-xl py-1.5 w-44 z-50">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => { setSelectedLang(lang.code); setShowLanguageMenu(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                        selectedLang === lang.code
                          ? 'bg-primary-50 text-primary-700 font-semibold'
                          : 'text-text-secondary hover:bg-surface-secondary'
                      }`}
                    >
                      <span className="text-base">{lang.flag}</span>
                      <span>{lang.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 hover:bg-surface-secondary rounded-xl transition-colors hidden sm:flex"
              title={isDark ? 'İşıqlı rejim' : 'Tünd rejim'}
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-warning-500" />
              ) : (
                <Moon className="w-5 h-5 text-text-secondary" />
              )}
            </button>

            <div className="relative">
              <button
                onClick={() => { setShowProfileMenu(!showProfileMenu); setShowLanguageMenu(false); }}
                className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 hover:bg-surface-secondary rounded-xl transition-colors"
              >
                {currentUser && (
                  <>
                    <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-white">
                        {getInitials(currentUser.name)}
                      </span>
                    </div>
                    <div className="hidden lg:block text-left">
                      <p className="text-sm font-semibold text-text-primary leading-tight">{currentUser.name}</p>
                      <p className="text-[11px] text-text-muted">{getRoleLabel(currentUser.role)}</p>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-text-muted hidden lg:block" />
                  </>
                )}
              </button>
              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-xl border border-border shadow-xl py-1.5 w-52 z-50">
                  {currentUser && (
                    <div className="px-3 py-2.5 border-b border-border">
                      <p className="text-sm font-semibold text-text-primary">{currentUser.name}</p>
                      <p className="text-xs text-text-muted">@{currentUser.username}</p>
                    </div>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-danger-600 hover:bg-danger-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="font-medium">Çıxış</span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {!showUser && (
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 bg-danger-50 text-danger-600 hover:bg-danger-100 rounded-xl text-sm font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Çıxış</span>
          </button>
        )}
      </div>
    </header>
  );
}
