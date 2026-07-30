import { useState, useMemo } from 'react';
import { useTranslation } from '../../i18n';
import { localize } from '../../utils/localize';
import { useStore } from '../../store/useStore';
import { useToast } from '../../store/useToast';
import type { Table, Order } from '../../types';
import { getOrderItemStatusLabels } from '../../lib/constants';
import { X, ClipboardList, CheckCircle, UtensilsCrossed, CreditCard, Timer, ReceiptText, Banknote, Clock, User, Phone, Plus, Minus, ShoppingBag, Hand } from 'lucide-react';

interface Props {
  table: Table;
  onClose: () => void;
}

export default function WaiterTableDetailModal({ table, onClose }: Props) {
  const { t, locale } = useTranslation();
  const ORDER_ITEM_STATUS_LABELS = useMemo(() => getOrderItemStatusLabels(t), [t]);
  const { orders, menuItems, menuCategories, currentUser, addToCart, removeFromCart, updateCartQuantity, cart, clearCart, createOrder, addItemsToOrder, updateTableStatus, updateOrderStatus, updateOrderItemStatus, completePayment } = useStore();
  const { addToast } = useToast();
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [showAddItems, setShowAddItems] = useState(false);

  const getElapsed = (createdAt: string) => {
    const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
    const m = Math.floor(diff / 60);
    return `${m} ${t('time.minutes_abbreviation')}`;
  };

  const getTableOrder = (): Order | undefined => {
    if (!table.currentOrderId) return undefined;
    return orders.find((o) => o.id === table.currentOrderId && !['completed', 'cancelled'].includes(o.status));
  };

  const order = getTableOrder();

  const handleCreateOrder = () => {
    if (!currentUser) return;
    const newOrder = createOrder(table.id, currentUser.id, currentUser.name);
    if (newOrder) {
      clearCart();
      setShowNewOrder(false);
      addToast(t('toast.order_created', { number: table.number }), 'success');
    }
  };

  const handleAddItemsToOrder = () => {
    if (!order) return;
    const items = cart.map((c) => ({
      menuItemId: c.menuItemId,
      menuItemName: c.menuItemName,
      quantity: c.quantity,
      price: c.price,
      notes: c.notes,
      status: 'pending' as const,
    }));
    addItemsToOrder(order.id, items);
    clearCart();
    setShowAddItems(false);
    addToast(t('toast.items_added'), 'success');
  };

  const handleMarkServed = () => {
    if (!order) return;
    updateOrderStatus(order.id, 'served');
    order.items.forEach((item) => {
      if (item.status === 'ready' || item.status === 'preparing') {
        updateOrderItemStatus(order.id, item.id, 'served');
      }
    });
    addToast(t('toast.marked_served', { number: table.number }), 'success');
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const renderNewOrder = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-text-primary">{t('order.new_order')}</h4>
        <button
          onClick={() => { setShowNewOrder(false); clearCart(); }}
          className="text-xs text-text-muted hover:text-text-primary"
        >
          {t('common.back')}
        </button>
      </div>

      <div className="space-y-4 max-h-64 overflow-y-auto">
        {menuCategories.map((cat) => {
          const items = menuItems.filter((m) => m.category === cat.id && m.isAvailable);
          if (items.length === 0) return null;
          return (
            <div key={cat.id}>
              <p className="text-xs font-semibold text-text-muted uppercase mb-2">{localize(cat.name, locale)}</p>
              <div className="grid grid-cols-2 gap-2">
                {items.map((item) => {
                  const cartItem = cart.find((c) => c.menuItemId === item.id);
                  return (
                    <div key={item.id} className="bg-surface-secondary rounded-xl p-3">
                      <p className="text-xs font-semibold text-text-primary truncate">{localize(item.name, locale)}</p>
                      <p className="text-xs text-text-muted">{item.price} ₼</p>
                      {cartItem ? (
                        <div className="flex items-center gap-1 mt-2">
                          <button
                            onClick={() => {
                              if (cartItem.quantity <= 1) removeFromCart(item.id);
                              else updateCartQuantity(item.id, cartItem.quantity - 1);
                            }}
                            className="w-6 h-6 bg-white dark:bg-surface rounded-lg border border-border flex items-center justify-center"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold w-5 text-center">{cartItem.quantity}</span>
                          <button
                            onClick={() => addToCart({ menuItemId: item.id, menuItemName: localize(item.name, locale), price: item.price, quantity: 1 })}
                            className="w-6 h-6 bg-primary-600 text-white rounded-lg flex items-center justify-center"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart({ menuItemId: item.id, menuItemName: localize(item.name, locale), price: item.price, quantity: 1 })}
                          className="mt-2 w-full bg-primary-600 hover:bg-primary-700 text-white text-xs py-1.5 rounded-lg transition-colors"
                        >
                          + {t('common.add')}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {cartCount > 0 && (
        <div className="bg-primary-50 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-text-primary">{t('cart.total')}: {cartTotal} ₼</span>
            <span className="text-xs text-text-muted">{cartCount} {t('cart.items_suffix')}</span>
          </div>
          <button
            onClick={handleCreateOrder}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            {t('cart.place_order')}
          </button>
        </div>
      )}
    </div>
  );

  const renderAddItems = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-text-primary">{t('order.add_items')}</h4>
        <button
          onClick={() => { setShowAddItems(false); clearCart(); }}
          className="text-xs text-text-muted hover:text-text-primary"
        >
          {t('common.back')}
        </button>
      </div>

      <div className="space-y-4 max-h-64 overflow-y-auto">
        {menuCategories.map((cat) => {
          const items = menuItems.filter((m) => m.category === cat.id && m.isAvailable);
          if (items.length === 0) return null;
          return (
            <div key={cat.id}>
              <p className="text-xs font-semibold text-text-muted uppercase mb-2">{localize(cat.name, locale)}</p>
              <div className="grid grid-cols-2 gap-2">
                {items.map((item) => {
                  const cartItem = cart.find((c) => c.menuItemId === item.id);
                  const alreadyInOrder = order?.items.some((oi) => oi.menuItemId === item.id);
                  return (
                    <div key={item.id} className={`rounded-xl p-3 ${alreadyInOrder ? 'bg-primary-50 border border-primary-200' : 'bg-surface-secondary'}`}>
                      <p className="text-xs font-semibold text-text-primary truncate">{localize(item.name, locale)}</p>
                      <p className="text-xs text-text-muted">{item.price} ₼</p>
                      {cartItem ? (
                        <div className="flex items-center gap-1 mt-2">
                          <button
                            onClick={() => {
                              if (cartItem.quantity <= 1) removeFromCart(item.id);
                              else updateCartQuantity(item.id, cartItem.quantity - 1);
                            }}
                            className="w-6 h-6 bg-white dark:bg-surface rounded-lg border border-border flex items-center justify-center"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold w-5 text-center">{cartItem.quantity}</span>
                          <button
                            onClick={() => addToCart({ menuItemId: item.id, menuItemName: localize(item.name, locale), price: item.price, quantity: 1 })}
                            className="w-6 h-6 bg-primary-600 text-white rounded-lg flex items-center justify-center"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart({ menuItemId: item.id, menuItemName: localize(item.name, locale), price: item.price, quantity: 1 })}
                          className="mt-2 w-full bg-primary-600 hover:bg-primary-700 text-white text-xs py-1.5 rounded-lg transition-colors"
                        >
                          + {t('common.add')}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {cartCount > 0 && (
        <div className="bg-primary-50 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-text-primary">{t('cart.total')}: {cartTotal} ₼</span>
            <span className="text-xs text-text-muted">{cartCount} {t('cart.items_suffix')}</span>
          </div>
          <button
            onClick={handleAddItemsToOrder}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 rounded-xl transition-colors"
          >
            {t('order.add_to_order')}
          </button>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    if (showNewOrder) return renderNewOrder();
    if (showAddItems) return renderAddItems();

    if (table.status === 'available') {
      return (
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 mx-auto text-success-500 mb-3" />
          <p className="text-lg font-semibold text-text-primary">{t('table.is_empty')}</p>
          <p className="text-sm text-text-muted mt-1">{t('table.no_active_order')}</p>
          <button
            onClick={() => setShowNewOrder(true)}
            className="mt-4 bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 mx-auto"
          >
            <Plus className="w-4 h-4" />
            {t('order.new_order')}
          </button>
        </div>
      );
    }

    if (table.status === 'cleaning') {
      return (
        <div className="text-center py-8">
          <UtensilsCrossed className="w-12 h-12 mx-auto text-text-muted mb-3 opacity-40" />
          <p className="text-lg font-semibold text-text-primary">{t('table.cleaning_detail')}</p>
          <p className="text-sm text-text-muted mt-1">{t('table.marked_clean')}</p>
          <button
            onClick={() => { updateTableStatus(table.id, 'available'); onClose(); }}
            className="mt-4 bg-success-500 hover:bg-success-600 text-white px-6 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            {t('table.status.available')}
          </button>
        </div>
      );
    }

    if (table.status === 'reserved') {
      const r = table.reservation;
      return (
        <div className="text-center py-8">
          <Clock className="w-12 h-12 mx-auto text-warning-500 mb-3" />
          <p className="text-lg font-semibold text-text-primary">{t('table.status.reserved')}</p>
          {r ? (
            <div className="mt-4 space-y-3">
              <div className="bg-warning-50 rounded-xl p-4 border border-warning-200 text-left space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-warning-600" />
                  <span className="text-sm font-semibold text-text-primary">{r.guestName}</span>
                </div>
                {r.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-text-muted" />
                    <span className="text-sm text-text-secondary">{r.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-text-muted" />
                  <span className="text-sm text-text-secondary">{r.time} • {r.guestCount} {t('table.guests')}</span>
                </div>
                {r.notes && (
                  <p className="text-xs text-text-muted pt-2 border-t border-warning-200">{r.notes}</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-text-muted mt-1">{t('table.reservation_info')}</p>
          )}
          <button
            onClick={() => { updateTableStatus(table.id, 'available'); onClose(); }}
            className="mt-4 bg-success-500 hover:bg-success-600 text-white px-6 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            {t('table.free_table')}
          </button>
        </div>
      );
    }

    if (!order) {
      return (
        <div className="text-center py-8">
          <ClipboardList className="w-12 h-12 mx-auto text-text-muted mb-3 opacity-40" />
          <p className="text-lg font-semibold text-text-primary">{t('order.not_found')}</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-surface-secondary rounded-xl">
          <div className="flex items-center gap-2">
            <ReceiptText className="w-4 h-4 text-text-muted" />
            <span className="text-sm font-medium text-text-secondary">
              {t('order.order_number_prefix', { number: order.id.slice(0, 6).toUpperCase() })}
            </span>
            {order.orderSource === 'customer' && (
              <span className="text-[10px] bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded font-medium">{t('order.customer')}</span>
            )}
          </div>
          <span className="text-xs text-text-muted flex items-center gap-1">
            <Timer className="w-3 h-3" />
            {getElapsed(order.createdAt)}
          </span>
        </div>

        <div>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">{t('order.items')}</p>
          <div className="space-y-2">
            {order.items.map((item) => {
              const statusInfo = ORDER_ITEM_STATUS_LABELS[item.status] || ORDER_ITEM_STATUS_LABELS.pending;
              return (
                <div key={item.id} className="flex items-center justify-between p-3 bg-surface-secondary rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{item.menuItemName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-text-muted">×{item.quantity}</span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-text-primary ml-3">
                    {item.price * item.quantity} ₼
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 bg-primary-50 rounded-xl border border-primary-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-primary-700">{t('order.total')}</span>
            <span className="text-xl font-bold text-primary-700">{order.totalAmount} ₼</span>
          </div>
        </div>

        {order.status !== 'served' && order.status !== 'completed' && order.status !== 'cancelled' && (
          <button
            onClick={() => setShowAddItems(true)}
            className="w-full bg-surface-secondary hover:bg-border text-text-secondary font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 border border-border"
          >
            <Plus className="w-4 h-4" />
            {t('order.add_items')}
          </button>
        )}

        {order.paymentRequested && order.paymentStatus === 'pending' && (
          <div className="p-4 bg-danger-50 rounded-xl border border-danger-200 flex items-center gap-3">
            {order.paymentMethod === 'cash' ? (
              <Banknote className="w-5 h-5 text-success-600" />
            ) : (
              <CreditCard className="w-5 h-5 text-primary-600" />
            )}
            <div>
              <p className="text-sm font-semibold text-danger-700">{t('order.bill_requested')}</p>
              <p className="text-xs text-danger-600">{t('payment.method')}: {order.paymentMethod === 'cash' ? t('payment.cash') : t('payment.card')}</p>
            </div>
          </div>
        )}

        {order.status === 'ready' && !order.paymentRequested && (
          <button
            onClick={handleMarkServed}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Hand className="w-5 h-5" />
            {t('order.mark_served')}
          </button>
        )}

        {order.paymentRequested && order.paymentStatus === 'pending' && (
          <button
            onClick={() => {
              completePayment(order.id);
              updateTableStatus(table.id, 'available');
              onClose();
              addToast(t('toast.bill_closed', { number: table.number }), 'success');
            }}
            className="w-full bg-success-500 hover:bg-success-600 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <CreditCard className="w-5 h-5" />
            {t('order.close_bill')}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white dark:bg-surface w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-border flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-text-primary">{t('table.number_prefix', { number: table.number })}</h3>
            <p className="text-xs text-text-muted">{table.section} • {table.capacity} {t('table.guests')}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-secondary rounded-xl transition-colors">
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}