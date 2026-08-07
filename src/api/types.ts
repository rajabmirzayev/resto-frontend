export interface ApiResponse<T> {
  success: boolean;
  message: string;
  errorCode: string | null;
  data: T;
}

export interface LocalizedString {
  az: string;
  en: string;
  ru: string;
}

// ===== Pagination =====

export interface PageDto<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// ===== Common enums =====

export type UserRoleEnum = 'ADMIN' | 'ORG_ADMIN' | 'WAITER' | 'CHEF' | 'CUSTOMER';
export type TableStatusEnum = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING';
export type OrderStatusEnum = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'SERVED' | 'COMPLETED' | 'CANCELLED';
export type OrderItemStatusEnum = 'PENDING' | 'PREPARING' | 'READY' | 'SERVED';
export type PaymentStatusEnum = 'PENDING' | 'PAID';
export type PaymentMethodEnum = 'CASH' | 'CARD';
export type OrderModeEnum = 'WAITER' | 'CUSTOMER' | 'CUSTOMER_WAITER_CONFIRM' | 'KITCHEN';
export type OrderSourceEnum = 'WAITER' | 'CUSTOMER';
export type CustomerThemeEnum = 'CLASSIC' | 'EMERALD' | 'SUNSET' | 'ROSE' | 'VIOLET' | 'AMBER';
export type PaymentTimingEnum = 'BEFORE' | 'AFTER';
export type UiScope = 'SUPER_ADMIN_PANEL' | 'ADMIN_PANEL' | 'WAITER_PANEL' | 'KITCHEN_PANEL';

// ===== Organization =====

export interface OrganizationDto {
  id: string;
  name: string;
  slug: string;
  adminName: string;
  adminEmail: string;
  logoUrl: string | null;
  phone: string | null;
  address: string | null;
  createdAt: string;
}

