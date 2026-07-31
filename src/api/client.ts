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

export interface ProblemDetail {
  type?: string;
  title?: string;
  status: number;
  detail?: string;
  instance?: string;
  key?: string;
  path?: string;
  timestamp?: string;
  fieldErrors?: { field: string; message: string }[];
}

export class ApiError extends Error {
  readonly status: number;
  readonly key?: string;
  readonly detail?: string;

  constructor(status: number, message: string, detail?: string, key?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
    this.key = key;
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
  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');

  if (!response.ok) {
    let problem: ProblemDetail | undefined;
    if (isJson) {
      try {
        problem = (await response.json()) as ProblemDetail;
      } catch {
        // ignore malformed body
      }
    }
    throw new ApiError(response.status, problem?.detail ?? response.statusText, problem?.detail, problem?.key);
  }

  if (response.status === 204 || !isJson) return undefined as T;
  return (await response.json()) as T;
}
