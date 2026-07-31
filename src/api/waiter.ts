import { request, buildQuery } from './client';
import { getAccessToken } from './session';
import type { ApiResponse, OrderDto, WaiterTablesDto } from './types';

const BASE = '/api/waiter-ms/v1';

export const waiterApi = {
  tables: (params?: { orgId?: string }) =>
    request<ApiResponse<WaiterTablesDto>>(`${BASE}/tables${buildQuery(params)}`, { token: getAccessToken() ?? undefined }),
  pendingConfirm: (params?: { orgId?: string }) =>
    request<ApiResponse<OrderDto[]>>(`${BASE}/orders/pending-confirm${buildQuery(params)}`, { token: getAccessToken() ?? undefined }),
  paymentRequests: (params?: { orgId?: string }) =>
    request<ApiResponse<OrderDto[]>>(`${BASE}/orders/payment-requests${buildQuery(params)}`, { token: getAccessToken() ?? undefined }),
};
