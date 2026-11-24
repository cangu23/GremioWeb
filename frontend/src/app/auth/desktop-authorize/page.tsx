'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/lib/ToastContext';
import { apiFetch } from '@/lib/api';
import { FourPointStar, Sparkles, Shield, Check } from '@/components/ui/Icons';
import { hasAnyRole } from '@gremio-estelar/shared';
import Link from 'next/link';

export default function DesktopAuthorizePage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
          <Sparkles className="w-10 h-10 text-primary animate-spin mb-4" />
          <p className="text-secondary text-sm">Consultando las estrellas del Gremio...</p>
        </div>
      }
    >
      <DesktopAuthorizeContent />
    </React.Suspense>
  );
}

function DesktopAuthorizeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { showToast } = useToast();

  const port = searchParams?.get('port') || '48123';
  const state = searchParams?.get('state') || '';
  const clientName = searchParams?.get('client') || 'Estelar Forge';

  const isCreator =
    user &&
    (hasAnyRole(user.role, [
      'VTUBER',
      'STREAMER',
      'PARTNER',
      'STAFF',
      'MODERATOR',
      'MOD',
      'ADMIN',
      'OWNER',
      'SYSADMIN',
    ]) ||
      Boolean((user as any).vtuberProfile) ||
      Boolean((user as any).streamerProfile));

  const [authorizing, setAuthorizing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [issuedToken, setIssuedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleAuthorize = async () => {
    if (!user) return;
    setAuthorizing(true);
    try {
      const res = await apiFetch<{ token: string; user: any }>('/api/auth/desktop-token', {
        method: 'POST',
      });

      if (!res.token) {
        throw new Error('No se pudo generar el token de autorización.');
      }

      setIssuedToken(res.token);
      setSuccess(true);
      showToast('✦ Acceso concedido a Estelar Forge', 'success');

      // Redirigir al servidor loopback de la app de escritorio
      const callbackUrl = `http://127.0.0.1:${port}/callback?token=${encodeURIComponent(
        res.token
      )}&state=${encodeURIComponent(state)}`;

      // Intentar redirigir automáticamente
      window.location.href = callbackUrl;
    } catch (err: any) {
      console.error('Error al autorizar aplicación:', err);
      showToast(err.message || 'Error al conectar con Estelar Forge', 'error');
    } finally {
      setAuthorizing(false);
    }
  };

  const copyToken = () => {
    if (!issuedToken) return;
    navigator.clipboard.writeText(issuedToken);
    setCopied(true);
    showToast('Clave de autorización copiada al portapapeles', 'info');
    setTimeout(() => setCopied(false), 3000);
  };

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
        <Sparkles className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-secondary text-sm">Consultando las estrellas del Gremio...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg bg-surface/90 border border-glass-border hover:border-glass-border-hover backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden transition-all">
        {/* Glow de fondo */}
        <div
          className="absolute -top-24 -right-24 w-60 h-60 rounded-full blur-3xl pointer-events-none opacity-30"
          style={{ background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-24 -left-24 w-60 h-60 rounded-full blur-3xl pointer-events-none opacity-20"
          style={{ background: 'radial-gradient(circle, var(--cafe-gold) 0%, transparent 70%)' }}
        />

        {/* Encabezado */}
        <div className="text-center mb-6 relative z-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-3 shadow-inner">
            <FourPointStar className="w-7 h-7 text-primary animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold text-primary-text tracking-tight">
            Vincular con {clientName}
          </h1>
          <p className="text-xs sm:text-sm text-secondary mt-1 max-w-sm mx-auto">
            Herramienta exclusiva de automatización de OBS para miembros de <span className="text-primary font-semibold">Gremio Estelar</span>.
          </p>
        </div>

        {/* Estado según autenticación */}
        {!user ? (
          <div className="space-y-4 relative z-10 text-center">
            <div className="p-4 rounded-xl bg-card border border-glass-border text-sm text-secondary">
              <Shield className="w-6 h-6 text-warm mx-auto mb-2" />
              <p className="font-medium text-primary-text mb-1">Inicia sesión en el Gremio</p>
              <p className="text-xs text-muted">
                Para acceder a Estelar Forge debes tener una cuenta activa de aventurero.
              </p>
            </div>
            <Link
              href={`/login?redirect=${encodeURIComponent(
                typeof window !== 'undefined' ? window.location.pathname + window.location.search : ''
              )}`}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm bg-primary hover:bg-primary-hover text-white shadow-lg transition-all"
            >
              <span>✦</span> Iniciar Sesión en el Gremio
            </Link>
          </div>
        ) : success ? (
          <div className="space-y-5 text-center relative z-10">
            <div className="w-14 h-14 mx-auto rounded-full bg-success/15 border border-success/30 flex items-center justify-center text-success">
              <Check className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-primary-text">¡Autorización Completada!</h2>
              <p className="text-xs sm:text-sm text-secondary mt-1">
                Hemos enviado la confirmación a <strong>{clientName}</strong>. Ya puedes cerrar esta ventana y volver a la aplicación.
              </p>
            </div>

            <div className="pt-2 border-t border-glass-border">
              <p className="text-xs text-muted mb-2">¿La aplicación no se desbloqueó automáticamente?</p>
              <button
                type="button"
                onClick={copyToken}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs bg-card hover:bg-card-hover border border-glass-border text-secondary hover:text-primary-text transition-all"
              >
                {copied ? '✔ Clave Copiada' : 'Copiar clave de autorización manual'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5 relative z-10">
            {/* Tarjeta de miembro actual */}
            <div className="p-4 rounded-xl bg-card border border-glass-border flex items-center gap-3.5">
              <div className="relative">
                <img
                  src={user.avatarUrl || '/avatars/default.png'}
                  alt={user.displayName || user.username}
                  className="w-12 h-12 rounded-full object-cover border-2 border-primary/50"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/avatars/default.png';
                  }}
                />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-success border-2 border-surface" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-primary-text text-sm truncate">
                    {user.displayName || user.username}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/25">
                    {user.role || 'MIEMBRO'}
                  </span>
                </div>
                <div className="text-xs text-muted truncate">@{user.username}</div>
              </div>
            </div>

            {/* Permisos concedidos / Bloqueo por rol */}
            {!isCreator ? (
              <div className="space-y-3 bg-red-500/10 border border-red-500/25 p-4 rounded-xl text-xs text-red-200">
                <div className="font-bold text-red-400 flex items-center gap-1.5 text-sm">
                  <Shield className="w-4 h-4 text-red-400" /> Requiere Rango de Creador
                </div>
                <p className="leading-relaxed">
                  Estelar Forge es una herramienta de grado profesional reservada para <strong>VTubers y Streamers</strong> acreditados del Gremio Estelar.
                </p>
                <p className="text-[11px] text-red-300">
                  Tu cuenta actual (@{user.username}) tiene rango regular. Postúlate como creador en la plataforma para recibir tu acreditación y desbloquear la forja.
                </p>
                <Link
                  href="/postulaciones"
                  className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-lg text-xs font-bold bg-primary hover:bg-primary-hover text-white transition-all shadow-md mt-1"
                >
                  <span>✦</span> Postularme como Creador (VTuber / Streamer)
                </Link>
              </div>
            ) : (
              <div className="space-y-2 text-xs text-secondary bg-surface/50 p-3.5 rounded-xl border border-glass-border/60">
                <div className="font-semibold text-primary-text mb-1 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-primary" /> Permisos solicitados:
                </div>
                <ul className="space-y-1 list-none pl-1">
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✔</span> Emitir licencia de Creador para Estelar Forge.
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✔</span> Configurar automáticamente escenas y audio para tu canal.
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✔</span> Activar soporte nativo de canal alfa para tu modelo VTuber.
                  </li>
                </ul>
              </div>
            )}

            {/* Botones de acción */}
            <div className="pt-2 flex flex-col gap-2">
              {isCreator ? (
                <button
                  type="button"
                  onClick={handleAuthorize}
                  disabled={authorizing}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm bg-primary hover:bg-primary-hover text-white shadow-lg transition-all disabled:opacity-50"
                >
                  {authorizing ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" /> Concediendo bendición estelar...
                    </>
                  ) : (
                    <>
                      <span>✦</span> Conceder Licencia de Creador y Abrir Estelar Forge
                    </>
                  )}
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => router.push('/')}
                className="w-full py-2 px-4 rounded-xl text-xs text-muted hover:text-secondary transition-all text-center"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
