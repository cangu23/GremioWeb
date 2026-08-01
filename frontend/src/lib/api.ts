let currentAccessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

// In production, Next.js rewrites /api/* to the Express backend (port 4001).
// In development, the Next.js dev server proxies to the Express backend (port 4000).
// Set NEXT_PUBLIC_API_BASE_URL to '/api' for production, or the full URL for dev.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

export const setAccessToken = (token: string | null) => {
  currentAccessToken = token;
};

export const getAccessToken = () => currentAccessToken;

export async function performRefresh(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (refreshRes.ok) {
        const data = await refreshRes.json();
        if (data?.accessToken) {
          setAccessToken(data.accessToken);
          return data.accessToken;
        }
      }

      setAccessToken(null);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
      return null;
    } catch {
      setAccessToken(null);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export const notifyStardustChanged = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('stardust:updated'));
  }
};

export const notifyMissionsChanged = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('missions:updated'));
    window.dispatchEvent(new CustomEvent('stardust:updated'));
  }
};

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  
  // If no access token is set yet, but a refresh check is currently running (e.g. on page reload F5),
  // wait for the refresh promise before making authenticated calls.
  if (!currentAccessToken && refreshPromise && endpoint !== '/auth/refresh' && endpoint !== '/auth/login' && endpoint !== '/auth/register') {
    await refreshPromise;
  }

  if (currentAccessToken) {
    headers.set('Authorization', `Bearer ${currentAccessToken}`);
  }

  let response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  // The refresh token is stored only in an HttpOnly cookie by the backend.
  if (response.status === 401 && endpoint !== '/auth/refresh' && endpoint !== '/auth/login' && endpoint !== '/auth/register') {
    const newAccessToken = await performRefresh();

    if (newAccessToken) {
      // Retry original request with new access token
      headers.set('Authorization', `Bearer ${newAccessToken}`);
      response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });
    } else {
      throw new Error('Session expired');
    }
  }

  // Handle empty responses (like 204 No Content for logout)
  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || 'Something went wrong');
  }

  // Auto-dispatch real-time updates for score/reward modifying routes
  if (options.method && ['POST', 'PUT', 'DELETE'].includes(options.method.toUpperCase())) {
    if (endpoint.includes('/claim') || endpoint.includes('/missions') || endpoint.includes('/like') || endpoint.includes('/comment') || endpoint.includes('/feed') || endpoint.includes('/stardust') || endpoint.includes('/buy') || endpoint.includes('/equip')) {
      notifyMissionsChanged();
    }
  }

  return data;
}

