'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import ClientOnly from '@/lib/ClientOnly';
import Link from 'next/link';
import GoogleLoginButton from '@/components/auth/GoogleLoginButton';

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ email, password });
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Decorative glows */}
      <div
        style={{
          position: 'absolute',
          top: '-80px',
          right: '-80px',
          width: '250px',
          height: '250px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(138,43,226,0.12), transparent)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-60px',
          left: '-60px',
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,0,127,0.08), transparent)',
          pointerEvents: 'none',
        }}
      />

      {error && (
        <div
          style={{
            background: 'rgba(255,77,79,0.1)',
            border: '1px solid rgba(255,77,79,0.2)',
            color: 'var(--error)',
            padding: '14px 16px',
            borderRadius: '12px',
            marginBottom: '24px',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <span style={{ fontSize: '1.1rem' }}>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Correo Electrónico</label>
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
          />
        </div>

        <div className="form-group" style={{ marginBottom: '8px' }}>
          <label className="form-label">Contraseña</label>
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>

        <div style={{ textAlign: 'right', marginBottom: '28px' }}>
          <Link
            href="/support"
            style={{
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <button
          type="submit"
          className="btn"
          style={{
            width: '100%',
            padding: '14px',
            fontSize: '1rem',
            fontWeight: 700,
            borderRadius: '12px',
            background: loading
              ? 'linear-gradient(135deg, var(--primary), var(--secondary))'
              : 'linear-gradient(135deg, var(--primary), var(--secondary))',
            opacity: loading ? 0.8 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
          disabled={loading}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <span
                style={{
                  width: '18px',
                  height: '18px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              Iniciando sesión...
            </span>
          ) : (
            '✦ Entrar'
          )}
        </button>
      </form>

      {/* Divider */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          margin: '28px 0',
        }}
      >
        <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }} />
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>o continúa con</span>
        <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }} />
      </div>

      {/* Google Login Button */}
      <div style={{ marginBottom: '8px' }}>
        <GoogleLoginButton />
      </div>

      <p
        style={{
          textAlign: 'center',
          marginTop: '24px',
          color: 'var(--text-muted)',
          fontSize: '0.9rem',
        }}
      >
        ¿No tienes cuenta?{' '}
        <Link
          href="/register"
          style={{ color: 'var(--primary)', fontWeight: 600 }}
        >
          Regístrate
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <div
      className="container"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 'calc(100vh - 80px)',
        padding: '20px',
      }}
    >
      <div
        className="glass"
        style={{
          padding: '48px 40px',
          width: '100%',
          maxWidth: '420px',
          borderRadius: '24px',
          position: 'relative',
          overflow: 'hidden',
          animation: 'fadeInUp 0.6s ease',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div
            style={{
              fontSize: '2.5rem',
              marginBottom: '8px',
            }}
            className="animate-float"
          >
            🌟
          </div>
          <h2
            className="gradient-text"
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              marginBottom: '8px',
            }}
          >
            Bienvenido de vuelta
          </h2>
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.95rem',
            }}
          >
            Inicia sesión para continuar
          </p>
        </div>

        <ClientOnly
          fallback={
            <div
              style={{
                textAlign: 'center',
                padding: '40px 0',
                color: 'var(--text-muted)',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: '24px',
                  height: '24px',
                  border: '2px solid rgba(255,255,255,0.2)',
                  borderTopColor: 'var(--primary)',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                  marginBottom: '12px',
                }}
              />
              <p>Cargando...</p>
            </div>
          }
        >
          <LoginForm />
        </ClientOnly>
      </div>
    </div>
  );
}
