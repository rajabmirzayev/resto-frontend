import { request } from './client';
import { getAccessToken } from './session';
import type { ApiResponse, CreateCustomerOrderRequest, CustomerMenuDto, CustomerMenuItemDto, CustomerTableDto, CustomerOrderDto, RequestBillRequest } from './types';

const BASE = '/api/customer-ms/v1';

function mapMenuItem(item: CustomerMenuItemDto): CustomerMenuItemDto {
  const raw = item as CustomerMenuItemDto & { available?: boolean };
  return { ...raw, isAvailable: raw.isAvailable ?? raw.available };
}

export const customerApi = {
  menu: async (orgId: string) => {
    const res = await request<ApiResponse<CustomerMenuDto>>(`${BASE}/${orgId}/menu`);
    return { ...res, data: { ...res.data, items: res.data.items.map(mapMenuItem) } };
  },
  tables: (orgId: string) => request<ApiResponse<CustomerTableDto[]>>(`${BASE}/${orgId}/tables`),
  createOrder: (payload: CreateCustomerOrderRequest) =>
    request<ApiResponse<CustomerOrderDto>>(`${BASE}/orders`, { method: 'POST', body: payload }),
  getOrder: (orderId: string, token?: string) =>
    request<ApiResponse<CustomerOrderDto>>(`${BASE}/orders/${orderId}${token ? `?token=${encodeURIComponent(token)}` : ''}`, { token: getAccessToken() ?? undefined }),
  requestBill: (orderId: string, payload: RequestBillRequest, token?: string) =>
    request<ApiResponse<null>>(`${BASE}/orders/${orderId}/request-bill${token ? `?token=${encodeURIComponent(token)}` : ''}`, { method: 'POST', body: payload }),
};
