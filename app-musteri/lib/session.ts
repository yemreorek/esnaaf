let activeSessionId: string | null = null;

export function startNewSession(): string {
  if (typeof window === 'undefined') return "";
  const freshId = crypto.randomUUID();
  activeSessionId = freshId;
  localStorage.setItem('esnaaf_session_id', freshId);
  return freshId;
}

export function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  if (activeSessionId) {
    return activeSessionId;
  }
  let sessionId = localStorage.getItem('esnaaf_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('esnaaf_session_id', sessionId);
  }
  activeSessionId = sessionId;
  return sessionId;
}

export async function customFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const sessionId = getSessionId();
  const headers = new Headers(options.headers || {});
  
  if (sessionId) {
    headers.set('X-Session-ID', sessionId);
  }
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  
  return fetch(url, {
    ...options,
    headers,
  });
}
