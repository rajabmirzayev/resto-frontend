import Header from '../../components/layout/Header';
import { useStore } from '../../store/useStore';
import { useTranslation } from '../../i18n';
import { ORDER_MODES } from '../../types';
import type { OrderMode } from '../../types';
import { Settings, UtensilsCrossed, UserCheck, ChefHat, ClipboardList, Check, Camera, ShieldCheck, Clock, CreditCard, Sun, Moon, Monitor, Palette } from 'lucide-react';
import { useTheme } from '../../store/useTheme';
import { useCustomerTheme } from '../../store/useCustomerTheme';
import type { CustomerThemeId } from '../../types';

const modeIcons: Record<OrderMode, typeof Settings> = {
  'waiter': UtensilsCrossed,
  'customer': UserCheck,
  'customer-waiter-confirm': ClipboardList,
  'kitchen': ChefHat,
};

const modeTitleKeys: Record<OrderMode, string> = {
  'waiter': 'mode.waiter.title',
  'customer': 'mode.customer.title',
  'customer-waiter-confirm': 'mode.customer_waiter_confirm.title',
  'kitchen': 'mode.kitchen.title',
};

const modeDescKeys: Record<OrderMode, string> = {
  'waiter': 'mode.waiter.description',
  'customer': 'mode.customer.description',
  'customer-waiter-confirm': 'mode.customer_waiter_confirm.description',
  'kitchen': 'mode.kitchen.description',
};

