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

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options;

  const headers: Record<string, string> = { Accept: 'application/json' };
  const isFormData = body instanceof FormData;
  if (body !== undefined && !isFormData) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
  });

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
