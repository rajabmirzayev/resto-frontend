import { request, buildQuery } from './client';
import { getAccessToken } from './session';
import type {
  ApiResponse,
  CreateMenuCategoryRequest,
  CreateMenuItemRequest,
  DeleteMenuCategoryRequest,
  ImageUploadDto,
  MenuCategoryDto,
  MenuItemDto,
  UpdateMenuCategoryRequest,
  UpdateMenuItemRequest,
} from './types';

const BASE = '/api/menu-ms/v1';

function mapMenuItem(item: MenuItemDto): MenuItemDto {
  const raw = item as MenuItemDto & { available?: boolean };
  return { ...raw, isAvailable: raw.available ?? raw.isAvailable };
}

export const menuApi = {
  items: async (params?: { orgId?: string; categoryId?: string; available?: boolean }) => {
    const res = await request<ApiResponse<MenuItemDto[]>>(`${BASE}/items${buildQuery(params)}`, { token: getAccessToken() ?? undefined });
    return { ...res, data: res.data.map(mapMenuItem) };
  },
  getItem: async (id: string) => {
    const res = await request<ApiResponse<MenuItemDto>>(`${BASE}/items/${id}`, { token: getAccessToken() ?? undefined });
    return { ...res, data: mapMenuItem(res.data) };
  },
  createItem: async (payload: CreateMenuItemRequest) => {
    const res = await request<ApiResponse<MenuItemDto>>(`${BASE}/items`, { method: 'POST', body: payload, token: getAccessToken() ?? undefined });
    return { ...res, data: mapMenuItem(res.data) };
  },
  updateItem: async (id: string, payload: UpdateMenuItemRequest) => {
    const res = await request<ApiResponse<MenuItemDto>>(`${BASE}/items/${id}`, { method: 'PUT', body: payload, token: getAccessToken() ?? undefined });
    return { ...res, data: mapMenuItem(res.data) };
  },
  removeItem: (id: string) => request<ApiResponse<null>>(`${BASE}/items/${id}`, { method: 'DELETE', token: getAccessToken() ?? undefined }),
  uploadItemImage: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<ApiResponse<ImageUploadDto>>(`${BASE}/items/${id}/image`, { method: 'POST', body: formData, token: getAccessToken() ?? undefined });
  },
  removeItemImage: (id: string) =>
    request<ApiResponse<null>>(`${BASE}/items/${id}/image`, { method: 'DELETE', token: getAccessToken() ?? undefined }),

  categories: (params?: { orgId?: string }) =>
    request<ApiResponse<MenuCategoryDto[]>>(`${BASE}/categories${buildQuery(params)}`, { token: getAccessToken() ?? undefined }),
  getCategory: (id: string) => request<ApiResponse<MenuCategoryDto>>(`${BASE}/categories/${id}`, { token: getAccessToken() ?? undefined }),
  createCategory: (payload: CreateMenuCategoryRequest) =>
    request<ApiResponse<MenuCategoryDto>>(`${BASE}/categories`, { method: 'POST', body: payload, token: getAccessToken() ?? undefined }),
  updateCategory: (id: string, payload: UpdateMenuCategoryRequest) =>
    request<ApiResponse<MenuCategoryDto>>(`${BASE}/categories/${id}`, { method: 'PUT', body: payload, token: getAccessToken() ?? undefined }),
  removeCategory: (id: string, payload?: DeleteMenuCategoryRequest) =>
    request<ApiResponse<null>>(`${BASE}/categories/${id}`, { method: 'DELETE', body: payload, token: getAccessToken() ?? undefined }),
};
