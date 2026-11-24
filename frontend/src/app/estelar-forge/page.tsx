'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { FourPointStar, Sparkles, Shield, Award, Check } from '@/components/ui/Icons';
import { hasAnyRole } from '@gremio-estelar/shared';

export default function EstelarForgePage() {
  const { user, isLoading } = useAuth();

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

  const downloadUrl = '/downloads/Estelar-Forge-Setup.exe';

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Luces y nebulosa de fondo */}
      <div
        className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] blur-[140px] pointer-events-none opacity-30 rounded-full"
        style={{ background: 'radial-gradient(circle, var(--primary) 0%, var(--secondary) 50%, transparent 80%)' }}
      />
      <div
        className="absolute top-96 right-10 w-[400px] h-[400px] blur-[150px] pointer-events-none opacity-20 rounded-full"
        style={{ background: 'radial-gradient(circle, var(--cafe-gold) 0%, transparent 70%)' }}
      />

      <div className="max-w-5xl mx-auto space-y-16 relative z-10">
        {/* HERO SECTION */}
        <div className="text-center space-y-6 pt-4 sm:pt-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-primary/10 border border-primary/25 text-primary backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>EXCLUSIVO PARA CREADORES DEL GREMIO · VTUBERS & STREAMERS</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-primary-text tracking-tight leading-tight">
            Configura tu OBS en segundos.<br />
            <span className="bg-gradient-to-r from-primary via-primary-hover to-accent bg-clip-text text-transparent">
              Hecho para VTubers y Streamers.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-secondary leading-relaxed">
            <strong>Estelar Forge</strong> automatiza la conexión con OBS Studio, aísla tus canales de audio quirúrgicamente, optimiza el bitrate según tu hardware y configura tu avatar VTuber con transparencia real.
          </p>

          {/* CONTROL DE ACCESO EXCLUSIVO PARA CREADORES */}
          <div className="pt-2">
            {!user ? (
              <div className="p-4 rounded-2xl bg-card border border-glass-border max-w-lg mx-auto space-y-3">
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-warm uppercase tracking-wider">
                  <Shield className="w-4 h-4 text-warm" /> Acceso Exclusivo para Creadores
                </div>
                <p className="text-xs text-secondary">
                  Esta herramienta está restringida a <strong>VTubers y Streamers</strong> acreditados del Gremio Estelar. Inicia sesión para comprobar tu licencia.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Link
                    href="/login?redirect=/estelar-forge"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-white shadow-lg transition-all"
                  >
                    <span>✦</span> Iniciar Sesión como Creador
                  </Link>
                  <Link
                    href="/postulaciones"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-surface hover:bg-card border border-glass-border text-secondary hover:text-primary-text transition-all"
                  >
                    Postularme como Creador
                  </Link>
                </div>
              </div>
            ) : !isCreator ? (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/25 max-w-lg mx-auto space-y-3">
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-red-400 uppercase tracking-wider">
                  <Shield className="w-4 h-4 text-red-400" /> Licencia Bloqueada: Requiere Rango de Creador
                </div>
                <p className="text-xs text-red-200">
                  Hola, <strong>@{user.username}</strong>. Tu cuenta tiene rango regular ({user.role || 'MIEMBRO'}). Estelar Forge solo puede activarse con una acreditación de VTuber o Streamer.
                </p>
                <Link
                  href="/postulaciones"
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-white shadow-lg transition-all"
                >
                  <span>✦</span> Solicitar Rango de Creador (VTuber / Streamer)
                </Link>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-primary/10 border border-primary/25 max-w-lg mx-auto space-y-3">
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-success uppercase tracking-wider">
                  <Check className="w-4 h-4 text-success" /> Licencia Habilitada: @{user.username} ({user.role || 'CREADOR'})
                </div>
                <p className="text-xs text-secondary">
                  Tu acreditación de creador ha sido verificada. Tienes acceso completo a la Forja Estelar.
                </p>
                <a
                  href={downloadUrl}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl font-bold text-sm bg-primary hover:bg-primary-hover text-white shadow-xl shadow-primary/30 hover:scale-[1.02] transition-all"
                >
                  <span>✦</span> Descargar Estelar Forge para Windows (64-bit)
                </a>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted pt-2">
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-success" /> OBS Studio 28+ compatible</span>
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-success" /> NVENC / AMF / QuickSync</span>
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-success" /> Cero pantalla verde para VTubers</span>
            <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-success" /> 100% Libre de costo</span>
          </div>
        </div>

        {/* PREVIEW INTERACTIVO / MOCKUP */}
        <div className="relative rounded-2xl border border-glass-border bg-card/60 backdrop-blur-2xl p-4 sm:p-6 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-glass-border/60 text-xs text-muted">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block" />
              <span className="ml-2 font-mono text-[11px] text-secondary">Estelar Forge v0.1.0 · Conexión WebSocket Activa</span>
            </div>
            <div className="flex items-center gap-1.5 text-primary">
              <FourPointStar className="w-3.5 h-3.5" /> Gremio Estelar Auth Guard
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div className="p-4 rounded-xl bg-surface/50 border border-glass-border">
              <div className="text-xs font-bold text-primary mb-1 uppercase tracking-wider">Paso 1</div>
              <div className="text-sm font-semibold text-primary-text">Autodiagnóstico de Hardware</div>
              <p className="text-xs text-secondary mt-1">
                Lee tu GPU, núcleos de CPU y mide tu velocidad real de subida para calcular la resolución (1080p60) y tasa de bits perfecta.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-surface/50 border border-glass-border">
              <div className="text-xs font-bold text-accent mb-1 uppercase tracking-wider">Paso 2</div>
              <div className="text-sm font-semibold text-primary-text">Lienzo y Modo VTuber</div>
              <p className="text-xs text-secondary mt-1">
                Arrastra tu cámara, chat y juego. Para VTubers (VTube Studio, VNyan, Warudo), activa transparencia nativa sin chroma key.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-surface/50 border border-glass-border">
              <div className="text-xs font-bold text-warm mb-1 uppercase tracking-wider">Paso 3</div>
              <div className="text-sm font-semibold text-primary-text">Inyección Quirúrgica</div>
              <p className="text-xs text-secondary mt-1">
                Crea una colección de escenas dedicada en OBS con audio aislado por procesos y filtros de voz de red neuronal integrados.
              </p>
            </div>
          </div>
        </div>

        {/* CARACTERÍSTICAS PRINCIPALES */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-primary-text tracking-tight">
              ¿Por qué Estelar Forge es diferente?
            </h2>
            <p className="text-xs sm:text-sm text-secondary mt-1">
              Desarrollado específicamente para creadores que no quieren perder horas configurando escenas.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-card border border-glass-border hover:border-glass-border-hover transition-all">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-primary-text">Especial para VTubers & PNGTubers</h3>
              <p className="text-xs sm:text-sm text-secondary mt-1.5 leading-relaxed">
                Olvídate de fondos verdes con bordes pixelados. Estelar Forge captura tu modelo directamente mediante canal alfa transparente, integrando tu avatar perfectamente sobre el gameplay.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-glass-border hover:border-glass-border-hover transition-all">
              <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-3">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-primary-text">Blindaje de Audio por Procesos</h3>
              <p className="text-xs sm:text-sm text-secondary mt-1.5 leading-relaxed">
                Separa tu micrófono, juego, Discord y Spotify en 4 canales aislados. Apaga el audio global de escritorio para que jamás se filtre un sonido privado o una notificación de Windows.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-glass-border hover:border-glass-border-hover transition-all">
              <div className="w-10 h-10 rounded-xl bg-warm/10 border border-warm/20 flex items-center justify-center text-warm mb-3">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-primary-text">Recomendación Matemática Inteligente</h3>
              <p className="text-xs sm:text-sm text-secondary mt-1.5 leading-relaxed">
                Clasifica tu tarjeta gráfica (NVIDIA GeForce, AMD Radeon, Intel Arc) y calcula el bitrate exacto dejando un 35% de margen de seguridad para evitar lag en el juego o pérdida de cuadros.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-glass-border hover:border-glass-border-hover transition-all">
              <div className="w-10 h-10 rounded-xl bg-success/10 border border-success/20 flex items-center justify-center text-success mb-3">
                <FourPointStar className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-primary-text">No invasivo & Seguro</h3>
              <p className="text-xs sm:text-sm text-secondary mt-1.5 leading-relaxed">
                Crea copias de seguridad de tu <code>global.ini</code> y genera un perfil y colección independientes llamados <em>Estelar Forge</em>. Tus escenas previas quedan intactas.
              </p>
            </div>
          </div>
        </div>

        {/* CTA FINAL DE DESCARGA */}
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-card to-surface border border-primary/20 text-center space-y-4 relative overflow-hidden">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/20 text-primary mb-1">
            <FourPointStar className="w-6 h-6 animate-spin" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-primary-text">
            Forja tu stream como un Creador Legendario
          </h2>
          <p className="text-xs sm:text-sm text-secondary max-w-lg mx-auto">
            Herramienta creada exclusivamente para la familia de creadores, VTubers y streamers de Gremio Estelar.
          </p>
          <div className="pt-2">
            {!user ? (
              <Link
                href="/login?redirect=/estelar-forge"
                className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl font-bold text-sm bg-primary hover:bg-primary-hover text-white shadow-xl shadow-primary/25 hover:scale-[1.02] transition-all"
              >
                <span>✦</span> Iniciar Sesión para Obtener Licencia
              </Link>
            ) : !isCreator ? (
              <Link
                href="/postulaciones"
                className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl font-bold text-sm bg-primary hover:bg-primary-hover text-white shadow-xl shadow-primary/25 hover:scale-[1.02] transition-all"
              >
                <span>✦</span> Postularme como Creador Acreditado
              </Link>
            ) : (
              <a
                href={downloadUrl}
                className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl font-bold text-sm bg-primary hover:bg-primary-hover text-white shadow-xl shadow-primary/25 hover:scale-[1.02] transition-all"
              >
                <span>✦</span> Descargar Ahora (Estelar Forge Windows)
              </a>
            )}
          </div>
          <div className="text-[11px] text-muted">
            Versión 0.1.0 · Requisitos: Windows 10/11 · OBS Studio 28+ · Licencia Exclusiva para Creadores
          </div>
        </div>
      </div>
    </div>
  );
}
