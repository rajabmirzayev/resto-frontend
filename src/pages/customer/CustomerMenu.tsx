import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { ShoppingBag, Plus, Minus, Trash2, X, Check, ChevronDown, Camera, Banknote, CreditCard, RotateCcw } from 'lucide-react';
import type { PaymentMethod } from '../../types';

export default function CustomerMenu() {
  const { menuItems, menuCategories, tables, cart, addToCart, removeFromCart, updateCartQuantity, clearCart, createCustomerOrder, requestPayment, orderMode, customerPhotoRequired, paymentTiming } = useStore();
  const navigate = useNavigate();
  const { tableId: urlTableId } = useParams();
  const [searchParams] = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const canOrder = orderMode === 'customer' || orderMode === 'customer-waiter-confirm';
  const needsPhoto = canOrder && orderMode === 'customer' && customerPhotoRequired;

  const tableParam = urlTableId || searchParams.get('t');
  const initialTable = tableParam
    ? (tables.find((t) => t.id === tableParam)?.id || tables.find((t) => t.number === Number(tableParam))?.id || '')
    : '';
  const [selectedTableId, setSelectedTableId] = useState<string>(initialTable);
  const [selectedCategory, setSelectedCategory] = useState<string>(menuCategories[0]?.id || '');
  const [showCart, setShowCart] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [customerPhoto, setCustomerPhoto] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>(null);
  const isBeforePayment = paymentTiming === 'before';

  const availableTables = tables.filter((t) => t.status === 'available');
  const filtered = menuItems.filter((m) => m.category === selectedCategory && m.isAvailable);
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleAddToCart = (item: (typeof menuItems)[0]) => {
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

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  }, []);

  const startCamera = useCallback(async (facing: 'user' | 'environment') => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setFacingMode(facing);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setOrderError('Kameraya icazə verilmədi. Zəhmət olmasa kamera icazəsini aktiv edin.');
      setShowCamera(false);
    }
  }, []);

  useEffect(() => {
    if (showCamera && videoRef.current) {
      startCamera(facingMode);
    }
    return () => {
      if (!showCamera && streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [showCamera, facingMode, startCamera]);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCustomerPhoto(dataUrl);
    setOrderError('');
    stopCamera();
  }, [facingMode, stopCamera]);

  const handleOpenCamera = () => {
    setOrderError('');
    setShowCamera(true);
  };

  const handleConfirmOrder = () => {
    if (!selectedTableId) {
      setOrderError('Zəhmət olmasa masa seçin');
      return;
    }
    if (needsPhoto && !customerPhoto) {
      setOrderError('Zəhmət olmasa masada olduğunuzu təsdiqləmək üçün şəkil çəkin');
      return;
    }
    if (isBeforePayment && !selectedPaymentMethod) {
      setOrderError('Zəhmət olmasa ödəniş üsulunu seçin');
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
      setOrderError('Sifariş yaradılarkən xəta baş verdi');
    }
  };

  return (
    <div className="min-h-screen bg-surface-secondary">
      <div className="bg-white border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <h1 className="text-xl font-bold text-text-primary">Tabler Menyu</h1>
        <div className="flex items-center gap-2">
          {selectedTableId && (
            <span className="text-xs bg-primary-50 text-primary-700 px-3 py-1.5 rounded-full font-medium">
              Masa #{tables.find((t) => t.id === selectedTableId)?.number || '?'}
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
      </div>

      {!selectedTableId && canOrder && (
        <div className="bg-white border-b border-border px-4 py-4">
          <p className="text-sm text-text-secondary mb-2 font-medium">Zəhmət olmasa masanızı seçin:</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {tables.map((table) => {
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
                      : 'border-border bg-white text-text-secondary hover:border-primary-300 hover:bg-primary-50'
                  }`}
                >
                  #{table.number}
                  <span className="text-xs ml-1 opacity-70">({table.capacity} nəf.)</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {showCart && canOrder && (
        <div className="bg-white border-b border-border px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-text-primary">Səbət</h3>
            {cart.length > 0 && (
              <button onClick={clearCart} className="text-xs text-danger-600 hover:text-danger-700 font-medium">
                Təmizlə
              </button>
            )}
          </div>
          {cart.length === 0 ? (
            <p className="text-sm text-text-muted py-2">Səbət boştur. Menyudan əlavə edin.</p>
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
                      className="w-7 h-7 rounded-lg bg-white border border-border flex items-center justify-center hover:bg-surface-secondary transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold text-text-primary">{item.quantity}</span>
                    <button
                      onClick={() => updateCartQuantity(item.menuItemId, item.quantity + 1)}
                      className="w-7 h-7 rounded-lg bg-white border border-border flex items-center justify-center hover:bg-surface-secondary transition-colors"
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
                  <span className="text-sm text-text-secondary">Cəmi:</span>
                  <span className="text-lg font-bold text-text-primary">{cartTotal} ₼</span>
                </div>
                <button
                  onClick={handleOpenOrderModal}
                  className="w-full bg-primary-600 text-white px-4 py-3 rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Sifariş Et ({cartCount} məhsul)
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {canOrder && (
        <div className="flex gap-2 px-4 py-3 overflow-x-auto bg-white border-b border-border">
          {menuCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-surface-secondary text-text-secondary hover:bg-border'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {!canOrder && (
        <div className="px-4 py-3 bg-white border-b border-border">
          <p className="text-sm text-text-muted text-center">Bu restoranda sifarişlər ofisant tərəfindən qəbul edilir</p>
        </div>
      )}

      <div className={`p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${!canOrder ? 'pt-4' : ''}`}>
        {filtered.map((item) => {
          const cartItem = cart.find((c) => c.menuItemId === item.id);
          return (
            <div key={item.id} className="bg-white rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-32 bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
                <span className="text-4xl">🍽️</span>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-text-primary">{item.name}</h3>
                <p className="text-sm text-text-muted mt-1 line-clamp-2">{item.description}</p>
                <p className="text-xs text-text-muted mt-1">~{item.preparationTime} dəq</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-lg font-bold text-primary-600">{item.price} ₼</span>
                  {canOrder && (
                    cartItem ? (
                      <div className="flex items-center gap-2 bg-primary-50 rounded-xl px-2 py-1">
                        <button
                          onClick={() => updateCartQuantity(item.id, cartItem.quantity - 1)}
                          className="w-7 h-7 rounded-lg bg-white border border-primary-200 flex items-center justify-center hover:bg-primary-100 transition-colors"
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

      {showOrderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowOrderModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-lg font-semibold text-text-primary">Sifarişi Təsdiqlə</h3>
              <button onClick={() => setShowOrderModal(false)} className="p-1 hover:bg-surface-secondary rounded-lg transition-colors">
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            <div className="px-6 py-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-secondary mb-2">Masa seçimi</label>
                <div className="relative">
                  <select
                    value={selectedTableId}
                    onChange={(e) => { setSelectedTableId(e.target.value); setOrderError(''); }}
                    className="w-full appearance-none bg-surface-secondary border border-border rounded-xl px-4 py-2.5 pr-10 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Masa seçin...</option>
                    {availableTables.map((t) => (
                      <option key={t.id} value={t.id}>
                        Masa #{t.number} — {t.capacity} nəfər ({t.section})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                </div>
                {availableTables.length === 0 && (
                  <p className="text-xs text-warning-600 mt-1">Hal-hazırda bütün masalar məşğuldur</p>
                )}
              </div>

              <div className="bg-surface-secondary rounded-xl p-4 mb-4">
                <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">Sifariş</p>
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
                    <span className="font-semibold text-text-primary">Cəmi</span>
                    <span className="text-lg font-bold text-primary-600">{cartTotal} ₼</span>
                  </div>
                </div>
              </div>

              {needsPhoto && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Şəkil təsdiqi <span className="text-danger-500">*</span>
                  </label>
                  <p className="text-xs text-text-muted mb-3">Masada olduğunuzu təsdiqləmək üçün şəkil çəkin</p>
                  
                  {customerPhoto ? (
                    <div className="relative">
                      <img src={customerPhoto} alt="Müşteri şəkli" className="w-full h-40 object-cover rounded-xl border border-border" />
                      <button
                        onClick={() => setCustomerPhoto(null)}
                        className="absolute top-2 right-2 w-8 h-8 bg-danger-500 text-white rounded-full flex items-center justify-center hover:bg-danger-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-2 left-2 bg-success-500 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Şəkil çəkildi
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleOpenCamera}
                      className="w-full border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center gap-2 hover:border-primary-400 hover:bg-primary-50 transition-colors"
                    >
                      <Camera className="w-8 h-8 text-text-muted" />
                      <span className="text-sm font-medium text-text-secondary">Şəkil Çək</span>
                    </button>
                  )}
                </div>
              )}

              {isBeforePayment && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Ödəniş Üsulu <span className="text-danger-500">*</span>
                  </label>
                  <p className="text-xs text-text-muted mb-3">Sifarişdən əvvəl ödəniş üsulunu seçin</p>
                  
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
                        <p className={`text-sm font-semibold ${selectedPaymentMethod === 'cash' ? 'text-success-700' : 'text-text-primary'}`}>Nagd</p>
                        <p className="text-[10px] text-text-muted">Nağd ödəniş</p>
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
                        <p className={`text-sm font-semibold ${selectedPaymentMethod === 'card' ? 'text-primary-700' : 'text-text-primary'}`}>Kart</p>
                        <p className="text-[10px] text-text-muted">Kart ilə ödəniş</p>
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
                Geri
              </button>
              <button
                onClick={handleConfirmOrder}
                disabled={availableTables.length === 0}
                className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-text-muted text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Təsdiqlə
              </button>
            </div>
          </div>
        </div>
      )}

      {showCamera && (
        <div className="fixed inset-0 bg-black z-[60] flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 bg-black">
            <h3 className="text-white font-semibold">Kamera</h3>
            <button onClick={stopCamera} className="p-2 text-white hover:bg-white/10 rounded-xl transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 relative bg-black overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>
          <div className="bg-black px-6 py-6 flex items-center justify-center gap-6">
            <button
              onClick={() => startCamera(facingMode === 'user' ? 'environment' : 'user')}
              className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={capturePhoto}
              className="w-16 h-16 rounded-full bg-white border-4 border-white/50 flex items-center justify-center hover:scale-105 transition-transform"
            >
              <div className="w-13 h-13 rounded-full border-2 border-gray-300" />
            </button>
            <div className="w-12 h-12" />
          </div>
        </div>
      )}
    </div>
  );
}
