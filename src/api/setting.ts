import { request, buildQuery } from './client';
import { getAccessToken } from './token';
import type { ApiResponse, OrgSettingDto, UpdateSettingsRequest } from './types';

const BASE = '/api/setting-ms/v1';

export const settingApi = {
  get: (params?: { orgId?: string }) =>
    request<ApiResponse<OrgSettingDto>>(`${BASE}/settings${buildQuery(params)}`, { token: getAccessToken() ?? undefined }),
  update: (payload: UpdateSettingsRequest) =>
    request<ApiResponse<OrgSettingDto>>(`${BASE}/settings`, { method: 'PUT', body: payload, token: getAccessToken() ?? undefined }),
};
