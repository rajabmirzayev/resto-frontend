import { useState } from 'react';
import Header from '../../components/layout/Header';
import { useStore } from '../../store/useStore';
import TableStatusModal from '../../components/admin/TableStatusModal';
import { useTables, useTableSections, useCreateTable, useUpdateTable, useDeleteTable, useUpdateTableStatus, useUpdateReservation, useRemoveReservation, useCreateSection, useUpdateSection, useRemoveSection } from '../../api/hooks/useTables';
import { useOrders } from '../../api/hooks/useOrders';
import type { RestaurantTableDto, SectionDto, TableStatusEnum } from '../../api/types';
import { Plus, Edit2, Trash2, X, Grid3X3, Armchair, ChefHat, FolderOpen, Clock, Loader2 } from 'lucide-react';
import { useTranslation } from '../../i18n';

type ModalMode = 'add' | 'edit' | 'status' | 'sectionAdd' | 'sectionEdit' | null;

interface TableForm {
  number: number;
  capacity: number;
  section: string;
}

const emptyForm: TableForm = { number: 1, capacity: 2, section: '' };

export default function AdminTables() {
  const { t } = useTranslation();
  const currentUser = useStore((s) => s.currentUser);
  const orgId = currentUser?.orgId;

  const tablesQuery = useTables(orgId);
  const sectionsQuery = useTableSections(orgId);
  const ordersQuery = useOrders(orgId);
  const createTable = useCreateTable(orgId);
  const updateTable = useUpdateTable(orgId);
  const deleteTable = useDeleteTable(orgId);
  const updateTableStatus = useUpdateTableStatus(orgId);
  const updateReservation = useUpdateReservation(orgId);
  const removeReservation = useRemoveReservation(orgId);
  const createSection = useCreateSection(orgId);
  const updateSection = useUpdateSection(orgId);
  const removeSection = useRemoveSection(orgId);

  const tables = tablesQuery.data ?? [];
  const sections = sectionsQuery.data ?? [];
  const orders = ordersQuery.data ?? [];

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingTable, setEditingTable] = useState<RestaurantTableDto | null>(null);
  const [form, setForm] = useState<TableForm>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteSectionConfirm, setDeleteSectionConfirm] = useState<string | null>(null);
  const [statusTable, setStatusTable] = useState<RestaurantTableDto | null>(null);
  const [activeSection, setActiveSection] = useState<string>('all');
  const [sectionFormName, setSectionFormName] = useState('');
  const [editingSection, setEditingSection] = useState<string | null>(null);

  const sectionName = (id: string) => sections.find((s) => s.id === id)?.name ?? '';

  const statusConfig: Record<TableStatusEnum, { label: string; color: string; badge: string; bg: string }> = {
    AVAILABLE: { label: t('table.status.available'), color: 'bg-success-500', badge: 'bg-success-500 text-white', bg: 'border-success-300 bg-success-50' },
    OCCUPIED: { label: t('table.status.occupied'), color: 'bg-danger-500', badge: 'bg-danger-500 text-white', bg: 'border-danger-300 bg-danger-50' },
    RESERVED: { label: t('table.status.reserved'), color: 'bg-warning-500', badge: 'bg-warning-500 text-white', bg: 'border-warning-300 bg-warning-50' },
    CLEANING: { label: t('table.status.cleaning'), color: 'bg-surface-secondary', badge: 'bg-surface-secondary text-text-secondary', bg: 'border-border bg-surface-secondary' },
  };

  const filteredTables = activeSection === 'all' ? tables : tables.filter((tbl) => tbl.sectionId === activeSection);

  const getTableOrder = (tableId: string) =>
    orders.find((o) => o.tableId === tableId && !['COMPLETED', 'CANCELLED'].includes(o.status));

  const sectionStats = (sectionId: string) => {
    const st = tables.filter((x) => x.sectionId === sectionId);
    return { total: st.length, available: st.filter((x) => x.status === 'AVAILABLE').length };
  };

  const openAdd = () => {
    setEditingTable(null);
    const nextNum = tables.length > 0 ? Math.max(...tables.map((tbl) => tbl.tableNumber)) + 1 : 1;
    setForm({ number: nextNum, capacity: 4, section: sections[0]?.id || '' });
    setModalMode('add');
  };

  const openEdit = (table: RestaurantTableDto) => {
    setEditingTable(table);
    setForm({ number: table.tableNumber, capacity: table.capacity, section: table.sectionId });
    setModalMode('edit');
  };

  const openStatus = (table: RestaurantTableDto) => {
    setStatusTable(table);
    setModalMode('status');
  };

  const handleSave = () => {
    if (form.number < 1 || form.capacity < 1 || !form.section.trim()) return;
    const duplicate = tables.find((tbl) => tbl.tableNumber === form.number && tbl.id !== editingTable?.id);
    if (duplicate) return;

    if (modalMode === 'edit' && editingTable) {
      updateTable.mutate({ id: editingTable.id, payload: { tableNumber: form.number, capacity: form.capacity, sectionId: form.section.trim() } });
    } else {
      createTable.mutate({ tableNumber: form.number, capacity: form.capacity, sectionId: form.section.trim(), orgId: orgId ?? '' });
    }
    setModalMode(null);
    setEditingTable(null);
  };

  const handleDelete = (id: string) => {
    deleteTable.mutate(id);
    setDeleteConfirm(null);
  };

  const openSectionAdd = () => {
    setEditingSection(null);
    setSectionFormName('');
    setModalMode('sectionAdd');
  };

  const openSectionEdit = (section: SectionDto) => {
    setEditingSection(section.id);
    setSectionFormName(section.name);
    setModalMode('sectionEdit');
  };

  const handleSectionSave = () => {
    const name = sectionFormName.trim();
    if (!name) return;
    if (modalMode === 'sectionEdit' && editingSection) {
      updateSection.mutate({ id: editingSection, name });
    } else {
      createSection.mutate({ name, orgId: orgId ?? '' });
    }
    setModalMode(null);
    setEditingSection(null);
    setSectionFormName('');
  };

  const handleSectionDelete = (id: string) => {
    removeSection.mutate(id);
    setDeleteSectionConfirm(null);
    if (activeSection === id) setActiveSection('all');
  };

  if ((tablesQuery.isLoading && !tablesQuery.data) || (sectionsQuery.isLoading && !sectionsQuery.data)) {
    return (
      <div>
        <Header title={t('tables.title')} subtitle={t('tables.subtitle', { count: tables.length, zones: sections.length })} showUser />
        <div className="p-6">
          <div className="bg-white dark:bg-surface rounded-2xl border border-border p-12 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            <p className="text-sm text-text-secondary">...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title={t('tables.title')} subtitle={t('tables.subtitle', { count: tables.length, zones: sections.length })} showUser />

      <div className="p-6">
        {(tablesQuery.isError || sectionsQuery.isError) && (
          <div className="bg-danger-50 border border-danger-200 rounded-2xl p-4 mb-6 flex items-center justify-between">
            <p className="text-sm text-danger-700">{t('error.unexpected')}</p>
            <button
              onClick={() => { tablesQuery.refetch(); sectionsQuery.refetch(); }}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition-colors"
            >
              {t('error.retry')}
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <button
            onClick={openAdd}
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-4 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-primary-200"
          >
            <Plus className="w-4 h-4" />
            {t('tables.new_table')}
          </button>

          <button
            onClick={openSectionAdd}
            className="bg-surface-secondary hover:bg-border text-text-secondary font-medium py-2.5 px-4 rounded-xl transition-all flex items-center gap-2 border border-border"
          >
            <FolderOpen className="w-4 h-4" />
            {t('tables.new_zone')}
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
            {t('common.all')} ({tables.length})
          </button>
          {sections.map((section) => {
            const stats = sectionStats(section.id);
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors group/section ${
                  activeSection === section.id ? 'bg-primary-600 text-white shadow-sm' : 'bg-surface-secondary text-text-secondary hover:bg-border'
                }`}
              >
                {section.name} ({stats.available}/{stats.total})
              </button>
            );
          })}
        </div>

        {sections.filter((s) => activeSection === 'all' || activeSection === s.id).map((section) => {
          const stats = sectionStats(section.id);
          const sectionTables = filteredTables.filter((tbl) => tbl.sectionId === section.id);

          return (
            <div key={section.id} className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-text-primary">{section.name}</h3>
                  <span className="text-xs bg-surface-secondary text-text-muted px-2.5 py-1 rounded-full font-medium">
                    {t('tables.available_total', { free: stats.available, total: stats.total })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openSectionEdit(section)}
                    className="p-1.5 rounded-lg hover:bg-surface-secondary transition-colors"
                    title={t('tables.edit_zone')}
                  >
                    <Edit2 className="w-4 h-4 text-text-muted" />
                  </button>
                  <button
                    onClick={() => setDeleteSectionConfirm(section.id)}
                    className="p-1.5 rounded-lg hover:bg-danger-50 transition-colors"
                    title={t('tables.delete_zone')}
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
                          className="w-7 h-7 rounded-lg bg-white dark:bg-surface border border-border flex items-center justify-center hover:bg-surface-secondary transition-colors"
                          title={t('common.edit')}
                        >
                          <Edit2 className="w-3.5 h-3.5 text-text-secondary" />
                        </button>
                        {!activeOrder && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteConfirm(table.id); }}
                            className="w-7 h-7 rounded-lg bg-white dark:bg-surface border border-border flex items-center justify-center hover:bg-danger-50 transition-colors"
                            title={t('common.delete')}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-danger-500" />
                          </button>
                        )}
                      </div>

                      <div className="mb-2 cursor-pointer" onClick={() => openStatus(table)}>
                        <div className="text-3xl font-bold text-text-primary mb-1">{t('table.number_prefix', { number: table.tableNumber })}</div>
                        <div className="flex items-center justify-center gap-1.5 text-text-secondary mb-3">
                          <Armchair className="w-4 h-4" />
                          <span className="text-sm">{table.capacity} {t('table.guests')}</span>
                        </div>
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${cfg.badge}`}>
                          {cfg.label}
                        </span>
                      </div>

                      {activeOrder && (
                        <div className="mt-3 bg-white dark:bg-surface rounded-xl p-2.5 border border-border">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <ChefHat className="w-3.5 h-3.5 text-primary-600" />
                            <span className="text-[10px] font-semibold text-primary-600">{t('tables.active_order')}</span>
                          </div>
                          <p className="text-xs font-bold text-text-primary">{activeOrder.totalAmount} ₼</p>
                          <p className="text-[10px] text-text-muted">{activeOrder.items.length} {t('order.items_suffix')}</p>
                        </div>
                      )}

                      {table.status === 'RESERVED' && table.reservation && (
                        <div className="mt-3 bg-warning-50 rounded-xl p-2.5 border border-warning-200">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Clock className="w-3.5 h-3.5 text-warning-600" />
                            <span className="text-[10px] font-semibold text-warning-600">{t('table.status.reserved')}</span>
                          </div>
                          <p className="text-xs font-bold text-text-primary">{table.reservation.guestName}</p>
                          <p className="text-[10px] text-text-muted">{table.reservation.time} • {table.reservation.guestCount} {t('table.guests')}</p>
                        </div>
                      )}

                      <div className="mt-3 flex gap-1 justify-center">
                        {(['AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING'] as const).map((s) => (
                          <button
                            key={s}
                            onClick={(e) => { e.stopPropagation(); updateTableStatus.mutate({ id: table.id, status: s }); }}
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
                    <p className="text-sm text-text-muted">{t('tables.no_tables_in_zone')}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {sections.length === 0 && (
          <div className="text-center py-20 bg-white dark:bg-surface rounded-2xl border border-border">
            <FolderOpen className="w-12 h-12 mx-auto text-text-muted opacity-30 mb-3" />
            <p className="text-text-muted mb-4">{t('tables.no_zones_created')}</p>
            <button onClick={openSectionAdd} className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
              {t('tables.create_first_zone')}
            </button>
          </div>
        )}
      </div>

      {/* Table Add / Edit Modal */}
      {(modalMode === 'add' || modalMode === 'edit') && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setModalMode(null)}>
          <div className="bg-white dark:bg-surface rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-lg font-bold text-text-primary">{modalMode === 'edit' ? t('tables.edit_table') : t('tables.add_table')}</h3>
              <button onClick={() => setModalMode(null)} className="p-1 hover:bg-surface-secondary rounded-lg">
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">{t('tables.table_number')}</label>
                  <input
                    type="number"
                    min={1}
                    value={form.number}
                    onChange={(e) => setForm({ ...form, number: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">{t('tables.capacity')}</label>
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
                <label className="block text-sm font-medium text-text-secondary mb-2">{t('tables.zone')}</label>
                {sections.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {sections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => setForm({ ...form, section: section.id })}
                        className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                          form.section === section.id
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-border bg-surface-secondary text-text-secondary hover:border-primary-300'
                        }`}
                      >
                        {section.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="bg-surface-secondary rounded-xl p-4 text-center">
                    <p className="text-sm text-text-muted mb-2">{t('tables.no_zones')}</p>
                    <button
                      onClick={() => { setModalMode(null); openSectionAdd(); }}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      + {t('tables.create_zone')}
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
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={form.number < 1 || form.capacity < 1 || !form.section.trim() || (modalMode === 'add' && tables.some((tbl) => tbl.tableNumber === form.number))}
                className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-text-muted text-white rounded-xl text-sm font-semibold transition-colors"
              >
                {modalMode === 'edit' ? t('common.save') : t('common.add')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Modal */}
      {modalMode === 'status' && statusTable && (
        <TableStatusModal
          table={statusTable}
          onUpdateStatus={(id, status) => updateTableStatus.mutate({ id, status })}
          onUpdateReservation={(id, reservation) => updateReservation.mutate({ id, reservation })}
          onRemoveReservation={(id) => removeReservation.mutate(id)}
          onClose={() => setModalMode(null)}
        />
      )}

      {/* Section Add / Edit Modal */}
      {(modalMode === 'sectionAdd' || modalMode === 'sectionEdit') && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setModalMode(null)}>
          <div className="bg-white dark:bg-surface rounded-2xl w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-lg font-bold text-text-primary">{modalMode === 'sectionEdit' ? t('tables.edit_zone_title') : t('tables.add_zone_title')}</h3>
              <button onClick={() => setModalMode(null)} className="p-1 hover:bg-surface-secondary rounded-lg">
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>
            <div className="px-6 py-4">
              <label className="block text-sm font-medium text-text-secondary mb-1">{t('tables.zone_name')}</label>
              <input
                value={sectionFormName}
                onChange={(e) => setSectionFormName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSectionSave(); }}
                className="w-full px-4 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder={t('tables.zone_placeholder')}
                autoFocus
              />
              {modalMode === 'sectionAdd' && sections.some((s) => s.name === sectionFormName.trim()) && (
                <p className="text-xs text-danger-600 mt-1">{t('tables.zone_already_exists')}</p>
              )}
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setModalMode(null)}
                className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSectionSave}
                disabled={!sectionFormName.trim() || (modalMode === 'sectionAdd' && sections.some((s) => s.name === sectionFormName.trim())) || (modalMode === 'sectionEdit' && (sections.find((s) => s.id === editingSection)?.name === sectionFormName.trim() || sections.some((s) => s.id !== editingSection && s.name === sectionFormName.trim())))}
                className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-text-muted text-white rounded-xl text-sm font-semibold transition-colors"
              >
                {modalMode === 'sectionEdit' ? t('common.save') : t('common.add')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white dark:bg-surface rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <Trash2 className="w-10 h-10 mx-auto text-danger-500 mb-3" />
            <h3 className="text-lg font-bold text-text-primary mb-1">
              {t('tables.delete_confirmation', { number: tables.find((tbl) => tbl.id === deleteConfirm)?.tableNumber ?? '?' })}
            </h3>
            <p className="text-sm text-text-secondary mb-5">{t('common.irreversible_warning')}</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors">
                {t('common.back')}
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 px-4 py-2.5 bg-danger-500 hover:bg-danger-600 text-white rounded-xl text-sm font-semibold transition-colors">
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Section Delete Confirmation */}
      {deleteSectionConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDeleteSectionConfirm(null)}>
          <div className="bg-white dark:bg-surface rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <Trash2 className="w-10 h-10 mx-auto text-danger-500 mb-3" />
            <h3 className="text-lg font-bold text-text-primary mb-1">
              {t('tables.delete_zone_confirmation', { name: sectionName(deleteSectionConfirm) })}
            </h3>
            <p className="text-sm text-text-secondary mb-2">
              {t('tables.zone_contains_tables', { count: tables.filter((tbl) => tbl.sectionId === deleteSectionConfirm).length })}
            </p>
            <p className="text-sm text-danger-600 mb-5">
              {t('tables.tables_will_be_moved')}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteSectionConfirm(null)} className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors">
                {t('common.back')}
              </button>
              <button onClick={() => handleSectionDelete(deleteSectionConfirm)} className="flex-1 px-4 py-2.5 bg-danger-500 hover:bg-danger-600 text-white rounded-xl text-sm font-semibold transition-colors">
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
