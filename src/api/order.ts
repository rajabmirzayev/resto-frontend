import { request, buildQuery } from './client';
import { getAccessToken } from './token';
import type {
  AddOrderItemsRequest,
  ApiResponse,
  CancelOrderRequest,
  CreateOrderRequest,
  OrderDto,
  RequestPaymentRequest,
  UpdateOrderItemStatusRequest,
  UpdateOrderStatusRequest,
  WaiterConfirmRequest,
} from './types';

const BASE = '/api/order-ms/v1';

export const orderApi = {
  list: (params?: { orgId?: string; status?: string; tableId?: string; waiterId?: string }) =>
    request<ApiResponse<OrderDto[]>>(`${BASE}/orders${buildQuery(params)}`, { token: getAccessToken() ?? undefined }),
  get: (id: string) => request<ApiResponse<OrderDto>>(`${BASE}/orders/${id}`, { token: getAccessToken() ?? undefined }),
  create: (payload: CreateOrderRequest) =>
    request<ApiResponse<OrderDto>>(`${BASE}/orders`, { method: 'POST', body: payload, token: getAccessToken() ?? undefined }),
  updateStatus: (id: string, payload: UpdateOrderStatusRequest) =>
    request<ApiResponse<OrderDto>>(`${BASE}/orders/${id}/status`, { method: 'PUT', body: payload, token: getAccessToken() ?? undefined }),
  updateItemStatus: (orderId: string, itemId: string, payload: UpdateOrderItemStatusRequest) =>
    request<ApiResponse<OrderDto>>(`${BASE}/orders/${orderId}/items/${itemId}/status`, { method: 'PUT', body: payload, token: getAccessToken() ?? undefined }),
  addItems: (id: string, payload: AddOrderItemsRequest) =>
    request<ApiResponse<OrderDto>>(`${BASE}/orders/${id}/items`, { method: 'POST', body: payload, token: getAccessToken() ?? undefined }),
  waiterConfirm: (id: string, payload: WaiterConfirmRequest) =>
    request<ApiResponse<OrderDto>>(`${BASE}/orders/${id}/waiter-confirm`, { method: 'PUT', body: payload, token: getAccessToken() ?? undefined }),
  cancel: (id: string, payload?: CancelOrderRequest) =>
    request<ApiResponse<OrderDto>>(`${BASE}/orders/${id}/cancel`, { method: 'POST', body: payload, token: getAccessToken() ?? undefined }),
  requestPayment: (id: string, payload: RequestPaymentRequest) =>
    request<ApiResponse<OrderDto>>(`${BASE}/orders/${id}/request-payment`, { method: 'POST', body: payload, token: getAccessToken() ?? undefined }),
  completePayment: (id: string) =>
    request<ApiResponse<OrderDto>>(`${BASE}/orders/${id}/complete-payment`, { method: 'POST', token: getAccessToken() ?? undefined }),
  startPreparing: (id: string) =>
    request<ApiResponse<OrderDto>>(`${BASE}/orders/${id}/start-preparing`, { method: 'POST', token: getAccessToken() ?? undefined }),
  markAllReady: (id: string) =>
    request<ApiResponse<OrderDto>>(`${BASE}/orders/${id}/mark-all-ready`, { method: 'POST', token: getAccessToken() ?? undefined }),
};
