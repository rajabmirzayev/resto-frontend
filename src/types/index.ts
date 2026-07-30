export type UserRole = 'admin' | 'waiter' | 'chef' | 'customer';

export type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning';

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';

export type PaymentStatus = 'pending' | 'paid';
export type PaymentMethod = 'cash' | 'card' | null;
export type PaymentTiming = 'before' | 'after';

export type OrderMode = 'waiter' | 'customer' | 'customer-waiter-confirm' | 'kitchen';

export const ORDER_MODES: { value: OrderMode; title: string; description: string; waiterPanel: boolean; kitchenPanel: boolean }[] = [
  { value: 'waiter', title: 'Ofisant Sifariş Alır', description: 'Ənənəvi qayda. Ofisant sifarişi özü yazır, müştəri sadəcə menyuya baxa bilər.', waiterPanel: true, kitchenPanel: true },
  { value: 'customer', title: 'Müştəri Özü Sifariş Verir', description: 'Müştəri menyudan sifariş edir, sifariş birbaşa metbexə gedir. Ofisant paneli lazım deyil.', waiterPanel: false, kitchenPanel: true },
  { value: 'customer-waiter-confirm', title: 'Müştəri Verir, Ofisant Təsdiqləyir', description: 'Müştəri sifariş edir, ofisant yoxlayıb təsdiqləyir, sonra metbexə gedir.', waiterPanel: true, kitchenPanel: true },
  { value: 'kitchen', title: 'Sifariş Sistemə Qeyd Olunur', description: 'Ofisant və ya müştəri paneli olmadan. Sifarişlər sistemi vasitəsilə metbexə düşür.', waiterPanel: false, kitchenPanel: true },
];

export type Permission =
  | 'dashboard.view'
  | 'menu.view' | 'menu.create' | 'menu.edit' | 'menu.delete'
  | 'tables.view' | 'tables.manage' | 'tables.status'
  | 'orders.view' | 'orders.manage' | 'orders.cancel'
  | 'reports.view'
  | 'staff.view' | 'staff.create' | 'staff.edit' | 'staff.delete'
  | 'roles.view' | 'roles.create' | 'roles.edit' | 'roles.delete'
  | 'kitchen.view' | 'kitchen.manage'
  | 'settings.view' | 'settings.edit';

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
    id: 'tables',
    label: 'Masalar',
    permissions: [
      { key: 'tables.view', label: 'Görüntüləmə' },
      { key: 'tables.manage', label: 'İdarəetmə' },
      { key: 'tables.status', label: 'Status dəyişikliyi' },
    ],
  },
  {
    id: 'orders',
    label: 'Sifarişlər',
    permissions: [
      { key: 'orders.view', label: 'Görüntüləmə' },
      { key: 'orders.manage', label: 'İdarəetmə' },
      { key: 'orders.cancel', label: 'Ləğv etmə' },
    ],
  },
  {
    id: 'reports',
    label: 'Hesabatlar',
    permissions: [{ key: 'reports.view', label: 'Görüntüləmə' }],
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
      { key: 'roles.view', label: 'Görüntüləmə' },
      { key: 'roles.create', label: 'Əlavə etmə' },
      { key: 'roles.edit', label: 'Redaktə' },
      { key: 'roles.delete', label: 'Silmə' },
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
    id: 'settings',
    label: 'Tənzimləmələr',
    permissions: [
      { key: 'settings.view', label: 'Baxış' },
      { key: 'settings.edit', label: 'Redaktə' },
    ],
  },
];

export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
  isSystem: boolean;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  roleId: string;
  username: string;
  password: string;
  avatar?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  isAvailable: boolean;
  preparationTime: number;
}

export interface MenuCategory {
  id: string;
  name: string;
  icon: string;
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
