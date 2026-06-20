let activeSessionId: string | null = null;

function safeUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Robust fallback UUID v4 generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function startNewSession(): string {
  if (typeof window === 'undefined') return "";
  const freshId = safeUUID();
  activeSessionId = freshId;
  localStorage.setItem('esnaaf_session_id', freshId);
  return freshId;
}

export function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  if (activeSessionId && activeSessionId !== 'undefined' && activeSessionId !== 'null') {
    return activeSessionId;
  }
  let sessionId = localStorage.getItem('esnaaf_session_id');
  if (!sessionId || sessionId === 'undefined' || sessionId === 'null') {
    sessionId = safeUUID();
    localStorage.setItem('esnaaf_session_id', sessionId);
  }
  activeSessionId = sessionId;
  return sessionId;
}

export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem('esnaaf_token');
  return !!token && token !== 'undefined' && token !== 'null';
}

export function logout(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('esnaaf_token');
  localStorage.removeItem('esnaaf_refresh_token');
  localStorage.removeItem('esnaaf_user');
}

export function getAuthUser(): any | null {
  if (typeof window === 'undefined') return null;
  const userJson = localStorage.getItem('esnaaf_user');
  if (!userJson || userJson === 'undefined' || userJson === 'null') return null;
  try {
    return JSON.parse(userJson);
  } catch (err) {
    return null;
  }
}

export async function customFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const sessionId = getSessionId();
  const headers = new Headers(options.headers || {});
  
  if (sessionId) {
    headers.set('X-Session-ID', sessionId);
  }

  // Inject Bearer token if logged in
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('esnaaf_token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  
  return fetch(url, {
    ...options,
    headers,
  });
}
