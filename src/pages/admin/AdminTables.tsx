import { useState } from 'react';
import Header from '../../components/layout/Header';
import { useStore } from '../../store/useStore';
import TableStatusModal from '../../components/admin/TableStatusModal';
import { useTables, useTableSections, useCreateTable, useUpdateTable, useDeleteTable, useUpdateTableStatus, useUpdateReservation, useRemoveReservation, useCreateSection, useUpdateSection, useRemoveSection } from '../../api/hooks/useTables';
import { useOrders } from '../../api/hooks/useOrders';
import type { RestaurantTableDto, SectionDto, TableStatusEnum } from '../../api/types';
import { Plus, Edit2, Trash2, X, Grid3X3, Armchair, ChefHat, FolderOpen, Clock, Loader2 } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { useToast } from '../../store/useToast';
import { ApiError } from '../../api/client';
import { getTableErrorMessage, TABLE_ERROR_KEYS } from '../../lib/tableErrors';
import { TABLE_LIMITS, hasControlCharacters, isValidCapacity, isValidTableNumber } from '../../lib/validation';
import { isStatusTransitionAllowed, TABLE_STATUSES } from '../../lib/tableStatus';

type ModalMode = 'add' | 'edit' | 'status' | 'sectionAdd' | 'sectionEdit' | null;

interface TableForm {
  number: number;
  capacity: number;
  section: string;
}

const emptyForm: TableForm = { number: 1, capacity: 2, section: '' };

const TABLE_FIELD_MAP: Record<string, string> = {
  tableNumber: 'number',
  capacity: 'capacity',
  sectionId: 'section',
};

const inputClass = (hasError: boolean): string =>
  `w-full px-4 py-2.5 bg-surface-secondary border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${hasError ? 'border-danger-400' : 'border-border'}`;

