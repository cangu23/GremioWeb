'use client';

import { useEffect, useRef } from 'react';

/**
 * Hook that applies a parallax translation to a child element based on scroll.
 *
 * @param speed  - How much the element moves relative to scroll (0 = static, 1 = scroll speed, negative = opposite direction)
 * @returns      - A ref to attach to the container that measures viewport position,
 *                 plus a childRef to attach to the element you want to parallax.
 *
 * Usage:
 *   const { containerRef, childRef } = useScrollParallax(-0.15);
 *   return (
 *     <section ref={containerRef}>
 *       <div ref={childRef} className="bg-blob" />
 *     </section>
 *   );
 */
export function useScrollParallax(speed: number = -0.15) {
  const containerRef = useRef<HTMLDivElement>(null);
  const childRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const child = childRef.current;
    const container = containerRef.current;
    if (!child || !container) return;

    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const rect = container.getBoundingClientRect();
        const viewportCenter = window.innerHeight / 2;
        const sectionCenter = rect.top + rect.height / 2;
        const distance = sectionCenter - viewportCenter;
        // Only parallax when section is roughly visible (± viewport height)
        const clamped = Math.max(-window.innerHeight, Math.min(window.innerHeight, distance));
        child.style.transform = `translateY(${clamped * speed}px)`;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // initial position

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [speed]);

  return { containerRef, childRef };
}

/**
 * Simpler variant: applies parallax to multiple elements inside a single container.
 * Each child gets a `data-parallax-speed` attribute and the hook animates them all.
 *
 * @param containerRef - the section container element
 */
export function useParallaxChildren(containerRef: React.RefObject<HTMLDivElement | null>) {
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const children = container.querySelectorAll<HTMLElement>('[data-parallax-speed]');
    if (children.length === 0) return;

    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const rect = container.getBoundingClientRect();
        const viewportCenter = window.innerHeight / 2;
        const sectionCenter = rect.top + rect.height / 2;
        const distance = sectionCenter - viewportCenter;
        const clamped = Math.max(-window.innerHeight, Math.min(window.innerHeight, distance));

        Array.from(children).forEach((el: HTMLElement) => {
          const speed = parseFloat(el.getAttribute('data-parallax-speed') || '0');
          el.style.transform = `translateY(${clamped * speed}px)`;
        });
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [containerRef]);
}
