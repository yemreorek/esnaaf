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
  const user = localStorage.getItem('esnaaf_user');
  return !!user && user !== 'undefined' && user !== 'null';
}

export function logout(): void {
  if (typeof window === 'undefined') return;
  // Trigger backend logout to clear cookies
  fetch('/api/ortak/auth/logout', { method: 'POST', credentials: 'include' }).catch(console.error);
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

  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('esnaaf_access_token') : null;
  if (accessToken && accessToken !== 'undefined' && accessToken !== 'null') {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  
  let response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // IMPORTANT: Send cookies
    cache: 'no-store', // Disable Next.js caching
  });

  if (response.status === 401 && !url.includes('/api/ortak/auth/refresh-token') && !url.includes('/api/ortak/auth/login')) {
    try {
      const storedRefreshToken = typeof window !== 'undefined' ? localStorage.getItem('esnaaf_refresh_token') || '' : '';
      const refreshRes = await fetch('/api/ortak/auth/refresh-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ refreshToken: storedRefreshToken }),
      });
      
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        if (typeof window !== 'undefined' && refreshData.accessToken) {
          localStorage.setItem('esnaaf_access_token', refreshData.accessToken);
          localStorage.setItem('esnaaf_refresh_token', refreshData.refreshToken || storedRefreshToken);
        }
        
        // Retry with new token
        headers.set('Authorization', `Bearer ${refreshData.accessToken}`);
        response = await fetch(url, {
          ...options,
          headers,
          credentials: 'include',
          cache: 'no-store',
        });
      } else {
        // Refresh failed, clear local state and force logout silently
        localStorage.removeItem('esnaaf_is_logged_in');
        localStorage.removeItem('esnaaf_user');
      }
    } catch (err) {
      console.error('Failed to refresh token', err);
    }
  }

  return response;
}