export default function AdminTables() {
  const { t } = useTranslation();
  const { addToast } = useToast();
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
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteSectionConfirm, setDeleteSectionConfirm] = useState<string | null>(null);
  const [statusTable, setStatusTable] = useState<RestaurantTableDto | null>(null);
  const [activeSection, setActiveSection] = useState<string>('all');
  const [sectionFormName, setSectionFormName] = useState('');
  const [sectionErrors, setSectionErrors] = useState<Record<string, string>>({});
  const [sectionFormError, setSectionFormError] = useState('');
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

  const isDotEnabled = (table: RestaurantTableDto, s: TableStatusEnum) => {
    if (s === 'RESERVED') return table.status === 'AVAILABLE' || table.status === 'CLEANING';
    if (s === 'OCCUPIED') return isStatusTransitionAllowed(table.status, s) && !!table.currentOrderId;
    return isStatusTransitionAllowed(table.status, s);
  };

  const translateTableFieldError = (field: string, message: string): string => {
    const lower = message.toLowerCase();
    if (lower.includes('must not be null') || lower.includes('must not be blank') || lower.includes('required')) {
      if (field === 'tableNumber') return t('validation.table_number.required');
      if (field === 'capacity') return t('validation.capacity.required');
      if (field === 'sectionId') return t('validation.zone.required');
      return t('error.tables.validation');
    }
    if (lower.includes('must be greater than or equal to') || lower.includes('must be less than or equal to')) {
      if (field === 'tableNumber') return t('validation.table_number.range', { min: TABLE_LIMITS.tableNumberMin, max: TABLE_LIMITS.tableNumberMax });
      if (field === 'capacity') return t('validation.capacity.range', { min: TABLE_LIMITS.capacityMin, max: TABLE_LIMITS.capacityMax });
    }
    if (lower.includes('numeric value out of bounds')) {
      if (field === 'tableNumber') return t('validation.table_number.range', { min: TABLE_LIMITS.tableNumberMin, max: TABLE_LIMITS.tableNumberMax });
      if (field === 'capacity') return t('validation.capacity.range', { min: TABLE_LIMITS.capacityMin, max: TABLE_LIMITS.capacityMax });
    }
    if (lower.includes('must not exceed') || lower.includes('control characters')) {
      return t('validation.name.invalid_char');
    }
    return message;
  };

  const translateSectionFieldError = (message: string): string => {
    const lower = message.toLowerCase();
    if (lower.includes('must not be blank') || lower.includes('must not be null')) return t('validation.name.required');
    if (lower.includes('must not exceed')) return t('validation.name.max_length', { max: TABLE_LIMITS.nameMax });
    if (lower.includes('control characters')) return t('validation.name.invalid_char');
    return message;
  };

  const handleTableApiError = (err: unknown) => {
    if (err instanceof ApiError) {
      if (err.fieldErrors && err.fieldErrors.length > 0) {
        const fe: Record<string, string> = {};
        for (const item of err.fieldErrors) {
          fe[TABLE_FIELD_MAP[item.field] ?? item.field] = translateTableFieldError(item.field, item.message);
        }
        setFormErrors(fe);
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

  const handleSectionApiError = (err: unknown) => {
    if (err instanceof ApiError) {
      if (err.fieldErrors && err.fieldErrors.length > 0) {
        const fe: Record<string, string> = {};
        for (const item of err.fieldErrors) {
          fe[item.field] = translateSectionFieldError(item.message);
        }
        setSectionErrors(fe);
        return;
      }
      if (err.key && TABLE_ERROR_KEYS[err.key]) {
        setSectionFormError(t(TABLE_ERROR_KEYS[err.key]));
        return;
      }
      setSectionFormError(err.detail || t('error.unexpected'));
      return;
    }
    setSectionFormError(t('error.network'));
  };

  const openAdd = () => {
    setEditingTable(null);
    const nextNum = tables.length > 0 ? Math.max(...tables.map((tbl) => tbl.tableNumber)) + 1 : 1;
    setForm({ number: nextNum, capacity: 4, section: sections[0]?.id || '' });
    setFormErrors({});
    setFormError('');
    setModalMode('add');
  };

  const openEdit = (table: RestaurantTableDto) => {
    setEditingTable(table);
    setForm({ number: table.tableNumber, capacity: table.capacity, section: table.sectionId });
    setFormErrors({});
    setFormError('');
    setModalMode('edit');
  };

  const openStatus = (table: RestaurantTableDto) => {
    setStatusTable(table);
    setModalMode('status');
  };

  const closeTableModal = () => {
    setModalMode(null);
    setEditingTable(null);
    setFormErrors({});
    setFormError('');
  };

  const validateTableForm = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!Number.isFinite(form.number) || form.number === 0) {
      errors.number = t('validation.table_number.required');
    } else if (!isValidTableNumber(form.number)) {
      errors.number = t('validation.table_number.range', { min: TABLE_LIMITS.tableNumberMin, max: TABLE_LIMITS.tableNumberMax });
    } else if (tables.some((tbl) => tbl.tableNumber === form.number && tbl.id !== editingTable?.id)) {
      errors.number = t('validation.table_number.duplicate');
    }
    if (!Number.isFinite(form.capacity) || form.capacity === 0) {
      errors.capacity = t('validation.capacity.required');
    } else if (!isValidCapacity(form.capacity)) {
      errors.capacity = t('validation.capacity.range', { min: TABLE_LIMITS.capacityMin, max: TABLE_LIMITS.capacityMax });
    }
    if (!form.section.trim()) {
      errors.section = t('validation.zone.required');
    }
    return errors;
  };

  const handleSave = async () => {
    const errors = validateTableForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setFormError('');
    setIsSaving(true);
    const sectionId = form.section.trim();
    try {
      if (modalMode === 'edit' && editingTable) {
        await updateTable.mutateAsync({ id: editingTable.id, payload: { tableNumber: form.number, capacity: form.capacity, sectionId } });
        addToast(t('tables.table_updated'), 'success');
      } else {
        await createTable.mutateAsync({ tableNumber: form.number, capacity: form.capacity, sectionId, orgId: orgId ?? '' });
        addToast(t('tables.table_added'), 'success');
      }
      setModalMode(null);
      setEditingTable(null);
    } catch (err) {
      handleTableApiError(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteConfirm(null);
    try {
      await deleteTable.mutateAsync(id);
      addToast(t('tables.table_deleted'), 'success');
    } catch (err) {
      addToast(getTableErrorMessage(err, t('tables.error.delete_table'), t), 'error');
    }
  };

  const handleQuickStatus = async (table: RestaurantTableDto, s: TableStatusEnum) => {
    if (s === 'RESERVED') {
      openStatus(table);
      return;
    }
    try {
      await updateTableStatus.mutateAsync({ id: table.id, status: s });
      addToast(t('tables.status_updated'), 'success');
    } catch (err) {
      addToast(getTableErrorMessage(err, t('tables.error.update_status'), t), 'error');
    }
  };

  const openSectionAdd = () => {
    setEditingSection(null);
    setSectionFormName('');
    setSectionErrors({});
    setSectionFormError('');
    setModalMode('sectionAdd');
  };

  const openSectionEdit = (section: SectionDto) => {
    setEditingSection(section.id);
    setSectionFormName(section.name);
    setSectionErrors({});
    setSectionFormError('');
    setModalMode('sectionEdit');
  };

  const closeSectionModal = () => {
    setModalMode(null);
    setEditingSection(null);
    setSectionFormName('');
    setSectionErrors({});
    setSectionFormError('');
  };

  const validateSectionForm = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    const name = sectionFormName.trim();
    if (!name) {
      errors.name = t('validation.name.required');
    } else {
      if (hasControlCharacters(name)) {
        errors.name = t('validation.name.invalid_char');
      } else if (name.length > TABLE_LIMITS.nameMax) {
        errors.name = t('validation.name.max_length', { max: TABLE_LIMITS.nameMax });
      }
      const normalized = name.toLowerCase();
      if (sections.some((s) => s.name.toLowerCase() === normalized && s.id !== editingSection)) {
        errors.name = t('validation.zone.name_duplicate');
      }
    }
    return errors;
  };

  const handleSectionSave = async () => {
    const errors = validateSectionForm();
    if (Object.keys(errors).length > 0) {
      setSectionErrors(errors);
      return;
    }
    setSectionErrors({});
    setSectionFormError('');
    setIsSaving(true);
    const name = sectionFormName.trim();
    try {
      if (modalMode === 'sectionEdit' && editingSection) {
        await updateSection.mutateAsync({ id: editingSection, name });
        addToast(t('tables.section_updated'), 'success');
      } else {
        await createSection.mutateAsync({ name, orgId: orgId ?? '' });
        addToast(t('tables.section_added'), 'success');
      }
      setModalMode(null);
      setEditingSection(null);
      setSectionFormName('');
    } catch (err) {
      handleSectionApiError(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSectionDelete = async (id: string) => {
    setDeleteSectionConfirm(null);
    try {
      await removeSection.mutateAsync(id);
      addToast(t('tables.section_deleted'), 'success');
      if (activeSection === id) setActiveSection('all');
    } catch (err) {
      addToast(getTableErrorMessage(err, t('tables.error.delete_section'), t), 'error');
    }
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
                          <p className="text-[10px] text-text-muted">
                            {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(table.reservation.time))} • {table.reservation.guestCount} {t('table.guests')}
                          </p>
                        </div>
                      )}

                      <div className="mt-3 flex gap-1 justify-center">
                        {TABLE_STATUSES.map((s) => {
                          const enabled = isDotEnabled(table, s);
                          return (
                            <button
                              key={s}
                              onClick={(e) => { e.stopPropagation(); if (enabled) handleQuickStatus(table, s); }}
                              disabled={!enabled}
                              title={!enabled && s === 'OCCUPIED' ? t('tables.order_required_hint') : statusConfig[s].label}
                              className={`w-6 h-6 rounded-full border-2 transition-all ${
                                table.status === s ? 'border-primary-600 scale-110' : 'border-border hover:border-primary-300'
                              } ${statusConfig[s].color} ${enabled ? '' : 'opacity-30 cursor-not-allowed'}`}
                            />
                          );
                        })}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeTableModal}>
          <div className="bg-white dark:bg-surface rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-lg font-bold text-text-primary">{modalMode === 'edit' ? t('tables.edit_table') : t('tables.add_table')}</h3>
              <button onClick={closeTableModal} className="p-1 hover:bg-surface-secondary rounded-lg">
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">{t('tables.table_number')}</label>
                  <input
                    type="number"
                    min={TABLE_LIMITS.tableNumberMin}
                    max={TABLE_LIMITS.tableNumberMax}
                    value={form.number || ''}
                    onChange={(e) => setForm({ ...form, number: Number(e.target.value) })}
                    className={inputClass(!!formErrors.number)}
                  />
                  {formErrors.number && <p className="text-xs text-danger-600 mt-1">{formErrors.number}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">{t('tables.capacity')}</label>
                  <input
                    type="number"
                    min={TABLE_LIMITS.capacityMin}
                    max={TABLE_LIMITS.capacityMax}
                    value={form.capacity || ''}
                    onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                    className={inputClass(!!formErrors.capacity)}
                  />
                  {formErrors.capacity && <p className="text-xs text-danger-600 mt-1">{formErrors.capacity}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">{t('tables.zone')}</label>
                {sections.length > 0 ? (
                  <>
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
                    {formErrors.section && <p className="text-xs text-danger-600 mt-1">{formErrors.section}</p>}
                  </>
                ) : (
                  <div className="bg-surface-secondary rounded-xl p-4 text-center">
                    <p className="text-sm text-text-muted mb-2">{t('tables.no_zones')}</p>
                    <button
                      onClick={() => { closeTableModal(); openSectionAdd(); }}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      + {t('tables.create_zone')}
                    </button>
                  </div>
                )}
              </div>
              {formError && <p className="text-sm text-danger-600 bg-danger-50 border border-danger-200 rounded-xl px-4 py-3">{formError}</p>}
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={closeTableModal}
                disabled={isSaving}
                className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || form.number < 1 || form.capacity < 1 || !form.section.trim() || (modalMode === 'add' && tables.some((tbl) => tbl.tableNumber === form.number))}
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
          onUpdateStatus={async (id, status) => {
            await updateTableStatus.mutateAsync({ id, status });
            addToast(t('tables.status_updated'), 'success');
          }}
          onUpdateReservation={async (id, reservation) => {
            await updateReservation.mutateAsync({ id, reservation });
            addToast(t('tables.reservation_added'), 'success');
          }}
          onRemoveReservation={async (id) => {
            await removeReservation.mutateAsync(id);
            addToast(t('tables.reservation_cancelled'), 'success');
          }}
          onClose={() => setModalMode(null)}
        />
      )}

      {/* Section Add / Edit Modal */}
      {(modalMode === 'sectionAdd' || modalMode === 'sectionEdit') && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeSectionModal}>
          <div className="bg-white dark:bg-surface rounded-2xl w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-lg font-bold text-text-primary">{modalMode === 'sectionEdit' ? t('tables.edit_zone_title') : t('tables.add_zone_title')}</h3>
              <button onClick={closeSectionModal} className="p-1 hover:bg-surface-secondary rounded-lg">
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>
            <div className="px-6 py-4">
              <label className="block text-sm font-medium text-text-secondary mb-1">{t('tables.zone_name')}</label>
              <input
                value={sectionFormName}
                onChange={(e) => setSectionFormName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSectionSave(); }}
                className={inputClass(!!sectionErrors.name)}
                placeholder={t('tables.zone_placeholder')}
                maxLength={TABLE_LIMITS.nameMax}
                autoFocus
              />
              {sectionErrors.name && <p className="text-xs text-danger-600 mt-1">{sectionErrors.name}</p>}
              {sectionFormError && <p className="text-sm text-danger-600 bg-danger-50 border border-danger-200 rounded-xl px-4 py-3 mt-2">{sectionFormError}</p>}
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={closeSectionModal}
                disabled={isSaving}
                className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSectionSave}
                disabled={isSaving || !sectionFormName.trim()}
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
