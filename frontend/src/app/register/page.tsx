'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import ClientOnly from '@/lib/ClientOnly';
import Link from 'next/link';
import GoogleLoginButton from '@/components/auth/GoogleLoginButton';
import DiscordLoginButton from '@/components/auth/DiscordLoginButton';
import AuthLayout from '@/components/auth/AuthLayout';

function RegisterForm() {
  const { user, isLoading, register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const refParam = searchParams ? (searchParams.get('ref') || undefined) : undefined;

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordChecks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };

  const allChecksPassed = Object.values(passwordChecks).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!allChecksPassed) {
      setError('La contraseña no cumple con los requisitos de seguridad');
      return;
    }

    setLoading(true);

    try {
      await register({ username, email, password, ref: refParam });
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrarse');
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

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '8px',
            }}
          >
            Nombre de Usuario
          </label>
          <input
            type="text"
            className="auth-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Tu nombre VTuber"
            required
            minLength={3}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
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

        <div style={{ marginBottom: '14px' }}>
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
            minLength={8}
          />
        </div>

        {/* Password requirements widget */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '12px 16px',
            marginBottom: '20px',
          }}
        >
          <p
            style={{
              fontSize: '0.78rem',
              color: 'rgba(255, 255, 255, 0.6)',
              marginBottom: '8px',
              fontWeight: 600,
            }}
          >
            Requisitos de seguridad:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {[
              { key: 'length', label: 'Min. 8 caracteres' },
              { key: 'upper', label: 'Una mayúscula' },
              { key: 'lower', label: 'Una minúscula' },
              { key: 'number', label: 'Un número' },
            ].map(({ key, label }) => {
              const passed = passwordChecks[key as keyof typeof passwordChecks];
              return (
                <div
                  key={key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.78rem',
                    color: passed ? '#34D399' : 'rgba(255, 255, 255, 0.4)',
                    transition: 'color 0.2s',
                  }}
                >
                  <span>{passed ? '✓' : '○'}</span>
                  <span>{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <p
          style={{
            fontSize: '0.78rem',
            color: 'rgba(255, 255, 255, 0.5)',
            marginBottom: '20px',
            lineHeight: 1.5,
          }}
        >
          Al registrarte, aceptas nuestros{' '}
          <Link href="/support" style={{ color: '#A78BFA', textDecoration: 'none' }}>
            Términos
          </Link>{' '}
          y{' '}
          <Link href="/support" style={{ color: '#A78BFA', textDecoration: 'none' }}>
            Privacidad
          </Link>
          .
        </p>

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
              Creando cuenta...
            </span>
          ) : (
            'Crear cuenta'
          )}
        </button>
      </form>

      {/* Divider */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          margin: '24px 0',
        }}
      >
        <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
        <span style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          o regístrate con
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

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Únete al Gremio"
      subtitle="Crea tu cuenta estelar y forma parte de la comunidad"
    >
      <ClientOnly
        fallback={
          <div
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
        <RegisterForm />
      </ClientOnly>
    </AuthLayout>
  );
}
