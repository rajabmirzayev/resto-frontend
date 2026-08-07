import { request, buildQuery } from './client';
import { getAccessToken } from './session';
import type {
  ApiResponse,
  AssignUsersRequest,
  CreateRoleRequest,
  CreateUserRequest,
  ModuleDto,
  ModuleTreeDto,
  PageDto,
  PermissionDto,
  RoleResponse,
  AddPermissionsRequest,
  SetPermissionsRequest,
  StaffPerformanceDto,
  UiGroupDto,
  UpdateRoleRequest,
  UpdateUserRequest,
  UserDto,
} from './types';

const BASE = '/api/access-ms/v1';

// ===== Users =====

export interface UserListParams {
  [key: string]: string | number | undefined;
  orgId?: string;
  roleId?: string;
  q?: string;
  page?: number;
  size?: number;
}

export const accessApi = {
  // Users
  listUsers: (params?: UserListParams) =>
    request<ApiResponse<PageDto<UserDto>>>(`${BASE}/users${buildQuery(params)}`, { token: getAccessToken() ?? undefined }),

  getUser: (id: string) =>
    request<ApiResponse<UserDto>>(`${BASE}/users/${id}`, { token: getAccessToken() ?? undefined }),

  createUser: (payload: CreateUserRequest) =>
    request<ApiResponse<UserDto>>(`${BASE}/users`, { method: 'POST', body: payload, token: getAccessToken() ?? undefined }),

  updateUser: (id: string, payload: UpdateUserRequest) =>
    request<ApiResponse<UserDto>>(`${BASE}/users/${id}`, { method: 'PUT', body: payload, token: getAccessToken() ?? undefined }),

  deleteUser: (id: string) =>
    request<void>(`${BASE}/users/${id}`, { method: 'DELETE', token: getAccessToken() ?? undefined }),

  deleteUserRole: (id: string) =>
    request<void>(`${BASE}/users/${id}/role`, { method: 'DELETE', token: getAccessToken() ?? undefined }),

  staffPerformance: (params?: { orgId?: string; roleId?: string }) =>
    request<ApiResponse<StaffPerformanceDto[]>>(`${BASE}/users/staff-performance${buildQuery(params)}`, { token: getAccessToken() ?? undefined }),

  // Roles
  listRoles: (params?: { q?: string; page?: number; size?: number }) =>
    request<ApiResponse<PageDto<RoleResponse>>>(`${BASE}/roles${buildQuery(params)}`, { token: getAccessToken() ?? undefined }),

  getRole: (id: string) =>
    request<ApiResponse<RoleResponse>>(`${BASE}/roles/${id}`, { token: getAccessToken() ?? undefined }),

  createRole: (payload: CreateRoleRequest) =>
    request<ApiResponse<RoleResponse>>(`${BASE}/roles`, { method: 'POST', body: payload, token: getAccessToken() ?? undefined }),

  updateRole: (id: string, payload: UpdateRoleRequest) =>
    request<ApiResponse<RoleResponse>>(`${BASE}/roles/${id}`, { method: 'PUT', body: payload, token: getAccessToken() ?? undefined }),

  deleteRole: (id: string) =>
    request<void>(`${BASE}/roles/${id}`, { method: 'DELETE', token: getAccessToken() ?? undefined }),

  getSystemRole: (code: string) =>
    request<ApiResponse<RoleResponse>>(`${BASE}/roles/system/${code}`, { token: getAccessToken() ?? undefined }),

  // Role permissions
  addRolePermissions: (roleId: string, payload: AddPermissionsRequest) =>
    request<ApiResponse<RoleResponse>>(`${BASE}/roles/${roleId}/permissions`, { method: 'POST', body: payload, token: getAccessToken() ?? undefined }),

  setRolePermissions: (roleId: string, payload: SetPermissionsRequest) =>
    request<ApiResponse<RoleResponse>>(`${BASE}/roles/${roleId}/permissions`, { method: 'PUT', body: payload, token: getAccessToken() ?? undefined }),

  removeRolePermission: (roleId: string, permissionId: string) =>
    request<void>(`${BASE}/roles/${roleId}/permissions/${permissionId}`, { method: 'DELETE', token: getAccessToken() ?? undefined }),

  // Role users
  listRoleUsers: (roleId: string, params?: { q?: string; page?: number; size?: number }) =>
    request<ApiResponse<PageDto<UserDto>>>(`${BASE}/roles/${roleId}/users${buildQuery(params)}`, { token: getAccessToken() ?? undefined }),

  assignRoleUsers: (roleId: string, payload: AssignUsersRequest) =>
    request<void>(`${BASE}/roles/${roleId}/users`, { method: 'POST', body: payload, token: getAccessToken() ?? undefined }),

  removeRoleUser: (roleId: string, userId: string) =>
    request<void>(`${BASE}/roles/${roleId}/users/${userId}`, { method: 'DELETE', token: getAccessToken() ?? undefined }),

  // Permissions
  myPermissions: () =>
    request<ApiResponse<{ code: string }[]>>(`${BASE}/permissions/my`, { token: getAccessToken() ?? undefined }),

  listPermissions: (params?: { q?: string; module?: string; uiGroup?: string; page?: number; size?: number }) =>
    request<ApiResponse<PageDto<PermissionDto>>>(`${BASE}/permissions${buildQuery(params)}`, { token: getAccessToken() ?? undefined }),

  permissionsTree: (params?: { q?: string }) =>
    request<ApiResponse<ModuleTreeDto[]>>(`${BASE}/permissions/tree${buildQuery(params)}`, { token: getAccessToken() ?? undefined }),

  permissionsByModule: (module: string, params?: { q?: string }) =>
    request<ApiResponse<PermissionDto[]>>(`${BASE}/permissions/by-module${buildQuery({ module, ...params })}`, { token: getAccessToken() ?? undefined }),

  permissionsByUiGroup: (uiGroup: string, params?: { q?: string }) =>
    request<ApiResponse<PermissionDto[]>>(`${BASE}/permissions/by-ui-group${buildQuery({ uiGroup, ...params })}`, { token: getAccessToken() ?? undefined }),

  // Modules
  listModules: (params?: { q?: string }) =>
    request<ApiResponse<ModuleDto[]>>(`${BASE}/modules${buildQuery(params)}`, { token: getAccessToken() ?? undefined }),

  // UI Groups
  listUiGroups: (params?: { q?: string; module?: string }) =>
    request<ApiResponse<UiGroupDto[]>>(`${BASE}/ui-groups${buildQuery(params)}`, { token: getAccessToken() ?? undefined }),
};
