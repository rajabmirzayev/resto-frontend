const SESSION_KEY = 'tabler-session';

export interface Session {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
}

let session: Session = loadSession();

function loadSession(): Session {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Session>;
      return {
        accessToken: typeof parsed.accessToken === 'string' ? parsed.accessToken : null,
        refreshToken: typeof parsed.refreshToken === 'string' ? parsed.refreshToken : null,
        expiresAt: typeof parsed.expiresAt === 'number' ? parsed.expiresAt : null,
      };
    }
  } catch {
    // ignore corrupted storage
  }
  return { accessToken: null, refreshToken: null, expiresAt: null };
}

function persist(): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
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

export function setSession(accessToken: string, refreshToken: string, expiresIn: number): void {
  session = {
    accessToken,
    refreshToken,
    expiresAt: Date.now() + expiresIn * 1000,
  };
  persist();
}

export function clearSession(): void {
  session = { accessToken: null, refreshToken: null, expiresAt: null };
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

export function getOrgIdFromToken(accessToken: string): string | null {
  try {
    const parts = accessToken.split('.');
    if (parts.length < 2) return null;
    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    const payload = JSON.parse(atob(padded)) as Record<string, unknown>;
    const orgId = payload['organizationId'];
    return typeof orgId === 'string' && orgId ? orgId : null;
  } catch {
    return null;
  }
}
