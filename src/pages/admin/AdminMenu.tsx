import { useState } from 'react';
import Header from '../../components/layout/Header';
import { useStore } from '../../store/useStore';
import type { MenuItem, MenuCategory } from '../../types';
import { Plus, Edit2, Trash2, Eye, EyeOff, X, Tag } from 'lucide-react';

type ModalMode = 'add-item' | 'edit-item' | 'add-category' | 'edit-category' | null;

interface ItemForm {
  name: string;
  description: string;
  price: number;
  category: string;
  preparationTime: number;
  isAvailable: boolean;
}

const emptyItemForm: ItemForm = { name: '', description: '', price: 0, category: '', preparationTime: 15, isAvailable: true };

export default function AdminMenu() {
  const { menuItems, menuCategories, addMenuItem, updateMenuItem, deleteMenuItem, addMenuCategory, updateMenuCategory, deleteMenuCategory } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemForm, setItemForm] = useState<ItemForm>(emptyItemForm);
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('utensils');
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [deleteItemConfirm, setDeleteItemConfirm] = useState<string | null>(null);
  const [deleteCatConfirm, setDeleteCatConfirm] = useState<MenuCategory | null>(null);
  const [deleteCatMoveTo, setDeleteCatMoveTo] = useState('');

  const filtered = selectedCategory === 'all'
    ? menuItems
    : menuItems.filter((m) => m.category === selectedCategory);

  const openAddItem = () => {
    setEditingItem(null);
    setItemForm({ ...emptyItemForm, category: selectedCategory === 'all' ? menuCategories[0]?.id || '' : selectedCategory });
    setModalMode('add-item');
  };

  const openEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setItemForm({ name: item.name, description: item.description, price: item.price, category: item.category, preparationTime: item.preparationTime, isAvailable: item.isAvailable });
    setModalMode('edit-item');
  };

  const handleSaveItem = () => {
    if (!itemForm.name || !itemForm.category || itemForm.price <= 0) return;
    if (modalMode === 'edit-item' && editingItem) {
      updateMenuItem(editingItem.id, itemForm);
    } else {
      addMenuItem(itemForm);
    }
    setModalMode(null);
    setEditingItem(null);
    setItemForm(emptyItemForm);
  };

  const openAddCategory = () => {
    setEditingCategory(null);
    setCatName('');
    setCatIcon('utensils');
    setModalMode('add-category');
  };

  const openEditCategory = (cat: MenuCategory) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatIcon(cat.icon);
    setModalMode('edit-category');
  };

  const handleSaveCategory = () => {
    if (!catName.trim()) return;
    if (modalMode === 'edit-category' && editingCategory) {
      updateMenuCategory(editingCategory.id, { name: catName.trim(), icon: catIcon });
    } else {
      addMenuCategory({ name: catName.trim(), icon: catIcon });
    }
    setModalMode(null);
    setEditingCategory(null);
    setCatName('');
    setCatIcon('utensils');
  };

  const openDeleteCategory = (cat: MenuCategory) => {
    const itemsInCat = menuItems.filter((m) => m.category === cat.id);
    setDeleteCatConfirm(cat);
    setDeleteCatMoveTo(itemsInCat.length > 0 ? (menuCategories.find((c) => c.id !== cat.id)?.id || '') : '');
  };

  const handleDeleteCategory = () => {
    if (!deleteCatConfirm) return;
    const itemsInCat = menuItems.filter((m) => m.category === deleteCatConfirm.id);
    if (itemsInCat.length > 0 && deleteCatMoveTo) {
      itemsInCat.forEach((item) => updateMenuItem(item.id, { category: deleteCatMoveTo }));
    } else if (itemsInCat.length > 0) {
      itemsInCat.forEach((item) => deleteMenuItem(item.id));
    }
    deleteMenuCategory(deleteCatConfirm.id);
    if (selectedCategory === deleteCatConfirm.id) setSelectedCategory('all');
    setDeleteCatConfirm(null);
    setDeleteCatMoveTo('');
  };

  const handleDeleteItem = (id: string) => {
    deleteMenuItem(id);
    setDeleteItemConfirm(null);
  };

  return (
    <div>
      <Header title="Menyu İdarəetməsi" subtitle={`${menuItems.length} məhsul, ${menuCategories.length} kateqoriya`} showUser />

      <div className="p-6">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <button onClick={openAddItem} className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-4 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-primary-200">
            <Plus className="w-4 h-4" />
            Yeni Məhsul
          </button>
          <button onClick={openAddCategory} className="bg-surface-secondary hover:bg-border text-text-secondary font-medium py-2.5 px-4 rounded-xl transition-all flex items-center gap-2 border border-border">
            <Tag className="w-4 h-4" />
            Yeni Kateqoriya
          </button>

          <div className="flex gap-2 flex-wrap ml-auto">
            <button onClick={() => setSelectedCategory('all')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedCategory === 'all' ? 'bg-primary-600 text-white' : 'bg-surface-secondary text-text-secondary hover:bg-border'}`}>
              Hamısı ({menuItems.length})
            </button>
            {menuCategories.map((cat) => {
              const count = menuItems.filter((m) => m.category === cat.id).length;
              const isActive = selectedCategory === cat.id;
              return (
                <div key={cat.id} className={`flex items-center gap-1 rounded-lg transition-colors group/cat ${isActive ? 'bg-primary-600' : 'bg-surface-secondary hover:bg-border'}`}>
                  <button onClick={() => setSelectedCategory(cat.id)} className={`px-3 py-1.5 text-sm font-medium ${isActive ? 'text-white' : 'text-text-secondary'}`}>
                    {cat.name} ({count})
                  </button>
                  <div className={`flex items-center pr-1.5 gap-0.5 opacity-0 group-hover/cat:opacity-100 transition-opacity ${isActive ? '' : ''}`}>
                    <button
                      onClick={(e) => { e.stopPropagation(); openEditCategory(cat); }}
                      className={`p-0.5 rounded transition-colors ${isActive ? 'hover:bg-white dark:bg-surface/20 text-white' : 'hover:bg-primary-100 text-text-muted hover:text-primary-600'}`}
                      title="Redaktə"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); openDeleteCategory(cat); }}
                      className={`p-0.5 rounded transition-colors ${isActive ? 'hover:bg-white dark:bg-surface/20 text-white' : 'hover:bg-danger-100 text-text-muted hover:text-danger-600'}`}
                      title="Sil"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-surface rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-border bg-surface-secondary">
                  <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-6 py-3">Məhsul</th>
                  <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-6 py-3">Kateqoriya</th>
                  <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-6 py-3">Qiymət</th>
                  <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-6 py-3">Vaxt</th>
                  <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-6 py-3">Status</th>
                  <th className="text-right text-xs font-semibold text-text-secondary uppercase tracking-wider px-6 py-3">Əməliyyatlar</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const cat = menuCategories.find((c) => c.id === item.category);
                  return (
                    <tr key={item.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-text-primary">{item.name}</p>
                        <p className="text-xs text-text-muted mt-0.5 truncate max-w-[200px]">{item.description}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full font-medium">{cat?.name || 'Naməlum'}</span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-text-primary">{item.price} ₼</td>
                      <td className="px-6 py-4 text-sm text-text-secondary">{item.preparationTime} dəq</td>
                      <td className="px-6 py-4">
                        <button onClick={() => updateMenuItem(item.id, { isAvailable: !item.isAvailable })} className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${item.isAvailable ? 'bg-success-50 text-success-600' : 'bg-danger-50 text-danger-600'}`}>
                          {item.isAvailable ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          {item.isAvailable ? 'Aktiv' : 'Gizli'}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEditItem(item)} className="p-1.5 hover:bg-primary-50 rounded-lg transition-colors text-text-secondary hover:text-primary-600">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteItemConfirm(item.id)} className="p-1.5 hover:bg-danger-50 rounded-lg transition-colors text-text-secondary hover:text-danger-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-text-muted">Bu kateqoriyada məhsul yoxdur</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Item Add / Edit Modal */}
      {(modalMode === 'add-item' || modalMode === 'edit-item') && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setModalMode(null)}>
          <div className="bg-white dark:bg-surface rounded-2xl w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-lg font-bold text-text-primary">{modalMode === 'edit-item' ? 'Məhsulu Redaktə Et' : 'Yeni Məhsul Əlavə Et'}</h3>
              <button onClick={() => setModalMode(null)} className="p-1 hover:bg-surface-secondary rounded-lg"><X className="w-5 h-5 text-text-muted" /></button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Ad</label>
                <input value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} className="w-full px-4 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Məhsul adı" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Təsvir</label>
                <textarea value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} className="w-full px-4 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" rows={2} placeholder="Qısa təsvir" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Qiymət (₼)</label>
                  <input type="number" value={itemForm.price || ''} onChange={(e) => setItemForm({ ...itemForm, price: Number(e.target.value) })} className="w-full px-4 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" min={0} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Hazırlıq (dəq)</label>
                  <input type="number" value={itemForm.preparationTime || ''} onChange={(e) => setItemForm({ ...itemForm, preparationTime: Number(e.target.value) })} className="w-full px-4 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" min={1} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Kateqoriya</label>
                <select value={itemForm.category} onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })} className="w-full appearance-none px-4 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="">Seçin...</option>
                  {menuCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-text-secondary">Status:</label>
                <button onClick={() => setItemForm({ ...itemForm, isAvailable: !itemForm.isAvailable })} className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${itemForm.isAvailable ? 'bg-success-50 text-success-600' : 'bg-danger-50 text-danger-600'}`}>
                  {itemForm.isAvailable ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  {itemForm.isAvailable ? 'Aktiv' : 'Gizli'}
                </button>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setModalMode(null)} className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors">Ləğv</button>
              <button onClick={handleSaveItem} disabled={!itemForm.name || !itemForm.category || itemForm.price <= 0} className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-text-muted text-white rounded-xl text-sm font-semibold transition-colors">
                {modalMode === 'edit-item' ? 'Yadda Saxla' : 'Əlavə Et'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Add / Edit Modal */}
      {(modalMode === 'add-category' || modalMode === 'edit-category') && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setModalMode(null)}>
          <div className="bg-white dark:bg-surface rounded-2xl w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-lg font-bold text-text-primary">{modalMode === 'edit-category' ? 'Kateqoriyanı Redaktə Et' : 'Yeni Kateqoriya'}</h3>
              <button onClick={() => setModalMode(null)} className="p-1 hover:bg-surface-secondary rounded-lg"><X className="w-5 h-5 text-text-muted" /></button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Kateqoriya Adı</label>
                <input value={catName} onChange={(e) => setCatName(e.target.value)} className="w-full px-4 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Məs: Şorbalar" />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">İkon</label>
                <input value={catIcon} onChange={(e) => setCatIcon(e.target.value)} className="w-full px-4 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Məs: soup, beef, salad" />
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setModalMode(null)} className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors">Ləğv</button>
              <button onClick={handleSaveCategory} disabled={!catName.trim()} className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-text-muted text-white rounded-xl text-sm font-semibold transition-colors">
                {modalMode === 'edit-category' ? 'Yadda Saxla' : 'Əlavə Et'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Delete Confirmation */}
      {deleteCatConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDeleteCatConfirm(null)}>
          <div className="bg-white dark:bg-surface rounded-2xl w-full max-w-md shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-5">
              <Trash2 className="w-10 h-10 mx-auto text-danger-500 mb-3" />
              <h3 className="text-lg font-bold text-text-primary mb-1">"{deleteCatConfirm.name}" kateqoriyası silinsin?</h3>
              <p className="text-sm text-text-secondary">
                Bu kateqoriyada {menuItems.filter((m) => m.category === deleteCatConfirm.id).length} məhsul var.
              </p>
            </div>
            {menuItems.filter((m) => m.category === deleteCatConfirm.id).length > 0 && (
              <div className="mb-5">
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Məhsulları köçür:</label>
                <select
                  value={deleteCatMoveTo}
                  onChange={(e) => setDeleteCatMoveTo(e.target.value)}
                  className="w-full appearance-none px-4 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Hamısını sil</option>
                  {menuCategories.filter((c) => c.id !== deleteCatConfirm.id).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <p className="text-xs text-text-muted mt-1">Seçilməzsə bütün məhsullar silinəcək</p>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setDeleteCatConfirm(null)} className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors">Geri</button>
              <button onClick={handleDeleteCategory} className="flex-1 px-4 py-2.5 bg-danger-500 hover:bg-danger-600 text-white rounded-xl text-sm font-semibold transition-colors">Sil</button>
            </div>
          </div>
        </div>
      )}

      {/* Item Delete Confirmation */}
      {deleteItemConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDeleteItemConfirm(null)}>
          <div className="bg-white dark:bg-surface rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <Trash2 className="w-10 h-10 mx-auto text-danger-500 mb-3" />
            <h3 className="text-lg font-bold text-text-primary mb-1">Silmək istəyirsiniz?</h3>
            <p className="text-sm text-text-secondary mb-5">Bu əməliyyat geri alına bilməz.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteItemConfirm(null)} className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors">Geri</button>
              <button onClick={() => handleDeleteItem(deleteItemConfirm)} className="flex-1 px-4 py-2.5 bg-danger-500 hover:bg-danger-600 text-white rounded-xl text-sm font-semibold transition-colors">Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
