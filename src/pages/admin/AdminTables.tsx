import { useState } from 'react';
import Header from '../../components/layout/Header';
import { useStore } from '../../store/useStore';
import type { Table, TableStatus } from '../../types';
import { Plus, Edit2, Trash2, X, Grid3X3, Armchair, ChefHat, FolderOpen, Clock, User, Phone } from 'lucide-react';

type ModalMode = 'add' | 'edit' | 'status' | 'sectionAdd' | 'sectionEdit' | null;

const statusConfig: Record<TableStatus, { label: string; color: string; badge: string; bg: string }> = {
  available: { label: 'Boş', color: 'bg-success-500', badge: 'bg-success-500 text-white', bg: 'border-success-300 bg-success-50' },
  occupied: { label: 'Məşğul', color: 'bg-danger-500', badge: 'bg-danger-500 text-white', bg: 'border-danger-300 bg-danger-50' },
  reserved: { label: 'Rezervasiya', color: 'bg-warning-500', badge: 'bg-warning-500 text-white', bg: 'border-warning-300 bg-warning-50' },
  cleaning: { label: 'Təmizlənir', color: 'bg-text-muted', badge: 'bg-text-muted text-white', bg: 'border-border bg-surface-secondary' },
};

interface TableForm {
  number: number;
  capacity: number;
  section: string;
}

const emptyForm: TableForm = { number: 1, capacity: 2, section: 'Zal 1' };

