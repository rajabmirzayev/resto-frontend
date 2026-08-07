import { request } from './client';
import type { UiScope } from './types';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  user: {
    username: string;
    roles: string[];
  };
  uiScope: UiScope;
  permissions: string[];
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LogoutRequest {
  refreshToken: string;
}

export const authApi = {
  login: (payload: LoginRequest) => request<LoginResponse>('/api/auth-ms/v1/auth/login', { method: 'POST', body: payload }),
  refresh: (payload: LogoutRequest) => request<RefreshResponse>('/api/auth-ms/v1/auth/refresh', { method: 'POST', body: payload }),
  logout: (payload: LogoutRequest) => request<void>('/api/auth-ms/v1/auth/logout', { method: 'POST', body: payload }),
};
