'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const attemptLogin = async (): Promise<boolean> => {
      try {
        const session = await apiFetch('/auth/refresh', { method: 'POST' });
        if (session?.accessToken) {
          setAccessToken(session.accessToken);
          const profile = await apiFetch('/users/me');
          setUser(profile);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    };

    const loadUser = async () => {
      // Try once, then retry after 1s for transient errors
      if (!(await attemptLogin())) {
        await new Promise(r => setTimeout(r, 1000));
        if (!(await attemptLogin())) {
          setAccessToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    loadUser();

    const handleUnauthorized = () => {
      setAccessToken(null);
      setUser(null);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (data: LoginPayload) => {
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    setAccessToken(res.accessToken);
    setUser(res.user);
  };

  const googleLogin = async (credential: string) => {
    const res = await apiFetch('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential })
    });
    setAccessToken(res.accessToken);
    setUser(res.user);
  };

  const { showToast } = useToast();

  const register = async (data: RegisterPayload) => {
    const res = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    setAccessToken(res.accessToken);
    setUser(res.user);
    showToast('¡Bienvenido a Gremio Estelar! 🎉', 'success');
  };

  const logout = async () => {
    await apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
    setAccessToken(null);
    setUser(null);
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
