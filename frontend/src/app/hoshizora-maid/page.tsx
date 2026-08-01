'use client';

export const dynamic = 'force-dynamic';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ClientOnly from '@/lib/ClientOnly';

export default function HoshizoraMaidPage() {
  return (
    <ClientOnly>
      <div style={{
        minHeight: '85vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '100px 20px 60px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Ambient Glows */}
        <div style={{
          position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,160,48,0.18) 0%, rgba(139,92,246,0.12) 40%, transparent 70%)',
          filter: 'blur(70px)', pointerEvents: 'none', zIndex: 0,
        }} />

        <div style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '680px',
          width: '100%',
          textAlign: 'center',
          background: 'rgba(26, 20, 16, 0.75)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(212, 160, 48, 0.3)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(212, 160, 48, 0.15)',
          borderRadius: '32px',
          padding: '48px 32px',
        }}>
          {/* Top Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 18px',
            borderRadius: '20px',
            background: 'rgba(212, 160, 48, 0.12)',
            border: '1px solid rgba(212, 160, 48, 0.35)',
            color: '#e8c060',
            fontSize: '0.82rem',
            fontWeight: 800,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            marginBottom: '28px',
          }}>
            <span>✨ PRÓXIMAMENTE ✨</span>
          </div>

          {/* Logo / Mascot Image */}
          <div style={{
            position: 'relative',
            width: '140px',
            height: '140px',
            margin: '0 auto 28px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(212,160,48,0.25), rgba(139,92,246,0.25))',
            border: '2px solid rgba(212, 160, 48, 0.5)',
            boxShadow: '0 0 35px rgba(212, 160, 48, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}>
            <Image
              src="/hoshi.png"
              alt="Hoshizora Maid Logo"
              width={130}
              height={130}
              style={{ objectFit: 'contain', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.4))' }}
              priority
            />
          </div>

          {/* Main Title */}
          <h1 style={{
            fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
            fontWeight: 900,
            color: '#f5e6d3',
            marginBottom: '16px',
            lineHeight: 1.2,
            textShadow: '0 2px 10px rgba(0,0,0,0.5)',
          }}>
            Estamos trabajando arduamente por aquí... ☕🌸
          </h1>

          {/* Subtitle */}
          <p style={{
            color: '#b8a898',
            fontSize: '1.05rem',
            lineHeight: 1.6,
            maxWidth: '520px',
            margin: '0 auto 36px',
          }}>
            El equipo del <strong>Hoshizora Maid Café</strong> está horneando una experiencia especial, llena de magia, eventos VRChat, atenciones exclusivas y sorpresas para toda la comunidad.
          </p>

          {/* Feature Teasers */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            marginBottom: '36px',
          }}>
            {[
              { icon: '☕', label: 'Maid Café VRChat' },
              { icon: '🎀', label: 'Anfitriones & Menú Mágico' },
              { icon: '⭐', label: 'Eventos & VIP Lounge' },
            ].map((f, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '14px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(212, 160, 48, 0.2)',
                  color: '#e8c060',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                <span>{f.icon}</span>
                <span>{f.label}</span>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 26px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #d4a030, #a0782c)',
                color: '#1a1410',
                fontWeight: 800,
                fontSize: '0.92rem',
                textDecoration: 'none',
                boxShadow: '0 4px 20px rgba(212, 160, 48, 0.35)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
            >
              🏠 Volver al Inicio
            </Link>

            <Link
              href="/vtubers"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 26px',
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#f5e6d3',
                fontWeight: 700,
                fontSize: '0.92rem',
                textDecoration: 'none',
                transition: 'background 0.2s',
              }}
            >
              ✨ Explorar Creadores
            </Link>
          </div>
        </div>
      </div>
    </ClientOnly>
  );
}
