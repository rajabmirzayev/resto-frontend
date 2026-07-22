import { useState } from 'react';
import { X } from 'lucide-react';
import type { Table, TableStatus } from '../../types';

const statusConfig: Record<TableStatus, { label: string; color: string; badge: string; bg: string }> = {
  available: { label: 'Boş', color: 'bg-success-500', badge: 'bg-success-500 text-white', bg: 'border-success-300 bg-success-50' },
  occupied: { label: 'Məşğul', color: 'bg-danger-500', badge: 'bg-danger-500 text-white', bg: 'border-danger-300 bg-danger-50' },
  reserved: { label: 'Rezervasiya', color: 'bg-warning-500', badge: 'bg-warning-500 text-white', bg: 'border-warning-300 bg-warning-50' },
  cleaning: { label: 'Təmizlənir', color: 'bg-text-muted', badge: 'bg-text-muted text-white', bg: 'border-border bg-surface-secondary' },
};

interface Props {
  table: Table;
  onSave: (tableId: string, updates: Partial<Table>) => void;
  onUpdateStatus: (tableId: string, status: TableStatus) => void;
  onClose: () => void;
}

export default function TableStatusModal({ table, onSave, onUpdateStatus, onClose }: Props) {
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [reservationForm, setReservationForm] = useState({
    guestName: table.reservation?.guestName || '',
    phone: table.reservation?.phone || '',
    time: table.reservation?.time || '',
    guestCount: table.reservation?.guestCount || 2,
    notes: table.reservation?.notes || '',
  });

  const handleStatusChange = (status: TableStatus) => {
    if (status === 'reserved') {
      setShowReservationForm(true);
    } else {
      onSave(table.id, { status, reservation: undefined });
      onUpdateStatus(table.id, status);
      onClose();
    }
  };

  const handleReservationSave = () => {
    onSave(table.id, {
      status: 'reserved',
      reservation: {
        guestName: reservationForm.guestName.trim(),
        phone: reservationForm.phone.trim(),
        time: reservationForm.time,
        guestCount: reservationForm.guestCount || 1,
        notes: reservationForm.notes.trim() || undefined,
      },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-surface rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-lg font-bold text-text-primary">Masa #{table.number} — Status</h3>
          <button onClick={onClose} className="p-1 hover:bg-surface-secondary rounded-lg">
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        {!showReservationForm && table.status !== 'reserved' && (
          <div className="px-6 py-4 space-y-2">
            {(['available', 'occupied', 'reserved', 'cleaning'] as const).map((s) => {
              const cfg = statusConfig[s];
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
                      {s === 'available' && 'Masa boşaldı'}
                      {s === 'occupied' && 'Müştəri oturdu'}
                      {s === 'reserved' && 'Rezervasiya edildi'}
                      {s === 'cleaning' && 'Təmizlənir'}
                    </p>
                  </div>
                  {active && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary-600 text-white">Cari</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {showReservationForm && table.status !== 'reserved' && (
          <div className="px-6 py-4 space-y-3">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Rezervasiya Məlumatı</p>
            <div>
              <input
                value={reservationForm.guestName}
                onChange={(e) => setReservationForm({ ...reservationForm, guestName: e.target.value })}
                className="w-full px-4 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Qonağın adı *"
                autoFocus
              />
              {!reservationForm.guestName.trim() && <p className="text-[11px] text-danger-500 mt-1">Ad vacibdir</p>}
            </div>
            <div>
              <input
                value={reservationForm.phone}
                onChange={(e) => setReservationForm({ ...reservationForm, phone: e.target.value })}
                className="w-full px-4 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Telefon nömrəsi *"
              />
              {!reservationForm.phone.trim() && <p className="text-[11px] text-danger-500 mt-1">Telefon vacibdir</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="time"
                  value={reservationForm.time}
                  onChange={(e) => setReservationForm({ ...reservationForm, time: e.target.value })}
                  className="w-full px-4 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {!reservationForm.time && <p className="text-[11px] text-danger-500 mt-1">Saat vacibdir</p>}
              </div>
              <input
                type="number"
                min={1}
                max={table.capacity}
                value={reservationForm.guestCount}
                onChange={(e) => setReservationForm({ ...reservationForm, guestCount: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Nəfər"
              />
            </div>
            <input
              value={reservationForm.notes}
              onChange={(e) => setReservationForm({ ...reservationForm, notes: e.target.value })}
              className="w-full px-4 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Qeydlər (ixtiyari)"
            />
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => { setShowReservationForm(false); setReservationForm({ guestName: '', phone: '', time: '', guestCount: 2, notes: '' }); }}
                className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors"
              >
                Geri
              </button>
              <button
                onClick={handleReservationSave}
                disabled={!reservationForm.guestName.trim() || !reservationForm.phone.trim() || !reservationForm.time}
                className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-text-muted text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Rezervasiya Et
              </button>
            </div>
          </div>
        )}

        {table.status === 'reserved' && table.reservation && (
          <div className="px-6 py-4 space-y-3">
            <div className="bg-warning-50 border border-warning-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-warning-700">Rezervasiya Məlumatı</span>
              </div>
              <p className="text-sm text-text-secondary">{table.reservation.guestName}</p>
              <p className="text-sm text-text-secondary">{table.reservation.phone}</p>
              <p className="text-sm text-text-secondary">{table.reservation.time} • {table.reservation.guestCount} nəfər</p>
              {table.reservation.notes && (
                <p className="text-xs text-text-muted pt-1 border-t border-warning-200">{table.reservation.notes}</p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { onSave(table.id, { status: 'available', reservation: undefined }); onUpdateStatus(table.id, 'available'); onClose(); }}
                className="flex-1 px-4 py-2.5 bg-danger-500 hover:bg-danger-600 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Rezervasiyanı Ləğv Et
              </button>
              <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors">
                Bağla
              </button>
            </div>
          </div>
        )}

        {table.status === 'reserved' && !table.reservation && (
          <div className="px-6 py-4 space-y-3">
            <div className="bg-warning-50 border border-warning-200 rounded-xl p-4 text-center">
              <p className="text-sm text-text-muted">Rezervasiya məlumatı yoxdur</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { onSave(table.id, { status: 'available' }); onUpdateStatus(table.id, 'available'); onClose(); }}
                className="flex-1 px-4 py-2.5 bg-danger-500 hover:bg-danger-600 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Boşalt
              </button>
              <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors">
                Bağla
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
