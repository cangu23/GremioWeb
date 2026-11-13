'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiFetch } from '@/lib/api';
import Navbar from '@/components/layout/Navbar';
import Link from 'next/link';
import {
  Sparkles,
  Shield,
  Award,
  Users,
  Check,
  Link2,
  Discord,
  Info,
} from '@/components/ui/Icons';

interface ReferralItem {
  id: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    createdAt: string;
  };
}

interface SeasonInfo {
  monthName: string;
  endsAt: string;
  daysRemaining: number;
}

interface MyReferralsData {
  referralCode: string;
  referralLink: string;
  monthlyValidCount: number;
  validCount: number; // Histórico
  pendingCount: number;
  invalidCount: number;
  totalCount: number;
  monthlyRank: number | null;
  allTimeRank: number | null;
  season: SeasonInfo;
  referrals: ReferralItem[];
}

interface LeaderboardItem {
  rank: number;
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  plan: string;
  role: string;
  verifiedInvites: number;
}

interface LeaderboardResponse {
  campaign: {
    title: string;
    rewards: string[];
    antiCheatNotice: string;
    frequencyNotice: string;
  };
  season: SeasonInfo;
  leaderboard: LeaderboardItem[];
}

export default function InvitarPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [myData, setMyData] = useState<MyReferralsData | null>(null);
  const [monthlyLeaderboard, setMonthlyLeaderboard] = useState<LeaderboardItem[]>([]);
  const [allTimeLeaderboard, setAllTimeLeaderboard] = useState<LeaderboardItem[]>([]);
  const [season, setSeason] = useState<SeasonInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'monthly' | 'all-time' | 'my-invites'>('monthly');

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      try {
        // Cargar ranking mensual
        const monthlyRes = await apiFetch<LeaderboardResponse>('/referrals/leaderboard?period=monthly').catch(() => null);
        if (isMounted && monthlyRes) {
          setMonthlyLeaderboard(monthlyRes.leaderboard || []);
          if (monthlyRes.season) {
            setSeason(monthlyRes.season);
          }
        }

        // Cargar ranking histórico
        const allTimeRes = await apiFetch<LeaderboardResponse>('/referrals/leaderboard?period=all_time').catch(() => null);
        if (isMounted && allTimeRes?.leaderboard) {
          setAllTimeLeaderboard(allTimeRes.leaderboard);
        }

        if (user) {
          const meRes = await apiFetch<MyReferralsData>('/referrals/me').catch(() => null);
          if (isMounted && meRes) {
            setMyData(meRes);
            if (meRes.season) {
              setSeason(meRes.season);
            }
          }
        }
      } catch (e) {
        console.error('Error cargando campaña de referidos:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (!authLoading) {
      loadData();
    }

    return () => {
      isMounted = false;
    };
  }, [user, authLoading]);

  const handleCopy = () => {
    if (!myData?.referralLink) return;
    navigator.clipboard.writeText(myData.referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VALID':
        return (
          <span style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#34D399',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '0.74rem',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            <Check size={12} color="#34D399" /> Verificada (+50 ⭐)
          </span>
        );
      case 'PENDING_INSCRIPTION':
        return (
          <span style={{
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            color: '#FBBF24',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '0.74rem',
            fontWeight: 600,
          }}>
            ⏳ Esperando Inscripción
          </span>
        );
      default:
        return (
          <span style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#F87171',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '0.74rem',
            fontWeight: 600,
          }}>
            ✕ Multicuenta detectada
          </span>
        );
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0915', color: '#fff', paddingBottom: '80px' }}>
      <Navbar />

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '30px 20px' }}>
        {/* Hero Banner */}
        <section style={{
          position: 'relative',
          borderRadius: '24px',
          padding: '40px 32px',
          background: 'linear-gradient(135deg, rgba(26, 20, 56, 0.9) 0%, rgba(13, 11, 26, 0.95) 100%)',
          border: '1px solid rgba(232, 199, 122, 0.25)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(232, 199, 122, 0.2)',
          overflow: 'hidden',
          marginBottom: '32px',
        }}>
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '280px',
            height: '280px',
            background: 'radial-gradient(circle, rgba(232, 199, 122, 0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Badges de Temporada Mensual */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '999px',
              background: 'rgba(232, 199, 122, 0.12)',
              border: '1px solid rgba(232, 199, 122, 0.3)',
              color: '#E8C77A',
              fontSize: '0.8rem',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              <Sparkles size={14} color="#E8C77A" /> Dinámica Mensual de Crecimiento
            </div>

            {season && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '999px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#34D399',
                fontSize: '0.8rem',
                fontWeight: 700,
              }}>
                ⏱️ Temporada de {season.monthName}: {season.daysRemaining} {season.daysRemaining === 1 ? 'día restante' : 'días restantes'} (Fin de mes)
              </div>
            )}
          </div>

          <h1 style={{
            fontSize: '2.4rem',
            fontWeight: 800,
            lineHeight: 1.2,
            margin: '0 0 12px 0',
            background: 'linear-gradient(135deg, #FFF8DB 0%, #E8C77A 50%, #9A7B38 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            ✦ Conviértete en Embajador Estelar ✦
          </h1>

          <p style={{
            color: 'rgba(255, 255, 255, 0.75)',
            fontSize: '1.05rem',
            maxWidth: '720px',
            lineHeight: 1.6,
            margin: '0 0 16px 0',
          }}>
            Invita a tus amigos, creadores y miembros de la comunidad. <strong>Cada fin de mes</strong> premiamos a los embajadores más activos con <strong>VRChat Plus</strong> o <strong>Discord Nitro</strong>.
          </p>

          <div style={{
            background: 'rgba(232, 199, 122, 0.08)',
            border: '1px solid rgba(232, 199, 122, 0.25)',
            borderRadius: '12px',
            padding: '12px 18px',
            maxWidth: '680px',
            fontSize: '0.86rem',
            color: 'rgba(255, 255, 255, 0.85)',
            lineHeight: 1.5,
            marginBottom: '26px',
          }}>
            ★ <strong>Reglas del ciclo:</strong> ¡Sin límite de invitaciones! Tienes todo el mes hasta el último día para invitar. Al terminar cada mes, el contador mensual se reinicia para dar inicio a una nueva temporada, mientras que el <strong>Salón Histórico</strong> acumula tu legado de todos los meses.
          </div>

          {/* Premios Destacados */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginTop: '20px',
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(232, 199, 122, 0.25)',
              borderRadius: '16px',
              padding: '18px',
              display: 'flex',
              gap: '14px',
              alignItems: 'center',
            }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.3rem',
                flexShrink: 0,
              }}>
                🌌
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: 700, textTransform: 'uppercase' }}>Premio Mayor (Fin de Mes)</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>VRChat Plus</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Para el Embajador #1 del mes</div>
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(88, 101, 242, 0.35)',
              borderRadius: '16px',
              padding: '18px',
              display: 'flex',
              gap: '14px',
              alignItems: 'center',
            }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #5865F2 0%, #404EED 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Discord size={24} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#B9C1FF', fontWeight: 700, textTransform: 'uppercase' }}>Premio Especial (Fin de Mes)</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>Discord Nitro</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Para los puestos top</div>
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(232, 199, 122, 0.2)',
              borderRadius: '16px',
              padding: '18px',
              display: 'flex',
              gap: '14px',
              alignItems: 'center',
            }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #E8C77A 0%, #B8860B 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.3rem',
                flexShrink: 0,
              }}>
                ⭐
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#E8C77A', fontWeight: 700, textTransform: 'uppercase' }}>Recompensa Inmediata</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>+50 Stardust</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Para ti y para tu amigo</div>
              </div>
            </div>
          </div>
        </section>

        {/* Caja de Enlace de Referido */}
        {user ? (
          <section style={{
            background: 'rgba(18, 14, 36, 0.85)',
            border: '1px solid rgba(232, 199, 122, 0.2)',
            borderRadius: '20px',
            padding: '24px',
            marginBottom: '32px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 4px 0', color: '#E8C77A' }}>
                  ✦ Tu Enlace Personal de Embajador
                </h2>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                  Comparte este enlace. Cada persona que complete su inscripción se sumará a tu marcador mensual y a tu récord histórico.
                </p>
              </div>
              <div style={{
                background: 'rgba(232, 199, 122, 0.1)',
                border: '1px solid rgba(232, 199, 122, 0.3)',
                padding: '6px 14px',
                borderRadius: '10px',
                fontSize: '0.82rem',
                color: '#E8C77A',
                fontWeight: 600,
              }}>
                Código: <strong style={{ color: '#fff' }}>{myData?.referralCode || user.username}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <input
                type="text"
                readOnly
                value={myData?.referralLink || `https://gremioweb.com/register?ref=${user.username}`}
                style={{
                  flex: 1,
                  minWidth: '280px',
                  background: 'rgba(10, 8, 20, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#fff',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  fontSize: '0.92rem',
                  fontFamily: 'monospace',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleCopy}
                style={{
                  background: copied ? '#10B981' : 'linear-gradient(135deg, #E8C77A 0%, #C49A45 100%)',
                  color: copied ? '#fff' : '#120E24',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                }}
              >
                {copied ? <Check size={16} /> : <Link2 size={16} />}
                {copied ? '¡Copiado!' : 'Copiar Enlace'}
              </button>
            </div>

            {/* Quick Share Buttons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Compartir directamente en:</span>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`¡Únete a Gremio Estelar conmigo y forma parte de la mejor comunidad VTuber y creadora! ✦ Regístrate aquí: ${myData?.referralLink || ''}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: '0.78rem',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                𝕏 Twitter / X
              </a>
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`¡Hola! Únete a Gremio Estelar con mi enlace de invitación: ${myData?.referralLink || ''}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: 'rgba(37, 211, 102, 0.12)',
                  border: '1px solid rgba(37, 211, 102, 0.25)',
                  color: '#25D366',
                  fontSize: '0.78rem',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                WhatsApp
              </a>
            </div>
          </section>
        ) : (
          <div style={{
            background: 'rgba(18, 14, 36, 0.85)',
            border: '1px solid rgba(232, 199, 122, 0.2)',
            borderRadius: '20px',
            padding: '28px',
            textAlign: 'center',
            marginBottom: '32px',
          }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#E8C77A' }}>Inicia sesión para obtener tu enlace personal</h3>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.9rem', marginBottom: '18px' }}>
              Debes tener una cuenta en Gremio Estelar para participar en la dinámica y registrar tus invitaciones.
            </p>
            <Link
              href="/login"
              style={{
                display: 'inline-block',
                background: 'linear-gradient(135deg, #E8C77A 0%, #C49A45 100%)',
                color: '#120E24',
                padding: '10px 24px',
                borderRadius: '10px',
                fontWeight: 700,
                textDecoration: 'none',
                fontSize: '0.9rem',
              }}
            >
              Iniciar Sesión
            </Link>
          </div>
        )}

        {/* Métricas del Usuario: Mensual vs Histórico */}
        {user && myData && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '32px',
          }}>
            {/* 1. Mensual Válidas */}
            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              borderRadius: '16px',
              padding: '20px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.75rem', color: '#34D399', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                🔥 Invitaciones Este Mes
              </div>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                {myData.monthlyValidCount ?? 0}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', marginTop: '6px' }}>
                Compitiendo por el premio de fin de mes
              </div>
            </div>

            {/* 2. Puesto del Mes */}
            <div style={{
              background: 'rgba(232, 199, 122, 0.08)',
              border: '1px solid rgba(232, 199, 122, 0.35)',
              borderRadius: '16px',
              padding: '20px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.75rem', color: '#E8C77A', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                🏆 Puesto del Mes
              </div>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#E8C77A', lineHeight: 1 }}>
                {myData.monthlyRank ? `#${myData.monthlyRank}` : '—'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', marginTop: '6px' }}>
                {myData.monthlyRank ? `Temporada de ${myData.season?.monthName || 'este mes'}` : 'Sin invitar este mes aún'}
              </div>
            </div>

            {/* 3. Total Histórico Acumulado */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '20px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                📜 Récord Histórico Total
              </div>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                {myData.validCount}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', marginTop: '6px' }}>
                Puesto global de todos los meses: {myData.allTimeRank ? `#${myData.allTimeRank}` : '—'}
              </div>
            </div>

            {/* 4. Por Completar Inscripción */}
            <div style={{
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '16px',
              padding: '20px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.75rem', color: '#FBBF24', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                ⏳ Esperando Inscripción
              </div>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                {myData.pendingCount}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', marginTop: '6px' }}>
                Total registrados con tu link: {myData.totalCount}
              </div>
            </div>
          </div>
        )}

        {/* Sistema Anti-Trampas Transparente */}
        <section style={{
          background: 'rgba(26, 21, 50, 0.5)',
          border: '1px solid rgba(232, 199, 122, 0.15)',
          borderRadius: '16px',
          padding: '20px 24px',
          marginBottom: '32px',
          display: 'flex',
          gap: '16px',
          alignItems: 'flex-start',
        }}>
          <Shield size={24} color="#E8C77A" style={{ marginTop: '2px' }} />
          <div>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '0.98rem', color: '#E8C77A' }}>
              ✦ Transparencia, Reinicio de Fin de Mes y Anti-Multicuentas
            </h4>
            <p style={{ margin: '0 0 8px 0', fontSize: '0.84rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
              Para garantizar que el <strong>VRChat Plus</strong> y <strong>Discord Nitro</strong> se entreguen de forma 100% justa a quienes realmente expanden la comunidad:
            </p>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.82rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
              <li><strong>Reinicio a Fin de Mes:</strong> El contador para ganar las suscripciones se reinicia el último día de cada mes a las 23:59:59. Todos inician en igualdad de condiciones cada nueva temporada.</li>
              <li><strong>Detección de multicuentas por red/IP:</strong> Cuentas secundarias creadas desde el mismo WiFi/router o navegador son filtradas de forma automática.</li>
              <li><strong>Sello de inscripción:</strong> La invitación se valida en cuanto el invitado sella su Hoja de Inscripción oficial.</li>
              <li><strong>Salón Histórico:</strong> Tus invitaciones de todos los meses quedan guardadas para siempre en la tabla histórica de embajadores legendarios.</li>
            </ul>
          </div>
        </section>

        {/* Selector de Pestañas: Mensual vs Histórico vs Mis Invitados */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '24px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('monthly')}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'monthly' ? '2px solid #E8C77A' : '2px solid transparent',
              color: activeTab === 'monthly' ? '#E8C77A' : 'rgba(255,255,255,0.6)',
              padding: '12px 18px',
              fontSize: '0.92rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            🔥 Carrera de Este Mes ({season?.monthName || 'Mes en Curso'})
          </button>

          <button
            onClick={() => setActiveTab('all-time')}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'all-time' ? '2px solid #E8C77A' : '2px solid transparent',
              color: activeTab === 'all-time' ? '#E8C77A' : 'rgba(255,255,255,0.6)',
              padding: '12px 18px',
              fontSize: '0.92rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            📜 Salón Histórico (Todos los Meses)
          </button>

          {user && (
            <button
              onClick={() => setActiveTab('my-invites')}
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'my-invites' ? '2px solid #E8C77A' : '2px solid transparent',
                color: activeTab === 'my-invites' ? '#E8C77A' : 'rgba(255,255,255,0.6)',
                padding: '12px 18px',
                fontSize: '0.92rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              👥 Tus Invitados ({myData?.totalCount || 0})
            </button>
          )}
        </div>

        {/* Tab 1: Carrera del Mes en Curso (Premios VRChat+ / Nitro) */}
        {activeTab === 'monthly' && (
          <section style={{
            background: 'rgba(18, 14, 36, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            padding: '24px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={20} color="#E8C77A" /> Tabla del Mes en Curso: {season?.monthName || 'Activa'}
              </h3>
              {season && (
                <span style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: 600 }}>
                  ✦ Se premia al finalizar {season.monthName} (en {season.daysRemaining} días)
                </span>
              )}
            </div>

            {monthlyLeaderboard.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                ✦ Aún no hay invitaciones registradas en este mes. ¡Invita hoy a tus amigos y toma el #1 de la temporada! ✦
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {monthlyLeaderboard.map((item) => {
                  const isTop1 = item.rank === 1;
                  const isTop2 = item.rank === 2;
                  const isTop3 = item.rank === 3;
                  const isMe = user?.id === item.id;

                  return (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 18px',
                        borderRadius: '14px',
                        background: isMe
                          ? 'rgba(232, 199, 122, 0.12)'
                          : isTop1
                          ? 'linear-gradient(90deg, rgba(232, 199, 122, 0.15) 0%, rgba(18, 14, 36, 0.5) 100%)'
                          : 'rgba(255, 255, 255, 0.02)',
                        border: isMe
                          ? '1px solid rgba(232, 199, 122, 0.5)'
                          : isTop1
                          ? '1px solid rgba(232, 199, 122, 0.35)'
                          : '1px solid rgba(255, 255, 255, 0.06)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: isTop1 || isTop2 || isTop3 ? '1.1rem' : '0.85rem',
                          background: isTop1
                            ? 'linear-gradient(135deg, #FFD700 0%, #B8860B 100%)'
                            : isTop2
                            ? 'linear-gradient(135deg, #E0E0E0 0%, #9E9E9E 100%)'
                            : isTop3
                            ? 'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)'
                            : 'rgba(255,255,255,0.06)',
                          color: isTop1 || isTop2 || isTop3 ? '#120E24' : 'rgba(255,255,255,0.7)',
                        }}>
                          {isTop1 ? '1°' : isTop2 ? '2°' : isTop3 ? '3°' : `${item.rank}`}
                        </div>

                        {item.avatarUrl ? (
                          <img
                            src={item.avatarUrl}
                            alt={item.displayName}
                            style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            background: 'rgba(232, 199, 122, 0.2)',
                            color: '#E8C77A',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                          }}>
                            {item.displayName.slice(0, 2).toUpperCase()}
                          </div>
                        )}

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>
                              {item.displayName}
                            </span>
                            {isMe && (
                              <span style={{
                                background: '#E8C77A',
                                color: '#120E24',
                                fontSize: '0.68rem',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                fontWeight: 800,
                              }}>
                                TÚ
                              </span>
                            )}
                            {isTop1 && (
                              <span style={{
                                background: 'rgba(16, 185, 129, 0.2)',
                                color: '#34D399',
                                border: '1px solid rgba(16, 185, 129, 0.4)',
                                fontSize: '0.68rem',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                fontWeight: 700,
                              }}>
                                🌌 Ganando VRChat+
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)' }}>
                            @{item.username}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34D399' }}>
                          {item.verifiedInvites}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' }}>
                          invitaciones este mes
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Tab 2: Salón Histórico (Acumulado de todos los meses) */}
        {activeTab === 'all-time' && (
          <section style={{
            background: 'rgba(18, 14, 36, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            padding: '24px',
          }}>
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={20} color="#E8C77A" /> Salón de Embajadores Legendarios (Histórico)
              </h3>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}>
                Los miembros que más personas han invitado a lo largo de todos los meses en la historia de Gremio Estelar.
              </p>
            </div>

            {allTimeLeaderboard.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                ✦ Aún no hay datos históricos registrados. ✦
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {allTimeLeaderboard.map((item) => {
                  const isTop1 = item.rank === 1;
                  const isTop2 = item.rank === 2;
                  const isTop3 = item.rank === 3;
                  const isMe = user?.id === item.id;

                  return (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 18px',
                        borderRadius: '14px',
                        background: isMe
                          ? 'rgba(232, 199, 122, 0.12)'
                          : 'rgba(255, 255, 255, 0.02)',
                        border: isMe
                          ? '1px solid rgba(232, 199, 122, 0.5)'
                          : '1px solid rgba(255, 255, 255, 0.06)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: isTop1 || isTop2 || isTop3 ? '1.1rem' : '0.85rem',
                          background: isTop1
                            ? 'linear-gradient(135deg, #FFD700 0%, #B8860B 100%)'
                            : isTop2
                            ? 'linear-gradient(135deg, #E0E0E0 0%, #9E9E9E 100%)'
                            : isTop3
                            ? 'linear-gradient(135deg, #CD7F32 0%, #8B4513 100%)'
                            : 'rgba(255,255,255,0.06)',
                          color: isTop1 || isTop2 || isTop3 ? '#120E24' : 'rgba(255,255,255,0.7)',
                        }}>
                          {isTop1 ? '1°' : isTop2 ? '2°' : isTop3 ? '3°' : `${item.rank}`}
                        </div>

                        {item.avatarUrl ? (
                          <img
                            src={item.avatarUrl}
                            alt={item.displayName}
                            style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            background: 'rgba(232, 199, 122, 0.2)',
                            color: '#E8C77A',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                          }}>
                            {item.displayName.slice(0, 2).toUpperCase()}
                          </div>
                        )}

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>
                              {item.displayName}
                            </span>
                            {isMe && (
                              <span style={{
                                background: '#E8C77A',
                                color: '#120E24',
                                fontSize: '0.68rem',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                fontWeight: 800,
                              }}>
                                TÚ
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)' }}>
                            @{item.username}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#E8C77A' }}>
                          {item.verifiedInvites}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' }}>
                          invitaciones totales
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Tab 3: Mis Invitados */}
        {activeTab === 'my-invites' && user && myData && (
          <section style={{
            background: 'rgba(18, 14, 36, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            padding: '24px',
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} color="#E8C77A" /> Registro de tus Invitados
            </h3>

            {myData.referrals.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                Aún no has invitado a nadie. Comparte tu enlace y tus amigos aparecerán aquí en cuanto se registren.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {myData.referrals.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      flexWrap: 'wrap',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {r.user.avatarUrl ? (
                        <img
                          src={r.user.avatarUrl}
                          alt={r.user.displayName}
                          style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: 'rgba(232, 199, 122, 0.2)',
                          color: '#E8C77A',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                        }}>
                          {r.user.displayName.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff' }}>
                          {r.user.displayName}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.45)' }}>
                          @{r.user.username} • Se unió {new Date(r.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </div>
                      </div>
                    </div>

                    <div>
                      {getStatusBadge(r.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
