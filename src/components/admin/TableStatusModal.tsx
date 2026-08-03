import { useState } from 'react';
import { useTranslation } from '../../i18n';
import { X } from 'lucide-react';
import { ApiError } from '../../api/client';
import { getTableErrorMessage, TABLE_ERROR_KEYS } from '../../lib/tableErrors';
import { TABLE_LIMITS, hasControlCharacters, hasValidPhoneChars, hasValidPhoneDigits, isValidReservationTime } from '../../lib/validation';
import { getStatusTargets, TABLE_STATUSES } from '../../lib/tableStatus';
import type { RestaurantTableDto, TableStatusEnum, UpdateReservationRequest } from '../../api/types';

const LOCAL_KEY: Record<TableStatusEnum, 'available' | 'occupied' | 'reserved' | 'cleaning'> = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  RESERVED: 'reserved',
  CLEANING: 'cleaning',
};

const getTableStatusLabels = (t: (key: string, params?: Record<string, string | number>) => string): Record<'available' | 'occupied' | 'reserved' | 'cleaning', { label: string; color: string; badge: string; bg: string }> => ({
  available: { label: t('table.status.available'), color: 'bg-success-500', badge: 'bg-success-500 text-white', bg: 'border-success-300 bg-success-50' },
  occupied: { label: t('table.status.occupied'), color: 'bg-danger-500', badge: 'bg-danger-500 text-white', bg: 'border-danger-300 bg-danger-50' },
  reserved: { label: t('table.status.reserved'), color: 'bg-warning-500', badge: 'bg-warning-500 text-white', bg: 'border-warning-300 bg-warning-50' },
  cleaning: { label: t('table.status.cleaning'), color: 'bg-surface-secondary', badge: 'bg-surface-secondary text-text-secondary', bg: 'border-border bg-surface-secondary' },
});

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toIso(datetimeLocal: string): string {
  return new Date(datetimeLocal).toISOString();
}

interface Props {
  table: RestaurantTableDto;
  onUpdateStatus: (id: string, status: TableStatusEnum) => Promise<void>;
  onUpdateReservation: (id: string, reservation: UpdateReservationRequest) => Promise<void>;
  onRemoveReservation: (id: string) => Promise<void>;
  onClose: () => void;
}

