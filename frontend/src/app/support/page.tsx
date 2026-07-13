'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';
import ClientOnly from '@/lib/ClientOnly';

interface Tier {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: string;
  benefits: string[];
  badgeLabel: string | null;
  color: string | null;
  active: boolean;
}

function SupportContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [mySub, setMySub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tiersData, subData] = await Promise.all([
          apiFetch('/payments/tiers', {}),
          user ? apiFetch('/payments/subscription/me', {}).catch(() => null) : Promise.resolve(null),
        ]);
        setTiers(tiersData);
        setMySub(subData);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleSubscribe = async (tierId: string) => {
    if (!user) { router.push('/login'); return; }
    try {
      const sub = await apiFetch('/payments/subscribe', {
        method: 'POST',
        body: JSON.stringify({ tierId }),
      });
      setMySub(sub);
      setMessage('¡Suscripción activada!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: unknown) {
      setMessage(`Error: ${err instanceof Error ? err.message : 'Error'}`);
    }
  };

  const handleCancel = async () => {
    try {
      await apiFetch('/payments/cancel', { method: 'POST' });
      setMySub(null);
      setMessage('Suscripción cancelada.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: unknown) {
      setMessage(`Error: ${err instanceof Error ? err.message : 'Error'}`);
    }
  };

  if (loading) {
    return <div className="container" style={{ padding: '40px', textAlign: 'center' }}>Cargando...</div>;
  }

  return (
    <>
      <h1 style={{ marginBottom: '10px', fontSize: '2.5rem' }}>Apoya a la Comunidad</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '30px', maxWidth: '600px' }}>
        Conviértete en miembro y obtén beneficios exclusivos mientras apoyas 
        a los VTubers de Gremio Estelar.
      </p>

      {message && (
        <div
          style={{
            padding: '12px 20px',
            borderRadius: '8px',
            marginBottom: '20px',
            background: message.startsWith('Error')
              ? 'rgba(255,77,79,0.1)'
              : 'rgba(0,230,118,0.1)',
            color: message.startsWith('Error') ? 'var(--error)' : 'var(--success)',
          }}
        >
          {message}
        </div>
      )}

      {mySub && (
        <div className="glass" style={{ padding: '20px', marginBottom: '30px', borderLeft: '4px solid var(--success)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Suscripción activa</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                {mySub.tier.badgeLabel} {mySub.tier.name}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                Renueva el {new Date(mySub.currentPeriodEnd).toLocaleDateString('es-ES')}
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="btn"
              style={{
                padding: '8px 16px',
                fontSize: '0.85rem',
                background: 'transparent',
                border: '1px solid var(--error)',
                color: 'var(--error)',
              }}
            >
              Cancelar suscripción
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', marginBottom: '40px' }}>
        {tiers.map((tier) => {
          const isActive = mySub?.tierId === tier.id;
          return (
            <div
              key={tier.id}
              className="glass"
              style={{
                padding: '32px 24px',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden',
                border: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                transition: 'all 0.3s ease',
              }}
            >
              {tier.color && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: tier.color,
                  }}
                />
              )}
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ width: '36px', height: '3px', borderRadius: '2px', background: tier.color || 'var(--primary)', margin: '0 auto 12px' }} />
                <h3 style={{ margin: 0, fontSize: '1.3rem' }}>{tier.name}</h3>
                <div style={{ marginTop: '8px' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 800 }}>${tier.price}</span>
                  <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>/{tier.interval === 'year' ? 'año' : 'mes'}</span>
                </div>
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '8px' }}>{tier.description}</p>
              </div>
              <div style={{ flex: 1 }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {tier.benefits.map((b, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
                      <span style={{ color: 'var(--success)' }}>✓</span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => handleSubscribe(tier.id)}
                className="btn"
                style={{
                  marginTop: '24px',
                  padding: '12px',
                  width: '100%',
                  background: isActive ? 'transparent' : undefined,
                  border: isActive ? '1px solid var(--primary)' : undefined,
                }}
                disabled={isActive}
              >
                {isActive ? 'Suscripción activa' : 'Suscribirse'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Donations info */}
      <div className="glass" style={{ padding: '24px' }}>
        <h3 style={{ margin: '0 0 12px 0' }}>Donaciones</h3>
        <p style={{ color: 'var(--muted)', margin: 0 }}>
          También puedes apoyar directamente a los VTubers que te gustan con donaciones.
          Ve a su perfil público y haz clic en {'"Donar"'}.
        </p>
      </div>
    </>
  );
}

export default function SupportPage() {
  return (
    <div className="container" style={{ paddingBottom: '40px', paddingTop: '20px', maxWidth: '900px' }}>
      <ClientOnly
        fallback={
          <div className="container" style={{ padding: '40px', textAlign: 'center' }}>
            Cargando...
          </div>
        }
      >
        <SupportContent />
      </ClientOnly>
    </div>
  );
}
