import { request, buildQuery } from './client';
import { getAccessToken } from './session';
import type { ApiResponse, CreateRoleRequest, RoleResponse, UpdateRoleRequest } from './types';

const BASE = '/api/access-ms/v1';

export const roleApi = {
  list: (params?: { q?: string }) =>
    request<ApiResponse<RoleResponse[]>>(`${BASE}/roles${buildQuery(params)}`, { token: getAccessToken() ?? undefined }),
  get: (id: string) => request<ApiResponse<RoleResponse>>(`${BASE}/roles/${id}`, { token: getAccessToken() ?? undefined }),
  create: (payload: CreateRoleRequest) =>
    request<ApiResponse<RoleResponse>>(`${BASE}/roles`, { method: 'POST', body: payload, token: getAccessToken() ?? undefined }),
  update: (id: string, payload: UpdateRoleRequest) =>
    request<ApiResponse<RoleResponse>>(`${BASE}/roles/${id}`, { method: 'PUT', body: payload, token: getAccessToken() ?? undefined }),
  remove: (id: string) => request<ApiResponse<null>>(`${BASE}/roles/${id}`, { method: 'DELETE', token: getAccessToken() ?? undefined }),
};