export default function AdminTables() {
  const { tables, orders, tableSections, addTable, updateTable, deleteTable, updateTableStatus, addTableSection, updateTableSection, deleteTableSection } = useStore();
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [form, setForm] = useState<TableForm>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteSectionConfirm, setDeleteSectionConfirm] = useState<string | null>(null);
  const [statusTable, setStatusTable] = useState<Table | null>(null);
  const [activeSection, setActiveSection] = useState<string>('all');
  const [sectionFormName, setSectionFormName] = useState('');
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [reservationForm, setReservationForm] = useState({ guestName: '', phone: '', time: '', guestCount: 2, notes: '' });
  const [showReservationForm, setShowReservationForm] = useState(false);

  const sections = tableSections;
  const filteredTables = activeSection === 'all' ? tables : tables.filter((t) => t.section === activeSection);

  const getTableOrder = (tableId: string) =>
    orders.find((o) => o.tableId === tableId && !['completed', 'cancelled'].includes(o.status));

  const sectionStats = (section: string) => {
    const t = tables.filter((x) => x.section === section);
    return { total: t.length, available: t.filter((x) => x.status === 'available').length };
  };

  const openAdd = () => {
    setEditingTable(null);
    const nextNum = tables.length > 0 ? Math.max(...tables.map((t) => t.number)) + 1 : 1;
    setForm({ number: nextNum, capacity: 4, section: sections[0] || '' });
    setModalMode('add');
  };

  const openEdit = (table: Table) => {
    setEditingTable(table);
    setForm({ number: table.number, capacity: table.capacity, section: table.section });
    setModalMode('edit');
  };

  const openStatus = (table: Table) => {
    setStatusTable(table);
    if (table.reservation) {
      setReservationForm({ guestName: table.reservation.guestName, phone: table.reservation.phone, time: table.reservation.time, guestCount: table.reservation.guestCount, notes: table.reservation.notes || '' });
    } else {
      setReservationForm({ guestName: '', phone: '', time: '', guestCount: 2, notes: '' });
    }
    setShowReservationForm(false);
    setModalMode('status');
  };

  const handleSave = () => {
    if (form.number < 1 || form.capacity < 1 || !form.section.trim()) return;
    const duplicate = tables.find((t) => t.number === form.number && t.id !== editingTable?.id);
    if (duplicate) return;

    if (modalMode === 'edit' && editingTable) {
      updateTable(editingTable.id, { number: form.number, capacity: form.capacity, section: form.section.trim() });
    } else {
      addTable({ number: form.number, capacity: form.capacity, section: form.section.trim(), status: 'available' });
    }
    setModalMode(null);
    setEditingTable(null);
  };

  const handleDelete = (id: string) => {
    deleteTable(id);
    setDeleteConfirm(null);
  };

  const openSectionAdd = () => {
    setEditingSection(null);
    setSectionFormName('');
    setModalMode('sectionAdd');
  };

  const openSectionEdit = (name: string) => {
    setEditingSection(name);
    setSectionFormName(name);
    setModalMode('sectionEdit');
  };

  const handleSectionSave = () => {
    const name = sectionFormName.trim();
    if (!name) return;
    if (modalMode === 'sectionEdit' && editingSection) {
      updateTableSection(editingSection, name);
    } else {
      addTableSection(name);
    }
    setModalMode(null);
    setEditingSection(null);
    setSectionFormName('');
  };

  const handleSectionDelete = (name: string) => {
    deleteTableSection(name);
    setDeleteSectionConfirm(null);
    if (activeSection === name) setActiveSection('all');
  };

  return (
    <div>
      <Header title="Masa İdarəetməsi" subtitle={`${tables.length} masa, ${sections.length} zona`} />

      <div className="p-6">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <button
            onClick={openAdd}
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-4 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-primary-200"
          >
            <Plus className="w-4 h-4" />
            Yeni Masa
          </button>

          <button
            onClick={openSectionAdd}
            className="bg-surface-secondary hover:bg-border text-text-secondary font-medium py-2.5 px-4 rounded-xl transition-all flex items-center gap-2 border border-border"
          >
            <FolderOpen className="w-4 h-4" />
            Yeni Zona
          </button>

          <div className="flex gap-4 ml-auto text-sm">
            {Object.entries(statusConfig).map(([status, cfg]) => (
              <div key={status} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-full ${cfg.color}`} />
                <span className="text-text-secondary">{cfg.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveSection('all')}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              activeSection === 'all' ? 'bg-primary-600 text-white shadow-sm' : 'bg-surface-secondary text-text-secondary hover:bg-border'
            }`}
          >
            Hamısı ({tables.length})
          </button>
          {sections.map((section) => {
            const stats = sectionStats(section);
            return (
              <button
                key={section}
                onClick={() => setActiveSection(section)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors group/section ${
                  activeSection === section ? 'bg-primary-600 text-white shadow-sm' : 'bg-surface-secondary text-text-secondary hover:bg-border'
                }`}
              >
                {section} ({stats.available}/{stats.total})
              </button>
            );
          })}
        </div>

        {sections.filter((s) => activeSection === 'all' || activeSection === s).map((section) => {
          const stats = sectionStats(section);
          const sectionTables = filteredTables.filter((t) => t.section === section);

          return (
            <div key={section} className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-text-primary">{section}</h3>
                  <span className="text-xs bg-surface-secondary text-text-muted px-2.5 py-1 rounded-full font-medium">
                    {stats.available} boş / {stats.total} cəmi
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openSectionEdit(section)}
                    className="p-1.5 rounded-lg hover:bg-surface-secondary transition-colors"
                    title="Zonanı redaktə et"
                  >
                    <Edit2 className="w-4 h-4 text-text-muted" />
                  </button>
                  <button
                    onClick={() => setDeleteSectionConfirm(section)}
                    className="p-1.5 rounded-lg hover:bg-danger-50 transition-colors"
                    title="Zonanı sil"
                  >
                    <Trash2 className="w-4 h-4 text-danger-400" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {sectionTables.map((table) => {
                  const activeOrder = getTableOrder(table.id);
                  const cfg = statusConfig[table.status];

                  return (
                    <div
                      key={table.id}
                      className={`relative rounded-2xl border-2 p-5 text-center transition-all hover:shadow-lg ${cfg.bg} group`}
                    >
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); openEdit(table); }}
                          className="w-7 h-7 rounded-lg bg-white border border-border flex items-center justify-center hover:bg-surface-secondary transition-colors"
                          title="Redaktə"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-text-secondary" />
                        </button>
                        {!activeOrder && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteConfirm(table.id); }}
                            className="w-7 h-7 rounded-lg bg-white border border-border flex items-center justify-center hover:bg-danger-50 transition-colors"
                            title="Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-danger-500" />
                          </button>
                        )}
                      </div>

                      <div className="mb-2 cursor-pointer" onClick={() => openStatus(table)}>
                        <div className="text-3xl font-bold text-text-primary mb-1">#{table.number}</div>
                        <div className="flex items-center justify-center gap-1.5 text-text-secondary mb-3">
                          <Armchair className="w-4 h-4" />
                          <span className="text-sm">{table.capacity} nəfər</span>
                        </div>
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${cfg.badge}`}>
                          {cfg.label}
                        </span>
                      </div>

                      {activeOrder && (
                        <div className="mt-3 bg-white rounded-xl p-2.5 border border-border">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <ChefHat className="w-3.5 h-3.5 text-primary-600" />
                            <span className="text-[10px] font-semibold text-primary-600">Aktiv Sifariş</span>
                          </div>
                          <p className="text-xs font-bold text-text-primary">{activeOrder.totalAmount} ₼</p>
                          <p className="text-[10px] text-text-muted">{activeOrder.items.length} məhsul</p>
                        </div>
                      )}

                      {table.status === 'reserved' && table.reservation && (
                        <div className="mt-3 bg-warning-50 rounded-xl p-2.5 border border-warning-200">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Clock className="w-3.5 h-3.5 text-warning-600" />
                            <span className="text-[10px] font-semibold text-warning-600">Rezervasiya</span>
                          </div>
                          <p className="text-xs font-bold text-text-primary">{table.reservation.guestName}</p>
                          <p className="text-[10px] text-text-muted">{table.reservation.time} • {table.reservation.guestCount} nəfər</p>
                        </div>
                      )}

                      <div className="mt-3 flex gap-1 justify-center">
                        {(['available', 'occupied', 'reserved', 'cleaning'] as const).map((s) => (
                          <button
                            key={s}
                            onClick={(e) => { e.stopPropagation(); updateTableStatus(table.id, s); }}
                            className={`w-6 h-6 rounded-full border-2 transition-all ${
                              table.status === s ? 'border-primary-600 scale-110' : 'border-border hover:border-primary-300'
                            } ${statusConfig[s].color}`}
                            title={statusConfig[s].label}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}

                {sectionTables.length === 0 && (
                  <div className="col-span-full text-center py-12 bg-surface-secondary rounded-2xl border border-dashed border-border">
                    <Grid3X3 className="w-10 h-10 mx-auto text-text-muted opacity-30 mb-2" />
                    <p className="text-sm text-text-muted">Bu zonada masa yoxdur</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {sections.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-border">
            <FolderOpen className="w-12 h-12 mx-auto text-text-muted opacity-30 mb-3" />
            <p className="text-text-muted mb-4">Hələ zona yaradılmayıb</p>
            <button onClick={openSectionAdd} className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
              İlk Zonanı Yarat
            </button>
          </div>
        )}
      </div>

      {/* Table Add / Edit Modal */}
      {(modalMode === 'add' || modalMode === 'edit') && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setModalMode(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-lg font-bold text-text-primary">{modalMode === 'edit' ? 'Masanı Redaktə Et' : 'Yeni Masa Əlavə Et'}</h3>
              <button onClick={() => setModalMode(null)} className="p-1 hover:bg-surface-secondary rounded-lg">
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Masa nömrəsi</label>
                  <input
                    type="number"
                    min={1}
                    value={form.number}
                    onChange={(e) => setForm({ ...form, number: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Tutum (nəfər)</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Zona</label>
                {sections.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {sections.map((section) => (
                      <button
                        key={section}
                        onClick={() => setForm({ ...form, section })}
                        className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                          form.section === section
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-border bg-surface-secondary text-text-secondary hover:border-primary-300'
                        }`}
                      >
                        {section}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="bg-surface-secondary rounded-xl p-4 text-center">
                    <p className="text-sm text-text-muted mb-2">Zona yoxdur</p>
                    <button
                      onClick={() => { setModalMode(null); openSectionAdd(); }}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      + Zona yarat
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setModalMode(null)}
                className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors"
              >
                Ləğv
              </button>
              <button
                onClick={handleSave}
                disabled={form.number < 1 || form.capacity < 1 || !form.section.trim() || (modalMode === 'add' && tables.some((t) => t.number === form.number))}
                className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-text-muted text-white rounded-xl text-sm font-semibold transition-colors"
              >
                {modalMode === 'edit' ? 'Yadda Saxla' : 'Əlavə Et'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Modal */}
      {modalMode === 'status' && statusTable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setModalMode(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-lg font-bold text-text-primary">Masa #{statusTable.number} — Status</h3>
              <button onClick={() => setModalMode(null)} className="p-1 hover:bg-surface-secondary rounded-lg">
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            {/* Status Buttons - hidden when reservation form is open */}
            {!showReservationForm && statusTable.status !== 'reserved' && (
              <div className="px-6 py-4 space-y-2">
                {(['available', 'occupied', 'reserved', 'cleaning'] as const).map((s) => {
                  const cfg = statusConfig[s];
                  const active = statusTable.status === s;
                  return (
                    <button
                      key={s}
                      onClick={() => {
                        if (s === 'reserved') {
                          setShowReservationForm(true);
                        } else {
                          updateTable(statusTable.id, { status: s, reservation: undefined });
                          updateTableStatus(statusTable.id, s);
                          setModalMode(null);
                        }
                      }}
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

            {/* Reservation Form - shown when clicking reserved to create new */}
            {showReservationForm && statusTable.status !== 'reserved' && (
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
                    max={statusTable.capacity}
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
                    onClick={() => {
                      updateTable(statusTable.id, {
                        status: 'reserved',
                        reservation: {
                          guestName: reservationForm.guestName.trim(),
                          phone: reservationForm.phone.trim(),
                          time: reservationForm.time,
                          guestCount: reservationForm.guestCount || 1,
                          notes: reservationForm.notes.trim() || undefined,
                        },
                      });
                      setModalMode(null);
                    }}
                    disabled={!reservationForm.guestName.trim() || !reservationForm.phone.trim() || !reservationForm.time}
                    className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-text-muted text-white rounded-xl text-sm font-semibold transition-colors"
                  >
                    Rezervasiya Et
                  </button>
                </div>
              </div>
            )}

            {/* Existing Reservation Info - shown when table is already reserved */}
            {statusTable.status === 'reserved' && statusTable.reservation && (
              <div className="px-6 py-4 space-y-3">
                <div className="bg-warning-50 border border-warning-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-warning-600" />
                    <span className="text-sm font-semibold text-warning-700">Rezervasiya Məlumatı</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-3.5 h-3.5 text-text-muted" />
                    <span className="text-text-secondary">{statusTable.reservation.guestName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-3.5 h-3.5 text-text-muted" />
                    <span className="text-text-secondary">{statusTable.reservation.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-3.5 h-3.5 text-text-muted" />
                    <span className="text-text-secondary">{statusTable.reservation.time} • {statusTable.reservation.guestCount} nəfər</span>
                  </div>
                  {statusTable.reservation.notes && (
                    <p className="text-xs text-text-muted pt-1 border-t border-warning-200">{statusTable.reservation.notes}</p>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => { updateTable(statusTable.id, { status: 'available', reservation: undefined }); updateTableStatus(statusTable.id, 'available'); setModalMode(null); }}
                    className="flex-1 px-4 py-2.5 bg-danger-500 hover:bg-danger-600 text-white rounded-xl text-sm font-semibold transition-colors"
                  >
                    Rezervasiyanı Ləğv Et
                  </button>
                  <button
                    onClick={() => setModalMode(null)}
                    className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors"
                  >
                    Bağla
                  </button>
                </div>
              </div>
            )}

            {/* Existing Reserved Table Without Data */}
            {statusTable.status === 'reserved' && !statusTable.reservation && (
              <div className="px-6 py-4 space-y-3">
                <div className="bg-warning-50 border border-warning-200 rounded-xl p-4 text-center">
                  <p className="text-sm text-text-muted">Rezervasiya məlumatı yoxdur</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => { updateTable(statusTable.id, { status: 'available' }); updateTableStatus(statusTable.id, 'available'); setModalMode(null); }}
                    className="flex-1 px-4 py-2.5 bg-danger-500 hover:bg-danger-600 text-white rounded-xl text-sm font-semibold transition-colors"
                  >
                    Boşalt
                  </button>
                  <button
                    onClick={() => setModalMode(null)}
                    className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors"
                  >
                    Bağla
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Section Add / Edit Modal */}
      {(modalMode === 'sectionAdd' || modalMode === 'sectionEdit') && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setModalMode(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-lg font-bold text-text-primary">{modalMode === 'sectionEdit' ? 'Zonanı Redaktə Et' : 'Yeni Zona Əlavə Et'}</h3>
              <button onClick={() => setModalMode(null)} className="p-1 hover:bg-surface-secondary rounded-lg">
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>
            <div className="px-6 py-4">
              <label className="block text-sm font-medium text-text-secondary mb-1">Zona adı</label>
              <input
                value={sectionFormName}
                onChange={(e) => setSectionFormName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSectionSave(); }}
                className="w-full px-4 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="məs. Zal 3, Terras, Bağça"
                autoFocus
              />
              {modalMode === 'sectionAdd' && sections.includes(sectionFormName.trim()) && (
                <p className="text-xs text-danger-600 mt-1">Bu zona artıq mövcuddur</p>
              )}
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setModalMode(null)}
                className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors"
              >
                Ləğv
              </button>
              <button
                onClick={handleSectionSave}
                disabled={!sectionFormName.trim() || (modalMode === 'sectionAdd' && sections.includes(sectionFormName.trim())) || (modalMode === 'sectionEdit' && (sectionFormName.trim() === editingSection || sections.includes(sectionFormName.trim())))}
                className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-text-muted text-white rounded-xl text-sm font-semibold transition-colors"
              >
                {modalMode === 'sectionEdit' ? 'Yadda Saxla' : 'Əlavə Et'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <Trash2 className="w-10 h-10 mx-auto text-danger-500 mb-3" />
            <h3 className="text-lg font-bold text-text-primary mb-1">
              Masa #{tables.find((t) => t.id === deleteConfirm)?.number} silinsin?
            </h3>
            <p className="text-sm text-text-secondary mb-5">Bu əməliyyat geri alına bilməz.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors">
                Geri
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 px-4 py-2.5 bg-danger-500 hover:bg-danger-600 text-white rounded-xl text-sm font-semibold transition-colors">
                Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Section Delete Confirmation */}
      {deleteSectionConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDeleteSectionConfirm(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <Trash2 className="w-10 h-10 mx-auto text-danger-500 mb-3" />
            <h3 className="text-lg font-bold text-text-primary mb-1">
              "{deleteSectionConfirm}" zonası silinsin?
            </h3>
            <p className="text-sm text-text-secondary mb-2">
              Bu zonada {tables.filter((t) => t.section === deleteSectionConfirm).length} masa var.
            </p>
            <p className="text-sm text-danger-600 mb-5">
              Bu masalar ilk mövcud zonaya köçürüləcək.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteSectionConfirm(null)} className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors">
                Geri
              </button>
              <button onClick={() => handleSectionDelete(deleteSectionConfirm)} className="flex-1 px-4 py-2.5 bg-danger-500 hover:bg-danger-600 text-white rounded-xl text-sm font-semibold transition-colors">
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
