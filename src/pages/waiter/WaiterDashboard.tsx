import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '../../i18n';
import Header from '../../components/layout/Header';
import { useStore } from '../../store/useStore';
import { useToast } from '../../store/useToast';
import { playOrderReadySound } from '../../lib/sounds';
import { useWaiterTables, useWaiterPendingConfirm, useWaiterPaymentRequests, waiterKeys } from '../../api/hooks/useWaiter';
import { useCompletePayment, useWaiterConfirmOrder, useCancelOrder, useUpdateOrderStatus } from '../../api/hooks/useOrders';
import { getOrderErrorMessage } from '../../lib/orderErrors';
import { getAccessToken, getUserIdFromToken } from '../../api/session';
import type { OrderDto, WaiterOrderSummary, WaiterTableDto } from '../../api/types';
import WaiterTableDetailModal from '../../components/waiter/WaiterTableDetailModal';
import {
  ClipboardList, Users, ReceiptText, CheckCircle,
  Timer, UserCheck, Hand,
  Banknote, Bell, CreditCard, Loader2,
} from 'lucide-react';

export default function WaiterDashboard() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const currentUser = useStore((s) => s.currentUser);
  const hasPermission = useStore((s) => s.hasPermission);
  const orderMode = useStore((s) => s.orderMode);
  const { addToast } = useToast();
  const orgId = currentUser?.orgId;

  const tablesQuery = useWaiterTables(orgId);
  const pendingConfirmQuery = useWaiterPendingConfirm(orgId);
  const paymentRequestsQuery = useWaiterPaymentRequests(orgId);
  const completePayment = useCompletePayment(orgId);
  const waiterConfirm = useWaiterConfirmOrder(orgId);
  const cancelOrder = useCancelOrder(orgId);
  const updateOrderStatus = useUpdateOrderStatus(orgId);

  const tables = tablesQuery.data ?? [];
  const pendingCustomerOrders = pendingConfirmQuery.data ?? [];
  const paymentRequests = paymentRequestsQuery.data ?? [];

  const [selectedTable, setSelectedTable] = useState<WaiterTableDto | null>(null);
  const [activeTab, setActiveTab] = useState<'tables' | 'ready' | 'pending' | 'payments'>('tables');
  const prevReadyCount = useRef(0);
  const prevPaymentCount = useRef(0);

  const isConfirmMode = orderMode === 'customer-waiter-confirm';

  useEffect(() => {
    const readyCount = (tablesQuery.data ?? []).filter((t) => t.orderSummary?.status === 'READY').length;
    if (prevReadyCount.current > 0 && readyCount > prevReadyCount.current) {
      playOrderReadySound();
      addToast(t('toast.order_ready'), 'success', 5000);
    }
    prevReadyCount.current = readyCount;
  }, [tablesQuery.data, addToast, t]);

  useEffect(() => {
    if (paymentRequests.length > prevPaymentCount.current) {
      playOrderReadySound();
    }
    prevPaymentCount.current = paymentRequests.length;
  }, [paymentRequests.length]);

  const activeOrders = tables.filter((t) => t.orderSummary !== null).length;
  const availableCount = tables.filter((t) => t.status === 'AVAILABLE').length;
  const occupiedCount = tables.filter((t) => t.status === 'OCCUPIED').length;
  const openAmount = tables.reduce((s, t) => s + (t.orderSummary?.totalAmount ?? 0), 0);

  const readyTables = tables.filter((t) => t.orderSummary?.status === 'READY');
  const paymentReqByOrder = new Set(paymentRequests.map((o) => o.id));

  const getTableStatusLabel = (table: WaiterTableDto, summary?: WaiterOrderSummary | null): string => {
    if (table.status === 'AVAILABLE') return t('table.status.available');
    if (table.status === 'CLEANING') return t('table.status.cleaning');
    if (table.status === 'RESERVED') return t('table.status.reserved');
    if (!summary) return t('table.status.occupied');
    if (summary.status === 'PENDING') return t('table.status.waiting_confirmation');
    if (summary.status === 'CONFIRMED' || summary.status === 'PREPARING') return t('table.status.preparing');
    if (summary.status === 'READY') return t('table.status.ready');
    if (summary.status === 'SERVED') return t('table.status.served');
    return t('table.status.occupied');
  };

  const getTableStatusColor = (table: WaiterTableDto, summary?: WaiterOrderSummary | null): string => {
    if (table.status === 'AVAILABLE') return 'bg-success-50 border-success-200 hover:border-success-400';
    if (table.status === 'CLEANING') return 'bg-surface-secondary border-border opacity-60';
    if (table.status === 'RESERVED') return 'bg-warning-50 border-warning-200 hover:border-warning-400';
    if (!summary) return 'bg-danger-50 border-danger-200 hover:border-danger-400';
    if (summary.status === 'PENDING') return 'bg-warning-50 border-warning-300 hover:border-warning-500 ring-1 ring-warning-200';
    if (summary.status === 'CONFIRMED' || summary.status === 'PREPARING') return 'bg-primary-50 border-primary-200 hover:border-primary-400';
    if (summary.status === 'READY') return 'bg-success-50 border-success-300 hover:border-success-500 ring-1 ring-success-200';
    if (summary.status === 'SERVED') return 'bg-primary-50 border-primary-200 hover:border-primary-400';
    return 'bg-danger-50 border-danger-200';
  };

  const getTableBadgeColor = (table: WaiterTableDto, summary?: WaiterOrderSummary | null): string => {
    if (table.status === 'AVAILABLE') return 'bg-success-500 text-white';
    if (table.status === 'CLEANING') return 'bg-text-muted text-white';
    if (table.status === 'RESERVED') return 'bg-warning-500 text-white';
    if (!summary) return 'bg-danger-500 text-white';
    if (summary.status === 'PENDING') return 'bg-warning-500 text-white animate-pulse';
    if (summary.status === 'CONFIRMED' || summary.status === 'PREPARING') return 'bg-primary-500 text-white';
    if (summary.status === 'READY') return 'bg-success-500 text-white animate-pulse';
    return 'bg-primary-500 text-white';
  };

  const getElapsed = (createdAt: string) => {
    const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
    const m = Math.floor(diff / 60);
    return `${m} ${t('time.minutes_abbreviation')}`;
  };

  const sectionIds = [...new Set(tables.map((t) => t.section).filter(Boolean))];

  const handleConfirmCustomerOrder = (order: OrderDto) => {
    const token = getAccessToken();
    const waiterId = token ? (getUserIdFromToken(token) ?? currentUser?.id ?? '') : (currentUser?.id ?? '');
    waiterConfirm.mutate(
      { id: order.id, waiterId, waiterName: currentUser?.name || '' },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: waiterKeys.all });
          addToast(t('toast.table_order_confirmed', { number: order.tableNumber }), 'success');
        },
        onError: (err) => {
          addToast(getOrderErrorMessage(err, t('error.orders.only_pending_confirmable'), t), 'error');
        },
      }
    );
  };

  const handleMarkServed = (table: WaiterTableDto) => {
    if (!table.currentOrderId) return;
    updateOrderStatus.mutate(
      { id: table.currentOrderId, status: 'SERVED' },
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
  };

  if ((tablesQuery.isLoading && !tablesQuery.data) || (pendingConfirmQuery.isLoading && !pendingConfirmQuery.data) || (paymentRequestsQuery.isLoading && !paymentRequestsQuery.data)) {
    return (
      <div>
        <Header title={t('waiter.title')} subtitle={isConfirmMode ? t('waiter.confirm_mode') : undefined} showUser showSidebarButton={false} />
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
      <Header title={t('waiter.title')} subtitle={isConfirmMode ? t('waiter.confirm_mode') : undefined} showUser showSidebarButton={false} />

      <div className="p-6">
        {(tablesQuery.isError || pendingConfirmQuery.isError || paymentRequestsQuery.isError) && (
          <div className="bg-danger-50 border border-danger-200 rounded-2xl p-4 mb-6 flex items-center justify-between">
            <p className="text-sm text-danger-700">{t('error.unexpected')}</p>
            <button
              onClick={() => { tablesQuery.refetch(); pendingConfirmQuery.refetch(); paymentRequestsQuery.refetch(); }}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition-colors"
            >
              {t('error.retry')}
            </button>
          </div>
        )}

        {(isConfirmMode || paymentRequests.length > 0 || readyTables.length > 0) && (
          <div className="mb-6">
            <div className="flex gap-2 mb-4 flex-wrap">
              <button
                onClick={() => setActiveTab('tables')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === 'tables' ? 'bg-primary-600 text-white shadow-sm' : 'bg-surface-secondary text-text-secondary hover:bg-border'
                }`}
              >
                {t('waiter.tables_tab')}
              </button>
              {readyTables.length > 0 && (
                <button
                  onClick={() => setActiveTab('ready')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors relative ${
                    activeTab === 'ready' ? 'bg-success-600 text-white shadow-sm' : 'bg-surface-secondary text-text-secondary hover:bg-border'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    {t('waiter.ready_orders')}
                  </span>
                  <span className="ml-1.5 bg-white/20 text-xs px-1.5 py-0.5 rounded-full">{readyTables.length}</span>
                </button>
              )}
              {isConfirmMode && (
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors relative ${
                    activeTab === 'pending' ? 'bg-warning-600 text-white shadow-sm' : 'bg-surface-secondary text-text-secondary hover:bg-border'
                  }`}
                >
                  {t('waiter.pending_confirmations')}
                  <span className="ml-1.5 bg-white/20 text-xs px-1.5 py-0.5 rounded-full">{pendingCustomerOrders.length}</span>
                </button>
              )}
              {paymentRequests.length > 0 && (
                <button
                  onClick={() => setActiveTab('payments')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors relative ${
                    activeTab === 'payments' ? 'bg-danger-600 text-white shadow-sm' : 'bg-surface-secondary text-text-secondary hover:bg-border'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <Bell className="w-3.5 h-3.5" />
                    {t('waiter.bill_requesters')}
                  </span>
                  <span className="ml-1.5 bg-white/20 text-xs px-1.5 py-0.5 rounded-full">{paymentRequests.length}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'ready' && readyTables.length > 0 ? (
          <div className="space-y-4">
            {readyTables.map((table) => (
              <div key={table.id} className="bg-white dark:bg-surface rounded-2xl border-2 border-success-300 p-5 shadow-sm ring-2 ring-success-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success-600" />
                    <span className="font-bold text-text-primary">{t('table.number_prefix', { number: table.tableNumber })}</span>
                  </div>
                  <span className="flex items-center gap-1.5 bg-success-100 text-success-700 text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
                    <Timer className="w-3 h-3" />
                    {t('table.status.ready')}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-3 p-3 bg-success-50 rounded-xl">
                  <span className="text-sm font-semibold text-success-700">{t('order.total')}</span>
                  <span className="text-lg font-bold text-success-700">{table.orderSummary?.totalAmount?.toFixed(2)} ₼</span>
                </div>
                {hasPermission('order.manage') && !(table.currentOrderId && paymentReqByOrder.has(table.currentOrderId)) && (
                  <button
                    onClick={() => handleMarkServed(table)}
                    className="w-full bg-success-500 hover:bg-success-600 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <Hand className="w-5 h-5" />
                    {t('order.mark_served')}
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : activeTab === 'payments' && paymentRequests.length > 0 ? (
          <div className="space-y-4">
            {paymentRequests.map((order) => (
              <div key={order.id} className="bg-white dark:bg-surface rounded-2xl border-2 border-danger-300 p-5 shadow-sm ring-2 ring-danger-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ReceiptText className="w-4 h-4 text-danger-600" />
                    <span className="font-bold text-text-primary">{t('table.number_prefix', { number: order.tableNumber })}</span>
                  </div>
                  <span className="flex items-center gap-1.5 bg-danger-100 text-danger-700 text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
                    <Bell className="w-3 h-3" />
                    {t('order.bill_requested')}
                  </span>
                </div>
                <div className="space-y-1.5 mb-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm bg-surface-secondary rounded-lg px-3 py-2">
                      <span className="text-text-secondary">{item.menuItemName} ×{item.quantity}</span>
                      <span className="font-medium text-text-primary">{item.price * item.quantity} ₼</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mb-3 p-3 bg-danger-50 rounded-xl">
                  <span className="text-sm font-semibold text-danger-700">{t('order.total')}</span>
                  <span className="text-lg font-bold text-danger-700">{order.totalAmount} ₼</span>
                </div>
                <div className="flex items-center gap-2 mb-3 p-3 bg-surface-secondary rounded-xl">
                  {order.paymentMethod === 'CASH' ? (
                    <>
                      <Banknote className="w-5 h-5 text-success-600" />
                      <span className="text-sm font-semibold text-text-primary">{t('payment.cash')}</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5 text-primary-600" />
                      <span className="text-sm font-semibold text-text-primary">{t('payment.card')}</span>
                    </>
                  )}
                </div>
                {hasPermission('order.payment') && (
                  <button
                    onClick={() => {
                      completePayment.mutate(order.id, {
                        onSuccess: () => {
                          queryClient.invalidateQueries({ queryKey: waiterKeys.all });
                          addToast(t('toast.bill_closed', { number: order.tableNumber }), 'success');
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
            ))}
          </div>
        ) : activeTab === 'pending' && isConfirmMode ? (
          <div className="space-y-4">
            {pendingCustomerOrders.map((order) => (
              <div key={order.id} className="bg-white dark:bg-surface rounded-2xl border border-warning-300 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ReceiptText className="w-4 h-4 text-warning-600" />
                    <span className="font-bold text-text-primary">{t('table.number_prefix', { number: order.tableNumber })}</span>
                  </div>
                  <span className="text-xs text-text-muted flex items-center gap-1">
                    <Timer className="w-3 h-3" />
                    {getElapsed(order.createdAt)}
                  </span>
                </div>
                <div className="space-y-1.5 mb-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm bg-surface-secondary rounded-lg px-3 py-2">
                      <span className="text-text-secondary">{item.menuItemName} ×{item.quantity}</span>
                      <span className="font-medium text-text-primary">{item.price * item.quantity} ₼</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mb-3 p-3 bg-primary-50 rounded-xl">
                  <span className="text-sm font-semibold text-primary-700">{t('order.total')}</span>
                  <span className="text-lg font-bold text-primary-700">{order.totalAmount} ₼</span>
                </div>
                <div className="flex gap-2">
                  {hasPermission('order.cancel') && (
                    <button
                      onClick={() => {
                        cancelOrder.mutate(order.id, {
                          onSuccess: () => {
                            queryClient.invalidateQueries({ queryKey: waiterKeys.all });
                            addToast(t('toast.order_cancelled', { number: order.tableNumber }), 'warning');
                          },
                          onError: (err) => {
                            addToast(getOrderErrorMessage(err, t('error.orders.not_cancellable'), t), 'error');
                          },
                        });
                      }}
                      className="flex-1 bg-danger-500 hover:bg-danger-600 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
                    >
                      {t('order.reject')}
                    </button>
                  )}
                  {hasPermission('order.manage') && (
                    <button
                      onClick={() => handleConfirmCustomerOrder(order)}
                      className="flex-1 bg-success-500 hover:bg-success-600 text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <UserCheck className="w-4 h-4" />
                      {t('common.confirm')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <div className="bg-white dark:bg-surface rounded-2xl p-5 border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                    <ClipboardList className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-text-primary">{activeOrders}</p>
                    <p className="text-xs text-text-secondary">{t('waiter.active_orders')}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-surface rounded-2xl p-5 border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-success-50 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-success-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-text-primary">{availableCount}</p>
                    <p className="text-xs text-text-secondary">{t('waiter.available_tables')}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-surface rounded-2xl p-5 border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-danger-50 flex items-center justify-center">
                    <Users className="w-5 h-5 text-danger-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-text-primary">{occupiedCount}</p>
                    <p className="text-xs text-text-secondary">{t('waiter.occupied_tables')}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-surface rounded-2xl p-5 border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-warning-50 flex items-center justify-center">
                    <ReceiptText className="w-5 h-5 text-warning-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-text-primary">{openAmount.toFixed(2)} ₼</p>
                    <p className="text-xs text-text-secondary">{t('waiter.open_amount')}</p>
                  </div>
                </div>
              </div>
            </div>

            {sectionIds.map((section) => (
              <div key={section} className="mb-8">
                <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4">{section}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {tables.filter((t) => t.section === section).map((table) => {
                    const summary = table.orderSummary;
                    const label = getTableStatusLabel(table, summary);
                    const bg = getTableStatusColor(table, summary);
                    const badge = getTableBadgeColor(table, summary);
                    const isSelected = selectedTable?.id === table.id;

                    return (
                      <button
                        key={table.id}
                        onClick={() => setSelectedTable(isSelected ? null : table)}
                        className={`rounded-2xl border-2 p-5 text-left transition-all hover:shadow-lg ${bg} ${
                          isSelected ? 'ring-2 ring-primary-500 shadow-lg' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl font-bold text-text-primary">#{table.tableNumber}</span>
                          <span className="text-xs font-medium text-text-muted flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {table.capacity}
                          </span>
                        </div>
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${badge}`}>
                          {label}
                        </span>
                        {summary && (
                          <div className="mt-2 pt-2 border-t border-border/50">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-text-primary">{summary.totalAmount.toFixed(2)} ₼</span>
                              <span className="text-[10px] text-text-muted">
                                {summary.itemCount} {t('order.items_suffix')}
                              </span>
                            </div>
                            {table.currentOrderId && paymentReqByOrder.has(table.currentOrderId) && (
                              <span className="text-[10px] bg-danger-50 text-danger-600 px-1.5 py-0.5 rounded mt-1 inline-block font-medium animate-pulse">
                                {t('order.bill_requested')}
                              </span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {selectedTable && (
        <WaiterTableDetailModal
          table={selectedTable}
          onClose={() => setSelectedTable(null)}
        />
      )}
    </div>
  );
}
