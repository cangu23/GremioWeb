'use client';

import { useState, useRef, useEffect } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api';

export default function DiscordLoginButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const handleDiscordLogin = () => {
    setLoading(true);
    setError(false);
    // Redirect to Discord OAuth — the callback will redirect back to the app
    window.location.href = `${API_BASE_URL}/auth/discord`;
    // If after 5 seconds we're still here, the redirect probably failed
    setTimeout(() => {
      if (mountedRef.current) {
        setLoading(false);
        setError(true);
      }
    }, 5000);
  };

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          onClick={handleDiscordLogin}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '0.9rem',
            borderRadius: '10px',
            border: '1px solid rgba(88, 101, 242, 0.3)',
            background: 'rgba(88, 101, 242, 0.15)',
            color: '#5865F2',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontWeight: 600,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.background = 'rgba(88, 101, 242, 0.25)';
              e.currentTarget.style.borderColor = 'rgba(88, 101, 242, 0.5)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.background = 'rgba(88, 101, 242, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(88, 101, 242, 0.3)';
            }
          }}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '16px', height: '16px',
                  border: '2px solid rgba(255,255,255,0.2)',
                  borderTopColor: '#fff', borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              Redirigiendo a Discord...
            </span>
          ) : (
            <>
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#5865F2' }}>D</span>
              Discord
            </>
          )}
        </button>
        <p style={{
          fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', margin: 0,
        }}>
          ¿No redirige?{' '}
          <button
            onClick={handleDiscordLogin}
            style={{
              background: 'none', border: 'none', color: 'var(--primary)',
              cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
              textDecoration: 'underline', padding: 0,
            }}
          >
            Intenta de nuevo
          </button>
        </p>
      </div>
    );
  }

  return (
    <button
      onClick={handleDiscordLogin}
      disabled={loading}
      style={{
        width: '100%',
        padding: '12px',
        fontSize: '0.9rem',
        borderRadius: '10px',
        border: '1px solid rgba(88, 101, 242, 0.3)',
        background: loading ? 'rgba(88, 101, 242, 0.3)' : 'rgba(88, 101, 242, 0.15)',
        color: loading ? 'var(--text-muted)' : '#5865F2',
        cursor: loading ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontWeight: 600,
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        if (!loading) {
          e.currentTarget.style.background = 'rgba(88, 101, 242, 0.25)';
          e.currentTarget.style.borderColor = 'rgba(88, 101, 242, 0.5)';
        }
      }}
      onMouseLeave={(e) => {
        if (!loading) {
          e.currentTarget.style.background = 'rgba(88, 101, 242, 0.15)';
          e.currentTarget.style.borderColor = 'rgba(88, 101, 242, 0.3)';
        }
      }}
    >
      {loading ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '16px',
              height: '16px',
              border: '2px solid rgba(255,255,255,0.2)',
              borderTopColor: '#fff',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          Redirigiendo a Discord...
        </span>
      ) : (
        <>
          <span style={{ fontSize: '1.2rem' }}>🎮</span>
          Discord
        </>
      )}
    </button>
  );
}
