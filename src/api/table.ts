import { request, buildQuery } from './client';
import { getAccessToken } from './session';
import type {
  ApiResponse,
  CreateSectionRequest,
  CreateTableRequest,
  RestaurantTableDto,
  SectionDto,
  UpdateReservationRequest,
  UpdateSectionRequest,
  UpdateTableRequest,
  UpdateTableStatusRequest,
} from './types';

const BASE = '/api/table-ms/v1';

export const tableApi = {
  list: (params?: { orgId?: string; sectionId?: string; status?: string }) =>
    request<ApiResponse<RestaurantTableDto[]>>(`${BASE}/tables${buildQuery(params)}`, { token: getAccessToken() ?? undefined }),
  get: (id: string) => request<ApiResponse<RestaurantTableDto>>(`${BASE}/tables/${id}`, { token: getAccessToken() ?? undefined }),
  create: (payload: CreateTableRequest) =>
    request<ApiResponse<RestaurantTableDto>>(`${BASE}/tables`, { method: 'POST', body: payload, token: getAccessToken() ?? undefined }),
  update: (id: string, payload: UpdateTableRequest) =>
    request<ApiResponse<RestaurantTableDto>>(`${BASE}/tables/${id}`, { method: 'PUT', body: payload, token: getAccessToken() ?? undefined }),
  remove: (id: string) => request<ApiResponse<null>>(`${BASE}/tables/${id}`, { method: 'DELETE', token: getAccessToken() ?? undefined }),
  updateStatus: (id: string, payload: UpdateTableStatusRequest) =>
    request<ApiResponse<RestaurantTableDto>>(`${BASE}/tables/${id}/status`, { method: 'PUT', body: payload, token: getAccessToken() ?? undefined }),
  updateReservation: (id: string, payload: UpdateReservationRequest) =>
    request<ApiResponse<RestaurantTableDto>>(`${BASE}/tables/${id}/reservation`, { method: 'PUT', body: payload, token: getAccessToken() ?? undefined }),
  removeReservation: (id: string) =>
    request<ApiResponse<RestaurantTableDto>>(`${BASE}/tables/${id}/reservation`, { method: 'DELETE', token: getAccessToken() ?? undefined }),

  sections: (params?: { orgId?: string }) =>
    request<ApiResponse<SectionDto[]>>(`${BASE}/sections${buildQuery(params)}`, { token: getAccessToken() ?? undefined }),
  createSection: (payload: CreateSectionRequest) =>
    request<ApiResponse<SectionDto>>(`${BASE}/sections`, { method: 'POST', body: payload, token: getAccessToken() ?? undefined }),
  updateSection: (id: string, payload: UpdateSectionRequest) =>
    request<ApiResponse<SectionDto>>(`${BASE}/sections/${id}`, { method: 'PUT', body: payload, token: getAccessToken() ?? undefined }),
  removeSection: (id: string) => request<ApiResponse<null>>(`${BASE}/sections/${id}`, { method: 'DELETE', token: getAccessToken() ?? undefined }),
};
