'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

interface Star {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
  alpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  color: string;
  isFourPoint?: boolean;
}

interface Meteor {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  opacity: number;
  life: number;
  maxLife: number;
  color: string;
  width: number;
  sparks: Spark[];
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export default function ParticlesBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';

  useEffect(() => {
    if (isAuthPage) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse interactive tracking
    const mouse = {
      x: -1000,
      y: -1000,
      radius: 170,
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('touchmove', handleTouchMove);

    // Static cosmic nebula layer — pre-rendered once (per-frame radial
    // gradients + full-canvas fills are expensive on modest GPUs/CPUs).
    const nebulaCanvas = document.createElement('canvas');
    const buildNebula = () => {
      nebulaCanvas.width = width;
      nebulaCanvas.height = height;
      const nctx = nebulaCanvas.getContext('2d');
      if (!nctx) return;
      const g1 = nctx.createRadialGradient(
        width * 0.2,
        height * 0.2,
        0,
        width * 0.2,
        height * 0.2,
        width * 0.4
      );
      g1.addColorStop(0, 'rgba(139, 92, 246, 0.05)');
      g1.addColorStop(1, 'transparent');
      nctx.fillStyle = g1;
      nctx.fillRect(0, 0, width, height);

      const g2 = nctx.createRadialGradient(
        width * 0.8,
        height * 0.7,
        0,
        width * 0.8,
        height * 0.7,
        width * 0.45
      );
      g2.addColorStop(0, 'rgba(108, 180, 238, 0.04)');
      g2.addColorStop(1, 'transparent');
      nctx.fillStyle = g2;
      nctx.fillRect(0, 0, width, height);
    };
    buildNebula();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      buildNebula();
    };
    window.addEventListener('resize', handleResize);

    // ── Generate Stars & Constellation Nodes ──
    const isLightTheme = document.documentElement.getAttribute('data-theme') === 'light';
    const starColors = isLightTheme
      ? ['#7C3AED', '#6D28D9', '#2563EB', '#D97706', '#475569', '#8B5CF6']
      : ['#FFFFFF', '#A78BFA', '#8B5CF6', '#6CB4EE', '#F59E0B', '#E2E8F0'];
    const isMobile = width < 768 || (navigator.maxTouchPoints > 1 && width < 900);

    // ── Device capability tiering (keep modest laptops smooth) ──
    // tier 0 = low-end / phones, tier 1 = mid laptops, tier 2 = high-end desktops
    const getQualityTier = (w: number, h: number, mobile: boolean): number => {
      const cores = navigator.hardwareConcurrency || 4;
      const mem = (navigator as unknown as { deviceMemory?: number }).deviceMemory || 4;
      const bigScreen = w >= 1440 && h >= 900;
      if (mobile || cores <= 2 || mem <= 2) return 0;
      // hardwareConcurrency counts logical THREADS (a 4C/8T i5 reports 8), so
      // tier 2 strictly needs >8 threads AND 16GB+ RAM; modest laptops stay
      // in tier 1 instead of accidentally getting the heaviest starfield.
      if (cores <= 8 || mem <= 8 || !bigScreen) return 1;
      return 2;
    };
    const tier = getQualityTier(width, height, isMobile);

    // Star budget per tier (visual density vs. per-frame cost)
    const starCount =
      tier === 2
        ? Math.min(200, Math.floor(Math.min(width, height) * 0.15))
        : tier === 1
          ? Math.min(110, Math.floor(Math.min(width, height) * 0.1))
          : 45;

    // Constellation lines: full on high, lighter on mid, light on low-end too
    // (the O(n²) pair loop is negligible at 45 stars)
    const maxConnectDistance = tier === 2 ? 110 : tier === 1 ? 85 : 70;
    // Meteors: fewer & rarer on weaker devices
    const meteorSpawnChance = tier === 2 ? 0.025 : tier === 1 ? 0.015 : 0.008;
    const maxMeteors = tier === 2 ? 8 : tier === 1 ? 5 : 3;
    // Mouse interaction radius (smaller on low-end saves connect-line work)
    mouse.radius = tier === 0 ? 120 : 170;

    const stars: Star[] = Array.from({ length: starCount }, (_, i) => {
      const isSpecial = i % 7 === 0;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        radius: isSpecial ? Math.random() * 2 + 1.8 : Math.random() * 1.5 + 0.5,
        baseAlpha: Math.random() * 0.6 + 0.3,
        alpha: Math.random() * 0.6 + 0.3,
        twinkleSpeed: Math.random() * 0.03 + 0.008,
        twinklePhase: Math.random() * Math.PI * 2,
        color: starColors[Math.floor(Math.random() * starColors.length)],
        isFourPoint: isSpecial,
      };
    });

    // ── Meteors Array ──
    let meteors: Meteor[] = [];
    let time = 0;

    const meteorColors = isLightTheme
      ? ['#7C3AED', '#6D28D9', '#2563EB', '#D97706', '#475569']
      : ['#8B5CF6', '#A78BFA', '#6CB4EE', '#F59E0B', '#FFFFFF'];

    const createMeteor = (isSuper = false) => {
      const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.3; // 45 deg angle
      const speed = isSuper ? Math.random() * 8 + 7 : Math.random() * 5 + 4;
      const maxLife = isSuper ? 1.4 : 1.0;
      meteors.push({
        x: Math.random() * (width * 1.2) - width * 0.1,
        y: Math.random() * (height * 0.4) - 50,
        length: isSuper ? Math.random() * 160 + 120 : Math.random() * 100 + 60,
        speed,
        angle,
        opacity: 1,
        life: maxLife,
        maxLife,
        color: meteorColors[Math.floor(Math.random() * meteorColors.length)],
        width: isSuper ? 2.5 : 1.5,
        sparks: [],
      });
    };

    // Helper: Draw authentic 4-Pointed Star (✦)
    const drawFourPointStar = (
      c: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      r: number,
      color: string,
      alpha: number
    ) => {
      c.save();
      c.translate(cx, cy);
      c.globalAlpha = alpha;
      c.fillStyle = color;

      // Glow backdrop
      const radGrad = c.createRadialGradient(0, 0, 0, 0, 0, r * 4);
      radGrad.addColorStop(0, color);
      radGrad.addColorStop(1, 'transparent');
      c.fillStyle = radGrad;
      c.beginPath();
      c.arc(0, 0, r * 4, 0, Math.PI * 2);
      c.fill();

      // 4-pointed diamond spikes
      c.fillStyle = color;
      c.beginPath();
      c.moveTo(0, -r * 2.5);
      c.quadraticCurveTo(0, 0, r * 2.5, 0);
      c.quadraticCurveTo(0, 0, 0, r * 2.5);
      c.quadraticCurveTo(0, 0, -r * 2.5, 0);
      c.quadraticCurveTo(0, 0, 0, -r * 2.5);
      c.closePath();
      c.fill();

      c.restore();
    };

    // ── Main Render Loop ──
    const render = () => {
      time++;
      ctx.clearRect(0, 0, width, height);

      // 1. Pre-rendered cosmic nebulae (static layer, blitted each frame)
      ctx.drawImage(nebulaCanvas, 0, 0, width, height);

      // 2. Update & Draw Stars + Constellations

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        // Move star
        star.x += star.vx;
        star.y += star.vy;

        // Wrap edges
        if (star.x < 0) star.x = width;
        if (star.x > width) star.x = 0;
        if (star.y < 0) star.y = height;
        if (star.y > height) star.y = 0;

        // Twinkle effect
        star.alpha =
          star.baseAlpha + Math.sin(time * star.twinkleSpeed + star.twinklePhase) * 0.25;

        // Distance to mouse
        const dx = mouse.x - star.x;
        const dy = mouse.y - star.y;
        const distToMouse = Math.sqrt(dx * dx + dy * dy);

        let activeAlpha = Math.max(0.1, Math.min(1, star.alpha));
        let activeScale = 1;

        if (distToMouse < mouse.radius) {
          const factor = 1 - distToMouse / mouse.radius;
          activeAlpha = Math.min(1, activeAlpha + factor * 0.6);
          activeScale = 1 + factor * 0.8;

          // Connect star to mouse with a soft glowing line
          ctx.beginPath();
          ctx.moveTo(star.x, star.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(167, 139, 250, ${factor * 0.35})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Draw star shapes
        if (star.isFourPoint && activeScale > 1.1) {
          drawFourPointStar(
            ctx,
            star.x,
            star.y,
            star.radius * activeScale,
            star.color,
            activeAlpha
          );
        } else {
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.radius * activeScale, 0, Math.PI * 2);
          ctx.fillStyle = star.color;
          ctx.globalAlpha = activeAlpha;
          ctx.fill();

          if (star.radius > 1.6) {
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius * 2.5 * activeScale, 0, Math.PI * 2);
            ctx.fillStyle = star.color;
            ctx.globalAlpha = activeAlpha * 0.15;
            ctx.fill();
          }
        }
        ctx.globalAlpha = 1;

        // Connect nearby stars to form constellations (squared distance
        // optimization; distance shrinks on weaker devices)
        if (maxConnectDistance > 0) {
          const maxConnectDistanceSq = maxConnectDistance * maxConnectDistance;
          for (let j = i + 1; j < stars.length; j++) {
            const other = stars[j];
            const sdx = other.x - star.x;
            if (Math.abs(sdx) > maxConnectDistance) continue;
            const sdy = other.y - star.y;
            if (Math.abs(sdy) > maxConnectDistance) continue;
            
            const sdistSq = sdx * sdx + sdy * sdy;
            if (sdistSq < maxConnectDistanceSq) {
              const sdist = Math.sqrt(sdistSq);
              const lineAlpha = (1 - sdist / maxConnectDistance) * 0.12 * activeAlpha;
              ctx.beginPath();
              ctx.moveTo(star.x, star.y);
              ctx.lineTo(other.x, other.y);
              ctx.strokeStyle = `rgba(139, 92, 246, ${lineAlpha})`;
              ctx.lineWidth = 0.8;
              ctx.stroke();
            }
          }
        }
      }

      // 3. Meteor Shower Generator (rate + count capped by device tier)
      if (meteors.length < maxMeteors && Math.random() < meteorSpawnChance) {
        createMeteor(Math.random() < 0.2); // 20% chance of super meteor
      }

      // Render & Update Meteors
      meteors = meteors.filter((m) => m.life > 0);

      for (const meteor of meteors) {
        meteor.life -= 0.012;
        meteor.opacity = Math.max(0, meteor.life / meteor.maxLife);

        meteor.x += meteor.speed * Math.cos(meteor.angle);
        meteor.y += meteor.speed * Math.sin(meteor.angle);

        const tailX = meteor.x - meteor.length * Math.cos(meteor.angle);
        const tailY = meteor.y - meteor.length * Math.sin(meteor.angle);

        // Meteor Trail Gradient
        const grad = ctx.createLinearGradient(meteor.x, meteor.y, tailX, tailY);
        grad.addColorStop(0, meteor.color);
        grad.addColorStop(0.3, 'rgba(139, 92, 246, 0.6)');
        grad.addColorStop(1, 'rgba(139, 92, 246, 0)');

        ctx.beginPath();
        ctx.moveTo(meteor.x, meteor.y);
        ctx.lineTo(tailX, tailY);
        ctx.strokeStyle = grad;
        ctx.lineWidth = meteor.width;
        ctx.globalAlpha = meteor.opacity;
        ctx.stroke();

        // Bright Meteor Head / Core
        ctx.beginPath();
        ctx.arc(meteor.x, meteor.y, meteor.width * 1.6, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = meteor.color;
        ctx.shadowBlur = 12;
        ctx.globalAlpha = meteor.opacity;
        ctx.fill();
        ctx.shadowBlur = 0; // Reset shadow

        // Emit spark particles along the meteor tail
        if (Math.random() < 0.4) {
          meteor.sparks.push({
            x: meteor.x + (Math.random() - 0.5) * 4,
            y: meteor.y + (Math.random() - 0.5) * 4,
            vx: (Math.random() - 0.5) * 1.5 - Math.cos(meteor.angle) * 0.5,
            vy: (Math.random() - 0.5) * 1.5 - Math.sin(meteor.angle) * 0.5,
            life: 1,
            maxLife: Math.random() * 20 + 10,
            color: meteor.color,
            size: Math.random() * 1.5 + 0.5,
          });
        }

        // Render & Update Sparks
        meteor.sparks = meteor.sparks.filter((s) => s.life > 0);
        for (const spark of meteor.sparks) {
          spark.life -= 1 / spark.maxLife;
          spark.x += spark.vx;
          spark.y += spark.vy;

          ctx.beginPath();
          ctx.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2);
          ctx.fillStyle = spark.color;
          ctx.globalAlpha = Math.max(0, spark.life * meteor.opacity);
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  if (isAuthPage) return null;

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
        opacity: 1,
      }}
    />
  );
}
