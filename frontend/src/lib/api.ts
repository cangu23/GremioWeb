let currentAccessToken: string | null = null;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api';

export const setAccessToken = (token: string | null) => {
  currentAccessToken = token;
};

export const getAccessToken = () => currentAccessToken;

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
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
  if (response.status === 401 && endpoint !== '/auth/refresh' && endpoint !== '/auth/login') {
    const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (refreshRes.ok) {
      const data = await refreshRes.json();
      
      // If refresh returned null accessToken, the user isn't logged in
      if (!data?.accessToken) {
        setAccessToken(null);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth:unauthorized'));
        }
        throw new Error('Session expired');
      }

      setAccessToken(data.accessToken);
      
      // Retry original request
      headers.set('Authorization', `Bearer ${data.accessToken}`);
      response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });
    } else {
      setAccessToken(null);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
      throw new Error('Unable to refresh session');
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

  return data;
}
