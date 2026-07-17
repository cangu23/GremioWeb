'use client';

import { useEffect, useState, useRef } from 'react';

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Trigger mount animation on each page change
    setMounted(false);
    const timer = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(timer);
  }, []);

  // Also detect route changes via DOM observation (for client-side navigation)
  useEffect(() => {
    if (!mounted) return;
    // Scroll to top on page transition
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [mounted]);

  return (
    <div
      ref={ref}
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  );
}
