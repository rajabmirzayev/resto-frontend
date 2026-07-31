import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '../../i18n';
import Header from '../../components/layout/Header';
import { useStore } from '../../store/useStore';
import { useToast } from '../../store/useToast';
import { playNewOrderSound } from '../../lib/sounds';
import { useKitchenOrders } from '../../api/hooks/useKitchen';
import KitchenOrderCard from '../../components/kitchen/KitchenOrderCard';
import { Clock, CheckCircle, ChefHat, AlertCircle, Loader2 } from 'lucide-react';

export default function KitchenDashboard() {
  const { t } = useTranslation();
  const currentUser = useStore((s) => s.currentUser);
  const orgId = currentUser?.orgId;
  const { addToast } = useToast();
  const prevPendingCount = useRef(0);
  const [, forceUpdate] = useState(0);

  const kitchenQuery = useKitchenOrders(orgId, { refetchInterval: 10000 });

  // Force re-render every 2 seconds so elapsed timers in KitchenOrderCard update in real time.
  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate((n) => n + 1);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const pendingCount = (kitchenQuery.data?.new ?? []).length;
    if (prevPendingCount.current > 0 && pendingCount > prevPendingCount.current) {
      const newCount = pendingCount - prevPendingCount.current;
      playNewOrderSound();
      addToast(t('toast.new_orders_received', { count: newCount }), 'warning', 5000);
    }
    prevPendingCount.current = pendingCount;
  }, [kitchenQuery.data, addToast, t]);

  const newOrders = kitchenQuery.data?.new ?? [];
  const preparingOrders = kitchenQuery.data?.preparing ?? [];
  const readyOrders = kitchenQuery.data?.ready ?? [];

  if (kitchenQuery.isLoading && !kitchenQuery.data) {
    return (
      <div>
        <Header title={t('kitchen.title')} subtitle={`${newOrders.length + preparingOrders.length} ${t('kitchen.active')}, ${readyOrders.length} ${t('kitchen.ready')}`} showUser showSidebarButton={false} />
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
      <Header title={t('kitchen.title')} subtitle={`${newOrders.length + preparingOrders.length} ${t('kitchen.active')}, ${readyOrders.length} ${t('kitchen.ready')}`} showUser showSidebarButton={false} />

      <div className="p-6">
        {kitchenQuery.isError && (
          <div className="bg-danger-50 border border-danger-200 rounded-2xl p-4 mb-6 flex items-center justify-between">
            <p className="text-sm text-danger-700">{t('error.unexpected')}</p>
            <button
              onClick={() => kitchenQuery.refetch()}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition-colors"
            >
              {t('error.retry')}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-surface rounded-2xl p-5 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning-50 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-warning-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">{newOrders.length}</p>
                <p className="text-sm text-text-secondary">{t('kitchen.new_orders')}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-surface rounded-2xl p-5 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">{preparingOrders.length}</p>
                <p className="text-sm text-text-secondary">{t('kitchen.preparing')}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-surface rounded-2xl p-5 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-success-50 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-success-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">{readyOrders.length}</p>
                <p className="text-sm text-text-secondary">{t('kitchen.ready_for_handoff')}</p>
              </div>
            </div>
          </div>
        </div>

        {newOrders.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-warning-500 animate-pulse" />
              <h2 className="text-lg font-bold text-text-primary">{t('kitchen.new_orders')}</h2>
              <span className="bg-warning-100 text-warning-700 text-xs font-bold px-2 py-0.5 rounded-full">{newOrders.length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {newOrders.slice().sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).map((order) => (
                <KitchenOrderCard key={order.id} order={order} variant="new" />
              ))}
            </div>
          </div>
        )}

        {preparingOrders.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-primary-500" />
              <h2 className="text-lg font-bold text-text-primary">{t('kitchen.preparing')}</h2>
              <span className="bg-primary-100 text-primary-700 text-xs font-bold px-2 py-0.5 rounded-full">{preparingOrders.length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {preparingOrders.slice().sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).map((order) => (
                <KitchenOrderCard key={order.id} order={order} variant="preparing" />
              ))}
            </div>
          </div>
        )}

        {readyOrders.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-success-500" />
              <h2 className="text-lg font-bold text-text-primary">{t('kitchen.ready_waiting')}</h2>
              <span className="bg-success-100 text-success-700 text-xs font-bold px-2 py-0.5 rounded-full">{readyOrders.length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {readyOrders.slice().sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).map((order) => (
                <KitchenOrderCard key={order.id} order={order} variant="ready" />
              ))}
            </div>
          </div>
        )}

        {newOrders.length === 0 && preparingOrders.length === 0 && readyOrders.length === 0 && (
          <div className="text-center py-20">
            <ChefHat className="w-16 h-16 mx-auto mb-4 text-text-muted opacity-30" />
            <p className="text-xl font-semibold text-text-primary">{t('kitchen.no_orders')}</p>
            <p className="text-sm text-text-muted mt-2">{t('kitchen.no_orders_hint')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
