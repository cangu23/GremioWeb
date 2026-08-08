'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * ⚡ LazyMount — monta sus children solo cuando se acercan al viewport.
 *
 * Optimización de carga: las secciones bajo el pliegue no se renderizan (ni
 * disparan sus fetch) hasta que el usuario está a `rootMargin` px de verlas.
 * - Sin dependencias de terceros (IntersectionObserver nativo).
 * - Fallback: si no hay IntersectionObserver, se monta directamente.
 * - Una vez visible, no se desmonta nunca (evita perder estado/scroll).
 */
export default function LazyMount({
  children,
  rootMargin = '600px',
  minHeight = 0,
}: {
  children: ReactNode;
  /** Cuántos px antes de entrar en pantalla se monta (default 600px). */
  rootMargin?: string;
  /** Altura mínima del contenedor mientras no se ha montado (reduce CLS). */
  minHeight?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div
      ref={ref}
      // El min-height actúa solo como placeholder mientras no se monta el
      // contenido (reserva espacio y evita CLS). Una vez visible, se quita
      // para que la altura real de la sección mande (sin huecos residuales).
      style={!visible && minHeight ? { minHeight: `${minHeight}px` } : undefined}
    >
      {visible ? children : null}
    </div>
  );
}
