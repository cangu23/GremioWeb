'use client';

import { useEffect, useState, ReactNode } from 'react';

/**
 * Wrapper component that only renders its children on the client side.
 * During SSR (Server-Side Rendering), it renders nothing or a fallback.
 * This prevents issues with React context hooks during Next.js static generation.
 */
export default function ClientOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <>{fallback}</>;
  return <>{children}</>;
}
