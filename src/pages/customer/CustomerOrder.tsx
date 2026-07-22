import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { useToast } from '../../store/useToast';
import { Clock, ChefHat, CheckCircle, UtensilsCrossed, ArrowLeft, ReceiptText, UserCheck, Banknote, CreditCard, X } from 'lucide-react';
import type { PaymentMethod } from '../../types';

export default function CustomerOrder() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('id');
  const orders = useStore((s) => s.orders);
  const requestPayment = useStore((s) => s.requestPayment);
  const paymentTiming = useStore((s) => s.paymentTiming);
  const { addToast } = useToast();

  const [, forceUpdate] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate((n) => n + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const order = orderId ? orders.find((o) => o.id === orderId) : null;

  if (!order) {
    return (
      <div className="min-h-screen bg-surface-secondary flex items-center justify-center p-4">
        <div className="text-center">
          <ChefHat className="w-16 h-16 mx-auto text-text-muted mb-4 opacity-40" />
          <h2 className="text-xl font-semibold text-text-primary">Sifariş Tapılmadı</h2>
          <p className="text-text-secondary mt-2 text-sm">Aktiv sifarişiniz yoxdur</p>
          <button
            onClick={() => navigate('/menu')}
            className="mt-6 bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            Menyuya qayıt
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = [
    { key: 'pending', label: 'Qəbul edildi', sublabel: 'Sifarişiniz qeydə alındı', icon: Clock, color: 'warning' },
    { key: 'confirmed', label: 'Təsdiqləndi', sublabel: 'Sifarişiniz təsdiqləndi', icon: CheckCircle, color: 'primary' },
    { key: 'preparing', label: 'Hazırlanır', sublabel: 'Mtbəxdə hazırlanır', icon: ChefHat, color: 'primary' },
    { key: 'ready', label: 'Hazırdır', sublabel: 'Sifarişiniz hazırdır', icon: UtensilsCrossed, color: 'success' },
    { key: 'served', label: 'Verilib', sublabel: 'Sifarişiniz masanıza verilib', icon: CheckCircle, color: 'success' },
    { key: 'completed', label: 'Tamamlandı', sublabel: 'Sifariş tamamlandı', icon: CheckCircle, color: 'success' },
  ];

  const activeIndex = statusConfig.findIndex((s) => s.key === order.status);
  const isCancelled = order.status === 'cancelled';
  const isCompleted = order.status === 'completed';
  const canRequestPayment = paymentTiming === 'after' && !isCancelled && !isCompleted && !order.paymentRequested && order.paymentStatus === 'pending';

  const statusColorMap: Record<string, string> = {
    warning: 'bg-warning-500 text-white',
    primary: 'bg-primary-500 text-white',
    success: 'bg-success-500 text-white',
  };

  const itemStatusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: 'Gözləyir', color: 'bg-warning-50 text-warning-600' },
    confirmed: { label: 'Təsdiqlənib', color: 'bg-primary-50 text-primary-600' },
    preparing: { label: 'Hazırlanır', color: 'bg-primary-50 text-primary-700' },
    ready: { label: 'Hazırdır', color: 'bg-success-50 text-success-600' },
    served: { label: 'Verilib', color: 'bg-success-50 text-success-600' },
    completed: { label: 'Tamamlanıb', color: 'bg-surface-secondary text-text-muted' },
    cancelled: { label: 'Ləğv', color: 'bg-danger-50 text-danger-600' },
  };

  const handleRequestPayment = (method: PaymentMethod) => {
    requestPayment(order.id, method);
    setShowPaymentModal(false);
    addToast('Hesab istəyi göndərildi. Ofisant gələcək.', 'success');
  };

  return (
    <div className="min-h-screen bg-surface-secondary">
      <div className="bg-white border-b border-border px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => navigate('/menu')}
          className="p-2 hover:bg-surface-secondary rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-text-primary">Sifariş Vəziyyəti</h1>
          <p className="text-xs text-text-muted">Masa #{order.tableNumber}</p>
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto space-y-4">
        {order.orderSource === 'customer' && !order.waiterConfirmed && (
          <div className="bg-warning-50 border border-warning-200 rounded-2xl p-4 flex items-start gap-3">
            <UserCheck className="w-5 h-5 text-warning-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-warning-700">Ofisant təsdiqi gözlənilir</p>
              <p className="text-xs text-warning-600 mt-1">Sifarişiniz ofisant tərəfindən yoxlanılır. Təsdiq edildikdən sonra metbəxə göndəriləcək.</p>
            </div>
          </div>
        )}

        {order.orderSource === 'customer' && order.waiterConfirmed && order.status === 'confirmed' && (
          <div className="bg-success-50 border border-success-200 rounded-2xl p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-success-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-success-700">Sifariş təsdiqləndi</p>
              <p className="text-xs text-success-600 mt-1">Sifarişiniz ofisant tərəfindən təsdiqləndi və metbəxə göndərildi.</p>
            </div>
          </div>
        )}

        {order.paymentRequested && (
          <div className="bg-primary-50 border border-primary-200 rounded-2xl p-4 flex items-start gap-3">
            <ReceiptText className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-primary-700">Hesab istəyi göndərildi</p>
              <p className="text-xs text-primary-600 mt-1">
                Ödəniş üsulu: {order.paymentMethod === 'cash' ? 'Nagd' : 'Kart'}
                {order.paymentMethod === 'cash' ? ' 💵' : ' 💳'}
              </p>
              <p className="text-xs text-primary-500 mt-1">Ofisant tezliklə gələcək.</p>
            </div>
          </div>
        )}

        {isCancelled && (
          <div className="bg-danger-50 border border-danger-500/20 rounded-2xl p-4 text-center">
            <p className="text-danger-600 font-semibold">Sifariş ləğv edilib</p>
          </div>
        )}

        {!isCancelled && (
          <div className="bg-white rounded-2xl border border-border p-5">
            <div className="flex items-center gap-2 mb-1">
              <ReceiptText className="w-4 h-4 text-text-muted" />
              <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Sifariş #{order.id.slice(0, 6).toUpperCase()}</p>
            </div>

            <div className="mt-5 space-y-0">
              {statusConfig.map((step, index) => {
                const isDone = index <= activeIndex;
                const isCurrent = index === activeIndex;

                return (
                  <div key={step.key} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                          isDone ? statusColorMap[step.color] : 'bg-surface-secondary text-text-muted'
                        } ${isCurrent ? 'ring-4 ring-primary-100' : ''}`}
                      >
                        <step.icon className="w-4 h-4" />
                      </div>
                      {index < statusConfig.length - 1 && (
                        <div className={`w-0.5 h-8 my-1 rounded-full transition-all duration-500 ${
                          index < activeIndex ? 'bg-success-500' : 'bg-border'
                        }`} />
                      )}
                    </div>
                    <div className="pt-1.5 pb-2">
                      <p className={`text-sm font-semibold ${isDone ? 'text-text-primary' : 'text-text-muted'}`}>
                        {step.label}
                      </p>
                      <p className={`text-xs ${isDone ? 'text-text-secondary' : 'text-text-muted'}`}>
                        {step.sublabel}
                      </p>
                      {isCurrent && (
                        <div className="mt-1.5 inline-flex items-center gap-1.5">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                          </span>
                          <span className="text-xs font-medium text-primary-600">Aktiv</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-border p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Sifariş Detalları</h3>
          <div className="space-y-2">
            {order.items.map((item) => {
              const statusInfo = itemStatusLabels[item.status] || itemStatusLabels.pending;
              return (
                <div key={item.id} className="flex items-center justify-between p-3 bg-surface-secondary rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{item.menuItemName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-text-muted">×{item.quantity}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-text-primary ml-3">{item.price * item.quantity} ₼</span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
            <span className="text-sm text-text-secondary">Cəmi</span>
            <span className="text-lg font-bold text-primary-600">{order.totalAmount} ₼</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Tarix:</span>
            <span className="text-text-primary font-medium">
              {new Date(order.createdAt).toLocaleString('az-AZ')}
            </span>
          </div>
        </div>

        {canRequestPayment && (
          <button
            onClick={() => setShowPaymentModal(true)}
            className="w-full bg-success-500 hover:bg-success-600 text-white py-3 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <ReceiptText className="w-4 h-4" />
            Hesab İstəyirəm
          </button>
        )}

        <button
          onClick={() => navigate('/menu')}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-xl text-sm font-semibold transition-colors"
        >
          Menyuya Qayıt
        </button>
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowPaymentModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-lg font-semibold text-text-primary">Ödəniş Üsulu</h3>
              <button onClick={() => setShowPaymentModal(false)} className="p-1 hover:bg-surface-secondary rounded-lg transition-colors">
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <p className="text-sm text-text-secondary text-center mb-4">Hesabı necə ödəmək istəyirsiniz?</p>
              
              <button
                onClick={() => handleRequestPayment('cash')}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-border hover:border-success-400 hover:bg-success-50 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-success-100 flex items-center justify-center">
                  <Banknote className="w-6 h-6 text-success-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-text-primary">Nagd</p>
                  <p className="text-xs text-text-muted">Nağd ödəniş</p>
                </div>
              </button>

              <button
                onClick={() => handleRequestPayment('card')}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-border hover:border-primary-400 hover:bg-primary-50 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-primary-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-text-primary">Kart</p>
                  <p className="text-xs text-text-muted">Kartla ödəniş</p>
                </div>
              </button>
            </div>

            <div className="px-6 pb-6">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="w-full px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors"
              >
                Geri
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
