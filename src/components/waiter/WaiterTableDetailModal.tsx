import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '../../i18n';
import { localize } from '../../utils/localize';
import { useStore } from '../../store/useStore';
import { useToast } from '../../store/useToast';
import { useMenuItems, useMenuCategories } from '../../api/hooks/useMenu';
import { useOrder, useCreateOrder, useAddOrderItems, useUpdateOrderStatus, useUpdateOrderItemStatus, useCompletePayment } from '../../api/hooks/useOrders';
import { useUpdateTableStatus, useRemoveReservation } from '../../api/hooks/useTables';
import { waiterKeys } from '../../api/hooks/useWaiter';
import type { WaiterTableDto } from '../../api/types';
import { getAccessToken, getOrgIdFromToken, getUserIdFromToken } from '../../api/session';
import { getOrderItemStatusLabels } from '../../lib/constants';
import { getOrderErrorMessage } from '../../lib/orderErrors';
import type { OrderStatus } from '../../types';
import { X, ClipboardList, CheckCircle, UtensilsCrossed, CreditCard, ReceiptText, Banknote, Plus, Minus, ShoppingBag, Hand, Clock, Loader2 } from 'lucide-react';

interface Props {
  table: WaiterTableDto;
  onClose: () => void;
}

export default function WaiterTableDetailModal({ table, onClose }: Props) {
  const { t, locale } = useTranslation();
  const queryClient = useQueryClient();
  const ORDER_ITEM_STATUS_LABELS = useMemo(() => getOrderItemStatusLabels(t), [t]);
  const currentUser = useStore((s) => s.currentUser);
  const hasPermission = useStore((s) => s.hasPermission);
  const cart = useStore((s) => s.cart);
  const addToCart = useStore((s) => s.addToCart);
  const removeFromCart = useStore((s) => s.removeFromCart);
  const updateCartQuantity = useStore((s) => s.updateCartQuantity);
  const clearCart = useStore((s) => s.clearCart);
  const { addToast } = useToast();
  const orgId = currentUser?.orgId;

  const menuItemsQuery = useMenuItems(orgId);
  const menuCategoriesQuery = useMenuCategories(orgId);
  const orderQuery = useOrder(table.currentOrderId);
  const createOrder = useCreateOrder(orgId);
  const addItemsOrder = useAddOrderItems(orgId);
  const updateOrderStatus = useUpdateOrderStatus(orgId);
  const updateOrderItemStatus = useUpdateOrderItemStatus(orgId);
  const completePayment = useCompletePayment(orgId);
  const updateTableStatus = useUpdateTableStatus(orgId);
  const removeReservation = useRemoveReservation(orgId);

  const menuItems = menuItemsQuery.data ?? [];
  const menuCategories = menuCategoriesQuery.data ?? [];

  const [showNewOrder, setShowNewOrder] = useState(false);
  const [showAddItems, setShowAddItems] = useState(false);

  const sectionName = table.section;

  const getOrder = () => {
    const o = orderQuery.data;
    if (!o || ['COMPLETED', 'CANCELLED'].includes(o.status)) return undefined;
    return o;
  };

  const order = getOrder();

  const handleCreateOrder = () => {
    if (!currentUser) return;
    const token = getAccessToken();
    const waiterId = token ? (getUserIdFromToken(token) ?? currentUser.id) : currentUser.id;
    const orgId = token ? (getOrgIdFromToken(token) ?? currentUser.orgId) : currentUser.orgId;
    if (!orgId) return;
    createOrder.mutate(
      {
        tableId: table.id,
        waiterId,
        waiterName: currentUser.name,
        orderSource: 'WAITER',
        items: cart.map((c) => ({ menuItemId: c.menuItemId, menuItemName: c.menuItemName, quantity: c.quantity, price: c.price, notes: c.notes })),
        orgId,
      },
      {
        onSuccess: () => {
          clearCart();
          setShowNewOrder(false);
          queryClient.invalidateQueries({ queryKey: waiterKeys.all });
          addToast(t('toast.order_created', { number: table.tableNumber }), 'success');
        },
        onError: (err) => {
          addToast(getOrderErrorMessage(err, t('error.order_creation_failed'), t), 'error');
        },
      }
    );
  };

  const handleAddItemsToOrder = () => {
    if (!order) return;
    addItemsOrder.mutate(
      {
        id: order.id,
        items: cart.map((c) => ({ menuItemId: c.menuItemId, menuItemName: c.menuItemName, quantity: c.quantity, price: c.price, notes: c.notes })),
      },
      {
        onSuccess: () => {
          clearCart();
          setShowAddItems(false);
          queryClient.invalidateQueries({ queryKey: waiterKeys.all });
          addToast(t('toast.items_added'), 'success');
        },
        onError: (err) => {
          addToast(getOrderErrorMessage(err, t('error.order_creation_failed'), t), 'error');
        },
      }
    );
  };

  const handleMarkServed = () => {
    if (!order) return;
    updateOrderStatus.mutate(
      { id: order.id, status: 'SERVED' },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: waiterKeys.all });
          addToast(t('toast.marked_served', { number: table.tableNumber }), 'success');
        },
        onError: (err) => {
          addToast(getOrderErrorMessage(err, t('error.orders.invalid_status_transition'), t), 'error');
        },
      }
    );
    order.items.forEach((item) => {
      if (item.status === 'READY') {
        updateOrderItemStatus.mutate({ orderId: order.id, itemId: item.id, status: 'SERVED' });
      }
    });
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
          const items = menuItems.filter((m) => m.categoryId === cat.id && m.isAvailable);
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
            disabled={createOrder.isPending}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {createOrder.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingBag className="w-4 h-4" />}
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
          const items = menuItems.filter((m) => m.categoryId === cat.id && m.isAvailable);
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
            disabled={addItemsOrder.isPending}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white font-semibold py-2.5 rounded-xl transition-colors"
          >
            {addItemsOrder.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t('order.add_to_order')}
          </button>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    if (showNewOrder) return renderNewOrder();
    if (showAddItems) return renderAddItems();

    if (table.status === 'AVAILABLE') {
      return (
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 mx-auto text-success-500 mb-3" />
          <p className="text-lg font-semibold text-text-primary">{t('table.is_empty')}</p>
          <p className="text-sm text-text-muted mt-1">{t('table.no_active_order')}</p>
          {hasPermission('order.create') && (
            <button
              onClick={() => setShowNewOrder(true)}
              className="mt-4 bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              {t('order.new_order')}
            </button>
          )}
        </div>
      );
    }

    if (table.status === 'CLEANING') {
      return (
        <div className="text-center py-8">
          <UtensilsCrossed className="w-12 h-12 mx-auto text-text-muted mb-3 opacity-40" />
          <p className="text-lg font-semibold text-text-primary">{t('table.cleaning_detail')}</p>
          <p className="text-sm text-text-muted mt-1">{t('table.marked_clean')}</p>
          {hasPermission('table.status') && (
            <button
              onClick={() => {
                updateTableStatus.mutate(
                  { id: table.id, status: 'AVAILABLE' },
                  {
                    onSuccess: () => { queryClient.invalidateQueries({ queryKey: waiterKeys.all }); onClose(); addToast(t('tables.status_updated'), 'success'); },
                    onError: (err) => { addToast(getOrderErrorMessage(err, t('tables.error.update_status'), t), 'error'); },
                  }
                );
              }}
              className="mt-4 bg-success-500 hover:bg-success-600 text-white px-6 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              {t('table.status.available')}
            </button>
          )}
        </div>
      );
    }

    if (table.status === 'RESERVED') {
      return (
        <div className="text-center py-8">
          <Clock className="w-12 h-12 mx-auto text-warning-500 mb-3" />
          <p className="text-lg font-semibold text-text-primary">{t('table.status.reserved')}</p>
          {hasPermission('table.reserve') && (
            <button
              onClick={() => {
                removeReservation.mutate(table.id, {
                  onSuccess: () => { queryClient.invalidateQueries({ queryKey: waiterKeys.all }); onClose(); addToast(t('tables.reservation_cancelled'), 'success'); },
                  onError: (err) => { addToast(getOrderErrorMessage(err, t('tables.error.cancel_reservation'), t), 'error'); },
                });
              }}
              className="mt-4 bg-success-500 hover:bg-success-600 text-white px-6 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              {t('table.free_table')}
            </button>
          )}
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
            {order.orderSource === 'CUSTOMER' && (
              <span className="text-[10px] bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded font-medium">{t('order.customer')}</span>
            )}
          </div>
          <span className="text-xs text-text-muted">
            {order.items.length} {t('order.items_suffix')}
          </span>
        </div>

        <div>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">{t('order.items')}</p>
          <div className="space-y-2">
            {order.items.map((item) => {
              const statusInfo = ORDER_ITEM_STATUS_LABELS[item.status.toLowerCase() as OrderStatus] || ORDER_ITEM_STATUS_LABELS.pending;
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

        {hasPermission('order.manage') && order.status !== 'SERVED' && order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
          <button
            onClick={() => setShowAddItems(true)}
            className="w-full bg-surface-secondary hover:bg-border text-text-secondary font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 border border-border"
          >
            <Plus className="w-4 h-4" />
            {t('order.add_items')}
          </button>
        )}

        {order.paymentRequested && order.paymentStatus === 'PENDING' && (
          <div className="p-4 bg-danger-50 rounded-xl border border-danger-200 flex items-center gap-3">
            {order.paymentMethod === 'CASH' ? (
              <Banknote className="w-5 h-5 text-success-600" />
            ) : (
              <CreditCard className="w-5 h-5 text-primary-600" />
            )}
            <div>
              <p className="text-sm font-semibold text-danger-700">{t('order.bill_requested')}</p>
              <p className="text-xs text-danger-600">{t('payment.method')}: {order.paymentMethod === 'CASH' ? t('payment.cash') : t('payment.card')}</p>
            </div>
          </div>
        )}

        {hasPermission('order.manage') && order.status === 'READY' && !order.paymentRequested && (
          <button
            onClick={handleMarkServed}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Hand className="w-5 h-5" />
            {t('order.mark_served')}
          </button>
        )}

        {hasPermission('order.payment') && order.paymentStatus !== 'PAID' && order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (order.paymentRequested || order.status === 'SERVED') && (
          <button
            onClick={() => {
              completePayment.mutate(order.id, {
                onSuccess: () => {
                  queryClient.invalidateQueries({ queryKey: waiterKeys.all });
                  addToast(t('toast.bill_closed', { number: table.tableNumber }), 'success');
                },
                onError: (err) => {
                  addToast(getOrderErrorMessage(err, t('error.unexpected'), t), 'error');
                },
              });
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
            <h3 className="text-lg font-bold text-text-primary">{t('table.number_prefix', { number: table.tableNumber })}</h3>
            <p className="text-xs text-text-muted">{sectionName} • {table.capacity} {t('table.guests')}</p>
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
