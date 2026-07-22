import { useEffect, useState, useRef } from 'react';
import Header from '../../components/layout/Header';
import { useStore } from '../../store/useStore';
import { useToast } from '../../store/useToast';
import { playOrderReadySound } from '../../lib/sounds';
import type { Table, Order } from '../../types';
import WaiterTableDetailModal from '../../components/waiter/WaiterTableDetailModal';
import {
  ClipboardList, Users, ReceiptText, CheckCircle,
  ChevronRight, Timer, UserCheck,
  Banknote, Bell, CreditCard, Phone, User, Clock,
} from 'lucide-react';

export default function WaiterDashboard() {
  const { tables, orders, currentUser, orderMode, completePayment, confirmOrder, cancelOrder } = useStore();
  const { addToast } = useToast();
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [activeTab, setActiveTab] = useState<'tables' | 'pending' | 'payments'>('tables');
  const [, forceUpdate] = useState(0);
  const prevReadyCount = useRef(0);

  const isConfirmMode = orderMode === 'customer-waiter-confirm';

  useEffect(() => {
    useStore.persist.rehydrate();
    const interval = setInterval(() => {
      useStore.persist.rehydrate();
      forceUpdate((n) => n + 1);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const readyCount = orders.filter((o) => o.status === 'ready').length;
    if (prevReadyCount.current > 0 && readyCount > prevReadyCount.current) {
      playOrderReadySound();
      addToast('Sifariş hazır! Təhvil almağa gedin.', 'success', 5000);
    }
    prevReadyCount.current = readyCount;
  }, [orders, addToast]);

  useEffect(() => {
    const newPaymentRequests = orders.filter((o) => o.paymentRequested && o.paymentStatus === 'pending');
    if (newPaymentRequests.length > 0) {
      playOrderReadySound();
    }
  }, [orders]);

  const activeOrders = orders.filter((o) => !['completed', 'cancelled'].includes(o.status));
  const pendingCustomerOrders = orders.filter((o) => o.status === 'pending' && o.orderSource === 'customer' && !o.waiterConfirmed);
  const paymentRequests = orders.filter((o) => o.paymentRequested && o.paymentStatus === 'pending' && !['completed', 'cancelled'].includes(o.status));
  const availableCount = tables.filter((t) => t.status === 'available').length;
  const occupiedCount = tables.filter((t) => t.status === 'occupied').length;
  const totalRevenue = orders.filter((o) => o.paymentStatus === 'paid').reduce((s, o) => s + o.totalAmount, 0);

  const getTableOrder = (table: Table): Order | undefined => {
    if (!table.currentOrderId) return undefined;
    return orders.find((o) => o.id === table.currentOrderId && !['completed', 'cancelled'].includes(o.status));
  };

  const getTableStatusLabel = (table: Table, order?: Order): string => {
    if (table.status === 'available') return 'Boş';
    if (table.status === 'cleaning') return 'Təmizlənir';
    if (table.status === 'reserved') return 'Rezervasiya';
    if (!order) return 'Məşğul';
    if (order.status === 'pending' && !order.waiterConfirmed) return 'Təsdiq gözləyir';
    if (order.status === 'pending') return 'Sifariş gözləyir';
    if (order.status === 'confirmed' || order.status === 'preparing') return 'Hazırlanır';
    if (order.status === 'ready') return 'Hesab istəyir';
    if (order.status === 'served') return 'Verilib';
    return 'Məşğul';
  };

  const getTableStatusColor = (table: Table, order?: Order): string => {
    if (table.status === 'available') return 'bg-success-50 border-success-200 hover:border-success-400';
    if (table.status === 'cleaning') return 'bg-surface-secondary border-border opacity-60';
    if (table.status === 'reserved') return 'bg-warning-50 border-warning-200 hover:border-warning-400';
    if (!order) return 'bg-danger-50 border-danger-200 hover:border-danger-400';
    if (order.status === 'pending' && !order.waiterConfirmed) return 'bg-warning-50 border-warning-300 hover:border-warning-500 ring-1 ring-warning-200';
    if (order.status === 'pending') return 'bg-warning-50 border-warning-300 hover:border-warning-500 ring-1 ring-warning-200';
    if (order.status === 'confirmed' || order.status === 'preparing') return 'bg-primary-50 border-primary-200 hover:border-primary-400';
    if (order.status === 'ready') return 'bg-danger-50 border-danger-300 hover:border-danger-500 ring-1 ring-danger-200';
    if (order.status === 'served') return 'bg-primary-50 border-primary-200 hover:border-primary-400';
    return 'bg-danger-50 border-danger-200';
  };

  const getTableBadgeColor = (table: Table, order?: Order): string => {
    if (table.status === 'available') return 'bg-success-500 text-white';
    if (table.status === 'cleaning') return 'bg-text-muted text-white';
    if (table.status === 'reserved') return 'bg-warning-500 text-white';
    if (!order) return 'bg-danger-500 text-white';
    if (order.status === 'pending' && !order.waiterConfirmed) return 'bg-warning-500 text-white animate-pulse';
    if (order.status === 'pending') return 'bg-warning-500 text-white animate-pulse';
    if (order.status === 'confirmed' || order.status === 'preparing') return 'bg-primary-500 text-white';
    if (order.status === 'ready') return 'bg-danger-500 text-white animate-pulse';
    return 'bg-primary-500 text-white';
  };

  const getElapsed = (createdAt: string) => {
    const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
    const m = Math.floor(diff / 60);
    return `${m} dəq`;
  };

  const sections = [...new Set(tables.map((t) => t.section))];

  const handleConfirmCustomerOrder = (order: Order) => {
    confirmOrder(order.id, currentUser?.id || '', currentUser?.name || '');
    addToast(`Masa #${order.tableNumber} sifarişi təsdiqləndi`, 'success');
  };

  return (
    <div>
      <Header title="Ofisant Paneli" subtitle={isConfirmMode ? 'Təsdiq Rejimi' : undefined} showUser />

      <div className="p-6">
        {(isConfirmMode || paymentRequests.length > 0) && (
          <div className="mb-6">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setActiveTab('tables')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === 'tables' ? 'bg-primary-600 text-white shadow-sm' : 'bg-surface-secondary text-text-secondary hover:bg-border'
                }`}
              >
                Masalar
              </button>
              {isConfirmMode && (
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors relative ${
                    activeTab === 'pending' ? 'bg-warning-600 text-white shadow-sm' : 'bg-surface-secondary text-text-secondary hover:bg-border'
                  }`}
                >
                  Təsdiq Gözləyənlər
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
                    Hesab İstəyənlər
                  </span>
                  <span className="ml-1.5 bg-white/20 text-xs px-1.5 py-0.5 rounded-full">{paymentRequests.length}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === 'payments' && paymentRequests.length > 0 ? (
          <div className="space-y-4">
            {paymentRequests.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl border-2 border-danger-300 p-5 shadow-sm ring-2 ring-danger-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ReceiptText className="w-4 h-4 text-danger-600" />
                    <span className="font-bold text-text-primary">Masa #{order.tableNumber}</span>
                  </div>
                  <span className="flex items-center gap-1.5 bg-danger-100 text-danger-700 text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
                    <Bell className="w-3 h-3" />
                    Hesab İstəyir
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
                  <span className="text-sm font-semibold text-danger-700">Cəmi</span>
                  <span className="text-lg font-bold text-danger-700">{order.totalAmount} ₼</span>
                </div>
                <div className="flex items-center gap-2 mb-3 p-3 bg-surface-secondary rounded-xl">
                  {order.paymentMethod === 'cash' ? (
                    <>
                      <Banknote className="w-5 h-5 text-success-600" />
                      <span className="text-sm font-semibold text-text-primary">Nagd ödəniş</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5 text-primary-600" />
                      <span className="text-sm font-semibold text-text-primary">Kart ilə ödəniş</span>
                    </>
                  )}
                </div>
                <button
                  onClick={() => {
                    completePayment(order.id);
                    addToast(`Masa #${order.tableNumber} hesabı bağlandı`, 'success');
                  }}
                  className="w-full bg-success-500 hover:bg-success-600 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-5 h-5" />
                  Hesabı Bağla
                </button>
              </div>
            ))}
          </div>
        ) : activeTab === 'pending' && isConfirmMode ? (
          <div className="space-y-4">
            {pendingCustomerOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl border border-warning-300 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ReceiptText className="w-4 h-4 text-warning-600" />
                    <span className="font-bold text-text-primary">Masa #{order.tableNumber}</span>
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
                  <span className="text-sm font-semibold text-primary-700">Cəmi</span>
                  <span className="text-lg font-bold text-primary-700">{order.totalAmount} ₼</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { cancelOrder(order.id); addToast(`Masa #${order.tableNumber} sifarişi ləğv edildi`, 'warning'); }}
                    className="flex-1 bg-danger-500 hover:bg-danger-600 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
                  >
                    Rədd Et
                  </button>
                  <button
                    onClick={() => handleConfirmCustomerOrder(order)}
                    className="flex-1 bg-success-500 hover:bg-success-600 text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <UserCheck className="w-4 h-4" />
                    Təsdiqlə
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-2xl p-5 border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                    <ClipboardList className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-text-primary">{activeOrders.length}</p>
                    <p className="text-xs text-text-secondary">Aktiv Sifariş</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-success-50 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-success-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-text-primary">{availableCount}</p>
                    <p className="text-xs text-text-secondary">Boş Masa</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-danger-50 flex items-center justify-center">
                    <Users className="w-5 h-5 text-danger-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-text-primary">{occupiedCount}</p>
                    <p className="text-xs text-text-secondary">Məşğul</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-warning-50 flex items-center justify-center">
                    <ReceiptText className="w-5 h-5 text-warning-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-text-primary">{totalRevenue} ₼</p>
                    <p className="text-xs text-text-secondary">Gəlir</p>
                  </div>
                </div>
              </div>
            </div>

            {sections.map((section) => (
              <div key={section} className="mb-8">
                <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4">{section}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {tables.filter((t) => t.section === section).map((table) => {
                    const order = getTableOrder(table);
                    const label = getTableStatusLabel(table, order);
                    const bg = getTableStatusColor(table, order);
                    const badge = getTableBadgeColor(table, order);
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
                          <span className="text-2xl font-bold text-text-primary">#{table.number}</span>
                          <span className="text-xs font-medium text-text-muted flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {table.capacity}
                          </span>
                        </div>
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${badge}`}>
                          {label}
                        </span>
                        {order && (
                          <div className="mt-2 pt-2 border-t border-border/50">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-text-primary">{order.totalAmount} ₼</span>
                              <span className="text-[10px] text-text-muted flex items-center gap-0.5">
                                <Timer className="w-2.5 h-2.5" />
                                {getElapsed(order.createdAt)}
                              </span>
                            </div>
                            {order.orderSource === 'customer' && (
                              <span className="text-[10px] bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded mt-1 inline-block font-medium">
                                Müştəri sifarişi
                              </span>
                            )}
                            {order.paymentRequested && order.paymentStatus === 'pending' && (
                              <span className="text-[10px] bg-danger-50 text-danger-600 px-1.5 py-0.5 rounded mt-1 inline-block font-medium animate-pulse">
                                Hesab istəyir
                              </span>
                            )}
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-[10px] text-text-muted">
                                {order.items.length} məhsul
                              </span>
                              <ChevronRight className="w-3 h-3 text-text-muted" />
                            </div>
                          </div>
                        )}
                        {table.status === 'reserved' && table.reservation && (
                          <div className="mt-2 pt-2 border-t border-border/50">
                            <div className="flex items-center gap-1 mb-0.5">
                              <User className="w-2.5 h-2.5 text-warning-600" />
                              <span className="text-[10px] font-semibold text-warning-700">{table.reservation.guestName}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-text-muted flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" />
                                {table.reservation.time}
                              </span>
                              <span className="text-[10px] text-text-muted">{table.reservation.guestCount} nəfər</span>
                            </div>
                            {table.reservation.phone && (
                              <div className="flex items-center gap-0.5 mt-0.5">
                                <Phone className="w-2.5 h-2.5 text-text-muted" />
                                <span className="text-[10px] text-text-muted">{table.reservation.phone}</span>
                              </div>
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
        <WaiterTableDetailModal table={selectedTable} onClose={() => setSelectedTable(null)} />
      )}
    </div>
  );
}
