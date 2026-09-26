import Header from '../../components/layout/Header';
import { useStore } from '../../store/useStore';
import { useTranslation } from '../../i18n';
import { localize } from '../../utils/localize';
import { getOrderStatusLabels } from '../../lib/constants';
import {
  useDashboardStats, useDashboardTopItems, useDashboardRecentOrders, useDashboardStaff,
} from '../../api/hooks/useDashboard';
import { useTables } from '../../api/hooks/useTables';
import type { OrderStatus } from '../../types';
import type { UserRoleEnum } from '../../api/types';
import {
  TrendingUp, ShoppingBag, Users, DollarSign, CheckCircle, Clock,
  ChefHat, UserCog, ArrowUpRight, Loader2,
} from 'lucide-react';

function statusStyle(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-success-50 text-success-600';
    case 'cancelled':
      return 'bg-danger-50 text-danger-600';
    case 'preparing':
      return 'bg-primary-50 text-primary-600';
    case 'ready':
      return 'bg-warning-50 text-warning-600';
    default:
      return 'bg-surface-secondary text-text-muted';
  }
}

function staffAvatarStyle(role: UserRoleEnum): string {
  if (role === 'ADMIN' || role === 'ORG_ADMIN') return 'bg-primary-100 text-primary-700';
  if (role === 'WAITER') return 'bg-warning-100 text-warning-700';
  return 'bg-success-100 text-success-700';
}

