const STORAGE_KEY = 'tabler-storage';

let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  if (accessToken !== null) return accessToken;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { state?: { accessToken?: unknown } };
      if (typeof parsed.state?.accessToken === 'string') {
        accessToken = parsed.state.accessToken;
      }
    }
  } catch {
    // ignore corrupted storage
  }
  return accessToken;
}