export interface CreateOrganizationRequest {
  name: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

export interface CreateOrganizationResponse {
  organization: OrganizationDto;
  adminUser: UserDto;
  adminRole: RoleResponse;
}

export interface QrCodeDto {
  qrCodeUrl: string;
}

// ===== User / Staff =====

export interface RoleBriefDto {
  id: string;
  code: string;
  name: string;
  uiScope: UiScope;
}

export interface UserDto {
  id: string;
  keycloakId?: string;
  name: string;
  username: string;
  email: string | null;
  phone: string | null;
  orgId: string;
  role: RoleBriefDto | null;
  isActive: boolean;
}

export interface CreateUserRequest {
  name: string;
  username?: string;
  password: string;
  roleId: string;
  orgId: string;
  email: string;
  phone?: string | null;
}

export interface UpdateUserRequest {
  name?: string;
  phone?: string;
  isActive?: boolean;
  username?: string;
  email?: string;
  password?: string;
}

export interface StaffPerformanceDto {
  userId: string;
  name: string;
  role: UserRoleEnum;
  totalOrders: number;
  completedOrders: number;
  revenue: number;
  activeOrders?: number;
}

// ===== Role =====

export interface PermissionDto {
  id: string;
  code: string;
  name: string;
  description: string;
  module: ModuleRefDto;
  uiGroup: UiGroupRefDto;
  sortOrder: number;
  isActive: boolean;
}

export interface ModuleRefDto {
  id: string;
  code: string;
  name: string;
}

export interface UiGroupRefDto {
  id: string;
  code: string;
  name: string;
}

export interface RoleResponse {
  id: string;
  code: string;
  name: string;
  uiScope: UiScope;
  isSystem: boolean;
  isActive: boolean;
  orgId: string | null;
  permissionIds: string[];
  permissions: PermissionDto[];
}

export interface CreateRoleRequest {
  code: string;
  name: string;
  uiScope: UiScope;
  permissionIds: string[];
}

export interface UpdateRoleRequest {
  name?: string;
  uiScope?: UiScope;
}

export interface AddPermissionsRequest {
  permissionIds: string[];
}

export interface SetPermissionsRequest {
  permissionIds: string[];
}

export interface AssignUsersRequest {
  userIds: string[];
}

// ===== Module & UI Group =====

export interface UiGroupDto {
  id: string;
  code: string;
  name: string;
  sortOrder: number;
  permissions: PermissionDto[];
}

export interface ModuleDto {
  id: string;
  code: string;
  name: string;
  sortOrder: number;
  uiGroups: UiGroupDto[];
}

export interface ModuleTreeDto {
  id: string;
  code: string;
  name: string;
  sortOrder: number;
  uiGroups: UiGroupDto[];
}

// ===== Menu =====

export interface MenuItemDto {
  id: string;
  name: LocalizedString;
  description: LocalizedString;
  price: number;
  categoryId: string;
  imageUrl: string | null;
  isAvailable: boolean;
  preparationTime: number;
  orgId: string;
  createdAt: string;
}

export interface MenuItemPayload {
  name: LocalizedString;
  description?: LocalizedString | null;
  price: number;
  categoryId: string;
  preparationTime: number;
  isAvailable?: boolean;
  imageUrl?: string;
}

export interface CreateMenuItemRequest extends MenuItemPayload {
  orgId: string;
}

export type UpdateMenuItemRequest = Partial<MenuItemPayload>;

export interface ImageUploadDto {
  imageUrl: string;
}

export interface MenuCategoryDto {
  id: string;
  name: LocalizedString;
  icon: string;
  sortOrder: number;
  orgId: string;
}

export interface CreateMenuCategoryRequest {
  name: LocalizedString;
  icon: string;
  sortOrder: number;
  orgId: string;
}

export interface UpdateMenuCategoryRequest {
  name?: LocalizedString;
  icon?: string;
  sortOrder?: number;
}

export interface DeleteMenuCategoryRequest {
  moveItemsTo?: string;
}

// ===== Table =====

export interface TableReservationDto {
  guestName: string;
  phone: string;
  time: string;
  guestCount: number;
  notes?: string;
}

export interface RestaurantTableDto {
  id: string;
  tableNumber: number;
  capacity: number;
  status: TableStatusEnum;
  sectionId: string;
  currentOrderId: string | null;
  reservation: TableReservationDto | null;
  orgId: string;
}

export interface CreateTableRequest {
  tableNumber: number;
  capacity: number;
  sectionId: string;
  orgId: string;
}

export interface UpdateTableRequest {
  tableNumber?: number;
  capacity?: number;
  sectionId?: string;
  status?: TableStatusEnum;
}

export interface UpdateTableStatusRequest {
  status: TableStatusEnum;
  currentOrderId?: string;
}

export interface UpdateReservationRequest {
  guestName: string;
  phone: string;
  time: string;
  guestCount: number;
  notes?: string;
}

export interface SectionDto {
  id: string;
  name: string;
  orgId: string;
}

export interface CreateSectionRequest {
  name: string;
  orgId: string;
}

export interface UpdateSectionRequest {
  name: string;
}

// ===== Order =====

export interface OrderItemDto {
  id: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  price: number;
  notes: string;
  status: OrderItemStatusEnum;
}

export interface OrderDto {
  id: string;
  tableId: string;
  tableNumber: number;
  items: OrderItemDto[];
  status: OrderStatusEnum;
  paymentStatus: PaymentStatusEnum;
  totalAmount: number;
  waiterId: string;
  waiterName: string;
  orderSource: OrderSourceEnum;
  waiterConfirmed: boolean;
  confirmedBy: string | null;
  customerPhoto: string | null;
  paymentMethod: PaymentMethodEnum | null;
  paymentRequested: boolean;
  cancelReason: string | null;
  orgId: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItemPayload {
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface CreateOrderRequest {
  tableId: string;
  waiterId?: string;
  waiterName?: string;
  orderSource: OrderSourceEnum;
  items: OrderItemPayload[];
  customerPhoto?: string;
  paymentMethod?: PaymentMethodEnum | null;
  orgId: string;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatusEnum;
}

export interface UpdateOrderItemStatusRequest {
  status: OrderItemStatusEnum;
}

export interface AddOrderItemsRequest {
  items: OrderItemPayload[];
}

export interface WaiterConfirmRequest {
  waiterId: string;
  waiterName: string;
}

export interface CancelOrderRequest {
  reason?: string;
}

export interface RequestPaymentRequest {
  method: PaymentMethodEnum;
}

// ===== Kitchen =====

export interface KitchenOrdersDto {
  new: OrderDto[];
  preparing: OrderDto[];
  ready: OrderDto[];
}

// ===== Waiter =====

export interface WaiterOrderSummary {
  totalAmount: number;
  itemCount: number;
  status: OrderStatusEnum;
}

export interface WaiterTableDto {
  id: string;
  tableNumber: number;
  capacity: number;
  status: TableStatusEnum;
  section: string;
  currentOrderId: string | null;
  orderSummary: WaiterOrderSummary | null;
}

export interface WaiterTablesDto {
  tables: WaiterTableDto[];
}

// ===== Customer =====

export interface CustomerCategoryDto {
  id: string;
  name: LocalizedString;
  icon: string;
}

export interface CustomerMenuItemDto {
  id: string;
  name: LocalizedString;
  description: LocalizedString;
  price: number;
  categoryId: string;
  imageUrl: string | null;
  isAvailable: boolean;
  preparationTime: number;
}

export interface CustomerMenuDto {
  categories: CustomerCategoryDto[];
  items: CustomerMenuItemDto[];
}

export interface CustomerTableDto {
  id: string;
  tableNumber: number;
  capacity: number;
  sectionId: string;
}

export interface CreateCustomerOrderRequest {
  orgId: string;
  tableId: string;
  items: OrderItemPayload[];
  customerPhoto?: string;
  paymentMethod?: PaymentMethodEnum | null;
}

export interface RequestBillRequest {
  method: PaymentMethodEnum;
}

// ===== Settings =====

export interface OrgSettingDto {
  orgId: string;
  orderMode: OrderModeEnum;
  customerPhotoRequired: boolean;
  paymentTiming: PaymentTimingEnum;
  customerTheme: CustomerThemeEnum;
}

export type UpdateSettingsRequest = OrgSettingDto;

// ===== Dashboard =====

export interface DashboardStatsDto {
  totalRevenue: number;
  completedOrders: number;
  activeOrders: number;
  occupiedTables: number;
}

export interface TopItemDto {
  menuItemId: string;
  name: LocalizedString;
  count: number;
  revenue?: number;
}

export interface RecentOrderDto {
  id: string;
  tableNumber: number;
  waiterName: string;
  totalAmount: number;
  status: OrderStatusEnum;
  createdAt: string;
}

export interface StaffListDto {
  id: string;
  name: string;
  role: UserRoleEnum;
  activeOrders: number;
}

// ===== Reports =====

export interface ReportSummaryDto {
  totalRevenue: number;
  completed: number;
  cancelled: number;
  avgOrderValue: number;
}

export interface DailyRevenueDto {
  date: string;
  revenue: number;
  orderCount: number;
}

export interface HourlyReportDto {
  hourly: number[];
}

export interface SalesByCategoryDto {
  categoryId: string;
  name: LocalizedString;
  count: number;
}

export interface TopItemReportDto {
  menuItemId: string;
  name: LocalizedString;
  count: number;
  revenue: number;
}

export interface StaffPerformanceReportDto {
  userId: string;
  name: string;
  role: UserRoleEnum;
  totalOrders: number;
  completedOrders: number;
  revenue: number;
}
