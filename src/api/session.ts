import type { UiScope } from './types';

const SESSION_KEY = 'restoflow-session';

export interface Session {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  permissions: string[];
  uiScope: UiScope | null;
}

let session: Session = loadSession();

function loadSession(): Session {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Session>;
      return {
        accessToken: typeof parsed.accessToken === 'string' ? parsed.accessToken : null,
        refreshToken: typeof parsed.refreshToken === 'string' ? parsed.refreshToken : null,
        expiresAt: typeof parsed.expiresAt === 'number' ? parsed.expiresAt : null,
        permissions: Array.isArray(parsed.permissions) ? parsed.permissions : [],
        uiScope: parsed.uiScope ?? null,
      };
    }
  } catch {
    // ignore corrupted storage
  }
  return { accessToken: null, refreshToken: null, expiresAt: null, permissions: [], uiScope: null };
}

function persist(): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // ignore storage quota/security errors
  }
}

export function getAccessToken(): string | null {
  return session.accessToken;
}

export function getRefreshToken(): string | null {
  return session.refreshToken;
}

export function getSessionExpiresAt(): number | null {
  return session.expiresAt;
}

export function getPermissions(): string[] {
  return session.permissions;
}

export function getUiScope(): string | null {
  return session.uiScope;
}

export function setSession(accessToken: string, refreshToken: string, expiresIn: number): void {
  session = {
    ...session,
    accessToken,
    refreshToken,
    expiresAt: Date.now() + expiresIn * 1000,
  };
  persist();
}

export function setPermissions(permissions: string[]): void {
  session = { ...session, permissions };
  persist();
}

export function setUiScope(uiScope: UiScope): void {
  session = { ...session, uiScope };
  persist();
}

export function clearSession(): void {
  session = { accessToken: null, refreshToken: null, expiresAt: null, permissions: [], uiScope: null };
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

function decodeTokenPayload(accessToken: string): Record<string, unknown> | null {
  try {
    const parts = accessToken.split('.');
    if (parts.length < 2) return null;
    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getUserIdFromToken(accessToken: string): string | null {
  const payload = decodeTokenPayload(accessToken);
  const userId = payload?.['sub'];
  return typeof userId === 'string' && userId ? userId : null;
}

export function getOrgIdFromToken(accessToken: string): string | null {
  const payload = decodeTokenPayload(accessToken);
  const orgId = payload?.['organizationId'];
  return typeof orgId === 'string' && orgId ? orgId : null;
}

export interface TokenClaims {
  sub?: string;
  organizationId?: string;
  roles?: string[];
  permissions?: string[];
  uiScope?: string;
  exp?: number;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

export function getTokenClaims(accessToken?: string | null): TokenClaims | null {
  const token = accessToken ?? session.accessToken;
  if (!token) return null;
  const payload = decodeTokenPayload(token);
  if (!payload) return null;
  return {
    sub: typeof payload['sub'] === 'string' ? payload['sub'] : undefined,
    organizationId: typeof payload['organizationId'] === 'string' ? payload['organizationId'] : undefined,
    roles: stringArray(payload['roles']),
    permissions: stringArray(payload['permissions']),
    uiScope: typeof payload['uiScope'] === 'string' ? payload['uiScope'] : undefined,
    exp: typeof payload['exp'] === 'number' ? payload['exp'] : undefined,
  };
}

export function getTokenExpiryMs(accessToken?: string | null): number | null {
  const exp = getTokenClaims(accessToken)?.exp;
  return typeof exp === 'number' ? exp * 1000 : null;
}

export function isAccessTokenExpired(marginMs = 0): boolean {
  const exp = getTokenExpiryMs();
  return exp === null || Date.now() + marginMs >= exp;
}
