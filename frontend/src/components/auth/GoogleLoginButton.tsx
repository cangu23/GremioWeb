'use client';

import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/lib/ToastContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export default function GoogleLoginButton() {
  const { googleLogin } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [error, setError] = useState(false);

  // If Google Client ID is not configured, show a disabled button
  if (!GOOGLE_CLIENT_ID) {
    return (
      <button
        disabled
        style={{
          width: '100%',
          padding: '12px',
          fontSize: '0.9rem',
          borderRadius: '10px',
          border: '1px solid var(--glass-border)',
          background: 'rgba(255,255,255,0.03)',
          color: 'var(--text-muted)',
          cursor: 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontWeight: 600,
          opacity: 0.5,
        }}
      >
        <span style={{ fontSize: '1.2rem' }}>🔵</span>
        Google (no configurado)
      </button>
    );
  }

  // If a previous render errored, show a retry button
  if (error) {
    return (
      <button
        onClick={() => setError(false)}
        style={{
          width: '100%',
          padding: '12px',
          fontSize: '0.9rem',
          borderRadius: '10px',
          border: '1px solid rgba(255,77,79,0.3)',
          background: 'rgba(255,77,79,0.08)',
          color: '#ff4d4f',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontWeight: 600,
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,77,79,0.15)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,77,79,0.08)'; }}
      >
        <span style={{ fontSize: '1.2rem' }}>⚠️</span>
        Error al cargar Google — Reintentar
      </button>
    );
  }

  return (
    <GoogleLogin
      onSuccess={async (credentialResponse) => {
        try {
          if (!credentialResponse.credential) {
            showToast('Error: No se recibió credencial de Google', 'error');
            return;
          }
          await googleLogin(credentialResponse.credential);
          showToast('¡Inicio de sesión con Google exitoso! 🎉', 'success');
          router.push('/dashboard');
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Error al iniciar sesión con Google';
          showToast(msg, 'error');
          setError(true);
        }
      }}
      onError={() => {
        showToast('Error al cargar el botón de Google', 'error');
        setError(true);
      }}
      theme="filled_black"
      size="large"
      text="signin_with"
      shape="rectangular"
      containerProps={{
        style: {
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
        },
      }}
    />
  );
}
