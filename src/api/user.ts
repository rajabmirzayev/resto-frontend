import { request, buildQuery } from './client';
import { getAccessToken } from './session';
import type { ApiResponse, CreateUserRequest, StaffPerformanceDto, UpdateUserRequest, UserDto } from './types';

const BASE = '/api/access-ms/v1';

export const userApi = {
  list: (params?: { orgId?: string; roleId?: string }) =>
    request<ApiResponse<UserDto[]>>(`${BASE}/users${buildQuery(params)}`, { token: getAccessToken() ?? undefined }),
  get: (id: string) => request<ApiResponse<UserDto>>(`${BASE}/users/${id}`, { token: getAccessToken() ?? undefined }),
  create: (payload: CreateUserRequest) =>
    request<ApiResponse<UserDto>>(`${BASE}/users`, { method: 'POST', body: payload, token: getAccessToken() ?? undefined }),
  update: (id: string, payload: UpdateUserRequest) =>
    request<ApiResponse<UserDto>>(`${BASE}/users/${id}`, { method: 'PUT', body: payload, token: getAccessToken() ?? undefined }),
  remove: (id: string) => request<ApiResponse<null>>(`${BASE}/users/${id}`, { method: 'DELETE', token: getAccessToken() ?? undefined }),
  staffPerformance: (params: { orgId?: string }) =>
    request<ApiResponse<StaffPerformanceDto[]>>(`${BASE}/users/staff-performance${buildQuery(params)}`, { token: getAccessToken() ?? undefined }),
  clearRole: (roleId: string) =>
    request<ApiResponse<null>>(`${BASE}/users/clear-role${buildQuery({ roleId })}`, { method: 'PUT', token: getAccessToken() ?? undefined }),
};
