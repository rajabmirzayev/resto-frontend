import { clearSession, getAccessToken, getRefreshToken, setSession } from './session';

const API_BASE_URL: string = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8001';

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

export function buildQuery(params?: QueryParams): string {
  if (!params) return '';
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export class ApiError extends Error {
  readonly status: number;
  readonly key?: string;
  readonly detail?: string;
  readonly fieldErrors?: { field: string; message: string }[];

  constructor(status: number, detail?: string, key?: string, fieldErrors?: { field: string; message: string }[]) {
    super(detail || `HTTP ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
    this.key = key;
    this.fieldErrors = fieldErrors;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string;
}

let refreshPromise: Promise<string | null> | null = null;

function redirectToLogin(): void {
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    window.location.assign('/login');
  }
}

async function performRefresh(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearSession();
    return null;
  }
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth-ms/v1/auth/refresh`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!response.ok) {
      clearSession();
      return null;
    }
    const data = (await response.json()) as { accessToken: string; refreshToken: string; expiresIn: number };
    setSession(data.accessToken, data.refreshToken, data.expiresIn);
    return data.accessToken;
  } catch {
    clearSession();
    return null;
  }
}

function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function fetchRequest(path: string, options: RequestOptions, token: string | null, allowRefresh: boolean): Promise<Response> {
  const { method = 'GET', body } = options;

  const headers: Record<string, string> = { Accept: 'application/json' };
  const isFormData = body instanceof FormData;
  if (body !== undefined && !isFormData) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
  });

  if (response.status === 401 && allowRefresh && token) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return fetchRequest(path, options, newToken, false);
    }
    redirectToLogin();
  }

  return response;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token } = options;
  const effectiveToken = token ?? getAccessToken();
  const response = await fetchRequest(path, options, effectiveToken, true);
  return parseResponse<T>(response);
}

async function parseResponse<T>(response: Response): Promise<T> {
  const ct = response.headers.get('content-type') ?? '';

  if (!response.ok) {
    if (ct.includes('json')) {
      try {
        const body = await response.json();
        throw new ApiError(response.status, body.detail || body.title || response.statusText, body.key);
      } catch (e) {
        if (e instanceof ApiError) throw e;
        try {
          const raw = await response.clone().text();
          const cleaned = raw.replace(/^\uFEFF/, '');
          const body = JSON.parse(cleaned);
          throw new ApiError(response.status, body.detail || body.title || response.statusText, body.key);
        } catch {
          throw new ApiError(response.status, response.statusText);
        }
      }
    }
    throw new ApiError(response.status, response.statusText);
  }

  if (response.status === 204 || !ct.includes('json')) return undefined as T;
  return await response.json() as T;
}
