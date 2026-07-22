import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../../i18n';
import { useStore } from '../../store/useStore';
import { useToast } from '../../store/useToast';
import { Clock, ChefHat, CheckCircle, UtensilsCrossed, ArrowLeft, ReceiptText, UserCheck, Banknote, CreditCard, X } from 'lucide-react';
import type { PaymentMethod } from '../../types';
import { getOrderItemStatusLabels } from '../../lib/constants';

export default function CustomerOrder() {
  const { t } = useTranslation();
  const ORDER_ITEM_STATUS_LABELS = getOrderItemStatusLabels(t);
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
          <h2 className="text-xl font-semibold text-text-primary">{t('order.not_found')}</h2>
          <p className="text-text-secondary mt-2 text-sm">{t('order.no_active_order')}</p>
          <button
            onClick={() => navigate('/menu')}
            className="mt-6 bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            {t('order.back_to_menu')}
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = [
    { key: 'pending', label: t('order.status.pending'), sublabel: t('order.waiter_confirmation_pending'), icon: Clock, color: 'warning' },
    { key: 'confirmed', label: t('order.status.confirmed'), sublabel: t('order.confirmed_by_waiter'), icon: CheckCircle, color: 'primary' },
    { key: 'preparing', label: t('order.status.preparing'), sublabel: t('order.confirmed_by_waiter_detail'), icon: ChefHat, color: 'primary' },
    { key: 'ready', label: t('order.status.ready'), sublabel: t('order.customer_order'), icon: UtensilsCrossed, color: 'success' },
    { key: 'served', label: t('order.status.served'), sublabel: t('order.confirmed_by_waiter_detail'), icon: CheckCircle, color: 'success' },
    { key: 'completed', label: t('order.status.completed'), sublabel: t('order.confirmed_by_waiter_detail'), icon: CheckCircle, color: 'success' },
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

  const handleRequestPayment = (method: PaymentMethod) => {
    requestPayment(order.id, method);
    setShowPaymentModal(false);
    addToast(t('toast.bill_requested'), 'success');
  };

  return (
    <div className="min-h-screen bg-surface-secondary">
      <div className="bg-white dark:bg-surface border-b border-border px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => navigate('/menu')}
          className="p-2 hover:bg-surface-secondary rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-text-primary">{t('order.details')}</h1>
          <p className="text-xs text-text-muted">{t('table.number_prefix', { number: order.tableNumber })}</p>
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto space-y-4">
        {order.orderSource === 'customer' && !order.waiterConfirmed && (
          <div className="bg-warning-50 border border-warning-200 rounded-2xl p-4 flex items-start gap-3">
            <UserCheck className="w-5 h-5 text-warning-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-warning-700">{t('order.waiter_confirmation_pending')}</p>
              <p className="text-xs text-warning-600 mt-1">{t('order.waiter_confirmation_pending_detail')}</p>
            </div>
          </div>
        )}

        {order.orderSource === 'customer' && order.waiterConfirmed && order.status === 'confirmed' && (
          <div className="bg-success-50 border border-success-200 rounded-2xl p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-success-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-success-700">{t('order.confirmed_by_waiter')}</p>
              <p className="text-xs text-success-600 mt-1">{t('order.confirmed_by_waiter_detail')}</p>
            </div>
          </div>
        )}

        {order.paymentRequested && (
          <div className="bg-primary-50 border border-primary-200 rounded-2xl p-4 flex items-start gap-3">
            <ReceiptText className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-primary-700">{t('order.bill_requested')}</p>
              <p className="text-xs text-primary-600 mt-1">
                {t('payment.method')}: {order.paymentMethod === 'cash' ? t('payment.cash') : t('payment.card')}
                {order.paymentMethod === 'cash' ? ' 💵' : ' 💳'}
              </p>
              <p className="text-xs text-primary-500 mt-1">{t('order.waiter_coming')}</p>
            </div>
          </div>
        )}

        {isCancelled && (
          <div className="bg-danger-50 border border-danger-500/20 rounded-2xl p-4 text-center">
            <p className="text-danger-600 font-semibold">{t('order.cancelled')}</p>
          </div>
        )}

        {!isCancelled && (
          <div className="bg-white dark:bg-surface rounded-2xl border border-border p-5">
            <div className="flex items-center gap-2 mb-1">
              <ReceiptText className="w-4 h-4 text-text-muted" />
              <p className="text-xs font-medium text-text-muted uppercase tracking-wider">{t('order.order_number_prefix', { number: order.id.slice(0, 6).toUpperCase() })}</p>
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
                          <span className="text-xs font-medium text-primary-600">{t('order.active_status')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-surface rounded-2xl border border-border p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-3">{t('order.details')}</h3>
          <div className="space-y-2">
            {order.items.map((item) => {
              const statusInfo = ORDER_ITEM_STATUS_LABELS[item.status] || ORDER_ITEM_STATUS_LABELS.pending;
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
            <span className="text-sm text-text-secondary">{t('order.total')}</span>
            <span className="text-lg font-bold text-primary-600">{order.totalAmount} ₼</span>
          </div>
        </div>

        <div className="bg-white dark:bg-surface rounded-2xl border border-border p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">{t('order.date_label')}:</span>
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
            {t('order.request_bill')}
          </button>
        )}

        <button
          onClick={() => navigate('/menu')}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-xl text-sm font-semibold transition-colors"
        >
          {t('order.back_to_menu_btn')}
        </button>
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowPaymentModal(false)}>
          <div className="bg-white dark:bg-surface rounded-2xl w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-lg font-semibold text-text-primary">{t('payment.method')}</h3>
              <button onClick={() => setShowPaymentModal(false)} className="p-1 hover:bg-surface-secondary rounded-lg transition-colors">
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              <p className="text-sm text-text-secondary text-center mb-4">{t('payment.how_to_pay')}</p>

              <button
                onClick={() => handleRequestPayment('cash')}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-border hover:border-success-400 hover:bg-success-50 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-success-100 flex items-center justify-center">
                  <Banknote className="w-6 h-6 text-success-600" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-text-primary">{t('payment.cash')}</p>
                  <p className="text-xs text-text-muted">{t('payment.cash_description')}</p>
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
                  <p className="font-semibold text-text-primary">{t('payment.card')}</p>
                  <p className="text-xs text-text-muted">{t('payment.card_description')}</p>
                </div>
              </button>
            </div>

            <div className="px-6 pb-6">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="w-full px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors"
              >
                {t('common.back')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
