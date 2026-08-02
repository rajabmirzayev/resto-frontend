import { useState, type ChangeEvent } from 'react';
import Header from '../../components/layout/Header';
import { useStore } from '../../store/useStore';
import {
  Plus, Edit2, Trash2, Eye, EyeOff, X, Tag, ImagePlus, Camera, Loader2, Search, LayoutGrid, Utensils,
  Soup, Beef, Salad, Pizza, Hamburger, Sandwich, CupSoda, Coffee, Milk, Wine, Martini, GlassWater, Beer,
  Cake, Cookie, Donut, Croissant, IceCreamCone, IceCreamBowl, Popcorn, Apple, Cherry, Grape, Carrot,
  Fish, Drumstick, Egg, ChefHat, UtensilsCrossed,
} from 'lucide-react';
import { useTranslation } from '../../i18n';
import { localize } from '../../utils/localize';
import { useToast } from '../../store/useToast';
import {
  useMenuItems, useMenuCategories, useCreateMenuItem, useUpdateMenuItem, useDeleteMenuItem,
  useUploadItemImage, useDeleteItemImage, useCreateMenuCategory, useUpdateMenuCategory, useDeleteMenuCategory,
} from '../../api/hooks/useMenu';
import { ApiError } from '../../api/client';
import type { MenuItemDto, MenuCategoryDto, CreateMenuItemRequest } from '../../api/types';
import {
  MENU_LIMITS, MENU_ICONS, MENU_IMAGE_TYPES,
  hasControlCharacters, isBlank, isValidLocalizedValue, isValidPrice, isValidPrepTime, isValidImageUrl, isValidIcon,
} from '../../lib/validation';

type ModalMode = 'add-item' | 'edit-item' | 'add-category' | 'edit-category' | null;

interface ItemForm {
  nameAz: string;
  nameEn: string;
  nameRu: string;
  descAz: string;
  descEn: string;
  descRu: string;
  price: number;
  category: string;
  preparationTime: number;
  isAvailable: boolean;
  image: string;
}

const emptyItemForm: ItemForm = { nameAz: '', nameEn: '', nameRu: '', descAz: '', descEn: '', descRu: '', price: 0, category: '', preparationTime: 15, isAvailable: true, image: '' };

const ITEM_FIELD_MAP: Record<string, string> = {
  'name.az': 'nameAz',
  'name.en': 'nameEn',
  'name.ru': 'nameRu',
  'description.az': 'descAz',
  'description.en': 'descEn',
  'description.ru': 'descRu',
  categoryId: 'category',
  imageUrl: 'image',
  preparationTime: 'preparationTime',
};

const CAT_FIELD_MAP: Record<string, string> = {
  'name.az': 'catNameAz',
  'name.en': 'catNameEn',
  'name.ru': 'catNameRu',
  icon: 'catIcon',
  sortOrder: '_form',
};

const MENU_ERROR_KEYS: Record<string, string> = {
  MENU_MS_1000: 'error.menu.validation',
  MENU_MS_3001: 'error.menu.category_not_found',
  MENU_MS_3002: 'error.menu.item_not_found',
  MENU_MS_3003: 'error.menu.access_denied',
  MENU_MS_3004: 'error.menu.category_self_move',
};

const ICON_MAP = {
  soup: Soup,
  beef: Beef,
  salad: Salad,
  pizza: Pizza,
  hamburger: Hamburger,
  sandwich: Sandwich,
  'cup-soda': CupSoda,
  coffee: Coffee,
  milk: Milk,
  wine: Wine,
  martini: Martini,
  'glass-water': GlassWater,
  beer: Beer,
  cake: Cake,
  cookie: Cookie,
  donut: Donut,
  croissant: Croissant,
  'ice-cream-cone': IceCreamCone,
  'ice-cream-bowl': IceCreamBowl,
  popcorn: Popcorn,
  apple: Apple,
  cherry: Cherry,
  grape: Grape,
  carrot: Carrot,
  fish: Fish,
  drumstick: Drumstick,
  egg: Egg,
  'chef-hat': ChefHat,
  utensils: Utensils,
  'utensils-crossed': UtensilsCrossed,
} as const;

function CategoryIcon({ icon, className }: { icon?: string | null; className?: string }) {
  const Icon = (icon && ICON_MAP[icon as keyof typeof ICON_MAP]) || Utensils;
  return <Icon className={className} />;
}

const inputClass = (hasError: boolean): string =>
  `flex-1 px-4 py-2.5 bg-surface-secondary border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${hasError ? 'border-danger-400' : 'border-border'}`;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-danger-600 mt-1 ml-9">{message}</p>;
}

