const STORAGE_KEY = 'docuvate.had-authenticated-session';

/** Non-sensitive hint that this browser had a signed-in session (httpOnly cookies are invisible to JS). */
export function hadAuthenticatedSessionHint(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function markAuthenticatedSessionHint(): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    /* storage blocked */
  }
}

export function clearAuthenticatedSessionHint(): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage blocked */
  }
}
