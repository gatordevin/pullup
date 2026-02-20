/**
 * Persists a pending redirect URL through auth flows.
 * Uses sessionStorage on web (survives page navigations within the same tab).
 */
const KEY = "pullup_pending_redirect";

export function setPendingRedirect(url: string): void {
  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      sessionStorage.setItem(KEY, url);
    }
  } catch {}
}

export function consumePendingRedirect(): string | null {
  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      const val = sessionStorage.getItem(KEY);
      if (val) {
        sessionStorage.removeItem(KEY);
        return val;
      }
    }
  } catch {}
  return null;
}

export function peekPendingRedirect(): string | null {
  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      return sessionStorage.getItem(KEY);
    }
  } catch {}
  return null;
}
