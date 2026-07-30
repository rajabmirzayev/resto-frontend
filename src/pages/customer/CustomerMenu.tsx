import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useTranslation } from '../../i18n';
import { useStore } from '../../store/useStore';
import { useCustomerTheme } from '../../store/useCustomerTheme';
import CameraCapture from '../../components/customer/CameraCapture';
import CustomerHeader from '../../components/customer/CustomerHeader';
import { ShoppingBag, Plus, Minus, Trash2, X, Check, ChevronDown, Camera, Banknote, CreditCard } from 'lucide-react';
import type { PaymentMethod } from '../../types';

export default function CustomerMenu() {
  const { t } = useTranslation();
  const { menuItems, menuCategories, tables, cart, addToCart, removeFromCart, updateCartQuantity, clearCart, createCustomerOrder, requestPayment, orderMode, customerPhotoRequired, paymentTiming } = useStore();
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const [showCamera, setShowCamera] = useState(false);

  const { theme: customerTheme } = useCustomerTheme();

  const orgId = params.orgId || searchParams.get('org');
  const urlTableId = params.tableId || undefined;

  const canOrder = orderMode === 'customer' || orderMode === 'customer-waiter-confirm';
  const needsPhoto = canOrder && customerPhotoRequired;

  const orgMenuItems = orgId ? menuItems.filter((m) => !m.orgId || m.orgId === orgId) : menuItems;
  const orgCategories = orgId ? menuCategories.filter((c) => !c.orgId || c.orgId === orgId) : menuCategories;
  const orgTables = orgId ? tables.filter((t) => !t.orgId || t.orgId === orgId) : tables;

  const tableParam = urlTableId || searchParams.get('t');
  const initialTable = tableParam
    ? (orgTables.find((t) => t.id === tableParam)?.id || orgTables.find((t) => t.number === Number(tableParam))?.id || '')
    : '';
  const [selectedTableId, setSelectedTableId] = useState<string>(initialTable);
  const [activeCategory, setActiveCategory] = useState<string>(orgCategories[0]?.id || '');
  const [showCart, setShowCart] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [customerPhoto, setCustomerPhoto] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>(null);
  const isBeforePayment = paymentTiming === 'before';

  const isScrollingRef = useRef(false);
  const categoryRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const categoryTabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const showCameraRef = useRef(showCamera);
  const showOrderModalRef = useRef(showOrderModal);
  const showCartRef = useRef(showCart);

  const availableTables = orgTables.filter((t) => t.status === 'available');
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleAddToCart = (item: (typeof orgMenuItems)[0]) => {
    addToCart({
      menuItemId: item.id,
      menuItemName: item.name,
      price: item.price,
      quantity: 1,
    });
  };

  const handleOpenOrderModal = () => {
    if (cart.length === 0) return;
    setOrderError('');
    setShowCart(false);
    setShowOrderModal(true);
  };

  const handleOpenCamera = () => {
    setOrderError('');
    setShowCamera(true);
  };

  const handlePhotoCaptured = useCallback((photo: string) => {
    setCustomerPhoto(photo);
    setOrderError('');
    setShowCamera(false);
  }, []);

  const handleConfirmOrder = () => {
    if (!selectedTableId) {
      setOrderError(t('error.please_select_table'));
      return;
    }
    if (needsPhoto && !customerPhoto) {
      setOrderError(t('error.please_take_photo'));
      return;
    }
    if (isBeforePayment && !selectedPaymentMethod) {
      setOrderError(t('error.please_select_payment_method'));
      return;
    }
    const order = createCustomerOrder(selectedTableId, customerPhoto || undefined);
    if (order) {
      if (isBeforePayment && selectedPaymentMethod) {
        requestPayment(order.id, selectedPaymentMethod);
      }
      setShowOrderModal(false);
      setCustomerPhoto(null);
      setSelectedPaymentMethod(null);
      navigate(`/order?id=${order.id}`);
    } else {
      setOrderError(t('error.order_creation_failed'));
    }
  };

  const scrollToCategory = (categoryId: string) => {
    const el = categoryRefs.current.get(categoryId);
    if (!el) return;
    isScrollingRef.current = true;
    setActiveCategory(categoryId);
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => { isScrollingRef.current = false; }, 800);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollingRef.current) return;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('data-category-id');
            if (id) {
              setActiveCategory(id);
              const tabEl = categoryTabRefs.current.get(id);
              if (tabEl && tabsContainerRef.current) {
                const container = tabsContainerRef.current;
                const tabLeft = tabEl.offsetLeft;
                const tabWidth = tabEl.offsetWidth;
                const containerWidth = container.offsetWidth;
                const scrollLeft = container.scrollLeft;
                if (tabLeft < scrollLeft || tabLeft + tabWidth > scrollLeft + containerWidth) {
                  container.scrollTo({ left: tabLeft - containerWidth / 2 + tabWidth / 2, behavior: 'smooth' });
                }
              }
            }
            break;
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    );

    categoryRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [orgCategories]);

  // Keep refs in sync with state (no dependency array - runs on every render)
  useEffect(() => {
    showCameraRef.current = showCamera;
    showOrderModalRef.current = showOrderModal;
    showCartRef.current = showCart;
  });

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showCameraRef.current) setShowCamera(false);
        else if (showOrderModalRef.current) setShowOrderModal(false);
        else if (showCartRef.current) setShowCart(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <div className={`min-h-screen bg-surface-secondary theme-${customerTheme}`}>
      <CustomerHeader
        title={t('menu.title')}
        rightAction={
          <div className="flex items-center gap-2">
            {selectedTableId && (
              <span className="text-xs bg-primary-50 text-primary-700 px-3 py-1.5 rounded-full font-medium">
                {t('table.number_prefix', { number: orgTables.find((t) => t.id === selectedTableId)?.number || '?' })}
              </span>
            )}
            {canOrder && (
              <button
                onClick={() => setShowCart(!showCart)}
                className="relative bg-primary-600 text-white p-2.5 rounded-xl hover:bg-primary-700 transition-colors"
              >
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-danger-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
              </button>
            )}
          </div>
        }
      />

      {!selectedTableId && canOrder && (
        <div className="bg-white dark:bg-surface border-b border-border px-4 py-4">
          <p className="text-sm text-text-secondary mb-2 font-medium">{t('menu.please_select_your_table')}</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {orgTables.map((table) => {
              const isSelected = selectedTableId === table.id;
              const isOccupied = table.status !== 'available';
              return (
                <button
                  key={table.id}
                  onClick={() => !isOccupied && setSelectedTableId(table.id)}
                  disabled={isOccupied}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                    isSelected
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : isOccupied
                      ? 'border-border bg-surface-secondary text-text-muted cursor-not-allowed opacity-50'
                      : 'border-border bg-white dark:bg-surface text-text-secondary hover:border-primary-300 hover:bg-primary-50'
                  }`}
                >
                  #{table.number}
                  <span className="text-xs ml-1 opacity-70">({table.capacity} {t('table.capacity_abbreviation')})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {showCart && canOrder && (
        <div className="bg-white dark:bg-surface border-b border-border px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-text-primary">{t('cart.title')}</h3>
            {cart.length > 0 && (
              <button onClick={clearCart} className="text-xs text-danger-600 hover:text-danger-700 font-medium">
                {t('cart.clear')}
              </button>
            )}
          </div>
          {cart.length === 0 ? (
            <p className="text-sm text-text-muted py-2">{t('cart.empty_message')}</p>
          ) : (
            <div className="space-y-2">
              {cart.map((item) => (
                <div key={item.menuItemId} className="flex items-center justify-between p-3 bg-surface-secondary rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{item.menuItemName}</p>
                    <p className="text-xs text-text-muted">{item.price} ₼ × {item.quantity} = {item.price * item.quantity} ₼</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <button
                      onClick={() => updateCartQuantity(item.menuItemId, item.quantity - 1)}
                      className="w-7 h-7 rounded-lg bg-white dark:bg-surface border border-border flex items-center justify-center hover:bg-surface-secondary transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold text-text-primary">{item.quantity}</span>
                    <button
                      onClick={() => updateCartQuantity(item.menuItemId, item.quantity + 1)}
                      className="w-7 h-7 rounded-lg bg-white dark:bg-surface border border-border flex items-center justify-center hover:bg-surface-secondary transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.menuItemId)}
                      className="w-7 h-7 rounded-lg bg-danger-50 text-danger-500 flex items-center justify-center hover:bg-danger-100 transition-colors ml-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
              <div className="pt-3 border-t border-border">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-text-secondary">{t('cart.total')}:</span>
                  <span className="text-lg font-bold text-text-primary">{cartTotal} ₼</span>
                </div>
                <button
                  onClick={handleOpenOrderModal}
                  className="w-full bg-primary-600 text-white px-4 py-3 rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  {t('cart.place_order')} ({cartCount} {t('cart.items_suffix')})
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div
        ref={tabsContainerRef}
        className="flex gap-2 px-4 py-3 overflow-x-auto bg-white dark:bg-surface border-b border-border sticky top-[57px] z-20 scrollbar-none"
        style={{ scrollbarWidth: 'none' }}
      >
        {orgCategories.map((cat) => {
          const itemCount = orgMenuItems.filter((m) => m.category === cat.id && m.isAvailable).length;
          return (
            <button
              key={cat.id}
              ref={(el) => { if (el) categoryTabRefs.current.set(cat.id, el); }}
              onClick={() => scrollToCategory(cat.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                activeCategory === cat.id
                  ? 'bg-primary-600 text-white shadow-sm scale-[1.02]'
                  : 'bg-surface-secondary text-text-secondary hover:bg-border'
              }`}
            >
              {cat.name}
              <span className={`ml-1.5 text-xs ${activeCategory === cat.id ? 'text-primary-200' : 'text-text-muted'}`}>
                {itemCount}
              </span>
            </button>
          );
        })}
      </div>

      {!canOrder && (
        <div className="px-4 py-3 bg-warning-50 border-b border-warning-200">
          <p className="text-sm text-warning-700 text-center font-medium">{t('menu.waiter_only_notice')}</p>
        </div>
      )}

      <div className="px-4 py-4 space-y-8">
        {orgCategories.map((cat) => {
          const categoryItems = orgMenuItems.filter((m) => m.category === cat.id && m.isAvailable);
          if (categoryItems.length === 0) return null;
          return (
            <div
              key={cat.id}
              ref={(el) => { if (el) categoryRefs.current.set(cat.id, el); }}
              data-category-id={cat.id}
              className="scroll-mt-[100px]"
            >
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-lg font-bold text-text-primary">{cat.name}</h2>
                <span className="text-xs bg-surface-secondary text-text-muted px-2.5 py-1 rounded-full font-medium">
                  {categoryItems.length} {t('menu.items_count')}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryItems.map((item) => {
                  const cartItem = cart.find((c) => c.menuItemId === item.id);
                  return (
                    <div key={item.id} className="bg-white dark:bg-surface rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="h-32 bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/30 dark:to-primary-900/15 flex items-center justify-center">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-4xl">🍽️</span>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-text-primary">{item.name}</h3>
                        <p className="text-sm text-text-muted mt-1 line-clamp-2">{item.description}</p>
                        <p className="text-xs text-text-muted mt-1">~{item.preparationTime} {t('time.minutes_abbreviation')}</p>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-lg font-bold text-primary-600">{item.price} ₼</span>
                          {canOrder && (
                            cartItem ? (
                              <div className="flex items-center gap-2 bg-primary-50 rounded-xl px-2 py-1">
                                <button
                                  onClick={() => updateCartQuantity(item.id, cartItem.quantity - 1)}
                                  className="w-7 h-7 rounded-lg bg-white dark:bg-surface border border-primary-200 flex items-center justify-center hover:bg-primary-100 transition-colors"
                                >
                                  <Minus className="w-3 h-3 text-primary-700" />
                                </button>
                                <span className="w-6 text-center text-sm font-bold text-primary-700">{cartItem.quantity}</span>
                                <button
                                  onClick={() => updateCartQuantity(item.id, cartItem.quantity + 1)}
                                  className="w-7 h-7 rounded-lg bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 transition-colors"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleAddToCart(item)}
                                className="bg-primary-600 hover:bg-primary-700 text-white p-2 rounded-xl transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {showOrderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowOrderModal(false)} role="dialog" aria-modal="true" aria-label={t('order.confirm_title')}>
          <div className="bg-white dark:bg-surface rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-lg font-semibold text-text-primary">{t('order.confirm_title')}</h3>
              <button onClick={() => setShowOrderModal(false)} className="p-1 hover:bg-surface-secondary rounded-lg transition-colors">
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            <div className="px-6 py-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-secondary mb-2">{t('order.table_selection_label')}</label>
                <div className="relative">
                  <select
                    value={selectedTableId}
                    onChange={(e) => { setSelectedTableId(e.target.value); setOrderError(''); }}
                    className="w-full appearance-none bg-surface-secondary border border-border rounded-xl px-4 py-2.5 pr-10 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">{t('order.select_table_placeholder')}</option>
                    {availableTables.map((tbl) => (
                      <option key={tbl.id} value={tbl.id}>
                        {t('table.number_prefix', { number: tbl.number })} — {tbl.capacity} {t('table.guests')} ({tbl.section})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                </div>
                {availableTables.length === 0 && (
                  <p className="text-xs text-warning-600 mt-1">{t('order.all_tables_occupied')}</p>
                )}
              </div>

              <div className="bg-surface-secondary rounded-xl p-4 mb-4">
                <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">{t('order.order_label')}</p>
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div key={item.menuItemId} className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary">
                        {item.menuItemName} <span className="text-text-muted">×{item.quantity}</span>
                      </span>
                      <span className="font-medium text-text-primary">{item.price * item.quantity} ₼</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-border flex items-center justify-between">
                    <span className="font-semibold text-text-primary">{t('order.total')}</span>
                    <span className="text-lg font-bold text-primary-600">{cartTotal} ₼</span>
                  </div>
                </div>
              </div>

              {needsPhoto && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    {t('order.photo_confirmation')} <span className="text-danger-500">*</span>
                  </label>
                  <p className="text-xs text-text-muted mb-3">{t('order.photo_confirmation_hint')}</p>

                  {customerPhoto ? (
                    <div className="relative">
                      <img src={customerPhoto} alt={t('order.customer_photo_alt')} className="w-full h-40 object-cover rounded-xl border border-border" />
                      <button
                        onClick={() => setCustomerPhoto(null)}
                        className="absolute top-2 right-2 w-8 h-8 bg-danger-500 text-white rounded-full flex items-center justify-center hover:bg-danger-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-2 left-2 bg-success-500 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        {t('order.photo_taken')}
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleOpenCamera}
                      className="w-full border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center gap-2 hover:border-primary-400 hover:bg-primary-50 transition-colors"
                    >
                      <Camera className="w-8 h-8 text-text-muted" />
                      <span className="text-sm font-medium text-text-secondary">{t('order.take_photo')}</span>
                    </button>
                  )}
                </div>
              )}

              {isBeforePayment && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    {t('payment.method')} <span className="text-danger-500">*</span>
                  </label>
                  <p className="text-xs text-text-muted mb-3">{t('payment.how_to_pay')}</p>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedPaymentMethod('cash')}
                      className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                        selectedPaymentMethod === 'cash'
                          ? 'border-success-500 bg-success-50'
                          : 'border-border hover:border-success-300'
                      }`}
                    >
                      <Banknote className={`w-6 h-6 ${selectedPaymentMethod === 'cash' ? 'text-success-600' : 'text-text-muted'}`} />
                      <div className="text-left">
                        <p className={`text-sm font-semibold ${selectedPaymentMethod === 'cash' ? 'text-success-700' : 'text-text-primary'}`}>{t('payment.cash')}</p>
                        <p className="text-[10px] text-text-muted">{t('payment.cash_description')}</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPaymentMethod('card')}
                      className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                        selectedPaymentMethod === 'card'
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-border hover:border-primary-300'
                      }`}
                    >
                      <CreditCard className={`w-6 h-6 ${selectedPaymentMethod === 'card' ? 'text-primary-600' : 'text-text-muted'}`} />
                      <div className="text-left">
                        <p className={`text-sm font-semibold ${selectedPaymentMethod === 'card' ? 'text-primary-700' : 'text-text-primary'}`}>{t('payment.card')}</p>
                        <p className="text-[10px] text-text-muted">{t('payment.card_description')}</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {orderError && (
                <p className="text-sm text-danger-600 bg-danger-50 px-3 py-2 rounded-lg mb-3">{orderError}</p>
              )}
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowOrderModal(false)}
                className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors"
              >
                {t('common.back')}
              </button>
              <button
                onClick={handleConfirmOrder}
                disabled={availableTables.length === 0}
                className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-text-muted text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                {t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCamera && (
        <CameraCapture onCapture={handlePhotoCaptured} onClose={() => setShowCamera(false)} />
      )}
    </div>
  );
}
