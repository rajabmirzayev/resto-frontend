export type UserRole = 'admin' | 'waiter' | 'chef' | 'customer' | string;

export type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning';

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';

export type PaymentStatus = 'pending' | 'paid';

export type Permission =
  | 'dashboard.view'
  | 'menu.view' | 'menu.create' | 'menu.edit' | 'menu.delete'
  | 'tables.view' | 'tables.manage' | 'tables.status'
  | 'orders.view' | 'orders.manage' | 'orders.cancel'
  | 'reports.view'
  | 'staff.view' | 'staff.create' | 'staff.edit' | 'staff.delete'
  | 'roles.view' | 'roles.create' | 'roles.edit' | 'roles.delete'
  | 'kitchen.view' | 'kitchen.manage';

export const PERMISSION_GROUPS: { label: string; permissions: { key: Permission; label: string }[] }[] = [
  {
    label: 'Dashboard',
    permissions: [{ key: 'dashboard.view', label: 'Baxış' }],
  },
  {
    label: 'Menyu',
    permissions: [
      { key: 'menu.view', label: 'Görüntüləmə' },
      { key: 'menu.create', label: 'Əlavə etmə' },
      { key: 'menu.edit', label: 'Redaktə' },
      { key: 'menu.delete', label: 'Silmə' },
    ],
  },
  {
    label: 'Masalar',
    permissions: [
      { key: 'tables.view', label: 'Görüntüləmə' },
      { key: 'tables.manage', label: 'İdarəetmə' },
      { key: 'tables.status', label: 'Status dəyişikliyi' },
    ],
  },
  {
    label: 'Sifarişlər',
    permissions: [
      { key: 'orders.view', label: 'Görüntüləmə' },
      { key: 'orders.manage', label: 'İdarəetmə' },
      { key: 'orders.cancel', label: 'Ləğv etmə' },
    ],
  },
  {
    label: 'Hesabatlar',
    permissions: [{ key: 'reports.view', label: 'Görüntüləmə' }],
  },
  {
    label: 'Personal',
    permissions: [
      { key: 'staff.view', label: 'Görüntüləmə' },
      { key: 'staff.create', label: 'Əlavə etmə' },
      { key: 'staff.edit', label: 'Redaktə' },
      { key: 'staff.delete', label: 'Silmə' },
    ],
  },
  {
    label: 'Rollar',
    permissions: [
      { key: 'roles.view', label: 'Görüntüləmə' },
      { key: 'roles.create', label: 'Əlavə etmə' },
      { key: 'roles.edit', label: 'Redaktə' },
      { key: 'roles.delete', label: 'Silmə' },
    ],
  },
  {
    label: 'Mtbəx',
    permissions: [
      { key: 'kitchen.view', label: 'Panelə baxış' },
      { key: 'kitchen.manage', label: 'Sifariş idarəetməsi' },
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

export interface Table {
  id: string;
  number: number;
  capacity: number;
  status: TableStatus;
  currentOrderId?: string;
  section: string;
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
