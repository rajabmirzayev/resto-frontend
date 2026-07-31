import { useState } from 'react';
import { useTranslation } from '../../i18n';
import { X } from 'lucide-react';
import type { RestaurantTableDto, TableStatusEnum, UpdateReservationRequest } from '../../api/types';

const LOCAL_KEY: Record<TableStatusEnum, 'available' | 'occupied' | 'reserved' | 'cleaning'> = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  RESERVED: 'reserved',
  CLEANING: 'cleaning',
};

const STATUS_ORDER: TableStatusEnum[] = ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING'];

const getTableStatusLabels = (t: (key: string) => string): Record<'available' | 'occupied' | 'reserved' | 'cleaning', { label: string; color: string; badge: string; bg: string }> => ({
  available: { label: t('table.status.available'), color: 'bg-success-500', badge: 'bg-success-500 text-white', bg: 'border-success-300 bg-success-50' },
  occupied: { label: t('table.status.occupied'), color: 'bg-danger-500', badge: 'bg-danger-500 text-white', bg: 'border-danger-300 bg-danger-50' },
  reserved: { label: t('table.status.reserved'), color: 'bg-warning-500', badge: 'bg-warning-500 text-white', bg: 'border-warning-300 bg-warning-50' },
  cleaning: { label: t('table.status.cleaning'), color: 'bg-surface-secondary', badge: 'bg-surface-secondary text-text-secondary', bg: 'border-border bg-surface-secondary' },
});

interface Props {
  table: RestaurantTableDto;
  onUpdateStatus: (id: string, status: TableStatusEnum) => void;
  onUpdateReservation: (id: string, reservation: UpdateReservationRequest) => void;
  onRemoveReservation: (id: string) => void;
  onClose: () => void;
}

