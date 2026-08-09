export type UserRole = 'admin' | 'org_admin' | 'waiter' | 'chef' | 'customer';

export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING';

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';

export type PaymentStatus = 'pending' | 'paid';
export type PaymentMethod = 'cash' | 'card' | null;
export type PaymentTiming = 'before' | 'after';

export type OrderMode = 'waiter' | 'customer' | 'customer-waiter-confirm' | 'kitchen';

export type CustomerThemeId = 'classic' | 'emerald' | 'sunset' | 'rose' | 'violet' | 'amber';

export const ORDER_MODES: { value: OrderMode; title: string; description: string; waiterPanel: boolean; kitchenPanel: boolean }[] = [
  { value: 'waiter', title: 'Ofisant Sifariş Alır', description: 'Ənənəvi qayda. Ofisant sifarişi özü yazır, müştəri sadəcə menyuya baxa bilər.', waiterPanel: true, kitchenPanel: true },
  { value: 'customer', title: 'Müştəri Özü Sifariş Verir', description: 'Müştəri menyudan sifariş edir, sifariş birbaşa metbexə gedir. Ofisant paneli lazım deyil.', waiterPanel: false, kitchenPanel: true },
  { value: 'customer-waiter-confirm', title: 'Müştəri Verir, Ofisant Təsdiqləyir', description: 'Müştəri sifariş edir, ofisant yoxlayıb təsdiqləyir, sonra metbexə gedir.', waiterPanel: true, kitchenPanel: true },
  { value: 'kitchen', title: 'Sifariş Sistemə Qeyd Olunur', description: 'Ofisant və ya müştəri paneli olmadan. Sifarişlər sistemi vasitəsilə metbexə düşür.', waiterPanel: false, kitchenPanel: true },
];

export type Permission =
  | 'dashboard.view'
  | 'menu.view' | 'menu.create' | 'menu.edit' | 'menu.delete'
  | 'table.view' | 'table.create' | 'table.edit' | 'table.delete' | 'table.status' | 'table.reserve'
  | 'order.view' | 'order.create' | 'order.manage' | 'order.cancel' | 'order.payment'
  | 'kitchen.view' | 'kitchen.manage'
  | 'waiter.view' | 'waiter.manage'
  | 'staff.view' | 'staff.create' | 'staff.edit' | 'staff.delete'
  | 'role.view' | 'role.create' | 'role.edit' | 'role.delete' | 'role.assign' | 'permission.view' | 'permission.manage'
  | 'settings.view' | 'settings.edit'
  | 'report.view'
  | 'organization.view' | 'organization.create' | 'organization.edit' | 'organization.delete';

