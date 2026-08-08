'use client';

import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/lib/ToastContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

/* Official Google "G" multicolor logo */
const GoogleLogo = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0, display: 'block' }}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

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
          padding: '10px 14px',
          fontSize: '0.85rem',
          borderRadius: '12px',
          border: '1px solid rgba(232, 199, 122, 0.2)',
          background: 'rgba(255, 255, 255, 0.04)',
          color: 'rgba(255, 255, 255, 0.5)',
          cursor: 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '9px',
          fontWeight: 600,
          letterSpacing: '0.02em',
          opacity: 0.75,
        }}
      >
        <GoogleLogo size={20} />
        Google
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
          padding: '10px 14px',
          fontSize: '0.85rem',
          borderRadius: '12px',
          border: '1px solid rgba(255,77,79,0.3)',
          background: 'rgba(255,77,79,0.08)',
          color: '#ff4d4f',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '9px',
          fontWeight: 600,
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,77,79,0.15)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,77,79,0.08)'; }}
      >
        <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ff4d4f' }}>!</span>
        Reintentar
      </button>
    );
  }

  // ⚡ OPTIMIZACIÓN: el provider se auto-contiene aquí (antes vivía en el
  // layout global e inyectaba el script GSI de Google en TODAS las páginas).
  // GoogleLoginButton solo se renderiza en /login y /register, así que el
  // script de ~300KB solo se descarga donde de verdad se usa.
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <GoogleLogin
      onSuccess={async (credentialResponse) => {
        try {
          if (!credentialResponse.credential) {
            showToast('Error: No se recibió credencial de Google', 'error');
            return;
          }
          await googleLogin(credentialResponse.credential);
          showToast('Inicio de sesión con Google exitoso', 'success');
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
      text="continue_with"
      shape="rectangular"
      containerProps={{
        className: 'google-login-wrap',
        style: {
          width: '100%',
          height: '42px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
          borderRadius: '12px',
          border: '1px solid rgba(232, 199, 122, 0.2)',
          boxShadow: '0 4px 18px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255,255,255,0.04)',
          background: 'rgba(255, 255, 255, 0.045)',
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        },
      }}
    />
    </GoogleOAuthProvider>
  );
}
