let currentAccessToken: string | null = null;
let refreshPromise: Promise<RefreshResult> | null = null;

// ── Resultado del refresh de sesión ────────────────────────────────────────
// `rejected` indica si el servidor RECHAZÓ explícitamente el refresh token
// (401/403 o "no hay sesión"). Si es false pero accessToken es null, fue un
// fallo TRANSITORIO (red, timeout, cold start): la sesión sigue viva y no hay
// que cerrarla.
export type RefreshResult = {
  accessToken: string | null;
  rejected: boolean;
};

// Cuánto esperar a que el backend responda al refresh. En hosts que duermen
// (Render free tier → cold start de decenas de segundos) es mejor no bloquear
// la app ni tirar la sesión por una espera larga: un timeout se trata como
// fallo transitorio y el siguiente intento se recupera solo.
const REFRESH_TIMEOUT_MS = 20000;

// ── Cortafuegos anti-torrente de 401 ──────────────────────────────────────
// Cuando la sesión expira (el refresh falla, o el token renovado también es
// rechazado), entramos en un periodo de enfriamiento en el que las peticiones
// autenticadas fallan al instante SIN golpear el servidor. Sin esto, los
// polls huérfanos (dm/unread-count, notifications/unread-count, gamification,
// etc.) martillean la API con 401 cada pocos segundos hasta el infinito.
const AUTH_ENDPOINTS = ['/auth/login', '/auth/register', '/auth/google', '/auth/refresh', '/auth/logout'];
let authCooldownUntil = 0;

// In production, Next.js rewrites /api/* to the Express backend (port 4001).
// In development, the Next.js dev server proxies to the Express backend (port 4000).
// Set NEXT_PUBLIC_API_BASE_URL to '/api' for production, or the full URL for dev.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

export const setAccessToken = (token: string | null) => {
  currentAccessToken = token;
  if (token) authCooldownUntil = 0; // nueva sesión → reactivar peticiones
};

export const getAccessToken = () => currentAccessToken;

export async function performRefresh(): Promise<RefreshResult> {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async (): Promise<RefreshResult> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REFRESH_TIMEOUT_MS);

    // Sesión muerta: el servidor rechazó explícitamente el token.
    const markRejected = (): RefreshResult => {
      setAccessToken(null);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
      return { accessToken: null, rejected: true };
    };

    try {
      const attempt = async (): Promise<{ status: number; accessToken: string | null }> => {
        const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          signal: controller.signal,
        });
        if (!refreshRes.ok) {
          return { status: refreshRes.status, accessToken: null };
        }
        const data = await refreshRes.json();
        return { status: refreshRes.status, accessToken: data?.accessToken ?? null };
      };

      let result = await attempt();

      // ── Rotación concurrente entre pestañas ──────────────────────────────
      // El backend rota el refresh token en CADA refresh (borra el anterior y
      // crea uno nuevo). Si dos pestañas refrescan a la vez (cookie compartida),
      // la perdedora recibe 401 "Refresh token not found". Esperamos un instante
      // para que llegue la cookie nueva del ganador y reintentamos UNA vez: la
      // pestaña perdedora recupera la sesión en vez de cerrarse sola. Si el
      // token estaba realmente expirado/revocado, el retry también falla →
      // sesión cerrada (comportamiento correcto).
      if ((result.status === 401 || result.status === 403) && !controller.signal.aborted) {
        await new Promise((r) => setTimeout(r, 300));
        result = await attempt();
      }

      if (result.accessToken) {
        setAccessToken(result.accessToken);
        return { accessToken: result.accessToken, rejected: false };
      }

      // 200 sin token = el servidor dice que no hay sesión (visitante).
      // 401/403 tras el retry = token expirado o revocado. Ambos → sesión muerta.
      return markRejected();
    } catch {
      // Fallo TRANSITORIO (red, timeout, cold start del backend): NO cerramos
      // la sesión ni tocamos el access token en memoria. El siguiente intento
      // puede recuperarse sin que el usuario "se salga solo".
      return { accessToken: null, rejected: false };
    } finally {
      clearTimeout(timer);
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export const notifyStardustChanged = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('stardust:updated'));
    window.dispatchEvent(new Event('stardust-updated'));
    window.dispatchEvent(new CustomEvent('user-refetched'));
  }
};

export const notifyMissionsChanged = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('missions:updated'));
    notifyStardustChanged();
  }
};

// In-memory cache for GET requests
const apiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 15000; // 15 seconds cache

export const clearApiCache = () => {
  apiCache.clear();
};

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Return cached response for GET requests if fresh
  if (method === 'GET' && apiCache.has(endpoint)) {
    const cached = apiCache.get(endpoint)!;
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
    apiCache.delete(endpoint);
  }

  // Sesión expirada recientemente: cortar antes de hacer red (los endpoints
  // de auth quedan exentos para permitir volver a iniciar sesión).
  if (Date.now() < authCooldownUntil && !AUTH_ENDPOINTS.some(e => endpoint.startsWith(e))) {
    throw new Error('Session expired');
  }

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
    const refreshResult = await performRefresh();

    if (refreshResult.accessToken) {
      // Retry original request with new access token
      headers.set('Authorization', `Bearer ${refreshResult.accessToken}`);
      response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });
      // Si el token recién renovado TAMBIÉN da 401 (usuario borrado/baneado
      // o secreto rotado), la sesión está muerta: activar cortafuegos + emitir
      // logout global. Sin esto el bucle 401 se repite infinitamente en cada poll.
      if (response.status === 401) {
        authCooldownUntil = Date.now() + 60_000;
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth:unauthorized'));
        }
        throw new Error('Session expired');
      }
    } else {
      // Si el refresh fue rechazado explícitamente, performRefresh ya emitió
      // 'auth:unauthorized' (la sesión se limpia). Si fue un fallo transitorio
      // (red/cold start) la sesión se conserva; aquí solo cortamos el grifo
      // temporalmente para no martillear el servidor.
      authCooldownUntil = Date.now() + 60_000;
      throw new Error('Session expired');
    }
  }

  // Handle empty responses (like 204 No Content for logout)
  if (response.status === 204) {
    if (method !== 'GET') clearApiCache();
    return null;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || 'Something went wrong');
  }

  // Cache GET responses
  if (method === 'GET') {
    apiCache.set(endpoint, { data, timestamp: Date.now() });
  } else {
    // Clear GET cache on mutations
    clearApiCache();
  }

  // Auto-dispatch real-time updates for score/reward modifying routes
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    if (endpoint.includes('/claim') || endpoint.includes('/missions') || endpoint.includes('/like') || endpoint.includes('/comment') || endpoint.includes('/feed') || endpoint.includes('/stardust') || endpoint.includes('/buy') || endpoint.includes('/equip')) {
      notifyMissionsChanged();
    }
  }

  return data;
}