export default function AdminSettings() {
  const { t } = useTranslation();
  const { orderMode, setOrderMode, customerPhotoRequired, setCustomerPhotoRequired, paymentTiming, setPaymentTiming } = useStore();
  const { theme, setTheme } = useTheme();
  const { theme: customerTheme, setTheme: setCustomerTheme } = useCustomerTheme();

  const customerThemeColors: Record<CustomerThemeId, string[]> = {
    classic: ['#0ea5e9', '#0284c7', '#0369a1'],
    emerald: ['#10b981', '#059669', '#047857'],
    sunset: ['#f97316', '#ea580c', '#c2410c'],
    rose: ['#f43f5e', '#e11d48', '#be123c'],
    violet: ['#8b5cf6', '#7c3aed', '#6d28d9'],
    amber: ['#f59e0b', '#d97706', '#b45309'],
  };

  const customerThemeIds: CustomerThemeId[] = ['classic', 'emerald', 'sunset', 'rose', 'violet', 'amber'];

  return (
    <div>
      <Header title={t('settings.title')} subtitle={t('settings.subtitle')} showUser />

      <div className="p-6 max-w-4xl">
        <div className="mb-8">
          <h2 className="text-lg font-bold text-text-primary mb-1">{t('settings.order_mode')}</h2>
          <p className="text-sm text-text-secondary">{t('settings.order_mode_description')}</p>
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
                  {t(modeTitleKeys[mode.value])}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed mb-4">
                  {t(modeDescKeys[mode.value])}
                </p>

                <div className="flex gap-3 text-xs">
                  <span className={`px-2.5 py-1 rounded-full font-medium ${
                    mode.waiterPanel ? 'bg-warning-50 text-warning-600' : 'bg-surface-secondary text-text-muted'
                  }`}>
                    {t('role.waiter')}: {mode.waiterPanel ? t('common.yes') : t('common.no')}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full font-medium ${
                    mode.kitchenPanel ? 'bg-success-50 text-success-600' : 'bg-surface-secondary text-text-muted'
                  }`}>
                    {t('role.chef')}: {mode.kitchenPanel ? t('common.yes') : t('common.no')}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-8 bg-white dark:bg-surface rounded-2xl border border-border p-6">
          <h3 className="text-base font-bold text-text-primary mb-3">{t('settings.current_mode')}: {t(modeTitleKeys[orderMode])}</h3>
          <div className="bg-surface-secondary rounded-xl p-4">
            <p className="text-sm text-text-secondary leading-relaxed">
              {t(modeDescKeys[orderMode])}
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
                    <h4 className="text-base font-bold text-text-primary">{t('settings.customer_photo_confirmation')}</h4>
                    <p className="text-sm text-text-secondary mt-1">
                      {t('settings.customer_photo_description')}
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
                      <span className="font-medium">{t('settings.active')}</span>
                    </div>
                    <p className="text-xs text-success-600 mt-1">{t('settings.photo_required_detail')}</p>
                  </div>
                )}
                {!customerPhotoRequired && (
                  <div className="mt-3 p-3 bg-surface-secondary rounded-xl">
                    <p className="text-xs text-text-muted">{t('settings.photo_optional_detail')}</p>
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
                <h4 className="text-base font-bold text-text-primary mb-1">{t('settings.payment_timing')}</h4>
                <p className="text-sm text-text-secondary mb-4">
                  {t('settings.payment_timing_description')}
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
                        {t('settings.payment_before')}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary">{t('settings.payment_before_detail')}</p>
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
                        {t('settings.payment_after')}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary">{t('settings.payment_after_detail')}</p>
                  </button>
                </div>

                <div className={`mt-3 p-3 rounded-xl ${paymentTiming === 'before' ? 'bg-primary-50 border border-primary-200' : 'bg-success-50 border border-success-200'}`}>
                  <p className={`text-xs ${paymentTiming === 'before' ? 'text-primary-700' : 'text-success-700'}`}>
                    {paymentTiming === 'before'
                      ? t('settings.current_before_payment')
                      : t('settings.current_after_payment')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-white dark:bg-surface rounded-2xl border border-border p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-warning-50 flex items-center justify-center flex-shrink-0">
                <Sun className="w-6 h-6 text-warning-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-base font-bold text-text-primary mb-1">{t('settings.theme')}</h4>
                <p className="text-sm text-text-secondary mb-4">
                  {t('settings.theme_description')}
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex-1 p-4 rounded-xl border-2 transition-all text-center ${
                      theme === 'light'
                        ? 'border-warning-500 bg-warning-50'
                        : 'border-border hover:border-warning-300'
                    }`}
                  >
                    <Sun className={`w-6 h-6 mx-auto mb-2 ${theme === 'light' ? 'text-warning-600' : 'text-text-muted'}`} />
                    <span className={`block font-semibold ${theme === 'light' ? 'text-warning-700' : 'text-text-primary'}`}>
                      {t('settings.theme_light')}
                    </span>
                    <p className="text-xs text-text-secondary mt-1">{t('settings.theme_light_desc')}</p>
                  </button>

                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex-1 p-4 rounded-xl border-2 transition-all text-center ${
                      theme === 'dark'
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-border hover:border-primary-300'
                    }`}
                  >
                    <Moon className={`w-6 h-6 mx-auto mb-2 ${theme === 'dark' ? 'text-primary-600' : 'text-text-muted'}`} />
                    <span className={`block font-semibold ${theme === 'dark' ? 'text-primary-700' : 'text-text-primary'}`}>
                      {t('settings.theme_dark')}
                    </span>
                    <p className="text-xs text-text-secondary mt-1">{t('settings.theme_dark_desc')}</p>
                  </button>

                  <button
                    onClick={() => setTheme('system')}
                    className={`flex-1 p-4 rounded-xl border-2 transition-all text-center ${
                      theme === 'system'
                        ? 'border-text-secondary bg-surface-secondary'
                        : 'border-border hover:border-text-muted'
                    }`}
                  >
                    <Monitor className={`w-6 h-6 mx-auto mb-2 ${theme === 'system' ? 'text-text-primary' : 'text-text-muted'}`} />
                    <span className={`block font-semibold ${theme === 'system' ? 'text-text-primary' : 'text-text-primary'}`}>
                      {t('settings.theme_system')}
                    </span>
                    <p className="text-xs text-text-secondary mt-1">{t('settings.theme_system_desc')}</p>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-border">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-text-primary mb-1">{t('settings.customer_theme')}</h2>
              <p className="text-sm text-text-secondary">{t('settings.customer_theme_description')}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {customerThemeIds.map((tid) => {
                const isActive = customerTheme === tid;
                const colors = customerThemeColors[tid];
                return (
                  <button
                    key={tid}
                    onClick={() => setCustomerTheme(tid)}
                    className={`relative text-left p-5 rounded-2xl border-2 transition-all ${
                      isActive
                        ? 'border-primary-500 bg-primary-50 shadow-lg shadow-primary-100'
                        : 'border-border bg-white dark:bg-surface hover:border-primary-300 hover:shadow-md'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute top-3 right-3 w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}

                    <div className="flex gap-1.5 mb-3">
                      {colors.map((c, i) => (
                        <div key={i} className="w-6 h-6 rounded-md" style={{ backgroundColor: c }} />
                      ))}
                    </div>

                    <span className={`text-sm font-bold ${isActive ? 'text-primary-700' : 'text-text-primary'}`}>
                      {t('settings.customer_theme_' + tid)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
      </div>
    </div>
  );
}