export default function TableStatusModal({ table, onUpdateStatus, onUpdateReservation, onRemoveReservation, onClose }: Props) {
  const { t } = useTranslation();
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [reservationForm, setReservationForm] = useState({
    guestName: table.reservation?.guestName || '',
    phone: table.reservation?.phone || '',
    time: table.reservation ? toDatetimeLocal(table.reservation.time) : '',
    guestCount: Math.min(table.reservation?.guestCount || 2, table.capacity),
    notes: table.reservation?.notes || '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const statusConfig = getTableStatusLabels(t);
  const targets = getStatusTargets(table);
  const statusOptions = TABLE_STATUSES.filter((s) => {
    if (s === 'RESERVED') return table.status === 'AVAILABLE' || table.status === 'CLEANING';
    return targets.includes(s);
  });
  const canOccupy = !!table.currentOrderId;

  const translateFieldError = (field: string, message: string): string => {
    const lower = message.toLowerCase();
    const maxMatch = message.match(/(\d+)\s+characters/);
    const max = maxMatch?.[1];
    if (lower.includes('in the future')) return t('reservation.time_future');
    if (lower.includes('exceed') && lower.includes('capacity')) return t('error.tables.guest_count_exceeds');
    if (lower.includes('must not be null') || lower.includes('must not be blank') || lower.includes('required')) {
      if (field === 'guestName') return t('reservation.name_required');
      if (field === 'phone') return t('reservation.phone_required');
      if (field === 'time') return t('reservation.time_required');
      if (field === 'guestCount') return t('reservation.guest_count_range', { min: TABLE_LIMITS.guestCountMin, max: TABLE_LIMITS.guestCountMax });
      return t('error.tables.validation');
    }
    if (lower.includes('must not contain null characters') || lower.includes('control characters')) return t('validation.name.invalid_char');
    if (lower.includes('invalid phone number format')) return t('reservation.phone_digits');
    if (lower.includes('must not exceed')) {
      if (field === 'guestName') return t('reservation.guest_name_max', { max: max ?? TABLE_LIMITS.reservationNameMax });
      if (field === 'phone') return t('reservation.phone_max', { max: max ?? TABLE_LIMITS.phoneMax });
      if (field === 'notes') return t('reservation.notes_max', { max: max ?? TABLE_LIMITS.notesMax });
      if (field === 'guestCount') return t('reservation.guest_count_capacity', { capacity: table.capacity });
      return t('error.tables.validation');
    }
    return message;
  };

  const handleReservationApiError = (err: unknown) => {
    if (err instanceof ApiError) {
      if (err.fieldErrors && err.fieldErrors.length > 0) {
        const fe: Record<string, string> = {};
        for (const item of err.fieldErrors) {
          fe[item.field] = translateFieldError(item.field, item.message);
        }
        setFieldErrors(fe);
        return;
      }
      if (err.key && TABLE_ERROR_KEYS[err.key]) {
        setFormError(t(TABLE_ERROR_KEYS[err.key]));
        return;
      }
      setFormError(err.detail || t('error.unexpected'));
      return;
    }
    setFormError(t('error.network'));
  };

  const handleStatusChange = async (status: TableStatusEnum) => {
    if (status === 'RESERVED') {
      setShowReservationForm(true);
      return;
    }
    setFormError('');
    setIsSubmitting(true);
    try {
      await onUpdateStatus(table.id, status);
      onClose();
    } catch (err) {
      setFormError(getTableErrorMessage(err, t('tables.error.update_status'), t));
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateReservation = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    const name = reservationForm.guestName.trim();
    const phone = reservationForm.phone.trim();
    if (!name) {
      errors.guestName = t('reservation.name_required');
    } else if (hasControlCharacters(name)) {
      errors.guestName = t('validation.name.invalid_char');
    } else if (name.length > TABLE_LIMITS.reservationNameMax) {
      errors.guestName = t('reservation.guest_name_max', { max: TABLE_LIMITS.reservationNameMax });
    }
    if (!phone) {
      errors.phone = t('reservation.phone_required');
    } else if (!hasValidPhoneChars(phone)) {
      errors.phone = t('reservation.phone_invalid');
    } else if (!hasValidPhoneDigits(phone)) {
      errors.phone = t('reservation.phone_digits');
    }
    if (!reservationForm.time) {
      errors.time = t('reservation.time_required');
    } else if (!isValidReservationTime(reservationForm.time)) {
      errors.time = t('reservation.time_future');
    }
    if (!Number.isFinite(reservationForm.guestCount) || reservationForm.guestCount < TABLE_LIMITS.guestCountMin || reservationForm.guestCount > TABLE_LIMITS.guestCountMax) {
      errors.guestCount = t('reservation.guest_count_range', { min: TABLE_LIMITS.guestCountMin, max: TABLE_LIMITS.guestCountMax });
    } else if (reservationForm.guestCount > table.capacity) {
      errors.guestCount = t('reservation.guest_count_capacity', { capacity: table.capacity });
    }
    if (reservationForm.notes.length > TABLE_LIMITS.notesMax) {
      errors.notes = t('reservation.notes_max', { max: TABLE_LIMITS.notesMax });
    }
    return errors;
  };

  const handleReservationSave = async () => {
    const errors = validateReservation();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setFormError('');
    setIsSubmitting(true);
    try {
      await onUpdateReservation(table.id, {
        guestName: reservationForm.guestName.trim(),
        phone: reservationForm.phone.trim(),
        time: toIso(reservationForm.time),
        guestCount: reservationForm.guestCount,
        notes: reservationForm.notes.trim() || undefined,
      });
      onClose();
    } catch (err) {
      handleReservationApiError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveReservation = async () => {
    setFormError('');
    setIsSubmitting(true);
    try {
      await onRemoveReservation(table.id);
      onClose();
    } catch (err) {
      setFormError(getTableErrorMessage(err, t('tables.error.cancel_reservation'), t));
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = (hasError: boolean): string =>
    `w-full px-4 py-2.5 bg-surface-secondary border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${hasError ? 'border-danger-400' : 'border-border'}`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-surface rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-lg font-bold text-text-primary">{t('table.status_modal_title', { number: table.tableNumber })}</h3>
          <button onClick={onClose} className="p-1 hover:bg-surface-secondary rounded-lg">
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        {formError && (
          <div className="px-6 pt-4">
            <p className="text-sm text-danger-600 bg-danger-50 border border-danger-200 rounded-xl px-4 py-3">{formError}</p>
          </div>
        )}

        {!showReservationForm && table.status !== 'RESERVED' && (
          <div className="px-6 py-4 space-y-2">
            {statusOptions.map((s) => {
              const cfg = statusConfig[LOCAL_KEY[s]];
              const active = table.status === s;
              const disabled = (s === 'OCCUPIED' && !canOccupy) || isSubmitting;
              return (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  disabled={disabled}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    active ? 'border-primary-500 bg-primary-50' : 'border-border hover:border-primary-300 bg-surface-secondary'
                  } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                  title={s === 'OCCUPIED' && !canOccupy ? t('tables.order_required_hint') : undefined}
                >
                  <div className={`w-4 h-4 rounded-full ${cfg.color}`} />
                  <div className="text-left flex-1">
                    <p className="text-sm font-semibold text-text-primary">{cfg.label}</p>
                    {s === 'OCCUPIED' && !canOccupy ? (
                      <p className="text-xs text-text-muted">{t('tables.order_required_hint')}</p>
                    ) : (
                      <p className="text-xs text-text-muted">{t(`table.status.${LOCAL_KEY[s]}`)}</p>
                    )}
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
              <label className="block text-sm font-medium text-text-secondary mb-1">{t('reservation.guest_name')}</label>
              <input
                value={reservationForm.guestName}
                onChange={(e) => setReservationForm({ ...reservationForm, guestName: e.target.value })}
                className={inputClass(!!fieldErrors.guestName)}
                placeholder={t('reservation.guest_name')}
                maxLength={TABLE_LIMITS.reservationNameMax}
                autoFocus
              />
              {fieldErrors.guestName && <p className="text-xs text-danger-600 mt-1">{fieldErrors.guestName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t('reservation.phone')}</label>
              <input
                value={reservationForm.phone}
                onChange={(e) => setReservationForm({ ...reservationForm, phone: e.target.value })}
                className={inputClass(!!fieldErrors.phone)}
                placeholder={t('reservation.phone')}
                maxLength={TABLE_LIMITS.phoneMax}
              />
              {fieldErrors.phone && <p className="text-xs text-danger-600 mt-1">{fieldErrors.phone}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">{t('reservation.time_label')}</label>
                <input
                  type="datetime-local"
                  value={reservationForm.time}
                  onChange={(e) => setReservationForm({ ...reservationForm, time: e.target.value })}
                  className={inputClass(!!fieldErrors.time)}
                />
                {fieldErrors.time && <p className="text-xs text-danger-600 mt-1">{fieldErrors.time}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">{t('reservation.guest_count')}</label>
                <input
                  type="number"
                  min={TABLE_LIMITS.guestCountMin}
                  max={table.capacity}
                  value={reservationForm.guestCount}
                  onChange={(e) => setReservationForm({ ...reservationForm, guestCount: Number(e.target.value) })}
                  className={inputClass(!!fieldErrors.guestCount)}
                />
                {fieldErrors.guestCount && <p className="text-xs text-danger-600 mt-1">{fieldErrors.guestCount}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t('order.details')}</label>
              <textarea
                value={reservationForm.notes}
                onChange={(e) => setReservationForm({ ...reservationForm, notes: e.target.value })}
                className={`${inputClass(!!fieldErrors.notes)} resize-none`}
                rows={2}
                maxLength={TABLE_LIMITS.notesMax}
                placeholder={t('reservation.notes_placeholder')}
              />
              {fieldErrors.notes && <p className="text-xs text-danger-600 mt-1">{fieldErrors.notes}</p>}
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setShowReservationForm(false); setFieldErrors({}); setFormError(''); }}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors"
              >
                {t('common.back')}
              </button>
              <button
                onClick={handleReservationSave}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-text-muted text-white rounded-xl text-sm font-semibold transition-colors"
              >
                {t('reservation.book')}
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
              <p className="text-sm text-text-secondary">
                {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(table.reservation.time))} • {table.reservation.guestCount} {t('table.guests')}
              </p>
              {table.reservation.notes && (
                <p className="text-xs text-text-muted pt-1 border-t border-warning-200">{table.reservation.notes}</p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRemoveReservation}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-danger-500 hover:bg-danger-600 disabled:bg-text-muted text-white rounded-xl text-sm font-semibold transition-colors"
              >
                {t('common.delete')}
              </button>
              <button onClick={onClose} disabled={isSubmitting} className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors">
                {t('common.cancel')}
              </button>
            </div>
          </div>
        )}

        {table.status === 'RESERVED' && !table.reservation && (
          <div className="px-6 py-4 space-y-3">
            <div className="bg-warning-50 border border-warning-200 rounded-xl p-4 text-center">
              <p className="text-sm text-text-muted">{t('reservation.no_info')}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRemoveReservation}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-danger-500 hover:bg-danger-600 disabled:bg-text-muted text-white rounded-xl text-sm font-semibold transition-colors"
              >
                {t('table.free_table')}
              </button>
              <button onClick={onClose} disabled={isSubmitting} className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors">
                {t('common.cancel')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
