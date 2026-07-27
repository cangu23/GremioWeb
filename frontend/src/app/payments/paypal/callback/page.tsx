'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/lib/ToastContext';
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';
import ClientOnly from '@/lib/ClientOnly';

function PayPalCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();
  const { user, isLoading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultData, setResultData] = useState<any>(null);

  useEffect(() => {
    if (authLoading) return;

    const confirmTx = async () => {
      const token = searchParams?.get('token'); // PayPal Order ID
      const orderId = searchParams?.get('orderId') || token;
      const clientTxId = searchParams?.get('clientTxId');
      const txId = searchParams?.get('txId');
      const status = searchParams?.get('status');

      if (status === 'canceled') {
        setLoading(false);
        setError('El pago por PayPal fue cancelado por el usuario.');
        return;
      }

      try {
        const res = await apiFetch('/payments/paypal/capture-order', {
          method: 'POST',
          body: JSON.stringify({
            orderId: orderId || 'SIMULATED',
            clientTxId: clientTxId || '',
            txId: txId || '',
          }),
        });

        if (res?.success) {
          setSuccess(true);
          setResultData(res);
          showToast(res.message || '¡Pago con PayPal procesado con éxito!', 'success');
        } else {
          setError(res?.message || 'No se pudo verificar la orden con PayPal.');
        }
      } catch (err: any) {
        setError(err?.message || 'Error al procesar la captura del pago en PayPal.');
      } finally {
        setLoading(false);
      }
    };

    confirmTx();
  }, [searchParams, showToast, authLoading]);

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        className="glass"
        style={{
          width: '100%',
          maxWidth: '520px',
          padding: '36px 28px',
          borderRadius: '24px',
          textAlign: 'center',
          background: 'linear-gradient(145deg, rgba(15,23,42,0.95), rgba(30,27,75,0.95))',
          border: '1px solid rgba(56,189,248,0.2)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
        }}
      >
        {/* LOGO DE PAYPAL & GREMIO */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '999px',
            background: 'rgba(56,189,248,0.12)',
            border: '1px solid rgba(56,189,248,0.3)',
            color: '#38bdf8',
            fontSize: '0.8rem',
            fontWeight: 800,
            marginBottom: '24px',
          }}
        >
          <span>🅿️ PayPal Checkout</span>
          <span>•</span>
          <span>⭐ Gremio Estelar</span>
        </div>

        {loading ? (
          <div>
            <div
              style={{
                width: '50px',
                height: '50px',
                border: '4px solid rgba(56,189,248,0.2)',
                borderTopColor: '#38bdf8',
                borderRadius: '50%',
                margin: '0 auto 20px',
                animation: 'spin 1s linear infinite',
              }}
            />
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
              Capturando tu pago con PayPal...
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Por favor espera unos segundos mientras confirmamos tu orden con PayPal.
            </p>
          </div>
        ) : success ? (
          <div>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #00e676, #00c853)',
                color: '#000',
                fontSize: '2rem',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                boxShadow: '0 0 25px rgba(0,230,118,0.4)',
              }}
            >
              ✓
            </div>

            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', marginBottom: '8px' }}>
              ¡Pago Exitoso con PayPal!
            </h2>

            <p style={{ fontSize: '0.92rem', color: '#00e676', fontWeight: 700, marginBottom: '20px' }}>
              {resultData?.message || 'Tu orden ha sido procesada correctamente por PayPal.'}
            </p>

            {resultData?.planKey && (
              <div
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  marginBottom: '24px',
                  fontSize: '0.88rem',
                  color: 'var(--text-muted)',
                }}
              >
                <div>Plan: <strong style={{ color: '#fff' }}>{resultData.planKey}</strong></div>
                {resultData.recipientUsername && (
                  <div>Beneficiario: <strong style={{ color: '#c084fc' }}>@{resultData.recipientUsername}</strong></div>
                )}
                <div>Monto: <strong style={{ color: '#38bdf8' }}>${resultData.amount} USD</strong></div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Link
                href="/premium"
                className="btn btn--primary"
                style={{ padding: '12px 24px', fontSize: '0.9rem', fontWeight: 800, borderRadius: '12px' }}
              >
                Ver Mi Membresía Premium →
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.4)',
                color: '#ef4444',
                fontSize: '1.8rem',
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              ✕
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
              No se pudo completar el pago con PayPal
            </h2>

            <p style={{ fontSize: '0.88rem', color: '#ef4444', marginBottom: '24px' }}>
              {error || 'El pago no pudo ser verificado.'}
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => router.push('/premium')}
                className="btn"
                style={{ padding: '10px 20px', fontSize: '0.88rem' }}
              >
                Volver a Planes Premium
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PayPalCallbackPage() {
  return (
    <ClientOnly>
      <Suspense fallback={<div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Cargando PayPal...</div>}>
        <PayPalCallbackContent />
      </Suspense>
    </ClientOnly>
  );
}
