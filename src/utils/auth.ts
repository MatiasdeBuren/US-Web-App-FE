/**
 * Decodes the payload of a JWT (no signature verification — that happens server-side).
 * Returns null if the token is malformed.
 */
export function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1];
    if (!base64) return null;
    // Convert base64url → base64 → JSON
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Returns true if the token is missing, malformed, or its `exp` claim is in the past.
 */
export function isTokenExpired(token: string | null | undefined): boolean {
  if (!token) return true;
  const payload = parseJwtPayload(token);
  if (!payload) return true;
  if (typeof payload.exp !== 'number') return false; // no exp claim → treat as valid
  return payload.exp < Math.floor(Date.now() / 1000);
}

/**
 * Clears all authentication data from localStorage and hard-redirects to the login page.
 * Safe to call from any context (no React hooks required).
 */
export function handleUnauthorized(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('userData');
  window.location.replace('/#/login');
}
