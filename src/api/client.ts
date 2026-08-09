import { clearSession, getAccessToken, getRefreshToken, getTokenExpiryMs, setSession } from './session';

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

export function formatApiError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.fieldErrors && err.fieldErrors.length > 0) {
      return err.fieldErrors.map((f) => f.message).join('; ');
    }
    return err.detail || err.message || fallback;
  }
  return fallback;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string;
}

const REFRESH_MARGIN_MS = 60_000;

interface RefreshOutcome {
  accessToken: string | null;
  definitiveFailure: boolean;
}

let refreshPromise: Promise<RefreshOutcome> | null = null;

function redirectToLogin(): void {
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    window.location.assign('/login');
  }
}

async function performRefresh(): Promise<RefreshOutcome> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearSession();
    return { accessToken: null, definitiveFailure: true };
  }
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth-ms/v1/auth/refresh`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!response.ok) {
      const definitive = response.status === 400 || response.status === 401;
      if (definitive) clearSession();
      return { accessToken: null, definitiveFailure: definitive };
    }
    const data = (await response.json()) as { accessToken: string; refreshToken: string; expiresIn: number };
    setSession(data.accessToken, data.refreshToken, data.expiresIn);
    return { accessToken: data.accessToken, definitiveFailure: false };
  } catch {
    return { accessToken: null, definitiveFailure: false };
  }
}

function refreshAccessToken(): Promise<RefreshOutcome> {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export async function ensureFreshToken(): Promise<string | null> {
  const token = getAccessToken();
  if (!token) return null;
  const exp = getTokenExpiryMs(token);
  if (exp !== null && exp > Date.now() + REFRESH_MARGIN_MS) return token;
  const outcome = await refreshAccessToken();
  return outcome.accessToken;
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
    const outcome = await refreshAccessToken();
    if (outcome.accessToken) {
      return fetchRequest(path, options, outcome.accessToken, false);
    }
    if (outcome.definitiveFailure) {
      redirectToLogin();
    }
  }

  return response;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token } = options;
  const effectiveToken = token ?? getAccessToken();
  const response = await fetchRequest(path, options, effectiveToken, true);
  return parseResponse<T>(response);
}

async function readErrorBody(response: Response): Promise<{ detail?: string; title?: string; key?: string; fieldErrors?: { field: string; message: string }[] }> {
  try {
    const body = await response.json();
    return (body ?? {}) as { detail?: string; title?: string; key?: string; fieldErrors?: { field: string; message: string }[] };
  } catch {
    try {
      const raw = await response.clone().text();
      const cleaned = raw.replace(/^\uFEFF/, '');
      return JSON.parse(cleaned) as { detail?: string; title?: string; key?: string; fieldErrors?: { field: string; message: string }[] };
    } catch {
      return {};
    }
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const ct = response.headers.get('content-type') ?? '';

  if (!response.ok) {
    if (ct.includes('json')) {
      const body = await readErrorBody(response);
      throw new ApiError(
        response.status,
        body.detail || body.title || response.statusText,
        body.key,
        body.fieldErrors?.filter((f) => f && typeof f.message === 'string')
      );
    }
    throw new ApiError(response.status, response.statusText);
  }

  if (response.status === 204 || !ct.includes('json')) return undefined as T;
  return await response.json() as T;
}
