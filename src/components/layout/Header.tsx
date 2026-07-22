import { Bell, Search, Menu } from 'lucide-react';
import { useSidebar } from '../../store/useSidebar';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const toggleSidebar = useSidebar((s) => s.toggle);

  return (
    <header className="bg-white border-b border-border px-4 lg:px-6 py-3 lg:py-4 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
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
      </div>

      <div className="flex items-center gap-3">
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
      </div>
    </header>
  );
}
