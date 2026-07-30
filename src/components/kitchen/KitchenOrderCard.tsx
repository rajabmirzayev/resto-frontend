import { useTranslation } from '../../i18n';
import { useStore } from '../../store/useStore';
import type { Order } from '../../types';
import { CheckCircle, ChefHat, Timer, ArrowRight, Camera } from 'lucide-react';

interface Props {
  order: Order;
  variant: 'new' | 'preparing' | 'ready';
}

export default function KitchenOrderCard({ order, variant }: Props) {
  const { t } = useTranslation();
  const { updateOrderItemStatus, updateOrderStatus } = useStore();

  const readyCount = order.items.filter((i) => i.status === 'ready' || i.status === 'served' || i.status === 'completed').length;
  const totalCount = order.items.length;
  const allReady = readyCount === totalCount;

  const menuItems = useStore((s) => s.menuItems);

  const getElapsed = (createdAt: string) => {
    const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
    const m = Math.floor(diff / 60);
    const s = diff % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getPrepTime = () => {
    if (order.items.length === 0) return 15;
    const maxTime = Math.max(...order.items.map((i) => {
      const item = menuItems.find((m) => m.id === i.menuItemId);
      return item?.preparationTime || 15;
    }));
    return Math.max(1, maxTime);
  };

  const getElapsedPercent = () => {
    const diff = (Date.now() - new Date(order.createdAt).getTime()) / 60000;
    const prepTime = getPrepTime();
    return Math.min(100, (diff / Math.max(1, prepTime)) * 100);
  };

  const handleStartPreparing = () => {
    updateOrderStatus(order.id, 'preparing');
    order.items.forEach((item) => {
      if (item.status === 'pending') {
        updateOrderItemStatus(order.id, item.id, 'preparing');
      }
    });
  };

  const handleAllItemsReady = () => {
    order.items.forEach((item) => {
      if (item.status !== 'ready') {
        updateOrderItemStatus(order.id, item.id, 'ready');
      }
    });
    updateOrderStatus(order.id, 'ready');
  };

  const elapsed = getElapsed(order.createdAt);
  const elapsedPercent = getElapsedPercent();
  const prepTime = getPrepTime();

  const headerStyles = {
    new: 'bg-warning-50 border-b-warning-200',
    preparing: 'bg-primary-50 border-b-primary-200',
    ready: 'bg-success-50 border-b-success-200',
  };

  const badgeStyles = {
    new: 'bg-warning-500 text-white animate-pulse',
    preparing: 'bg-primary-500 text-white',
    ready: 'bg-success-500 text-white',
  };

  const badgeLabels = {
    new: t('kitchen.badge_new'),
    preparing: t('kitchen.badge_preparing'),
    ready: t('kitchen.badge_ready'),
  };

  return (
    <div
      className={`bg-white dark:bg-surface rounded-2xl border border-border overflow-hidden transition-all hover:shadow-lg ${
        variant === 'new' ? 'ring-2 ring-warning-300 shadow-warning-100' : ''
      }`}
    >
      <div className={`px-5 py-3 border-b border-border ${headerStyles[variant]}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChefHat className="w-4 h-4 text-text-muted" />
            <span className="font-bold text-text-primary">{t('table.number_prefix', { number: order.tableNumber })}</span>
            {order.orderSource === 'customer' && (
              <span className="text-[10px] bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded font-medium">{t('order.customer')}</span>
            )}
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badgeStyles[variant]}`}>
            {badgeLabels[variant]}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
          <div className="flex items-center gap-1">
            <Timer className="w-3 h-3" />
            <span className="font-mono font-semibold text-text-secondary">{elapsed}</span>
          </div>
          <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                elapsedPercent > 80 ? 'bg-danger-500' : elapsedPercent > 50 ? 'bg-warning-500' : 'bg-primary-500'
              }`}
              style={{ width: `${elapsedPercent}%` }}
            />
          </div>
          <span className="text-[10px]">~{prepTime} {t('time.minutes_abbreviation')}</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-text-muted">
            {order.orderSource === 'customer' ? t('order.customer_order') : order.waiterName || t('order.waiter')} • {readyCount}/{totalCount} {t('kitchen.ready_suffix')}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-2">
        {order.items.map((item) => {
          const isReady = item.status === 'ready';
          const isPreparing = item.status === 'preparing';

          const renderItemActions = () => {
            if (item.status === 'ready') return null;
            return (
              <div className="flex items-center gap-1.5">
                {item.status === 'pending' && (
                  <button
                    onClick={() => updateOrderItemStatus(order.id, item.id, 'preparing')}
                    className="text-xs bg-primary-500 hover:bg-primary-600 text-white px-2.5 py-1 rounded-lg transition-colors font-medium"
                  >
                    {t('kitchen.start')}
                  </button>
                )}
                {item.status === 'preparing' && (
                  <button
                    onClick={() => updateOrderItemStatus(order.id, item.id, 'ready')}
                    className="text-xs bg-success-500 hover:bg-success-600 text-white px-2.5 py-1 rounded-lg transition-colors font-medium"
                  >
                    {t('kitchen.badge_ready')}
                  </button>
                )}
              </div>
            );
          };

          return (
            <div
              key={item.id}
              className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                isReady
                  ? 'bg-success-50 border border-success-200'
                  : isPreparing
                  ? 'bg-primary-50 border border-primary-200'
                  : 'bg-surface-secondary border border-transparent'
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${
                  isReady ? 'text-success-600 line-through' : isPreparing ? 'text-primary-700' : 'text-text-primary'
                }`}>
                  {item.menuItemName}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-text-muted">×{item.quantity}</span>
                  {item.notes && (
                    <span className="text-[10px] bg-warning-50 text-warning-600 px-1.5 py-0.5 rounded">
                      {item.notes}
                    </span>
                  )}
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                    isReady ? 'bg-success-100 text-success-700' :
                    isPreparing ? 'bg-primary-100 text-primary-700' :
                    'bg-surface-secondary text-text-muted'
                  }`}>
                    {isReady ? t('kitchen.badge_ready') : isPreparing ? t('kitchen.badge_preparing') : t('kitchen.badge_new')}
                  </span>
                </div>
              </div>
              {renderItemActions()}
            </div>
          );
        })}
      </div>

      {order.customerPhoto && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 mb-2">
            <Camera className="w-3.5 h-3.5 text-primary-600" />
            <span className="text-xs font-semibold text-primary-700">{t('kitchen.customer_photo')}</span>
          </div>
          <img
            src={order.customerPhoto}
            alt={t('kitchen.customer_photo_alt', { number: order.tableNumber })}
            className="w-full h-32 object-cover rounded-xl border border-primary-200"
          />
          <p className="text-[10px] text-text-muted mt-1">{t('kitchen.verify_customer')}</p>
        </div>
      )}

      <div className="px-4 pb-4 space-y-2">
        {variant === 'new' && !allReady && (
          <button
            onClick={handleStartPreparing}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <ChefHat className="w-4 h-4" />
            {t('kitchen.start_preparing')}
          </button>
        )}
        {variant === 'preparing' && !allReady && (
          <button
            onClick={handleAllItemsReady}
            className="w-full bg-success-500 hover:bg-success-600 text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            {t('kitchen.mark_all_ready')}
          </button>
        )}
        {allReady && variant !== 'ready' && (
          <button
            onClick={() => updateOrderStatus(order.id, 'ready')}
            className="w-full bg-success-600 hover:bg-success-700 text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            {t('kitchen.hand_off')}
          </button>
        )}
        {variant === 'ready' && (
          <div className="w-full text-center py-2.5 rounded-xl bg-success-50 border border-success-200 text-sm font-semibold text-success-700 flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4" />
            {t('kitchen.badge_ready')}
          </div>
        )}
      </div>
    </div>
  );
}
