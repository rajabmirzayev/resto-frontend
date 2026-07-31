import { request, buildQuery } from './client';
import { getAccessToken } from './token';
import type { ApiResponse, KitchenOrdersDto } from './types';

const BASE = '/api/kitchen-ms/v1';

export const kitchenApi = {
  orders: (params?: { orgId?: string }) =>
    request<ApiResponse<KitchenOrdersDto>>(`${BASE}/orders${buildQuery(params)}`, { token: getAccessToken() ?? undefined }),
};
