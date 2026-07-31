import { request, buildQuery } from './client';
import { getAccessToken } from './session';
import type { ApiResponse, CreateRoleRequest, PermissionGroupsDto, RoleDto, UpdateRoleRequest } from './types';

const BASE = '/api/role-ms/v1';

export const roleApi = {
  list: (params?: { orgId?: string }) =>
    request<ApiResponse<RoleDto[]>>(`${BASE}/roles${buildQuery(params)}`, { token: getAccessToken() ?? undefined }),
  get: (id: string) => request<ApiResponse<RoleDto>>(`${BASE}/roles/${id}`, { token: getAccessToken() ?? undefined }),
  create: (payload: CreateRoleRequest) =>
    request<ApiResponse<RoleDto>>(`${BASE}/roles`, { method: 'POST', body: payload, token: getAccessToken() ?? undefined }),
  update: (id: string, payload: UpdateRoleRequest) =>
    request<ApiResponse<RoleDto>>(`${BASE}/roles/${id}`, { method: 'PUT', body: payload, token: getAccessToken() ?? undefined }),
  remove: (id: string) => request<ApiResponse<null>>(`${BASE}/roles/${id}`, { method: 'DELETE', token: getAccessToken() ?? undefined }),
  permissions: () => request<ApiResponse<PermissionGroupsDto>>(`${BASE}/roles/permissions`, { token: getAccessToken() ?? undefined }),
};
