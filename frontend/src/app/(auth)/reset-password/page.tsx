'use client';

import { Suspense, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { AlertCircle, FourPointStar } from '@/components/ui/Icons';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams?.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Validation rules
  const checks = useMemo(() => {
    return {
      length: newPassword.length >= 8,
      upper: /[A-Z]/.test(newPassword),
      lower: /[a-z]/.test(newPassword),
      number: /[0-9]/.test(newPassword),
      match: Boolean(newPassword && newPassword === confirmPassword),
    };
  }, [newPassword, confirmPassword]);

  const isValid = checks.length && checks.upper && checks.lower && checks.number && checks.match;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Falta el token de recuperación en el enlace.');
      return;
    }
    if (!isValid) {
      setError('Asegúrate de cumplir con todos los requisitos de contraseña.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword }),
      });
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al restablecer la contraseña');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="glass" style={{ maxWidth: '440px', width: '100%', margin: '40px auto', padding: '36px 28px', borderRadius: '24px', textAlign: 'center' }}>
        <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#f87171', fontSize: '1.4rem' }}>
          ✦
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>Enlace de Recuperación Inválido</h2>
        <p style={{ fontSize: '0.86rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: '24px' }}>
          Este enlace no contiene un token válido de recuperación de acceso o fue cortado al abrirlo.
        </p>
        <Link href="/login" className="btn btn--primary" style={{ display: 'inline-block', width: '100%', padding: '12px' }}>
          Volver a Iniciar Sesión
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="glass" style={{ maxWidth: '440px', width: '100%', margin: '40px auto', padding: '36px 28px', borderRadius: '24px', textAlign: 'center', border: '1px solid rgba(0, 229, 255, 0.35)' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(0, 229, 255, 0.12)', border: '1px solid rgba(0, 229, 255, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#00e5ff', fontSize: '1.6rem' }}>
          ✦
        </div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>¡Contraseña Actualizada!</h2>
        <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, marginBottom: '24px' }}>
          Tu nueva contraseña ha sido guardada con éxito. Todas tus sesiones anteriores han sido cerradas por seguridad. Ya puedes ingresar con tu nueva clave.
        </p>
        <Link href="/login" className="btn btn--primary" style={{ display: 'inline-block', width: '100%', padding: '12px', textDecoration: 'none' }}>
          Iniciar Sesión
        </Link>
      </div>
    );
  }

  return (
    <div
      className="glass"
      style={{
        maxWidth: '440px',
        width: '100%',
        margin: '40px auto',
        padding: '36px 28px',
        borderRadius: '24px',
        background: 'linear-gradient(145deg, rgba(20, 24, 46, 0.95), rgba(12, 14, 28, 0.98))',
        border: '1px solid rgba(138, 43, 226, 0.35)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(138, 43, 226, 0.2)',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '22px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: '#a78bfa',
            fontSize: '0.78rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            marginBottom: '6px',
          }}
        >
          <FourPointStar size={12} color="#a78bfa" />
          Gremio Estelar
          <FourPointStar size={12} color="#a78bfa" />
        </div>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
          Nueva Contraseña
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.65)', marginTop: '8px' }}>
          Ingresa una clave segura para proteger tu cuenta en el Gremio.
        </p>
      </div>

      {error && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#FCA5A5',
            padding: '10px 14px',
            borderRadius: '10px',
            marginBottom: '16px',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={15} color="#FCA5A5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)', marginBottom: '6px' }}>
            Nueva Contraseña
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              className="auth-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              autoFocus
              style={{ paddingRight: '42px' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '0.78rem',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              {showPassword ? 'Ocultar' : 'Ver'}
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '18px' }}>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)', marginBottom: '6px' }}>
            Confirmar Nueva Contraseña
          </label>
          <input
            type={showPassword ? 'text' : 'password'}
            className="auth-input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••••••"
            required
          />
        </div>

        {/* Requirements checklist */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '12px 14px',
            marginBottom: '20px',
            fontSize: '0.74rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ color: checks.length ? '#10b981' : 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{checks.length ? '✓' : '✧'}</span> Al menos 8 caracteres
          </div>
          <div style={{ color: checks.upper ? '#10b981' : 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{checks.upper ? '✓' : '✧'}</span> Al menos una letra mayúscula
          </div>
          <div style={{ color: checks.lower ? '#10b981' : 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{checks.lower ? '✓' : '✧'}</span> Al menos una letra minúscula
          </div>
          <div style={{ color: checks.number ? '#10b981' : 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{checks.number ? '✓' : '✧'}</span> Al menos un número
          </div>
          <div style={{ color: checks.match ? '#10b981' : 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{checks.match ? '✓' : '✧'}</span> Las contraseñas coinciden
          </div>
        </div>

        <button
          type="submit"
          className="auth-btn-primary"
          disabled={loading || !isValid}
          style={{ width: '100%', padding: '12px', opacity: isValid ? 1 : 0.6 }}
        >
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
              Guardando contraseña...
            </span>
          ) : (
            'Guardar Nueva Contraseña'
          )}
        </button>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Link
            href="/login"
            style={{
              fontSize: '0.8rem',
              color: 'rgba(255, 255, 255, 0.5)',
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)')}
          >
            Volver a Iniciar Sesión
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        background: 'radial-gradient(ellipse at 50% 20%, rgba(138, 43, 226, 0.18) 0%, rgba(8, 9, 20, 0.98) 70%)',
      }}
    >
      <Suspense fallback={<div style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Cargando asistente de seguridad...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
