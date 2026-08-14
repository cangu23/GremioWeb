'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch, setAccessToken, performRefresh } from './api';
import { UserProfile, LoginPayload, RegisterPayload } from '@gremio-estelar/shared';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (data: LoginPayload) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  register: (data: RegisterPayload & { ref?: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── User cache (sessionStorage + localStorage) ─────────────────────
const SESSION_CACHE_KEY = 'gremio_user_v2';

function getCachedUser(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_CACHE_KEY) || sessionStorage.getItem(SESSION_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setCachedUser(user: UserProfile | null) {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(user));
      sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SESSION_CACHE_KEY);
      sessionStorage.removeItem(SESSION_CACHE_KEY);
    }
  } catch { /* storage full or blocked */ }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();
  // Restore cached user optimistically so we never flash a blank / landing
  // state when the component remounts after a client-side navigation.
  //
  // ⚠️ CONVENCIÓN DE HIDRATACIÓN: este cache se lee durante el PRIMER render
  // del cliente (hidratación), pero en el SSR siempre es null (sin window).
  // Por eso, CUALQUIER componente que ramifique su render por `user` DEBE:
  //   - estar envuelto en <ClientOnly>, o
  //   - comprobar `isLoading` antes de usar `user` (p. ej. `!isLoading && !!user`)
  // De lo contrario produce mismatches de hidratación (React #418/#425/#423).
  // Ver Footer.tsx (arreglado) como referencia del patrón correcto.
  // IMPORTANTE (fix hidratación): NO leer el cache aquí. Si `user` se
  // inicializa desde localStorage en el primer render del cliente, difiere
  // del SSR (donde no hay window y user=null) y CUALQUIER componente que
  // ramifique por `user` falla la hidratación (React #418/#425/#423).
  // El cache se restaura en el primer useEffect, justo después de hidratar.
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initialCheckDone = useRef(false);
  const isRefreshing = useRef(false);

  // ─── Backend auth refresh ──────────────────────────────────────────
  const refreshAuth = useCallback(async (): Promise<boolean> => {
    if (isRefreshing.current) return true;
    isRefreshing.current = true;
    try {
      const { accessToken, rejected } = await performRefresh();

      if (accessToken) {
        try {
          const profile = await apiFetch('/users/me');
          if (profile?.id) {
            if (profile?.dailyRewardClaimed?.message) {
              showToast(`🔥 ${profile.dailyRewardClaimed.message}`, 'success');
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event('stardust-updated'));
              }
            }
            setUser(profile);
            setCachedUser(profile);
          }
        } catch (err) {
          // El access token recién renovado también fue rechazado (usuario
          // baneado/borrado, secreto rotado): la sesión está muerta → limpiar.
          // Un fallo transitorio (red/cold start) conserva el user cacheado.
          if (err instanceof Error && err.message === 'Session expired') {
            setAccessToken(null);
            setUser(null);
            setCachedUser(null);
            return false;
          }
        }
        return true;
      }

      if (rejected) {
        // El servidor rechazó explícitamente el refresh token → sesión muerta.
        setAccessToken(null);
        setUser(null);
        setCachedUser(null);
        return false;
      }

      // Fallo transitorio (cold start, red): la sesión sigue viva; conservamos
      // el user cacheado y el siguiente intento se recupera solo.
      return true;
    } catch {
      return true;
    } finally {
      isRefreshing.current = false;
    }
  }, [showToast]);

  // ─── Initial check + global event listeners ────────────────────────
  useEffect(() => {
    // Guard: only run once even if React StrictMode double-invokes effects
    if (initialCheckDone.current) return;
    initialCheckDone.current = true;

    // ── 1. Handle 401 interceptor from api.ts  ─────────────────────────
    // Se registra ANTES de lanzar loadUser: si el refresh de abajo es rechazado
    // explícitamente, el evento 'auth:unauthorized' ya tiene quién lo escuche
    // y limpia la sesión.
    const handleUnauthorized = () => {
      isRefreshing.current = false;
      setAccessToken(null);
      setUser(null);
      setCachedUser(null);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);

    const handleRefetchUser = async () => {
      try {
        const res = await apiFetch('/users/me');
        const fresh = res?.user || res?.data?.user || res?.data || res;
        if (fresh && fresh.id) {
          setUser(fresh);
          setCachedUser(fresh);
        }
      } catch {}
    };
    window.addEventListener('stardust-updated', handleRefetchUser);
    window.addEventListener('stardust:updated', handleRefetchUser);
    window.addEventListener('user-refetched', handleRefetchUser);

    // ── 2. Render inmediato ────────────────────────────────────────────
    // Restaurar el user cacheado y DESBLOQUEAR el render de inmediato. Antes,
    // `isLoading` seguía en true hasta completar refresh + /users/me (~2 round
    // trips; con cold starts del backend, decenas de segundos) y la página
    // entera (spinner del home) esperaba. Ahora el UI pinta al instante con el
    // cache y la validación de sesión ocurre en segundo plano (loadUser).
    const cached = getCachedUser();
    if (cached) setUser(cached);
    setIsLoading(false);

    const loadUser = async () => {
      const ok = await refreshAuth();
      if (!ok) {
        // refreshAuth ya limpió el estado ante rechazo explícito; esto es
        // solo red de seguridad.
        setAccessToken(null);
        setUser(null);
        setCachedUser(null);
      }
      setIsLoading(false);
    };

    loadUser();

    // ── 2. BFCache — browser back/forward cache  ───────────────────────
    // When the user navigates away and comes back via the browser's
    // back/forward cache, React components are NOT re-mounted so the
    // initial useEffect (above) never re-runs. We must re-validate the
    // session manually here. If the refresh token cookie is still valid,
    // the user keeps their session; otherwise we clear state gracefully.
    //
    // IMPORTANT: We set isLoading=true FIRST so that components show a
    // loading/skeleton state instead of immediately redirecting to login.
    // Without this, the old user state is briefly shown, then the user
    // is kicked to login when refreshAuth() fails.
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setIsLoading(true);
        refreshAuth().then(ok => {
          if (!ok) {
            setAccessToken(null);
            setUser(null);
            setCachedUser(null);
          }
          setIsLoading(false);
        });
      }
    };
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
      window.removeEventListener('stardust-updated', handleRefetchUser);
      window.removeEventListener('stardust:updated', handleRefetchUser);
      window.removeEventListener('user-refetched', handleRefetchUser);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [refreshAuth]);

  // ─── Helpers ────────────────────────────────────────────────────────
  const setUserAndCache = useCallback((newUser: UserProfile | null) => {
    setUser(newUser);
    setCachedUser(newUser);
  }, []);

  const login = async (data: LoginPayload) => {
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    setAccessToken(res.accessToken);
    setUserAndCache(res.user);
  };

  const googleLogin = async (credential: string) => {
    const res = await apiFetch('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential })
    });
    setAccessToken(res.accessToken);
    setUserAndCache(res.user);
  };

  const register = async (data: RegisterPayload) => {
    const res = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    setAccessToken(res.accessToken);
    setUserAndCache(res.user);
    showToast('¡Bienvenido a Gremio Estelar!', 'success');
  };

  const logout = async () => {
    await apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
    setAccessToken(null);
    setUserAndCache(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, googleLogin, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // During SSR (Server-Side Rendering), the AuthProvider context may not be
    // available because React context providers in client components don't
    // propagate during the server render phase of Next.js build.
    // Return a safe default so pages don't crash during static generation.
    if (typeof window === 'undefined') {
      return {
        user: null,
        isLoading: true,
        login: async () => { throw new Error('Auth not available during SSR'); },
        googleLogin: async () => { throw new Error('Auth not available during SSR'); },
        register: async () => { throw new Error('Auth not available during SSR'); },
        logout: async () => { throw new Error('Auth not available during SSR'); },
      };
    }
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
