import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { AppState, CartItem, MenuCategory, MenuItem, Order, OrderItem, OrderMode, OrderStatus, PaymentMethod, PaymentTiming, Permission, Table, TableStatus, User, UserRole } from '../types';
import { initialData } from '../data/mock';
import { authApi } from '../api/auth';
import { clearSession, getAccessToken, getOrgIdFromToken, getPermissions, getRefreshToken, setSession, setPermissions, setUiScope } from '../api/session';

function mapRolesToUserRole(roles: string[]): UserRole {
  if (roles.includes('SUPER_ADMIN')) return 'admin';
  if (roles.includes('WAITER_DEFAULT')) return 'waiter';
  if (roles.includes('KITCHEN_DEFAULT')) return 'chef';
  return 'org_admin';
}

function buildUserFromLogin(username: string, roles: string[]): User {
  return {
    id: username,
    name: username,
    role: mapRolesToUserRole(roles),
    roleId: '',
    username,
    password: '',
    email: username,
  };
}

interface StoreActions {
  login: (username: string, password: string) => Promise<User | null>;
  logout: () => Promise<void>;

  addMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  updateMenuItem: (id: string, item: Partial<MenuItem>) => void;
  deleteMenuItem: (id: string) => void;

  addMenuCategory: (category: Omit<MenuCategory, 'id'>) => void;
  updateMenuCategory: (id: string, category: Partial<MenuCategory>) => void;
  deleteMenuCategory: (id: string) => void;

  addTable: (table: Omit<Table, 'id'>) => void;
  updateTable: (id: string, table: Partial<Table>) => void;
  deleteTable: (id: string) => void;
  updateTableStatus: (id: string, status: TableStatus) => void;

  addTableSection: (name: string) => void;
  updateTableSection: (oldName: string, newName: string) => void;
  deleteTableSection: (name: string) => void;

  hasPermission: (permission: Permission) => boolean;

  addToCart: (item: CartItem) => void;
  removeFromCart: (menuItemId: string) => void;
  updateCartQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;

  createOrder: (tableId: string, waiterId: string, waiterName: string) => Order | null;
  createCustomerOrder: (tableId: string, customerPhoto?: string) => Order | null;
  addItemsToOrder: (orderId: string, items: Omit<OrderItem, 'id'>[]) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updateOrderItemStatus: (orderId: string, itemId: string, status: OrderStatus) => void;
  confirmOrder: (orderId: string, waiterId: string, waiterName: string) => void;
  cancelOrder: (orderId: string) => void;
  completePayment: (orderId: string) => void;
  requestPayment: (orderId: string, method: PaymentMethod) => void;
  setOrderMode: (mode: OrderMode) => void;
  setCustomerPhotoRequired: (required: boolean) => void;
  setPaymentTiming: (timing: PaymentTiming) => void;

  getTableOrders: (tableId: string) => Order[];
  getActiveOrders: () => Order[];
  getOrdersByWaiter: (waiterId: string) => Order[];

  resetData: () => void;
}