export default function AdminMenu() {
  const { t, locale } = useTranslation();
  const { addToast } = useToast();
  const currentUser = useStore((s) => s.currentUser);
  const orgId = currentUser?.orgId;

  const itemsQuery = useMenuItems(orgId);
  const categoriesQuery = useMenuCategories(orgId);
  const createItem = useCreateMenuItem(orgId);
  const updateItem = useUpdateMenuItem(orgId);
  const deleteItem = useDeleteMenuItem(orgId);
  const uploadImage = useUploadItemImage();
  const deleteImage = useDeleteItemImage();
  const createCategory = useCreateMenuCategory(orgId);
  const updateCategory = useUpdateMenuCategory(orgId);
  const deleteCategory = useDeleteMenuCategory(orgId);

  const menuItems = itemsQuery.data ?? [];
  const menuCategories = categoriesQuery.data ?? [];

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingItem, setEditingItem] = useState<MenuItemDto | null>(null);
  const [itemForm, setItemForm] = useState<ItemForm>(emptyItemForm);
  const [itemImageFile, setItemImageFile] = useState<File | null>(null);
  const [itemErrors, setItemErrors] = useState<Record<string, string>>({});
  const [catNameAz, setCatNameAz] = useState('');
  const [catNameEn, setCatNameEn] = useState('');
  const [catNameRu, setCatNameRu] = useState('');
  const [catIcon, setCatIcon] = useState('utensils');
  const [editingCategory, setEditingCategory] = useState<MenuCategoryDto | null>(null);
  const [catErrors, setCatErrors] = useState<Record<string, string>>({});
  const [deleteItemConfirm, setDeleteItemConfirm] = useState<string | null>(null);
  const [deleteCatConfirm, setDeleteCatConfirm] = useState<MenuCategoryDto | null>(null);
  const [deleteCatMoveTo, setDeleteCatMoveTo] = useState('');

  const query = search.trim().toLowerCase();
  const filtered = menuItems.filter((m) => {
    if (selectedCategory !== 'all' && m.categoryId !== selectedCategory) return false;
    if (!query) return true;
    const cat = menuCategories.find((c) => c.id === m.categoryId);
    return (
      localize(m.name, locale).toLowerCase().includes(query) ||
      localize(m.description, locale).toLowerCase().includes(query) ||
      (cat ? localize(cat.name, locale).toLowerCase().includes(query) : false)
    );
  });

  const isSavingItem = createItem.isPending || updateItem.isPending || uploadImage.isPending || deleteImage.isPending;
  const isSavingCategory = createCategory.isPending || updateCategory.isPending;

  const translateFieldError = (field: string, message: string): string => {
    const lower = message.toLowerCase();
    const maxMatch = message.match(/(\d+)\s+characters/);
    const max = maxMatch?.[1];
    if (lower.includes('must be provided for locale')) {
      return t('validation.name.required');
    }
    if (lower.includes('must not exceed')) {
      if (field.startsWith('name')) return t('validation.name.max_length', { max: max ?? MENU_LIMITS.nameMax });
      if (field.startsWith('description')) return t('validation.desc.max_length', { max: max ?? MENU_LIMITS.descriptionMax });
      return t('validation.name.max_length', { max: max ?? MENU_LIMITS.nameMax });
    }
    if (lower.includes('must not contain null characters')) {
      return field.startsWith('name') ? t('validation.name.invalid_char') : t('validation.desc.invalid_char');
    }
    if (lower.includes('control characters')) return t('validation.icon.control_char');
    if (field === 'preparationTime') {
      if (lower.includes('less than or equal')) return t('validation.prep_time.max', { max: MENU_LIMITS.prepTimeMax });
      if (lower.includes('greater than or equal')) return t('validation.prep_time.negative');
    }
    if (lower.includes('must not be null')) {
      if (field.includes('name')) return t('validation.name.required');
      if (field.includes('price')) return t('validation.price.required');
      if (field.includes('category')) return t('validation.category.required');
      return t('error.menu.validation');
    }
    if (lower.includes('numeric value out of bounds')) return t('validation.price.digits');
    if (lower.includes('must be greater than 0') || lower.includes('positive')) {
      return t('validation.price.positive');
    }
    if (lower.includes('must be a valid http') || lower.includes('url')) return t('validation.image_url.invalid');
    return message;
  };

  const handleApiError = (err: unknown, setErrors: (errors: Record<string, string>) => void, fieldMap: Record<string, string>) => {
    if (err instanceof ApiError) {
      if (err.fieldErrors && err.fieldErrors.length > 0) {
        const fieldErrors: Record<string, string> = {};
        for (const fe of err.fieldErrors) {
          fieldErrors[fieldMap[fe.field] ?? fe.field] = translateFieldError(fe.field, fe.message);
        }
        setErrors(fieldErrors);
        return;
      }
      if (err.key && MENU_ERROR_KEYS[err.key]) {
        setErrors({ _form: t(MENU_ERROR_KEYS[err.key]) });
        return;
      }
      setErrors({ _form: err.detail || t('error.unexpected') });
      return;
    }
    setErrors({ _form: t('error.network') });
  };

  const getErrorMessage = (err: unknown, fallback: string): string => {
    if (err instanceof ApiError) {
      if (err.key && MENU_ERROR_KEYS[err.key]) return t(MENU_ERROR_KEYS[err.key]);
      if (err.detail) return err.detail;
      return fallback;
    }
    return t('error.network');
  };

  const validateItemForm = (form: ItemForm): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (isBlank(form.nameAz)) {
      errors.nameAz = t('validation.name.required');
    } else if (!isValidLocalizedValue(form.nameAz, MENU_LIMITS.nameMax)) {
      errors.nameAz = t('validation.name.max_length', { max: MENU_LIMITS.nameMax });
    }
    if (hasControlCharacters(form.nameAz)) errors.nameAz = t('validation.name.invalid_char');
    if (form.nameEn && !isValidLocalizedValue(form.nameEn, MENU_LIMITS.nameMax)) errors.nameEn = t('validation.name.max_length', { max: MENU_LIMITS.nameMax });
    if (form.nameEn && hasControlCharacters(form.nameEn)) errors.nameEn = t('validation.name.invalid_char');
    if (form.nameRu && !isValidLocalizedValue(form.nameRu, MENU_LIMITS.nameMax)) errors.nameRu = t('validation.name.max_length', { max: MENU_LIMITS.nameMax });
    if (form.nameRu && hasControlCharacters(form.nameRu)) errors.nameRu = t('validation.name.invalid_char');
    const checkDesc = (value: string, key: keyof ItemForm) => {
      if (value && !isValidLocalizedValue(value, MENU_LIMITS.descriptionMax)) errors[key] = t('validation.desc.max_length', { max: MENU_LIMITS.descriptionMax });
      if (value && hasControlCharacters(value)) errors[key] = t('validation.desc.invalid_char');
    };
    checkDesc(form.descAz, 'descAz');
    checkDesc(form.descEn, 'descEn');
    checkDesc(form.descRu, 'descRu');
    if (form.price === 0 || form.price === null) {
      errors.price = t('validation.price.required');
    } else if (!isValidPrice(form.price)) {
      errors.price = form.price < 0 ? t('validation.price.positive') : t('validation.price.digits');
    }
    if (!form.category) errors.category = t('validation.category.required');
    if (!Number.isFinite(form.preparationTime) || form.preparationTime < 0) {
      errors.preparationTime = t('validation.prep_time.negative');
    } else if (!isValidPrepTime(form.preparationTime)) {
      errors.preparationTime = t('validation.prep_time.max', { max: MENU_LIMITS.prepTimeMax });
    }
    if (form.image && !form.image.startsWith('data:') && !isValidImageUrl(form.image)) {
      errors.image = t('validation.image_url.invalid');
    }
    return errors;
  };

  const validateCategoryForm = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (isBlank(catNameAz)) {
      errors.catNameAz = t('validation.name.required');
    } else if (!isValidLocalizedValue(catNameAz, MENU_LIMITS.nameMax)) {
      errors.catNameAz = t('validation.name.max_length', { max: MENU_LIMITS.nameMax });
    }
    if (hasControlCharacters(catNameAz)) errors.catNameAz = t('validation.name.invalid_char');
    if (catNameEn && !isValidLocalizedValue(catNameEn, MENU_LIMITS.nameMax)) errors.catNameEn = t('validation.name.max_length', { max: MENU_LIMITS.nameMax });
    if (catNameEn && hasControlCharacters(catNameEn)) errors.catNameEn = t('validation.name.invalid_char');
    if (catNameRu && !isValidLocalizedValue(catNameRu, MENU_LIMITS.nameMax)) errors.catNameRu = t('validation.name.max_length', { max: MENU_LIMITS.nameMax });
    if (catNameRu && hasControlCharacters(catNameRu)) errors.catNameRu = t('validation.name.invalid_char');
    if (!isValidIcon(catIcon)) {
      errors.catIcon = catIcon.length > MENU_LIMITS.iconMax
        ? t('validation.icon.max_length', { max: MENU_LIMITS.iconMax })
        : t('validation.icon.control_char');
    }
    return errors;
  };

  const openAddItem = () => {
    setEditingItem(null);
    setItemForm({ ...emptyItemForm, category: selectedCategory === 'all' ? menuCategories[0]?.id || '' : selectedCategory });
    setItemImageFile(null);
    setItemErrors({});
    setModalMode('add-item');
  };

  const openEditItem = (item: MenuItemDto) => {
    setEditingItem(item);
    setItemForm({
      nameAz: item.name.az,
      nameEn: item.name.en,
      nameRu: item.name.ru,
      descAz: item.description.az,
      descEn: item.description.en,
      descRu: item.description.ru,
      price: item.price,
      category: item.categoryId,
      preparationTime: item.preparationTime,
      isAvailable: item.isAvailable,
      image: item.imageUrl || '',
    });
    setItemImageFile(null);
    setItemErrors({});
    setModalMode('edit-item');
  };

  const closeItemModal = () => {
    setModalMode(null);
    setEditingItem(null);
    setItemForm({ ...emptyItemForm });
    setItemImageFile(null);
    setItemErrors({});
  };

  const closeCatModal = () => {
    setModalMode(null);
    setEditingCategory(null);
    setCatNameAz('');
    setCatNameEn('');
    setCatNameRu('');
    setCatIcon('utensils');
    setCatErrors({});
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MENU_LIMITS.imageMaxSizeBytes) {
      addToast(t('menu_management.image_too_large'), 'error');
      return;
    }
    if (!(MENU_IMAGE_TYPES as readonly string[]).includes(file.type)) {
      addToast(t('menu_management.image_invalid_type'), 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setItemForm((prev) => ({ ...prev, image: reader.result as string }));
      setItemImageFile(file);
      setItemErrors((prev) => ({ ...prev, image: '' }));
    };
    reader.onerror = () => {
      addToast(t('error.file_upload_failed'), 'error');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveItem = async () => {
    const errors = validateItemForm(itemForm);
    if (Object.keys(errors).length > 0) {
      setItemErrors(errors);
      return;
    }
    setItemErrors({});
    const isNewImage = !!itemImageFile;
    const removeExistingImage = modalMode === 'edit-item' && !!editingItem?.imageUrl && !itemForm.image && !itemImageFile;
    const localizedName = { az: itemForm.nameAz, en: itemForm.nameEn || itemForm.nameAz, ru: itemForm.nameRu || itemForm.nameAz };
    const allDescEmpty = !itemForm.descAz.trim() && !itemForm.descEn.trim() && !itemForm.descRu.trim();
    const localizedDesc = allDescEmpty
      ? null
      : {
          az: itemForm.descAz.trim() || itemForm.descEn.trim() || itemForm.descRu.trim(),
          en: itemForm.descEn.trim() || itemForm.descAz.trim(),
          ru: itemForm.descRu.trim() || itemForm.descAz.trim(),
        };
    const payload = {
      name: localizedName,
      price: itemForm.price,
      categoryId: itemForm.category,
      preparationTime: itemForm.preparationTime,
      isAvailable: itemForm.isAvailable,
      imageUrl: itemForm.image && !isNewImage ? itemForm.image : undefined,
      description: localizedDesc,
    };
    const isEdit = modalMode === 'edit-item' && !!editingItem;
    try {
      const res = isEdit
        ? await updateItem.mutateAsync({ id: editingItem.id, payload })
        : await createItem.mutateAsync({ ...payload, orgId: orgId ?? '' } as CreateMenuItemRequest);
      if (itemImageFile) {
        try {
          await uploadImage.mutateAsync({ id: res.data.id, file: itemImageFile });
        } catch {
          addToast(t('menu_management.error.upload_image'), 'error');
        }
      } else if (removeExistingImage) {
        try {
          await deleteImage.mutateAsync(res.data.id);
        } catch {
          addToast(t('menu_management.error.upload_image'), 'error');
        }
      }
      addToast(isEdit ? t('menu_management.item_updated') : t('menu_management.item_added'), 'success');
      closeItemModal();
    } catch (err) {
      handleApiError(err, setItemErrors, ITEM_FIELD_MAP);
    }
  };

  const openAddCategory = () => {
    setEditingCategory(null);
    setCatNameAz('');
    setCatNameEn('');
    setCatNameRu('');
    setCatIcon('utensils');
    setCatErrors({});
    setModalMode('add-category');
  };

  const openEditCategory = (cat: MenuCategoryDto) => {
    setEditingCategory(cat);
    setCatNameAz(cat.name.az);
    setCatNameEn(cat.name.en);
    setCatNameRu(cat.name.ru);
    setCatIcon(cat.icon);
    setCatErrors({});
    setModalMode('edit-category');
  };

  const handleSaveCategory = async () => {
    const errors = validateCategoryForm();
    if (Object.keys(errors).length > 0) {
      setCatErrors(errors);
      return;
    }
    setCatErrors({});
    const isEdit = modalMode === 'edit-category' && !!editingCategory;
    const localizedName = { az: catNameAz.trim(), en: catNameEn.trim() || catNameAz.trim(), ru: catNameRu.trim() || catNameAz.trim() };
    try {
      if (isEdit) {
        await updateCategory.mutateAsync({ id: editingCategory.id, payload: { name: localizedName, icon: catIcon } });
      } else {
        await createCategory.mutateAsync({ name: localizedName, icon: catIcon, sortOrder: menuCategories.length, orgId: orgId ?? '' });
      }
      addToast(isEdit ? t('menu_management.category_updated') : t('menu_management.category_added'), 'success');
      closeCatModal();
    } catch (err) {
      handleApiError(err, setCatErrors, CAT_FIELD_MAP);
    }
  };

  const openDeleteCategory = (cat: MenuCategoryDto) => {
    const itemsInCat = menuItems.filter((m) => m.categoryId === cat.id);
    setDeleteCatConfirm(cat);
    setDeleteCatMoveTo(itemsInCat.length > 0 ? (menuCategories.find((c) => c.id !== cat.id)?.id || '') : '');
  };

  const handleDeleteCategory = async () => {
    if (!deleteCatConfirm) return;
    const id = deleteCatConfirm.id;
    setDeleteCatConfirm(null);
    setDeleteCatMoveTo('');
    if (selectedCategory === id) setSelectedCategory('all');
    try {
      await deleteCategory.mutateAsync({ id, payload: deleteCatMoveTo ? { moveItemsTo: deleteCatMoveTo } : undefined });
      addToast(t('menu_management.category_deleted'), 'success');
    } catch (err) {
      addToast(getErrorMessage(err, t('menu_management.error.delete_category')), 'error');
    }
  };

  const handleDeleteItem = async (id: string) => {
    setDeleteItemConfirm(null);
    try {
      await deleteItem.mutateAsync(id);
      addToast(t('menu_management.item_deleted'), 'success');
    } catch (err) {
      addToast(getErrorMessage(err, t('menu_management.error.delete_item')), 'error');
    }
  };

  const handleToggleAvailability = async (item: MenuItemDto) => {
    try {
      await updateItem.mutateAsync({ id: item.id, payload: { isAvailable: !item.isAvailable } });
      addToast(t('menu_management.status_changed'), 'success');
    } catch (err) {
      addToast(getErrorMessage(err, t('error.unexpected')), 'error');
    }
  };

  if ((itemsQuery.isLoading && !itemsQuery.data) || (categoriesQuery.isLoading && !categoriesQuery.data)) {
    return (
      <div>
        <Header title={t('menu_management.title', { items: menuItems.length, categories: menuCategories.length })} showUser />
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
      <Header title={t('menu_management.title', { items: menuItems.length, categories: menuCategories.length })} showUser />

      <div className="p-6">
        {(itemsQuery.isError || categoriesQuery.isError) && (
          <div className="bg-danger-50 border border-danger-200 rounded-2xl p-4 mb-6 flex items-center justify-between">
            <p className="text-sm text-danger-700">{t('error.unexpected')}</p>
            <button
              onClick={() => { itemsQuery.refetch(); categoriesQuery.refetch(); }}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition-colors"
            >
              {t('error.retry')}
            </button>
          </div>
        )}

        {!orgId && (
          <div className="bg-danger-50 border border-danger-200 rounded-2xl p-4 mb-6">
            <p className="text-sm text-danger-700">{t('menu_management.no_org')}</p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <button onClick={openAddItem} className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-4 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-primary-200">
            <Plus className="w-4 h-4" />
            {t('menu_management.new_item')}
          </button>
          <button onClick={openAddCategory} className="bg-surface-secondary hover:bg-border text-text-secondary font-medium py-2.5 px-4 rounded-xl transition-all flex items-center gap-2 border border-border">
            <Tag className="w-4 h-4" />
            {t('menu_management.new_category')}
          </button>
          <div className="relative ml-auto">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('menu_management.search_placeholder')}
              className="w-56 pl-9 pr-4 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6 gap-3 mb-6">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`group relative rounded-2xl border p-4 text-left transition-all ${selectedCategory === 'all' ? 'border-primary-500 ring-2 ring-primary-500/30 bg-primary-50/50 dark:bg-primary-900/10' : 'bg-white dark:bg-surface border-border hover:border-primary-300 hover:shadow-lg hover:shadow-primary-100/50 hover:-translate-y-0.5'}`}
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${selectedCategory === 'all' ? 'bg-primary-600 text-white' : 'bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/30 dark:to-primary-900/15 text-primary-600 group-hover:from-primary-600 group-hover:to-primary-500 group-hover:text-white'}`}>
              <LayoutGrid className="w-5 h-5" />
            </div>
            <p className={`mt-3 text-sm font-semibold truncate ${selectedCategory === 'all' ? 'text-primary-700 dark:text-primary-300' : 'text-text-primary'}`}>{t('common.all')}</p>
            <p className="text-xs text-text-muted mt-0.5">{menuItems.length} {t('menu.items_count')}</p>
          </button>

          {menuCategories.map((cat) => {
            const count = menuItems.filter((m) => m.categoryId === cat.id).length;
            const isActive = selectedCategory === cat.id;
            return (
              <div
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`group relative rounded-2xl border p-4 cursor-pointer transition-all ${isActive ? 'border-primary-500 ring-2 ring-primary-500/30 bg-primary-50/50 dark:bg-primary-900/10' : 'bg-white dark:bg-surface border-border hover:border-primary-300 hover:shadow-lg hover:shadow-primary-100/50 hover:-translate-y-0.5'}`}
              >
                <div className="flex items-start justify-between">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${isActive ? 'bg-primary-600 text-white' : 'bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/30 dark:to-primary-900/15 text-primary-600 group-hover:from-primary-600 group-hover:to-primary-500 group-hover:text-white'}`}>
                    <CategoryIcon icon={cat.icon} className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); openEditCategory(cat); }}
                      className={`p-1.5 rounded-lg transition-colors ${isActive ? 'text-primary-700 dark:text-primary-300 hover:bg-primary-600 hover:text-white' : 'text-text-muted hover:bg-primary-50 hover:text-primary-600'}`}
                      title={t('common.edit')}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); openDeleteCategory(cat); }}
                      className={`p-1.5 rounded-lg transition-colors ${isActive ? 'text-primary-700 dark:text-primary-300 hover:bg-danger-600 hover:text-white' : 'text-text-muted hover:bg-danger-50 hover:text-danger-600'}`}
                      title={t('common.delete')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className={`mt-3 text-sm font-semibold truncate ${isActive ? 'text-primary-700 dark:text-primary-300' : 'text-text-primary'}`} title={localize(cat.name, locale)}>{localize(cat.name, locale)}</p>
                <p className="text-xs text-text-muted mt-0.5">{count} {t('menu.items_count')}</p>
              </div>
            );
          })}
        </div>

        <div className="bg-white dark:bg-surface rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-border bg-surface-secondary">
                  <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-6 py-3">{t('menu_management.table_header.item')}</th>
                  <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-6 py-3">{t('menu_management.table_header.category')}</th>
                  <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-6 py-3">{t('menu_management.table_header.price')}</th>
                  <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-6 py-3">{t('menu_management.table_header.time')}</th>
                  <th className="text-left text-xs font-semibold text-text-secondary uppercase tracking-wider px-6 py-3">{t('common.status')}</th>
                  <th className="text-right text-xs font-semibold text-text-secondary uppercase tracking-wider px-6 py-3">{t('menu_management.table_header.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const cat = menuCategories.find((c) => c.id === item.categoryId);
                  return (
                    <tr key={item.id} className="border-b border-border last:border-0 hover:bg-surface-secondary/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={localize(item.name, locale)} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/30 dark:to-primary-900/15 flex items-center justify-center flex-shrink-0">
                              <Camera className="w-4 h-4 text-primary-400" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-text-primary">{localize(item.name, locale)}</p>
                            <p className="text-xs text-text-muted mt-0.5 truncate max-w-[200px]">{localize(item.description, locale)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {cat ? (
                          <span className="inline-flex items-center gap-1.5 text-xs bg-primary-50 text-primary-700 dark:bg-primary-900/20 px-2.5 py-1 rounded-full font-medium">
                            <CategoryIcon icon={cat.icon} className="w-3 h-3" />
                            {localize(cat.name, locale)}
                          </span>
                        ) : (
                          <span className="text-xs bg-surface-secondary text-text-muted px-2.5 py-1 rounded-full font-medium">{t('common.unknown')}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-text-primary">{item.price} ₼</td>
                      <td className="px-6 py-4 text-sm text-text-secondary">{item.preparationTime} {t('time.minutes_abbreviation')}</td>
                      <td className="px-6 py-4">
                        <button onClick={() => handleToggleAvailability(item)} className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${item.isAvailable ? 'bg-success-50 text-success-600' : 'bg-danger-50 text-danger-600'}`}>
                          {item.isAvailable ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          {item.isAvailable ? t('common.active') : t('common.hidden')}
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
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-text-muted">
                      {menuItems.length === 0 ? t('menu_management.no_items_in_category') : t('menu_management.no_items_found')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Item Add / Edit Modal */}
      {(modalMode === 'add-item' || modalMode === 'edit-item') && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeItemModal}>
          <div className="bg-white dark:bg-surface rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
              <h3 className="text-lg font-bold text-text-primary">{modalMode === 'edit-item' ? t('menu_management.edit_item') : t('menu_management.add_item')}</h3>
              <button onClick={closeItemModal} className="p-1 hover:bg-surface-secondary rounded-lg"><X className="w-5 h-5 text-text-muted" /></button>
            </div>
            <div className="px-6 py-4 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">{t('common.name')} <span className="text-danger-500">*</span></label>
                <div className="space-y-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-7 text-center text-xs font-bold text-text-muted uppercase">AZ</span>
                      <input value={itemForm.nameAz} onChange={(e) => setItemForm({ ...itemForm, nameAz: e.target.value })} className={inputClass(!!itemErrors.nameAz)} placeholder={t('menu_management.item_name_placeholder')} maxLength={MENU_LIMITS.nameMax} />
                    </div>
                    <FieldError message={itemErrors.nameAz} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-7 text-center text-xs font-bold text-text-muted uppercase">EN</span>
                      <input value={itemForm.nameEn} onChange={(e) => setItemForm({ ...itemForm, nameEn: e.target.value })} className={inputClass(!!itemErrors.nameEn)} placeholder={t('menu_management.item_name_placeholder')} maxLength={MENU_LIMITS.nameMax} />
                    </div>
                    <FieldError message={itemErrors.nameEn} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-7 text-center text-xs font-bold text-text-muted uppercase">RU</span>
                      <input value={itemForm.nameRu} onChange={(e) => setItemForm({ ...itemForm, nameRu: e.target.value })} className={inputClass(!!itemErrors.nameRu)} placeholder={t('menu_management.item_name_placeholder')} maxLength={MENU_LIMITS.nameMax} />
                    </div>
                    <FieldError message={itemErrors.nameRu} />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">{t('menu_management.description')}</label>
                <div className="space-y-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-7 text-center text-xs font-bold text-text-muted uppercase">AZ</span>
                      <textarea value={itemForm.descAz} onChange={(e) => setItemForm({ ...itemForm, descAz: e.target.value })} className={`${inputClass(!!itemErrors.descAz)} resize-none`} rows={3} placeholder={t('menu_management.short_description_placeholder')} maxLength={MENU_LIMITS.descriptionMax} />
                    </div>
                    <FieldError message={itemErrors.descAz} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-7 text-center text-xs font-bold text-text-muted uppercase">EN</span>
                      <textarea value={itemForm.descEn} onChange={(e) => setItemForm({ ...itemForm, descEn: e.target.value })} className={`${inputClass(!!itemErrors.descEn)} resize-none`} rows={3} placeholder={t('menu_management.short_description_placeholder')} maxLength={MENU_LIMITS.descriptionMax} />
                    </div>
                    <FieldError message={itemErrors.descEn} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-7 text-center text-xs font-bold text-text-muted uppercase">RU</span>
                      <textarea value={itemForm.descRu} onChange={(e) => setItemForm({ ...itemForm, descRu: e.target.value })} className={`${inputClass(!!itemErrors.descRu)} resize-none`} rows={3} placeholder={t('menu_management.short_description_placeholder')} maxLength={MENU_LIMITS.descriptionMax} />
                    </div>
                    <FieldError message={itemErrors.descRu} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">{t('menu_management.price')} <span className="text-danger-500">*</span></label>
                  <input type="number" value={itemForm.price || ''} onChange={(e) => setItemForm({ ...itemForm, price: Number(e.target.value) })} className={inputClass(!!itemErrors.price)} min={0} step="0.01" placeholder="0.00" />
                  {itemErrors.price && <p className="text-xs text-danger-600 mt-1 ml-9">{itemErrors.price}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">{t('menu_management.prep_time')}</label>
                  <input type="number" value={itemForm.preparationTime || ''} onChange={(e) => setItemForm({ ...itemForm, preparationTime: Number(e.target.value) })} className={inputClass(!!itemErrors.preparationTime)} min={0} />
                  {itemErrors.preparationTime && <p className="text-xs text-danger-600 mt-1 ml-9">{itemErrors.preparationTime}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">{t('menu_management.category')} <span className="text-danger-500">*</span></label>
                <select value={itemForm.category} onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })} className={`w-full appearance-none px-4 py-2.5 bg-surface-secondary border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${itemErrors.category ? 'border-danger-400' : 'border-border'}`}>
                  <option value="">{t('common.select_placeholder')}</option>
                  {menuCategories.map((c) => <option key={c.id} value={c.id}>{localize(c.name, locale)}</option>)}
                </select>
                {itemErrors.category && <p className="text-xs text-danger-600 mt-1 ml-9">{itemErrors.category}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">{t('menu_management.image')}</label>
                <div className="flex items-center gap-3">
                  {itemForm.image ? (
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-border flex-shrink-0">
                      <img src={itemForm.image} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => { setItemForm({ ...itemForm, image: '' }); setItemImageFile(null); }}
                        className="absolute top-1 right-1 w-5 h-5 bg-danger-500 text-white rounded-full flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors flex-shrink-0">
                      <ImagePlus className="w-5 h-5 text-text-muted" />
                      <span className="text-[10px] text-text-muted mt-0.5">{t('menu_management.upload')}</span>
                      <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageUpload} />
                    </label>
                  )}
                  <div className="flex-1">
                    <input
                      type="url"
                      value={itemForm.image.startsWith('data:') ? '' : itemForm.image}
                      onChange={(e) => setItemForm({ ...itemForm, image: e.target.value })}
                      className={`w-full px-4 py-2.5 bg-surface-secondary border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${itemErrors.image ? 'border-danger-400' : 'border-border'}`}
                      placeholder={t('menu_management.image_url_placeholder')}
                      disabled={itemForm.image.startsWith('data:')}
                    />
                  </div>
                </div>
                {itemErrors.image && <p className="text-xs text-danger-600 mt-1 ml-28">{itemErrors.image}</p>}
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-text-secondary">{t('common.status')}:</label>
                <button onClick={() => setItemForm({ ...itemForm, isAvailable: !itemForm.isAvailable })} className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${itemForm.isAvailable ? 'bg-success-50 text-success-600' : 'bg-danger-50 text-danger-600'}`}>
                  {itemForm.isAvailable ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  {itemForm.isAvailable ? t('common.active') : t('common.hidden')}
                </button>
              </div>
            </div>
            <div className="px-6 pb-6 flex flex-col gap-2 flex-shrink-0">
              {itemErrors._form && <p className="text-sm text-danger-600">{itemErrors._form}</p>}
              <div className="flex gap-3">
                <button onClick={closeItemModal} disabled={isSavingItem} className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors">{t('common.cancel')}</button>
                <button onClick={handleSaveItem} disabled={isSavingItem} className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-text-muted text-white rounded-xl text-sm font-semibold transition-colors">
                  {isSavingItem ? t('menu_management.saving') : (modalMode === 'edit-item' ? t('common.save') : t('common.add'))}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Add / Edit Modal */}
      {(modalMode === 'add-category' || modalMode === 'edit-category') && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeCatModal}>
          <div className="bg-white dark:bg-surface rounded-2xl w-full max-w-sm shadow-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
              <h3 className="text-lg font-bold text-text-primary">{modalMode === 'edit-category' ? t('menu_management.edit_category') : t('menu_management.new_category')}</h3>
              <button onClick={closeCatModal} className="p-1 hover:bg-surface-secondary rounded-lg"><X className="w-5 h-5 text-text-muted" /></button>
            </div>
            <div className="px-6 py-4 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">{t('menu_management.category_name')} <span className="text-danger-500">*</span></label>
                <div className="space-y-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-7 text-center text-xs font-bold text-text-muted uppercase">AZ</span>
                      <input value={catNameAz} onChange={(e) => setCatNameAz(e.target.value)} className={inputClass(!!catErrors.catNameAz)} placeholder={t('menu_management.category_name_placeholder')} maxLength={MENU_LIMITS.nameMax} />
                    </div>
                    <FieldError message={catErrors.catNameAz} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-7 text-center text-xs font-bold text-text-muted uppercase">EN</span>
                      <input value={catNameEn} onChange={(e) => setCatNameEn(e.target.value)} className={inputClass(!!catErrors.catNameEn)} placeholder={t('menu_management.category_name_placeholder')} maxLength={MENU_LIMITS.nameMax} />
                    </div>
                    <FieldError message={catErrors.catNameEn} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-7 text-center text-xs font-bold text-text-muted uppercase">RU</span>
                      <input value={catNameRu} onChange={(e) => setCatNameRu(e.target.value)} className={inputClass(!!catErrors.catNameRu)} placeholder={t('menu_management.category_name_placeholder')} maxLength={MENU_LIMITS.nameMax} />
                    </div>
                    <FieldError message={catErrors.catNameRu} />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">{t('menu_management.icon')}</label>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {(MENU_ICONS as readonly string[]).map((icon) => {
                    const Icon = ICON_MAP[icon as keyof typeof ICON_MAP];
                    const isActive = catIcon === icon;
                    return (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setCatIcon(icon)}
                        title={icon}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-colors ${isActive ? 'bg-primary-600 text-white border-primary-600' : 'bg-surface-secondary text-text-muted border-border hover:border-primary-400 hover:text-primary-600'}`}
                      >
                        <Icon className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
                <input value={catIcon} onChange={(e) => setCatIcon(e.target.value)} className={`w-full px-4 py-2.5 bg-surface-secondary border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${catErrors.catIcon ? 'border-danger-400' : 'border-border'}`} placeholder={t('menu_management.icon_placeholder')} maxLength={MENU_LIMITS.iconMax} />
                {catErrors.catIcon && <p className="text-xs text-danger-600 mt-1 ml-9">{catErrors.catIcon}</p>}
              </div>
            </div>
            <div className="px-6 pb-6 flex flex-col gap-2 flex-shrink-0">
              {catErrors._form && <p className="text-sm text-danger-600">{catErrors._form}</p>}
              <div className="flex gap-3">
                <button onClick={closeCatModal} disabled={isSavingCategory} className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors">{t('common.cancel')}</button>
                <button onClick={handleSaveCategory} disabled={isSavingCategory} className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-text-muted text-white rounded-xl text-sm font-semibold transition-colors">
                  {isSavingCategory ? t('menu_management.saving') : (modalMode === 'edit-category' ? t('common.save') : t('common.add'))}
                </button>
              </div>
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
              <h3 className="text-lg font-bold text-text-primary mb-1">{t('menu_management.delete_category_confirmation', { name: localize(deleteCatConfirm.name, locale) })}</h3>
              <p className="text-sm text-text-secondary">
                {t('menu_management.category_contains_items', { count: menuItems.filter((m) => m.categoryId === deleteCatConfirm.id).length })}
              </p>
            </div>
            {menuItems.filter((m) => m.categoryId === deleteCatConfirm.id).length > 0 && (
              <div className="mb-5">
                <label className="block text-sm font-medium text-text-secondary mb-1.5">{t('menu_management.move_items')}</label>
                <select
                  value={deleteCatMoveTo}
                  onChange={(e) => setDeleteCatMoveTo(e.target.value)}
                  className="w-full appearance-none px-4 py-2.5 bg-surface-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">{t('menu_management.delete_all')}</option>
                  {menuCategories.filter((c) => c.id !== deleteCatConfirm.id).map((c) => (
                    <option key={c.id} value={c.id}>{localize(c.name, locale)}</option>
                  ))}
                </select>
                <p className="text-xs text-text-muted mt-1">{t('menu_management.delete_all_warning')}</p>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setDeleteCatConfirm(null)} disabled={deleteCategory.isPending} className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors">{t('common.back')}</button>
              <button onClick={handleDeleteCategory} disabled={deleteCategory.isPending} className="flex-1 px-4 py-2.5 bg-danger-500 hover:bg-danger-600 disabled:bg-text-muted text-white rounded-xl text-sm font-semibold transition-colors">
                {deleteCategory.isPending ? t('menu_management.deleting') : t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Item Delete Confirmation */}
      {deleteItemConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDeleteItemConfirm(null)}>
          <div className="bg-white dark:bg-surface rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <Trash2 className="w-10 h-10 mx-auto text-danger-500 mb-3" />
            <h3 className="text-lg font-bold text-text-primary mb-1">{t('menu_management.delete_item_confirmation')}</h3>
            <p className="text-sm text-text-secondary mb-5">{t('common.irreversible_warning')}</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteItemConfirm(null)} disabled={deleteItem.isPending} className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors">{t('common.back')}</button>
              <button onClick={() => handleDeleteItem(deleteItemConfirm)} disabled={deleteItem.isPending} className="flex-1 px-4 py-2.5 bg-danger-500 hover:bg-danger-600 disabled:bg-text-muted text-white rounded-xl text-sm font-semibold transition-colors">
                {deleteItem.isPending ? t('menu_management.deleting') : t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
