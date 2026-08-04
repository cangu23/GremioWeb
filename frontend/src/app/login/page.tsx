'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import ClientOnly from '@/lib/ClientOnly';
import Link from 'next/link';
import GoogleLoginButton from '@/components/auth/GoogleLoginButton';
import DiscordLoginButton from '@/components/auth/DiscordLoginButton';
import AuthLayout from '@/components/auth/AuthLayout';

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
      {error && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#FCA5A5',
            padding: '14px 18px',
            borderRadius: '14px',
            marginBottom: '20px',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} suppressHydrationWarning>
        <div style={{ marginBottom: '18px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '8px',
            }}
          >
            Correo Electrónico
          </label>
          <input
            type="email"
            className="auth-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu.usuario@ejemplo.com"
            required
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '8px',
            }}
          >
            Contraseña
          </label>
          <input
            type="password"
            className="auth-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            required
          />
        </div>

        <div style={{ textAlign: 'right', marginBottom: '24px' }}>
          <Link
            href="/support"
            style={{
              fontSize: '0.83rem',
              color: 'rgba(255, 255, 255, 0.5)',
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#A78BFA')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)')}
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <button type="submit" className="auth-btn-primary" disabled={loading}>
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
            'Entrar al Gremio'
          )}
        </button>
      </form>

      {/* Divider */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          margin: '26px 0',
        }}
      >
        <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
        <span style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          o ingresa con
        </span>
        <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
      </div>

      {/* Social Login Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <GoogleLoginButton />
        <DiscordLoginButton />
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <AuthLayout
      title="Inicia Sesión"
      subtitle="Accede a tu cuenta y continúa tu aventura VTuber"
    >
      <ClientOnly
        fallback={
          <div
            suppressHydrationWarning
            style={{
              textAlign: 'center',
              padding: '40px 0',
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: '24px',
                height: '24px',
                border: '2px solid rgba(255,255,255,0.2)',
                borderTopColor: '#8B5CF6',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                marginBottom: '12px',
              }}
            />
            <p>Cargando interfaz...</p>
          </div>
        }
      >
        <LoginForm />
      </ClientOnly>
    </AuthLayout>
  );
}
