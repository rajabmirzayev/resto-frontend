import { request, buildQuery } from './client';
import { getAccessToken } from './session';
import type {
  ApiResponse,
  DailyRevenueDto,
  HourlyReportDto,
  ReportSummaryDto,
  SalesByCategoryDto,
  StaffPerformanceReportDto,
  TopItemReportDto,
} from './types';

const BASE = '/api/report-ms/v1';

export const reportApi = {
  summary: (params?: { orgId?: string }) =>
    request<ApiResponse<ReportSummaryDto>>(`${BASE}/summary${buildQuery(params)}`, { token: getAccessToken() ?? undefined }),
  dailyRevenue: (params?: { orgId?: string }) =>
    request<ApiResponse<DailyRevenueDto[]>>(`${BASE}/daily-revenue${buildQuery(params)}`, { token: getAccessToken() ?? undefined }),
  hourly: (params?: { orgId?: string }) =>
    request<ApiResponse<HourlyReportDto>>(`${BASE}/hourly${buildQuery(params)}`, { token: getAccessToken() ?? undefined }),
  salesByCategory: (params?: { orgId?: string }) =>
    request<ApiResponse<SalesByCategoryDto[]>>(`${BASE}/sales-by-category${buildQuery(params)}`, { token: getAccessToken() ?? undefined }),
  topItems: (params?: { orgId?: string }) =>
    request<ApiResponse<TopItemReportDto[]>>(`${BASE}/top-items${buildQuery(params)}`, { token: getAccessToken() ?? undefined }),
  staffPerformance: (params?: { orgId?: string }) =>
    request<ApiResponse<StaffPerformanceReportDto[]>>(`${BASE}/staff-performance${buildQuery(params)}`, { token: getAccessToken() ?? undefined }),
};
