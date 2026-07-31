import { request, buildQuery } from './client';
import { getAccessToken } from './token';
import type { ApiResponse, DashboardStatsDto, RecentOrderDto, StaffListDto, TopItemDto } from './types';

const BASE = '/api/dashboard-ms/v1';

export const dashboardApi = {
  stats: (params?: { orgId?: string }) =>
    request<ApiResponse<DashboardStatsDto>>(`${BASE}/stats${buildQuery(params)}`, { token: getAccessToken() ?? undefined }),
  topItems: (params?: { orgId?: string }) =>
    request<ApiResponse<TopItemDto[]>>(`${BASE}/top-items${buildQuery(params)}`, { token: getAccessToken() ?? undefined }),
  recentOrders: (params?: { orgId?: string }) =>
    request<ApiResponse<RecentOrderDto[]>>(`${BASE}/recent-orders${buildQuery(params)}`, { token: getAccessToken() ?? undefined }),
  staffList: (params?: { orgId?: string }) =>
    request<ApiResponse<StaffListDto[]>>(`${BASE}/staff-list${buildQuery(params)}`, { token: getAccessToken() ?? undefined }),
};
