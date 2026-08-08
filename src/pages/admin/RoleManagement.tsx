import { useState } from 'react';
import Header from '../../components/layout/Header';
import { useStore } from '../../store/useStore';
import { useTranslation } from '../../i18n';
import { useRoles, useCreateRole, useUpdateRole, useDeleteRole, usePermissionsTree, useSetRolePermissions } from '../../api/hooks/useAccess';
import { useUsers } from '../../api/hooks/useAccess';
import { formatApiError } from '../../api/client';
import type { RoleResponse, UiScope } from '../../api/types';
import { Plus, Edit2, Trash2, X, Shield, Check, Lock, Loader2, ShieldCheck, Users } from 'lucide-react';
import { panelMeta } from '../../lib/panelMeta';

type ModalMode = 'add' | 'edit' | null;

const UI_SCOPE_OPTIONS: { value: UiScope; labelKey: string }[] = [
  { value: 'ADMIN_PANEL', labelKey: 'roles.panel_admin' },
  { value: 'WAITER_PANEL', labelKey: 'roles.panel_waiter' },
  { value: 'KITCHEN_PANEL', labelKey: 'roles.panel_kitchen' },
];

export default function RoleManagement() {
  const { t } = useTranslation();
  const currentUser = useStore((s) => s.currentUser);
  const orgId = currentUser?.orgId;

  const rolesQuery = useRoles();
  const usersQuery = useUsers(orgId ? { orgId } : undefined);
  const treeQuery = usePermissionsTree();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const setRolePermissions = useSetRolePermissions();
  const deleteRole = useDeleteRole();

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingRole, setEditingRole] = useState<RoleResponse | null>(null);
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formUiScope, setFormUiScope] = useState<UiScope>('ADMIN_PANEL');
  const [formPermIds, setFormPermIds] = useState<string[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [panelFilter, setPanelFilter] = useState<'all' | UiScope>('all');

  const roles = rolesQuery.data?.content ?? [];
  const users = usersQuery.data?.content ?? [];
  const tree = treeQuery.data ?? [];
  const filteredRoles = panelFilter === 'all' ? roles : roles.filter((r) => r.uiScope === panelFilter);

  const getUserCount = (roleId: string) => users.filter((u) => u.role?.id === roleId).length;

  const openAdd = () => {
    setEditingRole(null);
    setFormName('');
    setFormCode('');
    setFormUiScope('ADMIN_PANEL');
    setFormPermIds([]);
    setFormError('');
    setModalMode('add');
  };

  const openEdit = (role: RoleResponse) => {
    setEditingRole(role);
    setFormName(role.name);
    setFormCode(role.code);
    setFormUiScope(role.uiScope);
    setFormPermIds([...role.permissionIds]);
    setFormError('');
    setModalMode('edit');
  };

  const togglePermId = (permId: string) => {
    setFormPermIds((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  const toggleModule = (permIds: string[]) => {
    setFormPermIds((prev) => {
      const allSelected = permIds.every((p) => prev.includes(p));
      if (allSelected) return prev.filter((p) => !permIds.includes(p));
      return [...new Set([...prev, ...permIds])];
    });
  };

  const handleSave = async () => {
    if (!formName.trim() || !formCode.trim()) return;
    setSaving(true);
    setFormError('');
    try {
      if (modalMode === 'edit' && editingRole) {
        await updateRole.mutateAsync({ id: editingRole.id, payload: { name: formName.trim(), uiScope: formUiScope } });
        const originalPerms = [...editingRole.permissionIds].sort().join(',');
        const nextPerms = [...formPermIds].sort().join(',');
        if (originalPerms !== nextPerms) {
          await setRolePermissions.mutateAsync({ roleId: editingRole.id, payload: { permissionIds: formPermIds } });
        }
      } else {
        await createRole.mutateAsync({ code: formCode.trim().toUpperCase(), name: formName.trim(), uiScope: formUiScope, permissionIds: formPermIds });
      }
      setModalMode(null);
      setEditingRole(null);
    } catch (err) {
      setFormError(formatApiError(err, t('error.network')));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    deleteRole.mutate(id);
    setDeleteConfirm(null);
  };

  if ((rolesQuery.isLoading || treeQuery.isLoading) && !rolesQuery.data) {
    return (
      <div>
        <Header title={t('roles.title')} subtitle={''} showUser />
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
      <Header title={t('roles.title')} subtitle={`${roles.length} ${t('roles.roles_suffix')}`} showUser />

      <div className="p-6">
        {rolesQuery.isError && (
          <div className="bg-danger-50 border border-danger-200 rounded-2xl p-4 mb-6 flex items-center justify-between">
            <p className="text-sm text-danger-700">{t('error.unexpected')}</p>
            <button
              onClick={() => rolesQuery.refetch()}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition-colors"
            >
              {t('error.retry')}
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-surface rounded-2xl border border-border p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-text-primary leading-none">{roles.length}</p>
              <p className="text-xs text-text-muted mt-1">{t('roles.stat_roles')}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-surface rounded-2xl border border-border p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning-50 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-warning-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-text-primary leading-none">{users.length}</p>
              <p className="text-xs text-text-muted mt-1">{t('roles.stat_users')}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-surface rounded-2xl border border-border p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-success-50 flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5 text-success-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-text-primary leading-none">{roles.filter((r) => r.isSystem).length}</p>
              <p className="text-xs text-text-muted mt-1">{t('roles.stat_system')}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setPanelFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                panelFilter === 'all'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-border bg-surface-secondary text-text-secondary hover:border-primary-300'
              }`}
            >
              {t('common.all')}
            </button>
            {UI_SCOPE_OPTIONS.map((opt) => {
              const meta = panelMeta[opt.value];
              const Icon = meta.icon;
              const active = panelFilter === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setPanelFilter(active ? 'all' : opt.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    active
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-border bg-surface-secondary text-text-secondary hover:border-primary-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t(meta.labelKey)}
                </button>
              );
            })}
          </div>

          <button
            onClick={openAdd}
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-4 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-primary-200"
          >
            <Plus className="w-4 h-4" />
            {t('roles.new_role')}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRoles.map((role) => {
            const userCount = getUserCount(role.id);
            const meta = panelMeta[role.uiScope];
            const PanelIcon = meta.icon;
            return (
              <div
                key={role.id}
                className="bg-white dark:bg-surface rounded-2xl border border-border p-5 hover:shadow-lg hover:border-primary-200 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.iconBg}`}>
                      <PanelIcon className={`w-6 h-6 ${meta.iconColor}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-text-primary truncate">{role.name}</p>
                      <p className="text-xs text-text-muted font-mono mt-0.5">{role.code}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    {role.isSystem && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-secondary text-text-muted">
                        <Lock className="w-3 h-3" />
                        {t('roles.system_badge')}
                      </span>
                    )}
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.badgeCls}`}>
                      <PanelIcon className="w-3 h-3" />
                      {t(meta.labelKey)}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex flex-wrap gap-1.5">
                    {tree.map((module) => {
                      const modulePerms = module.uiGroups.flatMap((g) => g.permissions);
                      const activeCount = modulePerms.filter((p) => role.permissionIds.includes(p.id)).length;
                      if (activeCount === 0) return null;
                      return (
                        <span
                          key={module.id}
                          className="text-[10px] font-medium px-2 py-1 rounded-md bg-surface-secondary text-text-secondary"
                        >
                          {module.name} ({activeCount}/{modulePerms.length})
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4 pt-3 border-t border-border">
                  <span className="inline-flex items-center gap-1.5 text-xs text-text-muted">
                    <Users className="w-3.5 h-3.5" />
                    {userCount} {t('roles.users_suffix')}
                  </span>
                  <span className="text-xs text-text-muted">{role.permissions.length} {t('roles.permissions_suffix')}</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(role)}
                    disabled={role.isSystem}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-surface-secondary hover:bg-border text-text-secondary rounded-xl text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    {t('common.edit')}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(role.id)}
                    disabled={role.isSystem}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-danger-50 hover:bg-danger-100 text-danger-600 rounded-xl text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {t('common.delete')}
                  </button>
                </div>
              </div>
            );
          })}

          {filteredRoles.length === 0 && (
            <div className="col-span-full text-center py-16">
              <Shield className="w-12 h-12 mx-auto text-text-muted opacity-30 mb-3" />
              <p className="text-text-muted">{t('roles.no_roles')}</p>
            </div>
          )}
        </div>
      </div>

      {modalMode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setModalMode(null)}>
          <div
            className="bg-white dark:bg-surface rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <h3 className="text-lg font-bold text-text-primary">
                {modalMode === 'edit' ? t('roles.edit_role') : t('roles.add_role')}
              </h3>
              <button onClick={() => setModalMode(null)} className="p-1 hover:bg-surface-secondary rounded-lg">
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">{t('roles.code')}</label>
                  <input
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    disabled={modalMode === 'edit'}
                    className="w-full px-4 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                    placeholder="MES: CASHIER"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">{t('roles.role_name')}</label>
                  <input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder={t('roles.role_name_placeholder')}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">{t('roles.panel')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {UI_SCOPE_OPTIONS.map((opt) => {
                    const meta = panelMeta[opt.value];
                    const Icon = meta.icon;
                    const active = formUiScope === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setFormUiScope(opt.value)}
                        className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-sm font-medium border transition-all ${
                          active
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-border bg-surface-secondary text-text-secondary hover:border-primary-300'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${active ? 'text-primary-600' : 'text-text-muted'}`} />
                        {t(meta.labelKey)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {modalMode !== null && (
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">{t('roles.permissions')}</label>
                  <div className="space-y-3">
                    {tree.map((module) => {
                      const modulePermIds = module.uiGroups.flatMap((g) => g.permissions.map((p) => p.id));
                      const allSelected = modulePermIds.every((p) => formPermIds.includes(p));
                      const someSelected = modulePermIds.some((p) => formPermIds.includes(p));

                      return (
                        <div key={module.id} className="bg-surface-secondary rounded-xl p-3">
                          <button
                            onClick={() => toggleModule(modulePermIds)}
                            className="flex items-center gap-2 mb-2 w-full text-left"
                          >
                            <div
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                allSelected
                                  ? 'bg-primary-500 border-primary-500'
                                  : someSelected
                                  ? 'bg-primary-200 border-primary-400'
                                  : 'border-border bg-white dark:bg-surface'
                              }`}
                            >
                              {allSelected && <Check className="w-3 h-3 text-white" />}
                              {someSelected && !allSelected && <div className="w-2 h-0.5 bg-primary-600 rounded" />}
                            </div>
                            <span className="text-sm font-semibold text-text-primary">{module.name}</span>
                          </button>
                          <div className="space-y-2 pl-7">
                            {module.uiGroups.map((group) => (
                              <div key={group.id}>
                                <p className="text-xs font-medium text-text-muted mb-1">{group.name}</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {group.permissions.map((perm) => {
                                    const selected = formPermIds.includes(perm.id);
                                    return (
                                      <button
                                        key={perm.id}
                                        onClick={() => togglePermId(perm.id)}
                                        className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all ${
                                          selected
                                            ? 'bg-primary-50 border-primary-300 text-primary-700'
                                            : 'bg-white dark:bg-surface border-border text-text-muted hover:border-primary-200'
                                        }`}
                                      >
                                        {perm.name}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    {tree.length === 0 && (
                      <p className="text-sm text-text-muted text-center py-4">{t('roles.permissions_tree_error')}</p>
                    )}
                  </div>
                </div>
              )}

              {formError && (
                <p className="text-sm text-danger-600">{formError}</p>
              )}
            </div>

            <div className="px-6 pb-6 flex gap-3 shrink-0 pt-4 border-t border-border">
              <button
                onClick={() => setModalMode(null)}
                disabled={saving}
                className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors disabled:opacity-50"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={!formName.trim() || (modalMode === 'add' && !formCode.trim()) || saving}
                className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-text-muted text-white rounded-xl text-sm font-semibold transition-colors"
              >
                {saving ? '...' : modalMode === 'edit' ? t('common.save') : t('common.add')}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white dark:bg-surface rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <Trash2 className="w-10 h-10 mx-auto text-danger-500 mb-3" />
            <h3 className="text-lg font-bold text-text-primary mb-1">{t('roles.delete_confirmation')}</h3>
            <p className="text-sm text-text-secondary mb-5">{t('common.irreversible_warning')}</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors">{t('common.back')}</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 px-4 py-2.5 bg-danger-500 hover:bg-danger-600 text-white rounded-xl text-sm font-semibold transition-colors">{t('common.delete')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
