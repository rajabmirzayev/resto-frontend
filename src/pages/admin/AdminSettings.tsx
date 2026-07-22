import Header from '../../components/layout/Header';
import { useStore } from '../../store/useStore';
import { ORDER_MODES } from '../../types';
import type { OrderMode } from '../../types';
import { Settings, UtensilsCrossed, UserCheck, ChefHat, ClipboardList, Check, Camera, ShieldCheck, Clock, CreditCard } from 'lucide-react';

const modeIcons: Record<OrderMode, typeof Settings> = {
  'waiter': UtensilsCrossed,
  'customer': UserCheck,
  'customer-waiter-confirm': ClipboardList,
  'kitchen': ChefHat,
};

export default function AdminSettings() {
  const { orderMode, setOrderMode, customerPhotoRequired, setCustomerPhotoRequired, paymentTiming, setPaymentTiming } = useStore();

  return (
    <div>
      <Header title="Tənzimləmələr" subtitle="Restoran konfiqurasiyası" showUser />

      <div className="p-6 max-w-4xl">
        <div className="mb-8">
          <h2 className="text-lg font-bold text-text-primary mb-1">Sifariş Rejimi</h2>
          <p className="text-sm text-text-secondary">Restoranınızın sifariş axınını tənzimləyin. Rejimi dəyişdikdə bütün sifarişlər yeni qaydalara uyğun idarə olunacaq.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ORDER_MODES.map((mode) => {
            const Icon = modeIcons[mode.value];
            const isActive = orderMode === mode.value;

            return (
              <button
                key={mode.value}
                onClick={() => setOrderMode(mode.value)}
                className={`relative text-left p-6 rounded-2xl border-2 transition-all ${
                  isActive
                    ? 'border-primary-500 bg-primary-50 shadow-lg shadow-primary-100'
                    : 'border-border bg-white dark:bg-surface hover:border-primary-300 hover:shadow-md'
                }`}
              >
                {isActive && (
                  <div className="absolute top-4 right-4 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}

                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                  isActive ? 'bg-primary-600 text-white' : 'bg-surface-secondary text-text-muted'
                }`}>
                  <Icon className="w-6 h-6" />
                </div>

                <h3 className={`text-base font-bold mb-2 ${isActive ? 'text-primary-700' : 'text-text-primary'}`}>
                  {mode.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed mb-4">
                  {mode.description}
                </p>

                <div className="flex gap-3 text-xs">
                  <span className={`px-2.5 py-1 rounded-full font-medium ${
                    mode.waiterPanel ? 'bg-warning-50 text-warning-600' : 'bg-surface-secondary text-text-muted'
                  }`}>
                    Ofisant: {mode.waiterPanel ? 'Var' : 'Yoxdur'}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full font-medium ${
                    mode.kitchenPanel ? 'bg-success-50 text-success-600' : 'bg-surface-secondary text-text-muted'
                  }`}>
                    Metbex: {mode.kitchenPanel ? 'Var' : 'Yoxdur'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-8 bg-white dark:bg-surface rounded-2xl border border-border p-6">
          <h3 className="text-base font-bold text-text-primary mb-3">Cari Rejim: {ORDER_MODES.find((m) => m.value === orderMode)?.title}</h3>
          <div className="bg-surface-secondary rounded-xl p-4">
            <p className="text-sm text-text-secondary leading-relaxed">
              {orderMode === 'waiter' && 'Ofisantlar menyudan sifarişləri öz panelindən yazır. Müştəri menyuya sadəcə baxa bilər və ya QR kod ilə menyunu görüntüləyə bilər.'}
              {orderMode === 'customer' && 'Müştəri QR kod ilə menyuya daxil olur, sifarişini seçir və birbaşa metbexə göndərir. Ofisant paneli lazım deyil.'}
              {orderMode === 'customer-waiter-confirm' && 'Müştəri QR kod ilə sifarişini edir. Ofisant panelində sifariş görünür və ofisant düzgünlüyünü yoxlayıb təsdiqləyir. Təsdiqdən sonra metbexə gedir.'}
              {orderMode === 'kitchen' && 'Sifarişlər sistemi vasitəsilə birbaşa metbexə düşür. Ofisant və ya müştəri paneli olmadan sadəcə metbex paneli işləyir.'}
            </p>
          </div>
        </div>

        {orderMode === 'customer' && (
          <div className="mt-6 bg-white dark:bg-surface rounded-2xl border border-border p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-warning-50 flex items-center justify-center flex-shrink-0">
                <Camera className="w-6 h-6 text-warning-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-bold text-text-primary">Müşteri Şəkil Təsdiqi</h4>
                    <p className="text-sm text-text-secondary mt-1">
                      Müştəri sifariş verəndə masada olduğunu təsdiqləmək üçün telefonu ilə şəkil çəkməlidir. Mtbəx personalı şəkilə baxıb sifarişi təsdiqləyir.
                    </p>
                  </div>
                  <button
                    onClick={() => setCustomerPhotoRequired(!customerPhotoRequired)}
                    className={`relative w-14 h-8 rounded-full transition-colors flex-shrink-0 ml-4 ${
                      customerPhotoRequired ? 'bg-success-500' : 'bg-border'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-6 h-6 bg-white dark:bg-surface rounded-full shadow transition-transform ${
                        customerPhotoRequired ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                {customerPhotoRequired && (
                  <div className="mt-3 p-3 bg-success-50 rounded-xl border border-success-200">
                    <div className="flex items-center gap-2 text-sm text-success-700">
                      <ShieldCheck className="w-4 h-4" />
                      <span className="font-medium">Aktivdir</span>
                    </div>
                    <p className="text-xs text-success-600 mt-1">Müştəri sifariş zamanı şəkil yükləmək məcburiyyətindədir. Şəkil olmadan sifariş qəbul edilmir.</p>
                  </div>
                )}
                {!customerPhotoRequired && (
                  <div className="mt-3 p-3 bg-surface-secondary rounded-xl">
                    <p className="text-xs text-text-muted">Deaktivdir. Müştəri şəkil yükləmədən sifariş verə bilər.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 bg-white dark:bg-surface rounded-2xl border border-border p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-6 h-6 text-primary-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-base font-bold text-text-primary mb-1">Ödəniş Vaxtı</h4>
                <p className="text-sm text-text-secondary mb-4">
                  Hesab sifarişdən əvvəl və ya sonradan alınsın.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setPaymentTiming('before')}
                    className={`flex-1 p-4 rounded-xl border-2 transition-all text-left ${
                      paymentTiming === 'before'
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-border hover:border-primary-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className={`w-5 h-5 ${paymentTiming === 'before' ? 'text-primary-600' : 'text-text-muted'}`} />
                      <span className={`font-semibold ${paymentTiming === 'before' ? 'text-primary-700' : 'text-text-primary'}`}>
                        Əvvəlcədən
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary">Hesab sifarişdən əvvəl alınır. Müştəri ödənişini edir.</p>
                  </button>

                  <button
                    onClick={() => setPaymentTiming('after')}
                    className={`flex-1 p-4 rounded-xl border-2 transition-all text-left ${
                      paymentTiming === 'after'
                        ? 'border-success-500 bg-success-50'
                        : 'border-border hover:border-success-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className={`w-5 h-5 ${paymentTiming === 'after' ? 'text-success-600' : 'text-text-muted'}`} />
                      <span className={`font-semibold ${paymentTiming === 'after' ? 'text-success-700' : 'text-text-primary'}`}>
                        Sonradan
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary">Müştəri yeməyini yeyir, sonra hesab istəyir.</p>
                  </button>
                </div>

                <div className={`mt-3 p-3 rounded-xl ${paymentTiming === 'before' ? 'bg-primary-50 border border-primary-200' : 'bg-success-50 border border-success-200'}`}>
                  <p className={`text-xs ${paymentTiming === 'before' ? 'text-primary-700' : 'text-success-700'}`}>
                    {paymentTiming === 'before'
                      ? 'Cari: Əvvəlcədən ödəniş — Hesab sifarişdən əvvəl alınır.'
                      : 'Cari: Sonradan ödəniş — Müştəri yemək bitdikdən sonra hesab istəyir.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}
