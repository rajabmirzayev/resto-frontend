import Header from '../../components/layout/Header';
import { useStore } from '../../store/useStore';
import { useTranslation } from '../../i18n';
import { localize } from '../../utils/localize';
import { getOrderStatusLabels } from '../../lib/constants';
import {
  TrendingUp, ShoppingBag, Users, DollarSign, CheckCircle, Clock,
  ChefHat, UserCog, ArrowUpRight,
} from 'lucide-react';

export default function AdminDashboard() {
  const { t, locale, formatDate } = useTranslation();
  const ORDER_STATUS_LABELS = getOrderStatusLabels(t);
  const { orders, tables, menuItems, users } = useStore();

  const totalRevenue = orders.filter((o) => o.paymentStatus === 'paid').reduce((s, o) => s + o.totalAmount, 0);
  const completedOrders = orders.filter((o) => o.status === 'completed');
  const activeOrders = orders.filter((o) => !['completed', 'cancelled'].includes(o.status));
  const occupiedTables = tables.filter((table) => table.status === 'occupied');

  const itemCounts: Record<string, number> = {};
  orders.forEach((o) => {
    o.items.forEach((item) => {
      itemCounts[item.menuItemId] = (itemCounts[item.menuItemId] || 0) + item.quantity;
    });
  });
  const topItems = Object.entries(itemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => {
      const mi = menuItems.find((m) => m.id === id);
      return { name: mi ? localize(mi.name, locale) : t('common.unknown'), count };
    });

  const staff = users.filter((u) => u.role !== 'customer');

  return (
    <div>
      <Header title={t('dashboard.welcome_overview')} subtitle={''} showUser />

      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-surface rounded-2xl p-5 border border-border hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-success-50 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-success-600" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-success-500" />
            </div>
            <p className="text-2xl font-bold text-text-primary">{totalRevenue} ₼</p>
            <p className="text-sm text-text-secondary mt-1">{t('dashboard.total_revenue')}</p>
          </div>
          <div className="bg-white dark:bg-surface rounded-2xl p-5 border border-border hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-primary-600" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-primary-500" />
            </div>
            <p className="text-2xl font-bold text-text-primary">{completedOrders.length}</p>
            <p className="text-sm text-text-secondary mt-1">{t('dashboard.completed_orders')}</p>
          </div>
          <div className="bg-white dark:bg-surface rounded-2xl p-5 border border-border hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-warning-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning-600" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-warning-500" />
            </div>
            <p className="text-2xl font-bold text-text-primary">{activeOrders.length}</p>
            <p className="text-sm text-text-secondary mt-1">{t('dashboard.active_orders')}</p>
          </div>
          <div className="bg-white dark:bg-surface rounded-2xl p-5 border border-border hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-danger-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-danger-600" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-danger-500" />
            </div>
            <p className="text-2xl font-bold text-text-primary">{occupiedTables.length}/{tables.length}</p>
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
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-text-primary truncate">{item.name}</p>
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
              {staff.map((s) => {
                const orderCount = orders.filter((o) => o.waiterId === s.id && !['completed', 'cancelled'].includes(o.status)).length;
                return (
                  <div key={s.id} className="flex items-center gap-3 p-3 bg-surface-secondary rounded-xl">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                      s.role === 'admin' ? 'bg-primary-100' : s.role === 'waiter' ? 'bg-warning-100' : 'bg-success-100'
                    }`}>
                      <span className={`text-xs font-bold ${
                        s.role === 'admin' ? 'text-primary-700' : s.role === 'waiter' ? 'text-warning-700' : 'text-success-700'
                      }`}>
                        {s.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">{s.name}</p>
                      <p className="text-xs text-text-muted">
                        {s.role === 'admin' ? t('role.admin') : s.role === 'waiter' ? t('role.waiter') : t('role.chef')}
                      </p>
                    </div>
                    <span className="text-xs text-text-muted">{orderCount} {t('dashboard.orders_suffix')}</span>
                  </div>
                );
              })}
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
              {orders.slice(-6).reverse().map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-surface-secondary rounded-xl">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{t('table.number_prefix', { number: order.tableNumber })}</p>
                    <p className="text-xs text-text-muted">{order.waiterName} • {formatDate(order.createdAt, { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-text-primary">{order.totalAmount} ₼</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      order.status === 'completed' ? 'bg-success-50 text-success-600' :
                      order.status === 'cancelled' ? 'bg-danger-50 text-danger-600' :
                      order.status === 'preparing' ? 'bg-primary-50 text-primary-600' :
                      order.status === 'ready' ? 'bg-warning-50 text-warning-600' :
                      'bg-surface-secondary text-text-muted'
                    }`}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </div>
                </div>
              ))}
              {orders.length === 0 && (
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
              {tables.map((table) => (
                <div
                  key={table.id}
                  className={`p-2.5 rounded-xl border text-center ${
                    table.status === 'available' ? 'border-success-200 bg-success-50' :
                    table.status === 'occupied' ? 'border-danger-200 bg-danger-50' :
                    table.status === 'reserved' ? 'border-warning-200 bg-warning-50' :
                    'border-border bg-surface-secondary'
                  }`}
                >
                  <p className="text-sm font-bold text-text-primary">#{table.number}</p>
                  <p className={`text-[10px] font-medium mt-0.5 ${
                    table.status === 'available' ? 'text-success-600' :
                    table.status === 'occupied' ? 'text-danger-600' :
                    table.status === 'reserved' ? 'text-warning-600' :
                    'text-text-muted'
                  }`}>
                    {table.status === 'available' ? t('table.status.available') :
                     table.status === 'occupied' ? t('table.status.occupied') :
                     table.status === 'reserved' ? t('table.status.reserved') : t('table.status.cleaning')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