export const PERMISSION_GROUPS: { id: string; label: string; permissions: { key: Permission; label: string }[] }[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    permissions: [{ key: 'dashboard.view', label: 'Baxış' }],
  },
  {
    id: 'menu',
    label: 'Menyu',
    permissions: [
      { key: 'menu.view', label: 'Görüntüləmə' },
      { key: 'menu.create', label: 'Əlavə etmə' },
      { key: 'menu.edit', label: 'Redaktə' },
      { key: 'menu.delete', label: 'Silmə' },
    ],
  },
  {
    id: 'table',
    label: 'Masalar',
    permissions: [
      { key: 'table.view', label: 'Görüntüləmə' },
      { key: 'table.create', label: 'Əlavə etmə' },
      { key: 'table.edit', label: 'Redaktə' },
      { key: 'table.delete', label: 'Silmə' },
      { key: 'table.status', label: 'Status dəyişikliyi' },
      { key: 'table.reserve', label: 'Rezervasiya' },
    ],
  },
  {
    id: 'order',
    label: 'Sifarişlər',
    permissions: [
      { key: 'order.view', label: 'Görüntüləmə' },
      { key: 'order.create', label: 'Yaratma' },
      { key: 'order.manage', label: 'İdarəetmə' },
      { key: 'order.cancel', label: 'Ləğv etmə' },
      { key: 'order.payment', label: 'Ödəniş' },
    ],
  },
  {
    id: 'kitchen',
    label: 'Mtbəx',
    permissions: [
      { key: 'kitchen.view', label: 'Panelə baxış' },
      { key: 'kitchen.manage', label: 'Sifariş idarəetməsi' },
    ],
  },
  {
    id: 'waiter',
    label: 'Ofisant',
    permissions: [
      { key: 'waiter.view', label: 'Panelə baxış' },
      { key: 'waiter.manage', label: 'İdarəetmə' },
    ],
  },
  {
    id: 'staff',
    label: 'Personal',
    permissions: [
      { key: 'staff.view', label: 'Görüntüləmə' },
      { key: 'staff.create', label: 'Əlavə etmə' },
      { key: 'staff.edit', label: 'Redaktə' },
      { key: 'staff.delete', label: 'Silmə' },
    ],
  },
  {
    id: 'roles',
    label: 'Rollar',
    permissions: [
      { key: 'role.view', label: 'Görüntüləmə' },
      { key: 'role.create', label: 'Əlavə etmə' },
      { key: 'role.edit', label: 'Redaktə' },
      { key: 'role.delete', label: 'Silmə' },
      { key: 'role.assign', label: 'Təyin etmə' },
      { key: 'permission.view', label: 'İcazələrə baxış' },
      { key: 'permission.manage', label: 'İcazə idarəsi' },
    ],
  },
  {
    id: 'settings',
    label: 'Tənzimləmələr',
    permissions: [
      { key: 'settings.view', label: 'Baxış' },
      { key: 'settings.edit', label: 'Redaktə' },
    ],
  },
  {
    id: 'reports',
    label: 'Hesabatlar',
    permissions: [{ key: 'report.view', label: 'Görüntüləmə' }],
  },
  {
    id: 'organization',
    label: 'Təşkilat',
    permissions: [
      { key: 'organization.view', label: 'Görüntüləmə' },
      { key: 'organization.create', label: 'Əlavə etmə' },
      { key: 'organization.edit', label: 'Redaktə' },
      { key: 'organization.delete', label: 'Silmə' },
    ],
  },
];

export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
  isSystem: boolean;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  adminName: string;
  adminEmail: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  roleId: string;
  username: string;
  password: string;
  email?: string;
  orgId?: string;
  avatar?: string;
}

export interface LocalizedString {
  az: string;
  en: string;
  ru: string;
}

export interface MenuItem {
  id: string;
  name: LocalizedString;
  description: LocalizedString;
  price: number;
  category: string;
  image?: string;
  isAvailable: boolean;
  preparationTime: number;
  orgId?: string;
}

export interface MenuCategory {
  id: string;
  name: LocalizedString;
  icon: string;
  orgId?: string;
}

export interface TableReservation {
  guestName: string;
  phone: string;
  time: string;
  guestCount: number;
  notes?: string;
}

export interface Table {
  id: string;
  number: number;
  capacity: number;
  status: TableStatus;
  currentOrderId?: string;
  section: string;
  reservation?: TableReservation;
  orgId?: string;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  price: number;
  notes?: string;
  status: OrderStatus;
}

export interface Order {
  id: string;
  tableId: string;
  tableNumber: number;
  items: OrderItem[];
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  waiterId: string;
  waiterName: string;
  orderSource: 'waiter' | 'customer';
  waiterConfirmed: boolean;
  confirmedBy: string;
  customerPhoto?: string;
  paymentMethod: PaymentMethod;
  paymentRequested: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AppState {
  users: User[];
  roles: Role[];
  organizations: Organization[];
  menuItems: MenuItem[];
  menuCategories: MenuCategory[];
  tables: Table[];
  tableSections: string[];
  orders: Order[];
  orderMode: OrderMode;
  customerPhotoRequired: boolean;
  paymentTiming: PaymentTiming;
  currentUser: User | null;
  cart: CartItem[];
  currentOrderId: string | null;
}

export interface CartItem {
  menuItemId: string;
  menuItemName: string;
  price: number;
  quantity: number;
  notes?: string;
}
