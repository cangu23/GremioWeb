'use client';

import { useEffect, useRef, useMemo } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  twinkleSpeed: number;
  twinklePhase: number;
  color: string;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  opacity: number;
  life: number;
}

export default function ParticlesBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stars = useMemo(() => {
    const count = 200;
    const colors = ['#ffffff', '#ffe9a0', '#a0d8ff', '#ffc0e0'];
    return Array.from({ length: count }, (): Star => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.5 + 0.5,
      opacity: Math.random() * 0.8 + 0.2,
      speed: Math.random() * 0.02 + 0.005,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      twinklePhase: Math.random() * Math.PI * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    let shootingStars: ShootingStar[] = [];

    const createShootingStar = () => {
      const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.5;
      shootingStars.push({
        x: Math.random() * 100,
        y: Math.random() * 30,
        length: Math.random() * 80 + 40,
        speed: Math.random() * 6 + 4,
        angle,
        opacity: 1,
        life: 1,
      });
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      time++;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Draw stars
      for (const star of stars) {
        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinklePhase) * 0.4 + 0.6;
        const alpha = star.opacity * twinkle;
        const x = (star.x + time * star.speed * 0.1) % 100;
        const px = (x / 100) * w;
        const py = (star.y / 100) * h;

        ctx.beginPath();
        ctx.arc(px, py, star.size, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.globalAlpha = alpha;
        ctx.fill();

        // Glow effect for larger stars
        if (star.size > 1.8) {
          ctx.beginPath();
          ctx.arc(px, py, star.size * 3, 0, Math.PI * 2);
          ctx.fillStyle = star.color;
          ctx.globalAlpha = alpha * 0.1;
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      // Spawn shooting stars occasionally
      if (Math.random() < 0.005 || time % 600 === 0) {
        createShootingStar();
      }

      // Draw and update shooting stars
      shootingStars = shootingStars.filter((s) => s.life > 0);
      for (const star of shootingStars) {
        star.life -= 0.015;
        star.opacity = Math.max(0, star.life);
        star.x += star.speed * Math.cos(star.angle) * 0.3;
        star.y += star.speed * Math.sin(star.angle) * 0.3;

        const px = (star.x / 100) * w;
        const py = (star.y / 100) * h;
        const endX = px - (star.length * Math.cos(star.angle)) / 100 * w;
        const endY = py - (star.length * Math.sin(star.angle)) / 100 * h;

        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Bright head
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.fill();
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [stars]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
      aria-hidden="true"
    />
  );
}
