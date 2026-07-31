import Header from '../../components/layout/Header';
import { useStore } from '../../store/useStore';
import { useTranslation } from '../../i18n';
import { getOrderStatusLabels, ORDER_STATUS_STYLES } from '../../lib/constants';
import { useOrders } from '../../api/hooks/useOrders';
import type { OrderStatus } from '../../types';
import { Loader2 } from 'lucide-react';

export default function AdminOrders() {
  const { t, formatDate } = useTranslation();
  const ORDER_STATUS_LABELS = getOrderStatusLabels(t);
  const currentUser = useStore((s) => s.currentUser);
  const orgId = currentUser?.orgId;

  const ordersQuery = useOrders(orgId);
  const orders = ordersQuery.data ?? [];

  const sortedOrders = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (ordersQuery.isLoading && !ordersQuery.data) {
    return (
      <div>
        <Header title={t('orders.history_title')} subtitle={''} showUser />
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
      <Header title={t('orders.history_title')} subtitle={t('orders.total_orders', { count: orders.length })} showUser />

      <div className="p-6">
        {ordersQuery.isError && (
          <div className="bg-danger-50 border border-danger-200 rounded-2xl p-4 mb-6 flex items-center justify-between">
            <p className="text-sm text-danger-700">{t('error.unexpected')}</p>
            <button
              onClick={() => ordersQuery.refetch()}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition-colors"
            >
              {t('error.retry')}
            </button>
          </div>
        )}

        <div className="bg-white dark:bg-surface rounded-2xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-secondary">
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-6 py-3">{t('orders.table_header.id')}</th>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-6 py-3">{t('orders.table_header.table')}</th>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-6 py-3">{t('orders.table_header.waiter')}</th>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-6 py-3">{t('orders.table_header.items')}</th>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-6 py-3">{t('orders.table_header.amount')}</th>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-6 py-3">{t('orders.table_header.status')}</th>
                <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-6 py-3">{t('orders.table_header.date')}</th>
              </tr>
            </thead>
            <tbody>
              {sortedOrders.map((order) => {
                const status = order.status.toLowerCase() as OrderStatus;
                return (
                  <tr key={order.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono text-text-secondary">
                      {order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-text-primary">#{order.tableNumber}</td>
                    <td className="px-6 py-4 text-sm text-text-secondary">{order.waiterName}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {order.items.map((item) => (
                          <span key={item.id} className="text-xs bg-surface-secondary text-text-secondary px-2 py-0.5 rounded-full">
                            {item.menuItemName} ×{item.quantity}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-text-primary">{order.totalAmount} ₼</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${ORDER_STATUS_STYLES[status]}`}>
                        {ORDER_STATUS_LABELS[status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-muted">
                      {formatDate(order.createdAt)}
                    </td>
                  </tr>
                );
              })}
              {sortedOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-text-muted">{t('orders.no_orders_yet')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
