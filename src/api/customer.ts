import { request } from './client';
import { getAccessToken } from './token';
import type { ApiResponse, CreateCustomerOrderRequest, CustomerMenuDto, CustomerTableDto, OrderDto, RequestBillRequest } from './types';

const BASE = '/api/customer-ms/v1';

export const customerApi = {
  menu: (orgId: string) => request<ApiResponse<CustomerMenuDto>>(`${BASE}/${orgId}/menu`),
  tables: (orgId: string) => request<ApiResponse<CustomerTableDto[]>>(`${BASE}/${orgId}/tables`),
  createOrder: (payload: CreateCustomerOrderRequest) =>
    request<ApiResponse<OrderDto>>(`${BASE}/orders`, { method: 'POST', body: payload }),
  getOrder: (orderId: string) => request<ApiResponse<OrderDto>>(`${BASE}/orders/${orderId}`, { token: getAccessToken() ?? undefined }),
  requestBill: (orderId: string, payload: RequestBillRequest) =>
    request<ApiResponse<null>>(`${BASE}/orders/${orderId}/request-bill`, { method: 'POST', body: payload }),
};