type Store = AppState & StoreActions;

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...initialData,

      login: async (username: string, password: string) => {
        const response = await authApi.login({ username, password });
        setSession(response.accessToken, response.refreshToken, response.expiresIn);
        setPermissions(response.permissions);
        setUiScope(response.uiScope);
        const userRoles = response.user?.roles ?? [];
        const user = buildUserFromLogin(username, userRoles);
        const token = getAccessToken();
        const orgId = token ? (getOrgIdFromToken(token) ?? get().users.find((u) => u.username === username)?.orgId) : undefined;
        const currentUser = orgId ? { ...user, orgId } : user;
        set({ currentUser });
        return currentUser;
      },

      logout: async () => {
        const refreshToken = getRefreshToken();
        if (refreshToken) {
          try {
            await authApi.logout({ refreshToken });
          } catch {
            // best-effort server-side logout
          }
        }
        clearSession();
        set({ currentUser: null, cart: [] });
      },

      addMenuItem: (item) => {
        const newItem: MenuItem = { ...item, id: uuidv4() };
        set((state) => ({ menuItems: [...state.menuItems, newItem] }));
      },

      updateMenuItem: (id, item) => {
        set((state) => ({
          menuItems: state.menuItems.map((m) => (m.id === id ? { ...m, ...item } : m)),
        }));
      },

      deleteMenuItem: (id) => {
        set((state) => ({ menuItems: state.menuItems.filter((m) => m.id !== id) }));
      },

      addMenuCategory: (category) => {
        const newCat: MenuCategory = { ...category, id: uuidv4() };
        set((state) => ({ menuCategories: [...state.menuCategories, newCat] }));
      },

      updateMenuCategory: (id, category) => {
        set((state) => ({
          menuCategories: state.menuCategories.map((c) => (c.id === id ? { ...c, ...category } : c)),
        }));
      },

      deleteMenuCategory: (id) => {
        set((state) => ({ menuCategories: state.menuCategories.filter((c) => c.id !== id) }));
      },

      addTable: (table) => {
        const newTable: Table = { ...table, id: uuidv4() };
        set((state) => ({ tables: [...state.tables, newTable] }));
      },

      updateTable: (id, table) => {
        set((state) => ({
          tables: state.tables.map((t) => (t.id === id ? { ...t, ...table } : t)),
        }));
      },

      deleteTable: (id) => {
        set((state) => ({ tables: state.tables.filter((t) => t.id !== id) }));
      },

      updateTableStatus: (id, status) => {
        set((state) => ({
          tables: state.tables.map((t) => (t.id === id ? { ...t, status } : t)),
        }));
      },

      addTableSection: (name) => {
        const trimmed = name?.trim() ?? '';
        if (!trimmed) return;
        set((state) => {
          if (state.tableSections.includes(trimmed)) return state;
          return { tableSections: [...state.tableSections, trimmed] };
        });
      },

      updateTableSection: (oldName, newName) => {
        const trimmed = newName?.trim() ?? '';
        if (!trimmed || oldName === trimmed) return;
        set((state) => {
          if (state.tableSections.includes(trimmed)) return state;
          return {
            tableSections: state.tableSections.map((s) => (s === oldName ? trimmed : s)),
            tables: state.tables.map((t) => (t.section === oldName ? { ...t, section: trimmed } : t)),
          };
        });
      },

      deleteTableSection: (name) => {
        set((state) => {
          const remaining = state.tableSections.filter((s) => s !== name);
          const fallback = remaining[0] || '';
          return {
            tableSections: remaining,
            tables: state.tables.map((t) => (t.section === name ? { ...t, section: fallback } : t)),
          };
        });
      },

      hasPermission: (permission) => {
        if (!get().currentUser) return false;
        const sessionPerms = getPermissions();
        if (sessionPerms.length === 0) return false;
        return sessionPerms.includes(permission);
      },

      addToCart: (item) => {
        set((state) => {
          const existing = state.cart.find((c) => c.menuItemId === item.menuItemId);
          if (existing) {
            return {
              cart: state.cart.map((c) =>
                c.menuItemId === item.menuItemId ? { ...c, quantity: c.quantity + item.quantity, notes: item.notes || c.notes } : c
              ),
            };
          }
          return { cart: [...state.cart, item] };
        });
      },

      removeFromCart: (menuItemId) => {
        set((state) => ({ cart: state.cart.filter((c) => c.menuItemId !== menuItemId) }));
      },

      updateCartQuantity: (menuItemId, quantity) => {
        if (quantity <= 0) {
          set((state) => ({ cart: state.cart.filter((c) => c.menuItemId !== menuItemId) }));
          return;
        }
        set((state) => ({
          cart: state.cart.map((c) => (c.menuItemId === menuItemId ? { ...c, quantity } : c)),
        }));
      },

      clearCart: () => set({ cart: [] }),

      createOrder: (tableId, waiterId, waiterName) => {
        const { cart, tables } = get();
        if (cart.length === 0) return null;

        const table = tables.find((t) => t.id === tableId);
        if (!table || table.status === 'occupied') return null;

        const orderItems: OrderItem[] = cart.map((item) => ({
          id: uuidv4(),
          menuItemId: item.menuItemId,
          menuItemName: item.menuItemName,
          quantity: item.quantity,
          price: item.price,
          notes: item.notes,
          status: 'pending' as OrderStatus,
        }));

        const totalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

        const newOrder: Order = {
          id: uuidv4(),
          tableId,
          tableNumber: table.number,
          items: orderItems,
          status: 'pending',
          paymentStatus: 'pending',
          totalAmount,
          waiterId,
          waiterName,
          orderSource: 'waiter',
          waiterConfirmed: true,
          confirmedBy: waiterName,
          paymentMethod: null,
          paymentRequested: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          orders: [...state.orders, newOrder],
          tables: state.tables.map((t) =>
            t.id === tableId ? { ...t, status: 'occupied' as TableStatus, currentOrderId: newOrder.id } : t
          ),
          cart: [],
          currentOrderId: newOrder.id,
        }));

        return newOrder;
      },

      createCustomerOrder: (tableId, customerPhoto) => {
        const { cart, tables, orderMode } = get();
        if (cart.length === 0) return null;

        const table = tables.find((t) => t.id === tableId);
        if (!table || table.status === 'occupied') return null;

        const orderItems: OrderItem[] = cart.map((item) => ({
          id: uuidv4(),
          menuItemId: item.menuItemId,
          menuItemName: item.menuItemName,
          quantity: item.quantity,
          price: item.price,
          notes: item.notes,
          status: 'pending' as OrderStatus,
        }));

        const totalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

        const needsWaiterConfirm = orderMode === 'customer-waiter-confirm';
        const initialStatus: OrderStatus = needsWaiterConfirm ? 'pending' : 'confirmed';

        const newOrder: Order = {
          id: uuidv4(),
          tableId,
          tableNumber: table.number,
          items: orderItems,
          status: initialStatus,
          paymentStatus: 'pending',
          totalAmount,
          waiterId: '',
          waiterName: '',
          orderSource: 'customer',
          waiterConfirmed: !needsWaiterConfirm,
          confirmedBy: needsWaiterConfirm ? '' : 'Avtomatik',
          customerPhoto: customerPhoto || undefined,
          paymentMethod: null,
          paymentRequested: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          orders: [...state.orders, newOrder],
          tables: state.tables.map((t) =>
            t.id === tableId ? { ...t, status: 'occupied' as TableStatus, currentOrderId: newOrder.id } : t
          ),
          cart: [],
          currentOrderId: newOrder.id,
        }));

        return newOrder;
      },

      addItemsToOrder: (orderId, items) => {
        const order = get().orders.find((o) => o.id === orderId);
        if (!order) return;
        set((state) => ({
          orders: state.orders.map((o) => {
            if (o.id !== orderId) return o;
            const newItems: OrderItem[] = items.map((item) => ({ ...item, id: uuidv4(), status: 'pending' as OrderStatus }));
            const totalAmount = [...o.items, ...newItems].reduce((s, i) => s + i.price * i.quantity, 0);
            return { ...o, items: [...o.items, ...newItems], totalAmount, updatedAt: new Date().toISOString() };
          }),
        }));
      },

      updateOrderStatus: (orderId, status) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, status, updatedAt: new Date().toISOString() } : o
          ),
        }));
      },

      updateOrderItemStatus: (orderId, itemId, status) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  items: o.items.map((item) => (item.id === itemId ? { ...item, status } : item)),
                  updatedAt: new Date().toISOString(),
                }
              : o
          ),
        }));
      },

      confirmOrder: (orderId, waiterId, waiterName) => {
        const order = get().orders.find((o) => o.id === orderId);
        if (!order || order.status !== 'pending') return;
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? { ...o, status: 'confirmed' as OrderStatus, waiterConfirmed: true, waiterId, waiterName, confirmedBy: waiterName, updatedAt: new Date().toISOString() }
              : o
          ),
        }));
      },

      cancelOrder: (orderId) => {
        const order = get().orders.find((o) => o.id === orderId);
        if (!order || order.status === 'cancelled' || order.status === 'completed') return;

        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, status: 'cancelled' as OrderStatus, updatedAt: new Date().toISOString() } : o
          ),
          tables: state.tables.map((t) =>
            t.currentOrderId === orderId ? { ...t, status: 'cleaning' as TableStatus, currentOrderId: undefined } : t
          ),
        }));
      },

      completePayment: (orderId) => {
        const order = get().orders.find((o) => o.id === orderId);
        if (!order || order.paymentStatus === 'paid') return;

        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, paymentStatus: 'paid' as const, status: 'completed' as OrderStatus, updatedAt: new Date().toISOString() } : o
          ),
          tables: state.tables.map((t) =>
            t.currentOrderId === orderId ? { ...t, status: 'available' as TableStatus, currentOrderId: undefined } : t
          ),
        }));
      },

      requestPayment: (orderId, method) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? { ...o, paymentRequested: true, paymentMethod: method, updatedAt: new Date().toISOString() }
              : o
          ),
        }));
      },

      getTableOrders: (tableId) => {
        const { orders } = get();
        return orders.filter((o) => o.tableId === tableId && o.status !== 'cancelled');
      },

      getActiveOrders: () => {
        const { orders } = get();
        return orders.filter((o) => !['completed', 'cancelled'].includes(o.status));
      },

      getOrdersByWaiter: (waiterId) => {
        const { orders } = get();
        return orders.filter((o) => o.waiterId === waiterId);
      },

      setOrderMode: (mode) => {
        set({ orderMode: mode });
      },

      setCustomerPhotoRequired: (required) => {
        set({ customerPhotoRequired: required });
      },

      setPaymentTiming: (timing) => {
        set({ paymentTiming: timing });
      },

      resetData: () => {
        set({ ...initialData, currentUser: null });
      },
    }),
    {
      name: 'restoflow-storage',
      version: 3,
      partialize: (state) => ({
        menuItems: state.menuItems,
        menuCategories: state.menuCategories,
        tables: state.tables,
        tableSections: state.tableSections,
        orders: state.orders,
        orderMode: state.orderMode,
        customerPhotoRequired: state.customerPhotoRequired,
        paymentTiming: state.paymentTiming,
        cart: state.cart,
        currentOrderId: state.currentOrderId,
        users: state.users,
        organizations: state.organizations,
        roles: state.roles,
        currentUser: state.currentUser,
      }),
    }
  )
);
