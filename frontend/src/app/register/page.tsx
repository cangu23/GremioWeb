'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import ClientOnly from '@/lib/ClientOnly';
import Link from 'next/link';

function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();

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
      await register({ username, email, password });
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrarse');
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
          top: '-100px',
          left: '-80px',
          width: '280px',
          height: '280px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,212,255,0.1), transparent)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-80px',
          right: '-60px',
          width: '200px',
          height: '200px',
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
          <label className="form-label">Nombre de Usuario</label>
          <input
            type="text"
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Tu nombre VTuber"
            required
            minLength={3}
          />
        </div>

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

        <div className="form-group" style={{ marginBottom: '12px' }}>
          <label className="form-label">Contraseña</label>
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={8}
          />
        </div>

        {/* Password requirements */}
        <div
          style={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '10px',
            padding: '12px 16px',
            marginBottom: '28px',
          }}
        >
          <p
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              marginBottom: '8px',
              fontWeight: 500,
            }}
          >
            Requisitos de seguridad:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[
              { key: 'length', label: 'Mínimo 8 caracteres' },
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
                    gap: '8px',
                    fontSize: '0.8rem',
                    color: passed ? 'var(--success)' : 'var(--text-muted)',
                    transition: 'color 0.2s',
                  }}
                >
                  <span style={{ fontSize: '0.7rem' }}>
                    {passed ? '✓' : '○'}
                  </span>
                  {label}
                </div>
              );
            })}
          </div>
        </div>

        <p
          style={{
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            marginBottom: '20px',
            lineHeight: 1.5,
          }}
        >
          Al registrarte, aceptas nuestros{' '}
          <Link href="/support" style={{ color: 'var(--primary)' }}>
            Términos y Condiciones
          </Link>{' '}
          y{' '}
          <Link href="/support" style={{ color: 'var(--primary)' }}>
            Política de Privacidad
          </Link>
          .
        </p>

        <button
          type="submit"
          className="btn"
          style={{
            width: '100%',
            padding: '14px',
            fontSize: '1rem',
            fontWeight: 700,
            borderRadius: '12px',
            background:
              'linear-gradient(135deg, var(--primary), var(--secondary))',
            opacity: loading ? 0.8 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
          disabled={loading}
        >
          {loading ? (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
              }}
            >
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
            '✦ Crear cuenta'
          )}
        </button>
      </form>

      <p
        style={{
          textAlign: 'center',
          marginTop: '24px',
          color: 'var(--text-muted)',
          fontSize: '0.9rem',
        }}
      >
        ¿Ya tienes cuenta?{' '}
        <Link
          href="/login"
          style={{ color: 'var(--primary)', fontWeight: 600 }}
        >
          Inicia Sesión
        </Link>
      </p>
    </>
  );
}

export default function RegisterPage() {
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
          maxWidth: '440px',
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
            ✨
          </div>
          <h2
            className="gradient-text"
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              marginBottom: '8px',
            }}
          >
            Únete al Gremio
          </h2>
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.95rem',
            }}
          >
            Crea tu cuenta y empieza tu viaje
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
          <RegisterForm />
        </ClientOnly>
      </div>
    </div>
  );
}
