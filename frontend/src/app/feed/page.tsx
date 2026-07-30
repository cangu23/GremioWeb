'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ClientOnly from '@/lib/ClientOnly';

function FeedRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams?.toString();
    router.replace(query ? `/?${query}` : '/');
  }, [router, searchParams]);

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: 'var(--text-muted)', flexDirection: 'column', gap: '16px' }}>
      <span style={{ width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p>Redirigiendo al Feed Principal...</p>
    </div>
  );
}

export default function FeedRedirectPage() {
  return (
    <Suspense fallback={
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: 'var(--text-muted)' }}>
        <p>Cargando...</p>
      </div>
    }>
      <ClientOnly fallback={
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: 'var(--text-muted)' }}>
          <p>Cargando...</p>
        </div>
      }>
        <FeedRedirectContent />
      </ClientOnly>
    </Suspense>
  );
}
