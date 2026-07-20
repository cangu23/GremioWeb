'use client';

import { useEffect } from 'react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Page error:', error);
  }, [error]);

  return (
    <div
      className="container"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 'calc(100vh - 80px)',
        padding: '20px',
        textAlign: 'center',
      }}
    >
      <div
        className="glass"
        style={{
          padding: '60px 40px',
          maxWidth: '480px',
          width: '100%',
          borderRadius: '24px',
        }}
      >
        <div
          style={{
            fontSize: '5rem',
            fontWeight: 800,
            background: 'linear-gradient(135deg, var(--error), var(--secondary))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: 1,
            marginBottom: '12px',
          }}
        >
          500
        </div>
        <div
          style={{
            width: '40px',
            height: '3px',
            borderRadius: '2px',
            background: 'linear-gradient(90deg, var(--error), var(--secondary))',
            margin: '0 auto 20px',
          }}
        />
        <p style={{ fontSize: '1.15rem', color: 'var(--text)', marginBottom: '8px', fontWeight: 600 }}>
          Algo salió mal
        </p>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '32px', lineHeight: 1.6 }}>
          Ocurrió un error inesperado.
          <br />
          Nuestro equipo ha sido notificado.
        </p>
        <button
          onClick={reset}
          className="btn"
          style={{
            padding: '12px 32px',
            borderRadius: '12px',
            fontWeight: 700,
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            display: 'inline-flex',
            cursor: 'pointer',
          }}
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  );
}
