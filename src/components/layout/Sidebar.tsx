import { LayoutDashboard, Menu, Grid3X3, ClipboardList, Users, BarChart3, ChefHat, Shield, X, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { useSidebar } from '../../store/useSidebar';
import type { Permission } from '../../types';

const navItems: { to: string; label: string; icon: typeof LayoutDashboard; permission: Permission }[] = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
  { to: '/admin/menu', label: 'Menyu', icon: Menu, permission: 'menu.view' },
  { to: '/admin/tables', label: 'Masalar', icon: Grid3X3, permission: 'tables.view' },
  { to: '/admin/orders', label: 'Sifarişlər', icon: ClipboardList, permission: 'orders.view' },
  { to: '/admin/reports', label: 'Hesabatlar', icon: BarChart3, permission: 'reports.view' },
  { to: '/admin/staff', label: 'Personal', icon: Users, permission: 'staff.view' },
  { to: '/admin/roles', label: 'Rollar', icon: Shield, permission: 'roles.view' },
  { to: '/admin/settings', label: 'Tənzimləmələr', icon: Settings, permission: 'dashboard.view' },
];

export default function Sidebar() {
  const currentUser = useStore((s) => s.currentUser);
  const hasPermission = useStore((s) => s.hasPermission);
  const roles = useStore((s) => s.roles);
  const { open, close } = useSidebar();

  const currentRole = roles.find((r) => r.id === currentUser?.roleId);

  const visibleItems = navItems.filter((item) => hasPermission(item.permission));

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={close} />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen w-64 bg-white border-r border-border flex flex-col
          transform transition-transform duration-300 ease-in-out
          lg:sticky lg:translate-x-0 lg:z-10
          ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-5 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-200">
                <ChefHat className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-text-primary leading-tight">Tabler</h1>
                <p className="text-xs text-text-muted">{currentRole?.name || 'Admin Panel'}</p>
              </div>
            </div>
            <button onClick={close} className="p-2 rounded-xl hover:bg-surface-secondary transition-colors lg:hidden">
              <X className="w-5 h-5 text-text-muted" />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin'}
              onClick={close}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 shadow-sm'
                    : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-primary-700">
                {currentUser?.name?.charAt(0) || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{currentUser?.name}</p>
              <p className="text-xs text-text-muted">{currentRole?.name || 'İstifadəçi'}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
