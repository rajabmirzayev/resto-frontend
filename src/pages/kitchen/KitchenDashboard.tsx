import { useEffect, useState, useRef } from 'react';
import { useTranslation } from '../../i18n';
import Header from '../../components/layout/Header';
import { useStore } from '../../store/useStore';
import { useToast } from '../../store/useToast';
import { playNewOrderSound } from '../../lib/sounds';
import KitchenOrderCard from '../../components/kitchen/KitchenOrderCard';
import { Clock, CheckCircle, ChefHat, AlertCircle } from 'lucide-react';

export default function KitchenDashboard() {
  const { t } = useTranslation();
  const orders = useStore((s) => s.orders);
  const { addToast } = useToast();
  const [, forceUpdate] = useState(0);
  const prevPendingCount = useRef(0);

  useEffect(() => {
    useStore.persist.rehydrate();
    const interval = setInterval(() => {
      useStore.persist.rehydrate();
      forceUpdate((n) => n + 1);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const pendingCount = orders.filter((o) => o.status === 'pending').length;
    if (prevPendingCount.current > 0 && pendingCount > prevPendingCount.current) {
      const newCount = pendingCount - prevPendingCount.current;
      playNewOrderSound();
      addToast(t('toast.new_orders_received', { count: newCount }), 'warning', 5000);
    }
    prevPendingCount.current = pendingCount;
  }, [orders, addToast, t]);

  const newOrders = orders.filter((o) => o.status === 'pending' || (o.status === 'confirmed' && o.orderSource === 'customer'));
  const preparingOrders = orders.filter((o) => o.status === 'preparing');
  const readyOrders = orders.filter((o) => o.status === 'ready');

  return (
    <div>
      <Header title={t('kitchen.title')} subtitle={`${newOrders.length + preparingOrders.length} ${t('kitchen.active')}, ${readyOrders.length} ${t('kitchen.ready')}`} showUser />

      <div className="p-6">
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
              {newOrders.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).map((order) => (
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
              {preparingOrders.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).map((order) => (
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
              {readyOrders.map((order) => (
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
