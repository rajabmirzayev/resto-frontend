import { useMemo } from 'react';
import Header from '../../components/layout/Header';
import { useStore } from '../../store/useStore';
import { useTranslation } from '../../i18n';
import { localize } from '../../utils/localize';
import {
  DollarSign, TrendingUp, BarChart3, PieChart, Users, ShoppingBag,
  ArrowUpRight, ArrowDownRight,
} from 'lucide-react';

export default function AdminReports() {
  const { t, locale, formatDate } = useTranslation();
  const { orders, menuItems, menuCategories, users } = useStore();

  const paidOrders = useMemo(() => orders.filter((o) => o.paymentStatus === 'paid'), [orders]);
  const totalRevenue = useMemo(() => paidOrders.reduce((s, o) => s + o.totalAmount, 0), [paidOrders]);
  const completedCount = useMemo(() => orders.filter((o) => o.status === 'completed').length, [orders]);
  const cancelledCount = useMemo(() => orders.filter((o) => o.status === 'cancelled').length, [orders]);
  const avgOrderValue = useMemo(() => paidOrders.length > 0 ? Math.round(totalRevenue / paidOrders.length) : 0, [paidOrders, totalRevenue]);

  const dailyRevenue = useMemo(() => {
    const now = new Date();
    const days: { label: string; revenue: number; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split('T')[0];
      const dayName = formatDate(d, { weekday: 'short' });
      const dayOrders = paidOrders.filter((o) => o.createdAt.startsWith(dayStr));
      const revenue = dayOrders.reduce((s, o) => s + o.totalAmount, 0);
      days.push({ label: dayName, revenue, count: dayOrders.length });
    }
    return days;
  }, [paidOrders, formatDate]);

  const maxDailyRevenue = Math.max(...dailyRevenue.map((d) => d.revenue), 1);

  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    orders.forEach((o) => {
      o.items.forEach((item) => {
        const mi = menuItems.find((m) => m.id === item.menuItemId);
        if (mi) {
          stats[mi.category] = (stats[mi.category] || 0) + item.quantity;
        }
      });
    });
    return Object.entries(stats)
      .map(([catId, count]) => {
        const cat = menuCategories.find((c) => c.id === catId);
        return { name: cat ? localize(cat.name, locale) : t('common.unknown'), count };
      })
      .sort((a, b) => b.count - a.count);
  }, [orders, menuItems, menuCategories, t]);

  const maxCatCount = Math.max(...categoryStats.map((c) => c.count), 1);

  const topItems = useMemo(() => {
    const counts: Record<string, { name: string; count: number; revenue: number }> = {};
    orders.forEach((o) => {
      o.items.forEach((item) => {
        if (!counts[item.menuItemId]) {
          counts[item.menuItemId] = { name: item.menuItemName, count: 0, revenue: 0 };
        }
        counts[item.menuItemId].count += item.quantity;
        counts[item.menuItemId].revenue += item.price * item.quantity;
      });
    });
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [orders]);

  const maxItemCount = Math.max(...topItems.map((i) => i.count), 1);

  const staffPerformance = useMemo(() => {
    const staff = users.filter((u) => u.role !== 'customer');
    return staff.map((s) => {
      const staffOrders = orders.filter((o) => o.waiterId === s.id);
      const completed = staffOrders.filter((o) => o.status === 'completed');
      const revenue = completed.reduce((s, o) => s + o.totalAmount, 0);
      return {
        name: s.name,
        role: s.role === 'admin' ? t('role.admin') : s.role === 'waiter' ? t('role.waiter') : t('role.chef'),
        totalOrders: staffOrders.length,
        completedOrders: completed.length,
        revenue,
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [orders, users, t]);

  const maxStaffRevenue = Math.max(...staffPerformance.map((s) => s.revenue), 1);

  const hourlyData = useMemo(() => {
    const hours: number[] = new Array(24).fill(0);
    orders.forEach((o) => {
      const h = new Date(o.createdAt).getHours();
      hours[h]++;
    });
    return hours;
  }, [orders]);

  const maxHourly = Math.max(...hourlyData, 1);

  const colors = [
    'bg-primary-500', 'bg-success-500', 'bg-warning-500', 'bg-danger-500',
    'bg-primary-400', 'bg-success-400', 'bg-warning-400', 'bg-danger-400',
  ];

  return (
    <div>
      <Header title={t('reports.title')} subtitle={t('reports.subtitle')} showUser />

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
            <p className="text-sm text-text-secondary mt-1">{t('reports.total_revenue')}</p>
          </div>
          <div className="bg-white dark:bg-surface rounded-2xl p-5 border border-border hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-primary-600" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-primary-500" />
            </div>
            <p className="text-2xl font-bold text-text-primary">{completedCount}</p>
            <p className="text-sm text-text-secondary mt-1">{t('reports.completed')}</p>
          </div>
          <div className="bg-white dark:bg-surface rounded-2xl p-5 border border-border hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-warning-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-warning-600" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-warning-500" />
            </div>
            <p className="text-2xl font-bold text-text-primary">{avgOrderValue} ₼</p>
            <p className="text-sm text-text-secondary mt-1">{t('reports.avg_order')}</p>
          </div>
          <div className="bg-white dark:bg-surface rounded-2xl p-5 border border-border hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-danger-50 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-danger-600" />
              </div>
              <ArrowDownRight className="w-4 h-4 text-danger-500" />
            </div>
            <p className="text-2xl font-bold text-text-primary">{cancelledCount}</p>
            <p className="text-sm text-text-secondary mt-1">{t('reports.cancelled')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white dark:bg-surface rounded-2xl p-6 border border-border">
            <h3 className="text-lg font-bold text-text-primary mb-1 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-500" />
              {t('reports.daily_revenue')}
            </h3>
            <p className="text-xs text-text-muted mb-5">{t('reports.daily_revenue_subtitle')}</p>
            <div className="flex items-end gap-2 h-48">
              {dailyRevenue.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-semibold text-text-primary">{day.revenue > 0 ? `${day.revenue}` : ''}</span>
                  <div className="w-full flex flex-col items-center">
                    <div
                      className="w-full bg-primary-500 rounded-t-lg transition-all duration-500 hover:bg-primary-600 min-h-[4px]"
                      style={{ height: `${(day.revenue / maxDailyRevenue) * 160}px` }}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-text-muted mt-1">{day.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-surface rounded-2xl p-6 border border-border">
            <h3 className="text-lg font-bold text-text-primary mb-1 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-warning-500" />
              {t('reports.hourly_distribution')}
            </h3>
            <p className="text-xs text-text-muted mb-5">{t('reports.hourly_subtitle')}</p>
            <div className="flex items-end gap-0.5 h-48">
              {hourlyData.map((count, h) => (
                <div key={h} className="flex-1 flex flex-col items-center justify-end h-full" title={`${h}:00 — ${count} ${t('order.items_suffix')}`}>
                  <div
                    className="w-full bg-warning-400 rounded-t-sm transition-all duration-300 hover:bg-warning-500"
                    style={{ height: `${(count / maxHourly) * 180}px`, minHeight: count > 0 ? '4px' : '0px' }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[10px] text-text-muted">0:00</span>
              <span className="text-[10px] text-text-muted">6:00</span>
              <span className="text-[10px] text-text-muted">12:00</span>
              <span className="text-[10px] text-text-muted">18:00</span>
              <span className="text-[10px] text-text-muted">23:00</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white dark:bg-surface rounded-2xl p-6 border border-border">
            <h3 className="text-lg font-bold text-text-primary mb-1 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-success-500" />
              {t('reports.sales_by_category')}
            </h3>
            <p className="text-xs text-text-muted mb-5">{t('reports.top_categories')}</p>
            <div className="space-y-3">
              {categoryStats.map((cat, i) => (
                <div key={cat.name} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-text-secondary w-24 truncate">{cat.name}</span>
                  <div className="flex-1 h-6 bg-surface-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${colors[i % colors.length]}`}
                      style={{ width: `${(cat.count / maxCatCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-text-primary w-12 text-right">{cat.count}</span>
                </div>
              ))}
              {categoryStats.length === 0 && (
                <p className="text-center text-text-muted py-4 text-sm">{t('common.no_data')}</p>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-surface rounded-2xl p-6 border border-border">
            <h3 className="text-lg font-bold text-text-primary mb-1 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-500" />
              {t('reports.top_selling_items')}
            </h3>
            <p className="text-xs text-text-muted mb-5">{t('reports.top_8_by_quantity')}</p>
            <div className="space-y-3">
              {topItems.map((item, i) => (
                <div key={item.name} className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-text-primary truncate">{item.name}</span>
                      <span className="text-[10px] text-text-muted ml-2">{item.revenue} ₼</span>
                    </div>
                    <div className="w-full h-2 bg-surface-secondary rounded-full overflow-hidden mt-1">
                      <div
                        className="h-full rounded-full bg-primary-500 transition-all duration-700"
                        style={{ width: `${(item.count / maxItemCount) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-primary-600 w-10 text-right">{item.count}x</span>
                </div>
              ))}
              {topItems.length === 0 && (
                <p className="text-center text-text-muted py-4 text-sm">{t('reports.no_sales')}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-surface rounded-2xl p-6 border border-border">
          <h3 className="text-lg font-bold text-text-primary mb-1 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-500" />
            {t('reports.staff_performance')}
          </h3>
          <p className="text-xs text-text-muted mb-5">{t('reports.staff_performance_subtitle')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {staffPerformance.map((staff, i) => (
              <div key={staff.name} className="bg-surface-secondary rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    staff.role === t('role.admin') ? 'bg-primary-100' : staff.role === t('role.waiter') ? 'bg-warning-100' : 'bg-success-100'
                  }`}>
                    <span className={`text-sm font-bold ${
                      staff.role === t('role.admin') ? 'text-primary-700' : staff.role === t('role.waiter') ? 'text-warning-700' : 'text-success-700'
                    }`}>{staff.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text-primary">{staff.name}</p>
                    <p className="text-[10px] text-text-muted">{staff.role}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-white dark:bg-surface rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-text-primary">{staff.totalOrders}</p>
                    <p className="text-[10px] text-text-muted">{t('reports.total')}</p>
                  </div>
                  <div className="bg-white dark:bg-surface rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-success-600">{staff.completedOrders}</p>
                    <p className="text-[10px] text-text-muted">{t('common.active')}</p>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-text-muted">{t('reports.revenue')}</span>
                    <span className="text-xs font-bold text-primary-600">{staff.revenue} ₼</span>
                  </div>
                  <div className="w-full h-2 bg-white dark:bg-surface rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${colors[i % colors.length]}`}
                      style={{ width: `${(staff.revenue / maxStaffRevenue) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
