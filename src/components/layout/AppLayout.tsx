import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useSidebar } from '../../store/useSidebar';

export default function AppLayout() {
  const location = useLocation();
  const closeSidebar = useSidebar((s) => s.close);

  useEffect(() => {
    closeSidebar();
  }, [location.pathname, closeSidebar]);

  return (
    <div className="flex min-h-screen bg-surface-secondary">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
