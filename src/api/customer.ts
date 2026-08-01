import { request } from './client';
import { getAccessToken } from './session';
import type { ApiResponse, CreateCustomerOrderRequest, CustomerMenuDto, CustomerMenuItemDto, CustomerTableDto, OrderDto, RequestBillRequest } from './types';

const BASE = '/api/customer-ms/v1';

function mapMenuItem(item: CustomerMenuItemDto): CustomerMenuItemDto {
  const raw = item as CustomerMenuItemDto & { available?: boolean };
  return { ...raw, isAvailable: raw.available ?? raw.isAvailable };
}

export const customerApi = {
  menu: async (orgId: string) => {
    const res = await request<ApiResponse<CustomerMenuDto>>(`${BASE}/${orgId}/menu`);
    return { ...res, data: { ...res.data, items: res.data.items.map(mapMenuItem) } };
  },
  tables: (orgId: string) => request<ApiResponse<CustomerTableDto[]>>(`${BASE}/${orgId}/tables`),
  createOrder: (payload: CreateCustomerOrderRequest) =>
    request<ApiResponse<OrderDto>>(`${BASE}/orders`, { method: 'POST', body: payload }),
  getOrder: (orderId: string) => request<ApiResponse<OrderDto>>(`${BASE}/orders/${orderId}`, { token: getAccessToken() ?? undefined }),
  requestBill: (orderId: string, payload: RequestBillRequest) =>
    request<ApiResponse<null>>(`${BASE}/orders/${orderId}/request-bill`, { method: 'POST', body: payload }),
};