export default function AdminDashboard() {
  const { t, locale, formatDate } = useTranslation();
  const ORDER_STATUS_LABELS = getOrderStatusLabels(t);
  const currentUser = useStore((s) => s.currentUser);
  const orgId = currentUser?.orgId;

  const statsQuery = useDashboardStats(orgId);
  const topItemsQuery = useDashboardTopItems(orgId);
  const recentQuery = useDashboardRecentOrders(orgId);
  const staffQuery = useDashboardStaff(orgId);
  const tablesQuery = useTables(orgId);

  const isLoading =
    !statsQuery.data &&
    (statsQuery.isLoading || topItemsQuery.isLoading || recentQuery.isLoading || staffQuery.isLoading || tablesQuery.isLoading);
  const isError =
    statsQuery.isError || topItemsQuery.isError || recentQuery.isError || staffQuery.isError || tablesQuery.isError;

  const stats = statsQuery.data;
  const topItems = topItemsQuery.data ?? [];
  const recentOrders = recentQuery.data ?? [];
  const staff = staffQuery.data ?? [];
  const tables = tablesQuery.data ?? [];

  const totalTables = tables.length;
  const occupiedCount = tables.filter((table) => table.status === 'OCCUPIED').length;
  const occupiedText = totalTables > 0 ? `${stats?.occupiedTables ?? occupiedCount}/${totalTables}` : String(stats?.occupiedTables ?? occupiedCount);

  const refetchAll = () => {
    statsQuery.refetch();
    topItemsQuery.refetch();
    recentQuery.refetch();
    staffQuery.refetch();
    tablesQuery.refetch();
  };

  if (isLoading) {
    return (
      <div>
        <Header title={t('dashboard.welcome_overview')} subtitle={''} showUser />
        <div className="p-6">
          <div className="bg-white dark:bg-surface rounded-2xl border border-border p-12 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            <p className="text-sm text-text-secondary">...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title={t('dashboard.welcome_overview')} subtitle={''} showUser />

      <div className="p-6">
        {isError && (
          <div className="bg-danger-50 border border-danger-200 rounded-2xl p-4 mb-6 flex items-center justify-between">
            <p className="text-sm text-danger-700">{t('error.unexpected')}</p>
            <button
              onClick={refetchAll}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition-colors"
            >
              {t('error.retry')}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-surface rounded-2xl p-5 border border-border hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-success-50 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-success-600" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-success-500" />
            </div>
            <p className="text-2xl font-bold text-text-primary">{stats?.totalRevenue ?? 0} ₼</p>
            <p className="text-sm text-text-secondary mt-1">{t('dashboard.total_revenue')}</p>
          </div>
          <div className="bg-white dark:bg-surface rounded-2xl p-5 border border-border hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-primary-600" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-primary-500" />
            </div>
            <p className="text-2xl font-bold text-text-primary">{stats?.completedOrders ?? 0}</p>
            <p className="text-sm text-text-secondary mt-1">{t('dashboard.completed_orders')}</p>
          </div>
          <div className="bg-white dark:bg-surface rounded-2xl p-5 border border-border hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-warning-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning-600" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-warning-500" />
            </div>
            <p className="text-2xl font-bold text-text-primary">{stats?.activeOrders ?? 0}</p>
            <p className="text-sm text-text-secondary mt-1">{t('dashboard.active_orders')}</p>
          </div>
          <div className="bg-white dark:bg-surface rounded-2xl p-5 border border-border hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-danger-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-danger-600" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-danger-500" />
            </div>
            <p className="text-2xl font-bold text-text-primary">{occupiedText}</p>
            <p className="text-sm text-text-secondary mt-1">{t('dashboard.occupied_tables')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-white dark:bg-surface rounded-2xl p-6 border border-border">
            <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-500" />
              {t('dashboard.top_selling_items')}
            </h3>
            {topItems.length === 0 ? (
              <p className="text-text-muted text-center py-6">{t('dashboard.no_sales')}</p>
            ) : (
              <div className="space-y-3">
                {topItems.map((item, i) => (
                  <div key={item.menuItemId || i} className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-text-primary truncate">{localize(item.name, locale)}</p>
                        <span className="text-sm font-bold text-primary-600">{item.count} {t('dashboard.orders_suffix')}</span>
                      </div>
                      <div className="w-full bg-border rounded-full h-1.5 mt-1">
                        <div
                          className="bg-primary-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${(item.count / (topItems[0]?.count || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-surface rounded-2xl p-6 border border-border">
            <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
              <UserCog className="w-5 h-5 text-primary-500" />
              {t('dashboard.active_staff')}
            </h3>
            <div className="space-y-3">
              {staff.map((s) => (
                <div key={s.id} className="flex items-center gap-3 p-3 bg-surface-secondary rounded-xl">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${staffAvatarStyle(s.role)}`}>
                    <span className={`text-xs font-bold ${staffAvatarStyle(s.role)}`}>
                      {s.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-primary truncate">{s.name}</p>
                    <p className="text-xs text-text-muted">{t(`role.${s.role.toLowerCase()}`)}</p>
                  </div>
                  <span className="text-xs text-text-muted">{s.activeOrders} {t('dashboard.orders_suffix')}</span>
                </div>
              ))}
              {staff.length === 0 && (
                <p className="text-text-muted text-center py-4 text-sm">{t('dashboard.no_staff')}</p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-surface rounded-2xl p-6 border border-border">
            <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary-500" />
              {t('dashboard.recent_orders')}
            </h3>
            <div className="space-y-2">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-surface-secondary rounded-xl">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{t('table.number_prefix', { number: order.tableNumber })}</p>
                    <p className="text-xs text-text-muted">{order.waiterName} • {formatDate(order.createdAt, { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-text-primary">{order.totalAmount} ₼</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusStyle(order.status.toLowerCase())}`}>
                      {ORDER_STATUS_LABELS[order.status.toLowerCase() as OrderStatus]}
                    </span>
                  </div>
                </div>
              ))}
              {recentOrders.length === 0 && (
                <p className="text-center text-text-muted py-6 text-sm">{t('dashboard.no_orders')}</p>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-surface rounded-2xl p-6 border border-border">
            <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-primary-500" />
              {t('dashboard.table_map')}
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {tables.map((table) => {
                const status = table.status;
                return (
                  <div
                    key={table.id}
                    className={`p-2.5 rounded-xl border text-center ${
                      status === 'AVAILABLE' ? 'border-success-200 bg-success-50' :
                      status === 'OCCUPIED' ? 'border-danger-200 bg-danger-50' :
                      status === 'RESERVED' ? 'border-warning-200 bg-warning-50' :
                      'border-border bg-surface-secondary'
                    }`}
                  >
                    <p className="text-sm font-bold text-text-primary">#{table.tableNumber}</p>
                    <p className={`text-[10px] font-medium mt-0.5 ${
                      status === 'AVAILABLE' ? 'text-success-600' :
                      status === 'OCCUPIED' ? 'text-danger-600' :
                      status === 'RESERVED' ? 'text-warning-600' :
                      'text-text-muted'
                    }`}>
                      {status === 'AVAILABLE' ? t('table.status.available') :
                       status === 'OCCUPIED' ? t('table.status.occupied') :
                       status === 'RESERVED' ? t('table.status.reserved') : t('table.status.cleaning')}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
