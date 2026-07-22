import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import AppLayout from './components/layout/AppLayout';
import ToastContainer from './components/ui/ToastContainer';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminMenu from './pages/admin/AdminMenu';
import AdminTables from './pages/admin/AdminTables';
import AdminOrders from './pages/admin/AdminOrders';
import AdminReports from './pages/admin/AdminReports';
import StaffManagement from './pages/admin/StaffManagement';
import RoleManagement from './pages/admin/RoleManagement';
import WaiterDashboard from './pages/waiter/WaiterDashboard';
import KitchenDashboard from './pages/kitchen/KitchenDashboard';
import CustomerMenu from './pages/customer/CustomerMenu';
import CustomerOrder from './pages/customer/CustomerOrder';
import type { Permission } from './types';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const currentUser = useStore((s) => s.currentUser);
  if (!currentUser) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(currentUser.role)) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PermRoute({ children, permission }: { children: React.ReactNode; permission: Permission }) {
  const currentUser = useStore((s) => s.currentUser);
  const hasPermission = useStore((s) => s.hasPermission);
  if (!currentUser) return <Navigate to="/login" replace />;
  if (!hasPermission(permission)) return <Navigate to="/admin" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="menu" element={<PermRoute permission="menu.view"><AdminMenu /></PermRoute>} />
          <Route path="tables" element={<PermRoute permission="tables.view"><AdminTables /></PermRoute>} />
          <Route path="orders" element={<PermRoute permission="orders.view"><AdminOrders /></PermRoute>} />
          <Route path="reports" element={<PermRoute permission="reports.view"><AdminReports /></PermRoute>} />
          <Route path="staff" element={<PermRoute permission="staff.view"><StaffManagement /></PermRoute>} />
          <Route path="roles" element={<PermRoute permission="roles.view"><RoleManagement /></PermRoute>} />
        </Route>

        <Route
          path="/waiter"
          element={
            <ProtectedRoute allowedRoles={['waiter']}>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<WaiterDashboard />} />
        </Route>

        <Route
          path="/kitchen"
          element={
            <ProtectedRoute allowedRoles={['chef']}>
              <KitchenDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="/menu" element={<CustomerMenu />} />
        <Route path="/menu/:tableId" element={<CustomerMenu />} />
        <Route path="/order" element={<CustomerOrder />} />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
