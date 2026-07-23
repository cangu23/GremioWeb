'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch, setAccessToken } from './api';
import { UserProfile, LoginPayload, RegisterPayload } from '@gremio-estelar/shared';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (data: LoginPayload) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── sessionStorage cache ────────────────────────────────────────────
// This lets us survive component re-mounts (e.g. during Next.js
// client-side navigation or BFCache restore) without flashing the
// landing page while the background auth check runs.
const SESSION_CACHE_KEY = 'gremio_user_v2';

function getCachedUser(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setCachedUser(user: UserProfile | null) {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(user));
    } else {
      sessionStorage.removeItem(SESSION_CACHE_KEY);
    }
  } catch { /* sessionStorage may be full or blocked */ }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Restore cached user optimistically so we never flash a blank / landing
  // state when the component remounts after a client-side navigation.
  const [user, setUser] = useState<UserProfile | null>(() => getCachedUser());
  const [isLoading, setIsLoading] = useState(true);
  const initialCheckDone = useRef(false);
  const isRefreshing = useRef(false);

  // ─── Backend auth refresh ──────────────────────────────────────────
  const refreshAuth = useCallback(async (): Promise<boolean> => {
    // Prevent concurrent refresh calls. The refresh token is rotated on
    // every call, so two concurrent calls will cause one to fail, which
    // would incorrectly log the user out.
    if (isRefreshing.current) return true;
    isRefreshing.current = true;
    try {
      const session = await apiFetch('/auth/refresh', { method: 'POST' });
      if (session?.accessToken) {
        setAccessToken(session.accessToken);
        const profile = await apiFetch('/users/me');
        setUser(profile);
        setCachedUser(profile);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      isRefreshing.current = false;
    }
  }, []);

  // ─── Initial check + global event listeners ────────────────────────
  useEffect(() => {
    // Guard: only run once even if React StrictMode double-invokes effects
    if (initialCheckDone.current) return;
    initialCheckDone.current = true;

    const loadUser = async () => {
      const ok = await refreshAuth();
      if (!ok) {
        setAccessToken(null);
        setUser(null);
        setCachedUser(null);
      }
      setIsLoading(false);
    };

    loadUser();

    // ── 1. Handle 401 interceptor from api.ts  ─────────────────────────
    const handleUnauthorized = () => {
      isRefreshing.current = false;
      setAccessToken(null);
      setUser(null);
      setCachedUser(null);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);

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

    // ── 3. Tab switch — user returns after being away  ─────────────────
    // Silently re-validate the session so that if the access/refresh
    // token expired while the user was on another tab, we recover
    // transparently instead of waiting for the next 401.
    //
    // Note: refreshAuth() has an isRefreshing guard, so if BFCache
    // restore fires both pageshow and visibilitychange simultaneously,
    // only the first call proceeds. The second is a no-op.
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshAuth();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
      window.removeEventListener('pageshow', handlePageShow);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
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

  const { showToast } = useToast();

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
