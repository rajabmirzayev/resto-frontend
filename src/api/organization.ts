import { request } from './client';
import { getAccessToken } from './token';
import type { ApiResponse, CreateOrganizationRequest, CreateOrganizationResponse, OrganizationDto, QrCodeDto } from './types';

const BASE = '/api/organization-ms/v1';

export const organizationApi = {
  list: () => request<ApiResponse<OrganizationDto[]>>(`${BASE}/organizations`, { token: getAccessToken() ?? undefined }),
  get: (orgId: string) => request<ApiResponse<OrganizationDto>>(`${BASE}/organizations/${orgId}`, { token: getAccessToken() ?? undefined }),
  create: (payload: CreateOrganizationRequest) =>
    request<ApiResponse<CreateOrganizationResponse>>(`${BASE}/organizations`, { method: 'POST', body: payload, token: getAccessToken() ?? undefined }),
  getQrCode: (orgId: string) => request<ApiResponse<QrCodeDto>>(`${BASE}/organizations/${orgId}/qr-code`, { token: getAccessToken() ?? undefined }),
};
