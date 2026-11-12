'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/lib/ToastContext';
import Link from 'next/link';
import UserAvatar from '@/components/ui/UserAvatar';
import {
  APPLICATION_ROLES_CONFIG,
  getAllApplicationConfigs,
  type ApplicationRole,
  type RoleApplicationConfig,
} from '@gremio-estelar/shared';

interface MyRequest {
  id: string;
  type: string;
  status: string;
  displayName: string;
  notes: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

export default function PostulacionesPage() {
  const { user, isLoading } = useAuth();
  const { showToast } = useToast();

  const [activeRole, setActiveRole] = useState<RoleApplicationConfig | null>(null);
  const [myRequests, setMyRequests] = useState<MyRequest[]>([]);
  const [loadingMyRequests, setLoadingMyRequests] = useState(false);

  // Wizard state
  const [step, setStep] = useState<number>(1);
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [lore, setLore] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [challengeAction, setChallengeAction] = useState('');
  const [challengeMedia, setChallengeMedia] = useState('');
  const [challengeJustification, setChallengeJustification] = useState('');
  const [pledgeAccepted, setPledgeAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const configs = getAllApplicationConfigs();

  const loadMyRequests = async () => {
    if (!user) return;
    setLoadingMyRequests(true);
    try {
      const data = await apiFetch('/applications/my');
      if (Array.isArray(data)) {
        setMyRequests(data);
      }
    } catch {
      // Ignorar error si no está autenticado
    } finally {
      setLoadingMyRequests(false);
    }
  };

  useEffect(() => {
    loadMyRequests();
  }, [user]);

  useEffect(() => {
    if (user && !displayName) {
      setDisplayName(user.displayName || user.username || '');
      setAvatarUrl(user.avatarUrl || user.vtuberProfile?.avatarUrl || '');
    }
  }, [user, displayName]);

  const openWizard = (cfg: RoleApplicationConfig) => {
    // Check if user already has a pending request of this type
    const pendingReq = myRequests.find(r => r.type === cfg.role && r.status === 'PENDING');
    if (pendingReq) {
      showToast(`✦ Ya tienes una postulación pendiente para ${cfg.title}.`, 'info');
      return;
    }

    setActiveRole(cfg);
    setStep(1);
    setAnswers({});
    setChallengeAction('');
    setChallengeMedia('');
    setChallengeJustification('');
    setPledgeAccepted(false);
    setSubmittedSuccess(false);
  };

  const closeWizard = () => {
    setActiveRole(null);
    setStep(1);
    setSubmittedSuccess(false);
  };

  const handleAnswerChange = (questionId: string, val: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: val }));
  };

  const handleNextStep = () => {
    if (!activeRole) return;

    if (step === 1) {
      if (!displayName.trim()) {
        showToast('Por favor introduce tu nombre o alias para la postulación.', 'error');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      // Validate required questions
      for (const q of activeRole.questions) {
        if (q.required && (!answers[q.id] || !answers[q.id].trim())) {
          showToast(`Por favor responde a: "${q.label}"`, 'error');
          return;
        }
      }
      setStep(3);
    } else if (step === 3) {
      // Validate challenge
      if (activeRole.challenge.requiresActionChoice && !challengeAction) {
        showToast('Por favor selecciona una decisión táctica en el reto.', 'error');
        return;
      }
      if (activeRole.challenge.requiresMediaOrUrl && !challengeMedia.trim()) {
        showToast('Por favor proporciona el enlace o muestra solicitada.', 'error');
        return;
      }
      if (activeRole.challenge.requiresTextJustification && !challengeJustification.trim()) {
        showToast('Por favor redacta tu justificación o resolución del reto.', 'error');
        return;
      }
      setStep(4);
    }
  };

  const handleSubmitApplication = async () => {
    if (!user) {
      showToast('Debes iniciar sesión para postular.', 'error');
      return;
    }
    if (!activeRole) return;
    if (!pledgeAccepted) {
      showToast('Debes aceptar el juramento estelar para enviar tu postulación.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payloadAnswers: Record<string, any> = {
        ...answers,
        challenge_action: challengeAction || undefined,
        challenge_media: challengeMedia || undefined,
        challenge_justification: challengeJustification || undefined,
      };

      await apiFetch('/applications/submit', {
        method: 'POST',
        body: JSON.stringify({
          type: activeRole.role,
          displayName: displayName.trim(),
          avatarUrl: avatarUrl.trim() || undefined,
          lore: lore.trim() || undefined,
          surveyAnswers: payloadAnswers,
        }),
      });

      setSubmittedSuccess(true);
      showToast(`✦ ¡Postulación de ${activeRole.title} enviada con éxito!`, 'success');
      loadMyRequests();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error al enviar postulación', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '24px 16px 80px' }}>
      {/* HERO BANNER */}
      <div
        className="glass"
        style={{
          padding: '36px 32px',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(56, 189, 248, 0.08), rgba(0,0,0,0.6))',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          textAlign: 'center',
          marginBottom: '36px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 14px',
          borderRadius: '999px',
          background: 'rgba(251, 191, 36, 0.12)',
          border: '1px solid rgba(251, 191, 36, 0.3)',
          color: '#fbbf24',
          fontSize: '0.82rem',
          fontWeight: 800,
          marginBottom: '16px',
        }}>
          <span>★</span> Convocatorias y Postulaciones Abiertas
        </div>

        <h1 style={{ fontSize: '2.4rem', fontWeight: 900, color: '#fff', margin: '0 0 12px 0', letterSpacing: '-0.02em' }}>
          Portal de Postulaciones Estelares
        </h1>

        <p style={{ maxWidth: '680px', margin: '0 auto 20px', color: 'var(--text-muted)', fontSize: '0.98rem', lineHeight: 1.6 }}>
          El Gremio se forja con el talento y la dedicación de sus miembros. Cada rol cuenta con una prueba única diseñada para poner a prueba tu vocación y tus habilidades. Elige tu senda y únete a las filas activas del Santuario.
        </p>

        {!user && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <Link href="/login" className="btn" style={{ padding: '10px 24px', fontSize: '0.9rem' }}>
              Iniciar Sesión para Postular ✦
            </Link>
          </div>
        )}
      </div>

      {/* MY REQUESTS SECTION (IF AUTHENTICATED) */}
      {user && myRequests.length > 0 && (
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#38bdf8' }}>✦</span> Mis Postulaciones Enviadas
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '14px' }}>
            {myRequests.map(req => {
              const cfg = APPLICATION_ROLES_CONFIG[req.type as ApplicationRole];
              const isApproved = req.status === 'APPROVED';
              const isRejected = req.status === 'REJECTED';
              const statusColor = isApproved ? '#10b981' : isRejected ? '#ef4444' : '#f59e0b';
              const statusText = isApproved ? 'Aprobada' : isRejected ? 'Rechazada' : 'En Revisión';

              return (
                <div
                  key={req.id}
                  className="glass"
                  style={{
                    padding: '18px 20px',
                    borderRadius: '16px',
                    border: `1px solid ${statusColor}44`,
                    background: `${statusColor}08`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: cfg?.color || '#fff', fontSize: '1.1rem' }}>{cfg?.symbol || '✦'}</span>
                      <strong style={{ fontSize: '0.95rem', color: '#fff' }}>
                        {cfg?.title || req.type}
                      </strong>
                    </div>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '3px 10px',
                      borderRadius: '999px',
                      background: `${statusColor}22`,
                      color: statusColor,
                      border: `1px solid ${statusColor}55`,
                    }}>
                      {statusText}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Alias: {req.displayName} · Enviada el {new Date(req.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>

                  {req.notes && (
                    <div style={{
                      marginTop: '10px', padding: '10px 12px', borderRadius: '10px',
                      background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)',
                      fontSize: '0.8rem', color: '#e4e4e7',
                    }}>
                      <strong style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: '2px' }}>
                        Feedback del Staff:
                      </strong>
                      {req.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ROLES SELECTION GRID */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '8px' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#fbbf24' }}>★</span> Vacantes y Roles Disponibles
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Selecciona una vacante para comenzar tu postulación
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '18px' }}>
          {configs.map(cfg => {
            const isUserInRole = user?.role?.includes(cfg.role);
            const pendingReq = myRequests.find(r => r.type === cfg.role && r.status === 'PENDING');

            return (
              <div
                key={cfg.role}
                className="glass"
                style={{
                  padding: '24px',
                  borderRadius: '20px',
                  border: `1px solid ${cfg.color}33`,
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(0,0,0,0.4) 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '16px',
                  transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = `${cfg.color}88`;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = `${cfg.color}33`;
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div>
                  {/* Top Bar: Badge & Symbol */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      padding: '4px 12px',
                      borderRadius: '999px',
                      background: `${cfg.color}18`,
                      color: cfg.color,
                      border: `1px solid ${cfg.color}44`,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}>
                      <span>{cfg.symbol}</span> {cfg.badge}
                    </span>

                    {isUserInRole && (
                      <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700 }}>
                        ✓ Rol Activo
                      </span>
                    )}
                    {!isUserInRole && pendingReq && (
                      <span style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 700 }}>
                        En Revisión
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: '0 0 6px 0' }}>
                    {cfg.title}
                  </h3>

                  <p style={{ fontSize: '0.82rem', color: cfg.color, fontWeight: 600, margin: '0 0 12px 0' }}>
                    {cfg.subtitle}
                  </p>

                  <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.55, margin: 0 }}>
                    {cfg.description}
                  </p>
                </div>

                {/* Challenge Preview pill */}
                <div style={{
                  padding: '10px 14px', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: '2px' }}>
                    Reto Único Especial:
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#e4e4e7', fontWeight: 600 }}>
                    ★ {cfg.challenge.title}
                  </div>
                </div>

                {/* Action button */}
                <button
                  onClick={() => openWizard(cfg)}
                  disabled={!user || isUserInRole || !!pendingReq}
                  className="btn"
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    background: isUserInRole
                      ? 'rgba(255,255,255,0.06)'
                      : pendingReq
                      ? 'rgba(245,158,11,0.15)'
                      : `linear-gradient(135deg, ${cfg.color}dd, ${cfg.color}88)`,
                    color: isUserInRole ? 'var(--text-muted)' : pendingReq ? '#f59e0b' : '#000',
                    border: 'none',
                    cursor: !user || isUserInRole || !!pendingReq ? 'not-allowed' : 'pointer',
                  }}
                >
                  {!user
                    ? 'Inicia sesión para postular'
                    : isUserInRole
                    ? 'Ya posees este rol'
                    : pendingReq
                    ? 'Postulación en revisión'
                    : `Postular como ${cfg.title} ✦`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          WIZARD MODAL (INTERACTIVE MULTI-STEP FLOW)
          ========================================================================= */}
      {activeRole && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
          }}
          onClick={closeWizard}
        >
          <div
            className="glass"
            style={{
              width: '100%', maxWidth: '720px', maxHeight: '90vh',
              borderRadius: '24px', overflowY: 'auto',
              background: '#0c0c14', border: `1px solid ${activeRole.color}55`,
              boxShadow: `0 25px 60px rgba(0,0,0,0.9), 0 0 40px ${activeRole.color}22`,
              display: 'flex', flexDirection: 'column',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* WIZARD HEADER */}
            <div style={{
              padding: '24px 28px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              background: `linear-gradient(135deg, ${activeRole.color}18, transparent)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ color: activeRole.color, fontSize: '1.2rem' }}>{activeRole.symbol}</span>
                  <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: '#fff' }}>
                    Postulación: {activeRole.title}
                  </h2>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Paso {step} de 4 · {step === 1 ? 'Identidad' : step === 2 ? 'Cuestionario' : step === 3 ? 'Reto Único' : 'Juramento'}
                </div>
              </div>

              <button
                onClick={closeWizard}
                style={{ background: 'none', border: 'none', color: '#a1a1aa', fontSize: '1.4rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* STEP PROGRESS INDICATOR */}
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', width: '100%' }}>
              <div
                style={{
                  height: '100%',
                  width: `${(step / 4) * 100}%`,
                  background: `linear-gradient(90deg, ${activeRole.color}, #38bdf8)`,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>

            {/* WIZARD CONTENT */}
            <div style={{ padding: '28px', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {submittedSuccess ? (
                /* SUCCESS STATE */
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{
                    width: '64px', height: '64px', borderRadius: '50%',
                    background: `${activeRole.color}22`, border: `2px solid ${activeRole.color}`,
                    color: activeRole.color, fontSize: '2rem', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                  }}>
                    ✓
                  </div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff', marginBottom: '8px' }}>
                    ¡Tu postulación ha sido enviada a las estrellas!
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: '480px', margin: '0 auto 24px', lineHeight: 1.6 }}>
                    El Alto Mando y los evaluadores del Gremio revisarán tu cuestionario y tu resolución del reto único. Recibirás una notificación en la plataforma con el veredicto oficial.
                  </p>
                  <button onClick={closeWizard} className="btn" style={{ padding: '10px 28px', fontSize: '0.9rem' }}>
                    Entendido ✦
                  </button>
                </div>
              ) : (
                <>
                  {/* STEP 1: IDENTITY */}
                  {step === 1 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)' }}>
                        <UserAvatar
                          src={avatarUrl}
                          alt={displayName}
                          userId={user?.id}
                          size={54}
                        />
                        <div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Postulando con la cuenta:</div>
                          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>@{user?.username}</div>
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
                          Nombre o Alias Oficial de Aspirante <span style={{ color: activeRole.color }}>*</span>
                        </label>
                        <input
                          type="text"
                          className="input"
                          placeholder="Tu nombre de creador, streamer o alias..."
                          value={displayName}
                          onChange={e => setDisplayName(e.target.value)}
                          style={{ width: '100%', padding: '10px 14px', fontSize: '0.9rem' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
                          URL del Avatar o Foto de Presentación (Opcional)
                        </label>
                        <input
                          type="text"
                          className="input"
                          placeholder="https://imgur.com/... o enlace a imagen"
                          value={avatarUrl}
                          onChange={e => setAvatarUrl(e.target.value)}
                          style={{ width: '100%', padding: '10px 14px', fontSize: '0.9rem' }}
                        />
                      </div>

                      {(activeRole.role === 'VTUBER' || activeRole.role === 'STREAMER') && (
                        <div>
                          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
                            Breve Biografía o Descripción del Canal
                          </label>
                          <textarea
                            className="input"
                            rows={3}
                            placeholder="Cuéntanos un resumen rápido de quién eres..."
                            value={lore}
                            onChange={e => setLore(e.target.value)}
                            style={{ width: '100%', padding: '10px 14px', fontSize: '0.9rem', resize: 'vertical' }}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* STEP 2: VOCATION SURVEY QUESTIONS */}
                  {step === 2 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                      <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        Responde con sinceridad. Tus respuestas serán evaluadas directamente por los administradores del Gremio.
                      </div>

                      {activeRole.questions.map(q => (
                        <div key={q.id}>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
                            {q.label} {q.required && <span style={{ color: activeRole.color }}>*</span>}
                          </label>
                          {q.description && (
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 6px 0' }}>
                              {q.description}
                            </p>
                          )}
                          {q.type === 'textarea' ? (
                            <textarea
                              className="input"
                              rows={3}
                              placeholder={q.placeholder}
                              value={answers[q.id] || ''}
                              onChange={e => handleAnswerChange(q.id, e.target.value)}
                              style={{ width: '100%', padding: '10px 14px', fontSize: '0.9rem', resize: 'vertical' }}
                            />
                          ) : (
                            <input
                              type="text"
                              className="input"
                              placeholder={q.placeholder}
                              value={answers[q.id] || ''}
                              onChange={e => handleAnswerChange(q.id, e.target.value)}
                              style={{ width: '100%', padding: '10px 14px', fontSize: '0.9rem' }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* STEP 3: UNIQUE ROLE CHALLENGE */}
                  {step === 3 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {/* Challenge Banner */}
                      <div style={{
                        padding: '18px 20px', borderRadius: '16px',
                        background: `linear-gradient(135deg, ${activeRole.color}15, rgba(0,0,0,0.5))`,
                        border: `1px solid ${activeRole.color}44`,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span style={{ fontSize: '1.2rem', color: activeRole.color }}>★</span>
                          <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#fff', margin: 0 }}>
                            {activeRole.challenge.title}
                          </h3>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                          {activeRole.challenge.tagline}
                        </p>
                      </div>

                      {/* Scenario prompt if any */}
                      {activeRole.challenge.promptScenario && (
                        <div style={{
                          padding: '14px 16px', borderRadius: '12px',
                          background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)',
                          fontSize: '0.85rem', color: '#e4e4e7', whiteSpace: 'pre-wrap', lineHeight: 1.6,
                        }}>
                          <strong style={{ color: activeRole.color, display: 'block', marginBottom: '6px' }}>
                            Caso o Situación a Resolver:
                          </strong>
                          {activeRole.challenge.promptScenario}
                        </div>
                      )}

                      {/* Action options (if scenario has radio options) */}
                      {activeRole.challenge.requiresActionChoice && activeRole.challenge.options && (
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#fff', marginBottom: '10px' }}>
                            Selecciona tu Decisión Táctica: <span style={{ color: activeRole.color }}>*</span>
                          </label>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {activeRole.challenge.options.map(opt => (
                              <label
                                key={opt.value}
                                style={{
                                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                                  padding: '12px 14px', borderRadius: '12px',
                                  background: challengeAction === opt.value ? `${activeRole.color}18` : 'rgba(255,255,255,0.02)',
                                  border: `1px solid ${challengeAction === opt.value ? activeRole.color : 'rgba(255,255,255,0.06)'}`,
                                  cursor: 'pointer', transition: 'all 0.15s ease',
                                }}
                              >
                                <input
                                  type="radio"
                                  name="challengeAction"
                                  value={opt.value}
                                  checked={challengeAction === opt.value}
                                  onChange={e => setChallengeAction(e.target.value)}
                                  style={{ marginTop: '3px' }}
                                />
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>
                                    {opt.label}
                                  </div>
                                  {opt.description && (
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                      {opt.description}
                                    </div>
                                  )}
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Media Link if challenge requires media */}
                      {activeRole.challenge.requiresMediaOrUrl && (
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
                            {activeRole.challenge.mediaLabel || 'Enlace a Muestra Multimedia'} <span style={{ color: activeRole.color }}>*</span>
                          </label>
                          <input
                            type="text"
                            className="input"
                            placeholder={activeRole.challenge.mediaPlaceholder || 'https://...'}
                            value={challengeMedia}
                            onChange={e => setChallengeMedia(e.target.value)}
                            style={{ width: '100%', padding: '10px 14px', fontSize: '0.9rem' }}
                          />
                        </div>
                      )}

                      {/* Text Justification */}
                      {activeRole.challenge.requiresTextJustification && (
                        <div>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
                            Tu Respuesta / Justificación Detallada <span style={{ color: activeRole.color }}>*</span>
                          </label>
                          <textarea
                            className="input"
                            rows={4}
                            placeholder={activeRole.challenge.justificationPlaceholder || 'Escribe aquí tu análisis o resolución...'}
                            value={challengeJustification}
                            onChange={e => setChallengeJustification(e.target.value)}
                            style={{ width: '100%', padding: '12px 14px', fontSize: '0.9rem', resize: 'vertical' }}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* STEP 4: THE PLEDGE */}
                  {step === 4 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                      <div style={{
                        padding: '24px', borderRadius: '18px',
                        background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.08), rgba(0,0,0,0.6))',
                        border: '1px solid rgba(251, 191, 36, 0.3)',
                        textAlign: 'center',
                      }}>
                        <div style={{ fontSize: '1.8rem', color: '#fbbf24', marginBottom: '8px' }}>★</div>
                        <h4 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#fff', margin: '0 0 12px 0' }}>
                          El Juramento de {activeRole.title}
                        </h4>
                        <p style={{
                          fontSize: '0.95rem', color: '#e4e4e7', fontStyle: 'italic',
                          lineHeight: 1.6, margin: 0, padding: '0 12px',
                        }}>
                          "{activeRole.pledge}"
                        </p>
                      </div>

                      {/* Summary review preview */}
                      <div style={{
                        padding: '14px 18px', borderRadius: '14px',
                        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                        fontSize: '0.84rem', color: 'var(--text-muted)',
                      }}>
                        <strong style={{ color: '#fff', display: 'block', marginBottom: '4px' }}>
                          Resumen de la Postulación:
                        </strong>
                        <div>• Aspirante: <span style={{ color: '#fff' }}>{displayName}</span></div>
                        <div>• Rol: <span style={{ color: activeRole.color }}>{activeRole.title}</span></div>
                        <div>• Preguntas respondidas: <span style={{ color: '#fff' }}>{Object.keys(answers).length}</span></div>
                        <div>• Reto de rol completado: <span style={{ color: '#10b981' }}>✓ Listo</span></div>
                      </div>

                      {/* Agreement Checkbox */}
                      <label style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '14px 16px', borderRadius: '14px',
                        background: pledgeAccepted ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${pledgeAccepted ? '#10b981' : 'rgba(255,255,255,0.08)'}`,
                        cursor: 'pointer', transition: 'all 0.15s ease',
                      }}>
                        <input
                          type="checkbox"
                          checked={pledgeAccepted}
                          onChange={e => setPledgeAccepted(e.target.checked)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff' }}>
                          Acepto el Juramento Estelar y me comprometo a cumplir con honor los deberes de este cargo.
                        </span>
                      </label>
                    </div>
                  )}

                  {/* WIZARD FOOTER NAVIGATION */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', marginTop: '10px',
                  }}>
                    {step > 1 ? (
                      <button
                        onClick={() => setStep(s => s - 1)}
                        className="btn btn--outline"
                        style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                      >
                        ← Anterior
                      </button>
                    ) : (
                      <div />
                    )}

                    {step < 4 ? (
                      <button
                        onClick={handleNextStep}
                        className="btn"
                        style={{
                          padding: '9px 24px', fontSize: '0.88rem',
                          background: `linear-gradient(135deg, ${activeRole.color}, #38bdf8)`,
                          color: '#000', fontWeight: 800, border: 'none',
                        }}
                      >
                        Siguiente →
                      </button>
                    ) : (
                      <button
                        onClick={handleSubmitApplication}
                        disabled={submitting || !pledgeAccepted}
                        className="btn"
                        style={{
                          padding: '10px 28px', fontSize: '0.9rem',
                          background: pledgeAccepted ? '#10b981' : 'rgba(255,255,255,0.1)',
                          color: pledgeAccepted ? '#000' : 'var(--text-muted)',
                          fontWeight: 900, border: 'none',
                          cursor: pledgeAccepted && !submitting ? 'pointer' : 'not-allowed',
                        }}
                      >
                        {submitting ? 'Enviando a las Estrellas...' : '✦ Firmar Juramento y Enviar'}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
