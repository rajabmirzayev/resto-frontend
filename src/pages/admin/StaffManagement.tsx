import { useState } from 'react';
import Header from '../../components/layout/Header';
import { useStore } from '../../store/useStore';
import type { User, UserRole } from '../../types';
import { Plus, Edit2, Trash2, X, Users, Shield, UtensilsCrossed, ChefHat } from 'lucide-react';
import { useTranslation } from '../../i18n';

type ModalMode = 'add' | 'edit' | null;

interface StaffForm {
  name: string;
  username: string;
  password: string;
  role: UserRole;
  roleId: string;
}

const emptyForm: StaffForm = { name: '', username: '', password: '', role: 'waiter', roleId: '' };

const iconMap: Record<string, typeof Shield> = {
  admin: Shield,
  waiter: UtensilsCrossed,
  chef: ChefHat,
};

export default function StaffManagement() {
  const { t } = useTranslation();
  const { users, orders, roles, addUser, updateUser, deleteUser } = useStore();
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<StaffForm>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const staff = users.filter((u) => u.role !== 'customer');
  const filtered = roleFilter === 'all' ? staff : staff.filter((u) => u.roleId === roleFilter);

  const getOrderCount = (userId: string) =>
    orders.filter((o) => o.waiterId === userId && !['completed', 'cancelled'].includes(o.status)).length;

  const getTotalRevenue = (userId: string) =>
    orders.filter((o) => o.waiterId === userId && o.paymentStatus === 'paid').reduce((s, o) => s + o.totalAmount, 0);

  const getRoleBadgeColor = (roleName: string) => {
    const colors = ['bg-primary-100 text-primary-700', 'bg-warning-100 text-warning-700', 'bg-success-100 text-success-700', 'bg-danger-100 text-danger-700', 'bg-primary-200 text-primary-800'];
    let hash = 0;
    for (let i = 0; i < roleName.length; i++) hash = roleName.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const openAdd = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setModalMode('add');
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setForm({ name: user.name, username: user.username, password: '', role: user.role, roleId: user.roleId });
    setModalMode('edit');
  };

  const handleSave = () => {
    if (!form.name || !form.username || (!editingUser && !form.password)) return;
    const selectedRole = roles.find((r) => r.id === form.roleId);
    if (modalMode === 'edit' && editingUser) {
      const updates: Partial<User> = { name: form.name, username: form.username, role: form.role, roleId: form.roleId };
      if (form.password) updates.password = form.password;
      updateUser(editingUser.id, updates);
    } else {
      addUser({ name: form.name, username: form.username, password: form.password, role: (selectedRole && (selectedRole.name.toLowerCase().includes('aşpaz') || selectedRole.name.toLowerCase().includes('chef')) ? 'chef' : 'waiter') as UserRole, roleId: form.roleId, avatar: '' });
    }
    setModalMode(null);
    setEditingUser(null);
    setForm(emptyForm);
  };

  const handleDelete = (id: string) => { deleteUser(id); setDeleteConfirm(null); };

  return (
    <div>
      <Header title={t('staff.title')} subtitle={`${staff.length} ${t('staff.staff_suffix')}`} showUser />

      <div className="p-6">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <button onClick={openAdd} className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-4 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-primary-200">
            <Plus className="w-4 h-4" />
            {t('staff.new_staff')}
          </button>

          <div className="flex gap-2 flex-wrap ml-auto">
            <button onClick={() => setRoleFilter('all')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${roleFilter === 'all' ? 'bg-primary-600 text-white' : 'bg-surface-secondary text-text-secondary hover:bg-border'}`}>
              {t('common.all')} ({staff.length})
            </button>
            {roles.map((role) => (
              <button key={role.id} onClick={() => setRoleFilter(role.id)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${roleFilter === role.id ? 'bg-primary-600 text-white' : 'bg-surface-secondary text-text-secondary hover:bg-border'}`}>
                {role.name} ({staff.filter((u) => u.roleId === role.id).length})
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((user) => {
            const role = roles.find((r) => r.id === user.roleId);
            const badgeColor = getRoleBadgeColor(role?.name || '');
            const Icon = iconMap[user.role] || Shield;
            const orderCount = getOrderCount(user.id);
            const revenue = getTotalRevenue(user.id);

            return (
              <div key={user.id} className="bg-white dark:bg-surface rounded-2xl border border-border p-5 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${badgeColor}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text-primary">{user.name}</p>
                      <p className="text-xs text-text-muted">@{user.username}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${badgeColor}`}>
                    {role?.name || t('common.unknown')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-surface-secondary rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-text-primary">{orderCount}</p>
                    <p className="text-[10px] text-text-muted">{t('staff.active_orders')}</p>
                  </div>
                  <div className="bg-surface-secondary rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-text-primary">{revenue} ₼</p>
                    <p className="text-[10px] text-text-muted">{t('staff.revenue')}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => openEdit(user)} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-surface-secondary hover:bg-border text-text-secondary rounded-xl text-xs font-medium transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                    {t('common.edit')}
                  </button>
                  <button onClick={() => setDeleteConfirm(user.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-danger-50 hover:bg-danger-100 text-danger-600 rounded-xl text-xs font-medium transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                    {t('common.delete')}
                  </button>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16">
              <Users className="w-12 h-12 mx-auto text-text-muted opacity-30 mb-3" />
              <p className="text-text-muted">{t('staff.no_staff_in_category')}</p>
            </div>
          )}
        </div>
      </div>

      {modalMode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setModalMode(null)}>
          <div className="bg-white dark:bg-surface rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-lg font-bold text-text-primary">{modalMode === 'edit' ? t('staff.edit_staff') : t('staff.add_staff')}</h3>
              <button onClick={() => setModalMode(null)} className="p-1 hover:bg-surface-secondary rounded-lg"><X className="w-5 h-5 text-text-muted" /></button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">{t('staff.full_name')}</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder={t('staff.full_name_placeholder')} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">{t('staff.username')}</label>
                  <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="w-full px-4 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="username" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">{t('common.password')}</label>
                  <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-4 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="••••••" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">{t('staff.role')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {roles.map((role) => {
                    const Icon = iconMap[role.name.toLowerCase()] || Shield;
                    return (
                      <button key={role.id} onClick={() => setForm({ ...form, roleId: role.id })} className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${form.roleId === role.id ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-border bg-surface-secondary text-text-secondary hover:border-primary-300'}`}>
                        <Icon className="w-4 h-4" />
                        {role.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setModalMode(null)} className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors">{t('common.cancel')}</button>
              <button onClick={handleSave} disabled={!form.name || !form.username || !form.roleId || (!editingUser && !form.password)} className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-text-muted text-white rounded-xl text-sm font-semibold transition-colors">
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
            <h3 className="text-lg font-bold text-text-primary mb-1">{t('staff.delete_confirmation')}</h3>
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
