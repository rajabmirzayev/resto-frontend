import { useState } from 'react';
import Header from '../../components/layout/Header';
import { useStore } from '../../store/useStore';
import type { Permission, Role } from '../../types';
import { PERMISSION_GROUPS } from '../../types';
import { Plus, Edit2, Trash2, X, Shield, Check, Lock } from 'lucide-react';
import { useTranslation } from '../../i18n';

type ModalMode = 'add' | 'edit' | null;

export default function RoleManagement() {
  const { t } = useTranslation();
  const { roles, addRole, updateRole, deleteRole, users } = useStore();
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formName, setFormName] = useState('');
  const [formPermissions, setFormPermissions] = useState<Permission[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const getUserCount = (roleId: string) => users.filter((u) => u.roleId === roleId).length;

  const openAdd = () => {
    setEditingRole(null);
    setFormName('');
    setFormPermissions([]);
    setModalMode('add');
  };

  const openEdit = (role: Role) => {
    setEditingRole(role);
    setFormName(role.name);
    setFormPermissions([...role.permissions]);
    setModalMode('edit');
  };

  const togglePermission = (perm: Permission) => {
    setFormPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const toggleGroup = (perms: Permission[]) => {
    setFormPermissions((prev) => {
      const allSelected = perms.every((p) => prev.includes(p));
      if (allSelected) return prev.filter((p) => !perms.includes(p));
      return [...new Set([...prev, ...perms])];
    });
  };

  const handleSave = () => {
    if (!formName.trim()) return;
    if (modalMode === 'edit' && editingRole) {
      updateRole(editingRole.id, { name: formName.trim(), permissions: formPermissions });
    } else {
      addRole({ name: formName.trim(), permissions: formPermissions, isSystem: false });
    }
    setModalMode(null);
    setEditingRole(null);
  };

  const handleDelete = (id: string) => {
    deleteRole(id);
    setDeleteConfirm(null);
  };

  return (
    <div>
      <Header title={t('roles.title')} subtitle={`${roles.length} ${t('roles.roles_suffix')}`} showUser />

      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={openAdd}
            className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-4 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-primary-200"
          >
            <Plus className="w-4 h-4" />
            {t('roles.new_role')}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => {
            const userCount = getUserCount(role.id);
            return (
              <div
                key={role.id}
                className="bg-white dark:bg-surface rounded-2xl border border-border p-5 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${role.isSystem ? 'bg-primary-100 text-primary-700' : 'bg-surface-secondary text-text-muted'}`}>
                      {role.isSystem ? <Lock className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text-primary">{role.name}</p>
                      <p className="text-xs text-text-muted">{role.permissions.length} {t('roles.permissions_suffix')}</p>
                    </div>
                  </div>
                  {role.isSystem && (
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-primary-50 text-primary-600">
                      {t('roles.system')}
                    </span>
                  )}
                </div>

                <div className="mb-4">
                  <div className="flex flex-wrap gap-1.5">
                    {PERMISSION_GROUPS.map((group) => {
                      const groupPerms = group.permissions.map((p) => p.key);
                      const activeCount = groupPerms.filter((p) => role.permissions.includes(p)).length;
                      if (activeCount === 0) return null;
                      return (
                        <span
                          key={group.label}
                          className="text-[10px] font-medium px-2 py-1 rounded-md bg-surface-secondary text-text-secondary"
                        >
                          {group.label} ({activeCount}/{group.permissions.length})
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-text-muted">{userCount} {t('roles.users_suffix')}</span>
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

          {roles.length === 0 && (
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
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">{t('roles.role_name')}</label>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder={t('roles.role_name_placeholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">{t('roles.permissions')}</label>
                <div className="space-y-3">
                  {PERMISSION_GROUPS.map((group) => {
                    const groupPerms = group.permissions.map((p) => p.key);
                    const allSelected = groupPerms.every((p) => formPermissions.includes(p));
                    const someSelected = groupPerms.some((p) => formPermissions.includes(p));

                    return (
                      <div key={group.label} className="bg-surface-secondary rounded-xl p-3">
                        <button
                          onClick={() => toggleGroup(groupPerms)}
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
                          <span className="text-sm font-semibold text-text-primary">{group.label}</span>
                        </button>
                        <div className="flex flex-wrap gap-1.5 pl-7">
                          {group.permissions.map((perm) => {
                            const selected = formPermissions.includes(perm.key);
                            return (
                              <button
                                key={perm.key}
                                onClick={() => togglePermission(perm.key)}
                                className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all ${
                                  selected
                                    ? 'bg-primary-50 border-primary-300 text-primary-700'
                                    : 'bg-white dark:bg-surface border-border text-text-muted hover:border-primary-200'
                                }`}
                              >
                                {perm.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3 shrink-0 pt-4 border-t border-border">
              <button
                onClick={() => setModalMode(null)}
                className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={!formName.trim()}
                className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-text-muted text-white rounded-xl text-sm font-semibold transition-colors"
              >
                {modalMode === 'edit' ? t('common.save') : t('common.add')}
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
