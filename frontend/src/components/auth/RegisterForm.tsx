'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';
import GoogleLoginButton from '@/components/auth/GoogleLoginButton';
import DiscordLoginButton from '@/components/auth/DiscordLoginButton';

export default function RegisterForm() {
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
    <div style={{ width: '100%' }}>
      {error && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#FCA5A5',
            padding: '8px 12px',
            borderRadius: '10px',
            marginBottom: '10px',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '8px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '3px',
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

        <div style={{ marginBottom: '8px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '3px',
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

        <div style={{ marginBottom: '8px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '3px',
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

        {/* 🛡️ CYBER SECURITY WIDGET BADGES */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginBottom: '10px' }}>
          {[
            { key: 'length', label: '8+ Caracteres' },
            { key: 'upper', label: 'Mayúscula' },
            { key: 'lower', label: 'Minúscula' },
            { key: 'number', label: 'Número' },
          ].map(({ key, label }) => {
            const passed = passwordChecks[key as keyof typeof passwordChecks];
            return (
              <div
                key={key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 8px',
                  borderRadius: '8px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  background: passed ? 'rgba(52, 211, 153, 0.14)' : 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${passed ? 'rgba(52, 211, 153, 0.35)' : 'rgba(255, 255, 255, 0.08)'}`,
                  color: passed ? '#34D399' : 'rgba(255, 255, 255, 0.4)',
                  boxShadow: passed ? '0 0 10px rgba(52, 211, 153, 0.15)' : 'none',
                  transition: 'all 0.25s ease',
                }}
              >
                <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>{passed ? '✓' : '•'}</span>
                <span>{label}</span>
              </div>
            );
          })}
        </div>

        <p
          style={{
            fontSize: '0.73rem',
            color: 'rgba(255, 255, 255, 0.45)',
            marginBottom: '10px',
            lineHeight: 1.3,
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
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '16px',
                  height: '16px',
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
          gap: '12px',
          margin: '12px 0',
        }}
      >
        <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
        <span style={{ fontSize: '0.74rem', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          o regístrate con
        </span>
        <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
      </div>

      {/* Side-by-side Social Widgets */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <GoogleLoginButton />
        <DiscordLoginButton />
      </div>
    </div>
  );
}
