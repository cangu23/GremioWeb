'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';

export default function NotFound() {
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
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            lineHeight: 1,
            marginBottom: '12px',
          }}
        >
          404
        </div>
        <div
          style={{
            width: '40px',
            height: '3px',
            borderRadius: '2px',
            background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
            margin: '0 auto 20px',
          }}
        />
        <p style={{ fontSize: '1.15rem', color: 'var(--text)', marginBottom: '8px', fontWeight: 600 }}>
          Página no encontrada
        </p>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '32px', lineHeight: 1.6 }}>
          La página que buscas no existe o ha sido movida.
          <br />
          Revisa la URL o vuelve al inicio.
        </p>
        <Link
          href="/"
          className="btn"
          style={{
            padding: '12px 32px',
            borderRadius: '12px',
            fontWeight: 700,
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            display: 'inline-flex',
          }}
        >
          ← Volver al inicio
        </Link>
      </div>
    </div>
  );
}