export default function TableStatusModal({ table, onUpdateStatus, onUpdateReservation, onRemoveReservation, onClose }: Props) {
  const { t } = useTranslation();
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [reservationForm, setReservationForm] = useState({
    guestName: table.reservation?.guestName || '',
    phone: table.reservation?.phone || '',
    time: table.reservation?.time || '',
    guestCount: table.reservation?.guestCount || 2,
    notes: table.reservation?.notes || '',
  });
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const markTouched = (field: string) => {
    if (!touched.has(field)) {
      setTouched((prev) => new Set(prev).add(field));
    }
  };

  const statusConfig = getTableStatusLabels(t);

  const handleStatusChange = (status: TableStatusEnum) => {
    if (status === 'RESERVED') {
      setShowReservationForm(true);
    } else {
      onUpdateStatus(table.id, status);
      onClose();
    }
  };

  const handleReservationSave = () => {
    onUpdateReservation(table.id, {
      guestName: reservationForm.guestName.trim(),
      phone: reservationForm.phone.trim(),
      time: reservationForm.time,
      guestCount: reservationForm.guestCount || 1,
      notes: reservationForm.notes.trim() || undefined,
    });
    onUpdateStatus(table.id, 'RESERVED');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-surface rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-lg font-bold text-text-primary">{t('table.status_modal_title', { number: table.tableNumber })}</h3>
          <button onClick={onClose} className="p-1 hover:bg-surface-secondary rounded-lg">
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        {!showReservationForm && table.status !== 'RESERVED' && (
          <div className="px-6 py-4 space-y-2">
            {STATUS_ORDER.map((s) => {
              const cfg = statusConfig[LOCAL_KEY[s]];
              const active = table.status === s;
              return (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    active ? 'border-primary-500 bg-primary-50' : 'border-border hover:border-primary-300 bg-surface-secondary'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full ${cfg.color}`} />
                  <div className="text-left flex-1">
                    <p className="text-sm font-semibold text-text-primary">{cfg.label}</p>
                    <p className="text-xs text-text-muted">
                      {t(`table.status.${LOCAL_KEY[s]}`)}
                    </p>
                  </div>
                  {active && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary-600 text-white">{t('table.current_status')}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {showReservationForm && table.status !== 'RESERVED' && (
          <div className="px-6 py-4 space-y-3">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">{t('table.reservation_info')}</p>
            <div>
              <input
                value={reservationForm.guestName}
                onChange={(e) => { setReservationForm({ ...reservationForm, guestName: e.target.value }); markTouched("guestName"); }}
                className="w-full px-4 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder={`${t('order.customer')} *`}
                autoFocus
              />
              {touched.has("guestName") && !reservationForm.guestName.trim() && <p className="text-[11px] text-danger-500 mt-1">{t('reservation.name_required')}</p>}
            </div>
            <div>
              <input
                value={reservationForm.phone}
                onChange={(e) => { setReservationForm({ ...reservationForm, phone: e.target.value }); markTouched("phone"); }}
                className="w-full px-4 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder={`${t('order.customer')} *`}
              />
              {touched.has("phone") && !reservationForm.phone.trim() && <p className="text-[11px] text-danger-500 mt-1">{t('reservation.phone_required')}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="time"
                  value={reservationForm.time}
                  onChange={(e) => { setReservationForm({ ...reservationForm, time: e.target.value }); markTouched("time"); }}
                  className="w-full px-4 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {touched.has("time") && !reservationForm.time && <p className="text-[11px] text-danger-500 mt-1">{t('reservation.time_required')}</p>}
              </div>
              <input
                type="number"
                min={1}
                max={table.capacity}
                value={reservationForm.guestCount}
                onChange={(e) => setReservationForm({ ...reservationForm, guestCount: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder={t('table.guests')}
              />
            </div>
            <input
              value={reservationForm.notes}
              onChange={(e) => setReservationForm({ ...reservationForm, notes: e.target.value })}
              className="w-full px-4 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder={`${t('order.details')} (${t('common.cancel')})`}
            />
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setShowReservationForm(false); setReservationForm({ guestName: '', phone: '', time: '', guestCount: 2, notes: '' }); }}
                className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors"
              >
                {t('common.back')}
              </button>
              <button
                onClick={handleReservationSave}
                disabled={!reservationForm.guestName.trim() || !reservationForm.phone.trim() || !reservationForm.time}
                className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-text-muted text-white rounded-xl text-sm font-semibold transition-colors"
              >
                {t('common.save')}
              </button>
            </div>
          </div>
        )}

        {table.status === 'RESERVED' && table.reservation && (
          <div className="px-6 py-4 space-y-3">
            <div className="bg-warning-50 border border-warning-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-warning-700">{t('table.reservation_info')}</span>
              </div>
              <p className="text-sm text-text-secondary">{table.reservation.guestName}</p>
              <p className="text-sm text-text-secondary">{table.reservation.phone}</p>
              <p className="text-sm text-text-secondary">{table.reservation.time} • {table.reservation.guestCount} {t('table.guests')}</p>
              {table.reservation.notes && (
                <p className="text-xs text-text-muted pt-1 border-t border-warning-200">{table.reservation.notes}</p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { onRemoveReservation(table.id); onUpdateStatus(table.id, 'AVAILABLE'); onClose(); }}
                className="flex-1 px-4 py-2.5 bg-danger-500 hover:bg-danger-600 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                {t('common.delete')}
              </button>
              <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors">
                {t('common.cancel')}
              </button>
            </div>
          </div>
        )}

        {table.status === 'RESERVED' && !table.reservation && (
          <div className="px-6 py-4 space-y-3">
            <div className="bg-warning-50 border border-warning-200 rounded-xl p-4 text-center">
              <p className="text-sm text-text-muted">{t('table.no_active_order')}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { onUpdateStatus(table.id, 'AVAILABLE'); onClose(); }}
                className="flex-1 px-4 py-2.5 bg-danger-500 hover:bg-danger-600 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                {t('table.free_table')}
              </button>
              <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors">
                {t('common.cancel')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
