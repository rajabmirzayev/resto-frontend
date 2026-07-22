import { useStore } from '../../store/useStore';
import { useToast } from '../../store/useToast';
import type { Table, Order } from '../../types';
import { ORDER_ITEM_STATUS_LABELS } from '../../lib/constants';
import { X, ClipboardList, CheckCircle, UtensilsCrossed, CreditCard, Timer, ReceiptText, Banknote, Clock, User, Phone } from 'lucide-react';

interface Props {
  table: Table;
  onClose: () => void;
}

export default function WaiterTableDetailModal({ table, onClose }: Props) {
  const { orders, updateTableStatus, completePayment } = useStore();
  const { addToast } = useToast();

  const getElapsed = (createdAt: string) => {
    const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
    const m = Math.floor(diff / 60);
    return `${m} dəq`;
  };

  const getTableOrder = (): Order | undefined => {
    if (!table.currentOrderId) return undefined;
    return orders.find((o) => o.id === table.currentOrderId && !['completed', 'cancelled'].includes(o.status));
  };

  const order = getTableOrder();

  const renderContent = () => {
    if (table.status === 'available') {
      return (
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 mx-auto text-success-500 mb-3" />
          <p className="text-lg font-semibold text-text-primary">Masa Boşdur</p>
          <p className="text-sm text-text-muted mt-1">Bu masada aktiv sifariş yoxdur</p>
        </div>
      );
    }

    if (table.status === 'cleaning') {
      return (
        <div className="text-center py-8">
          <UtensilsCrossed className="w-12 h-12 mx-auto text-text-muted mb-3 opacity-40" />
          <p className="text-lg font-semibold text-text-primary">Təmizlənir</p>
          <p className="text-sm text-text-muted mt-1">Masa təmizlənir, hazırlanır</p>
          <button
            onClick={() => { updateTableStatus(table.id, 'available'); onClose(); }}
            className="mt-4 bg-success-500 hover:bg-success-600 text-white px-6 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            Təmizləndi
          </button>
        </div>
      );
    }

    if (table.status === 'reserved') {
      const r = table.reservation;
      return (
        <div className="text-center py-8">
          <Clock className="w-12 h-12 mx-auto text-warning-500 mb-3" />
          <p className="text-lg font-semibold text-text-primary">Rezervasiya</p>
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
                  <span className="text-sm text-text-secondary">{r.time} • {r.guestCount} nəfər</span>
                </div>
                {r.notes && (
                  <p className="text-xs text-text-muted pt-2 border-t border-warning-200">{r.notes}</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-text-muted mt-1">Masa rezervasiya olunub</p>
          )}
          <button
            onClick={() => { updateTableStatus(table.id, 'available'); onClose(); }}
            className="mt-4 bg-success-500 hover:bg-success-600 text-white px-6 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            Boşalt
          </button>
        </div>
      );
    }

    if (!order) {
      return (
        <div className="text-center py-8">
          <ClipboardList className="w-12 h-12 mx-auto text-text-muted mb-3 opacity-40" />
          <p className="text-lg font-semibold text-text-primary">Sifariş Tapılmadı</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-surface-secondary rounded-xl">
          <div className="flex items-center gap-2">
            <ReceiptText className="w-4 h-4 text-text-muted" />
            <span className="text-sm font-medium text-text-secondary">
              Sifariş #{order.id.slice(0, 6).toUpperCase()}
            </span>
            {order.orderSource === 'customer' && (
              <span className="text-[10px] bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded font-medium">Müştəri</span>
            )}
          </div>
          <span className="text-xs text-text-muted flex items-center gap-1">
            <Timer className="w-3 h-3" />
            {getElapsed(order.createdAt)}
          </span>
        </div>

        <div>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Məhsullar</p>
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
            <span className="text-sm font-semibold text-primary-700">Cəmi</span>
            <span className="text-xl font-bold text-primary-700">{order.totalAmount} ₼</span>
          </div>
        </div>

        {order.paymentRequested && order.paymentStatus === 'pending' && (
          <div className="p-4 bg-danger-50 rounded-xl border border-danger-200 flex items-center gap-3">
            {order.paymentMethod === 'cash' ? (
              <Banknote className="w-5 h-5 text-success-600" />
            ) : (
              <CreditCard className="w-5 h-5 text-primary-600" />
            )}
            <div>
              <p className="text-sm font-semibold text-danger-700">Hesab istəyir</p>
              <p className="text-xs text-danger-600">Ödəniş üsulu: {order.paymentMethod === 'cash' ? 'Nagd' : 'Kart'}</p>
            </div>
          </div>
        )}

        {(order.status === 'ready' || order.paymentRequested) && (
          <button
            onClick={() => {
              completePayment(order.id);
              updateTableStatus(table.id, 'available');
              onClose();
              addToast(`Masa #${table.number} hesabı bağlandı`, 'success');
            }}
            className="w-full bg-success-500 hover:bg-success-600 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <CreditCard className="w-5 h-5" />
            Hesabı Bağla
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-border flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-text-primary">Masa #{table.number}</h3>
            <p className="text-xs text-text-muted">{table.section} • {table.capacity} nəfər</p>
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
