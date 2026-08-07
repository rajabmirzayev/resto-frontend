import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import { getAccessToken, getOrgIdFromToken, getUiScope } from './api/session';
import AppLayout from './components/layout/AppLayout';
import ToastContainer from './components/ui/ToastContainer';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { I18nProvider } from './i18n';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminMenu from './pages/admin/AdminMenu';
import AdminTables from './pages/admin/AdminTables';
import AdminOrders from './pages/admin/AdminOrders';
import AdminReports from './pages/admin/AdminReports';
import StaffManagement from './pages/admin/StaffManagement';
import RoleManagement from './pages/admin/RoleManagement';
import AdminSettings from './pages/admin/AdminSettings';
import AdminOrganizations from './pages/admin/Organizations';
import WaiterDashboard from './pages/waiter/WaiterDashboard';
import KitchenDashboard from './pages/kitchen/KitchenDashboard';
import CustomerMenu from './pages/customer/CustomerMenu';
import CustomerOrder from './pages/customer/CustomerOrder';
import type { Permission } from './types';

function ProtectedRoute({ children, scope }: { children: React.ReactNode; scope: string[] }) {
  const currentUser = useStore((s) => s.currentUser);
  const savedScope = getUiScope();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (!scope.includes(savedScope ?? '')) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PermRoute({ children, permission }: { children: React.ReactNode; permission: Permission }) {
  const currentUser = useStore((s) => s.currentUser);
  const hasPermission = useStore((s) => s.hasPermission);
  if (!currentUser) return <Navigate to="/login" replace />;
  if (!hasPermission(permission)) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function OrgIdBackfill() {
  const currentUser = useStore((s) => s.currentUser);
  useEffect(() => {
    const token = getAccessToken();
    if (currentUser && !currentUser.orgId && token) {
      const orgId = getOrgIdFromToken(token);
      if (orgId) {
        useStore.setState({ currentUser: { ...currentUser, orgId } });
      }
    }
  }, [currentUser]);
  return null;
}

export default function App() {
  return (
    <I18nProvider>
      <ErrorBoundary>
        <OrgIdBackfill />
        <BrowserRouter>
          <ToastContainer />
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute scope={['ADMIN_PANEL', 'SUPER_ADMIN_PANEL']}>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="menu" element={<PermRoute permission="menu.view"><AdminMenu /></PermRoute>} />
            <Route path="tables" element={<PermRoute permission="table.view"><AdminTables /></PermRoute>} />
            <Route path="orders" element={<PermRoute permission="order.view"><AdminOrders /></PermRoute>} />
            <Route path="reports" element={<PermRoute permission="report.view"><AdminReports /></PermRoute>} />
            <Route path="staff" element={<PermRoute permission="staff.view"><StaffManagement /></PermRoute>} />
            <Route path="roles" element={<PermRoute permission="role.view"><RoleManagement /></PermRoute>} />
            <Route path="settings" element={<PermRoute permission="settings.view"><AdminSettings /></PermRoute>} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          <Route
            path="/waiter"
            element={
              <ProtectedRoute scope={['WAITER_PANEL']}>
                <WaiterDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/kitchen"
            element={
              <ProtectedRoute scope={['KITCHEN_PANEL']}>
                <KitchenDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/super-admin"
            element={
              <ProtectedRoute scope={['SUPER_ADMIN_PANEL']}>
                <AdminOrganizations />
              </ProtectedRoute>
            }
          />

          <Route path="/menu" element={<CustomerMenu />} />
          <Route path="/menu/:tableId" element={<CustomerMenu />} />
          <Route path="/org/:orgId/menu" element={<CustomerMenu />} />
          <Route path="/org/:orgId/menu/:tableId" element={<CustomerMenu />} />
          <Route path="/order" element={<CustomerOrder />} />

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    </I18nProvider>
  );
}
