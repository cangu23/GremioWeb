'use client';

import { ShimmerBlock, SkeletonText, SkeletonDivider } from '@/components/ui/Skeleton';

export default function SkeletonGuildCard() {
  return (
    <div
      className="glass"
      style={{
        padding: '28px',
        borderRadius: '20px',
        position: 'relative',
        overflow: 'hidden',
        animation: 'fadeInUp 0.4s ease-out',
      }}
    >
      {/* Gradient bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
        background: 'linear-gradient(90deg, var(--secondary), var(--primary))',
        opacity: 0.3,
      }} />

      {/* Logo + Name + Tags */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '14px' }}>
        <ShimmerBlock width="56px" height="56px" borderRadius="14px" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <ShimmerBlock width="140px" height="22px" borderRadius="4px" />
            <ShimmerBlock width="60px" height="18px" borderRadius="10px" />
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <ShimmerBlock width="50px" height="16px" borderRadius="8px" />
            <ShimmerBlock width="60px" height="16px" borderRadius="8px" />
          </div>
        </div>
      </div>

      {/* Description */}
      <SkeletonText lines={2} />

      <div style={{ marginBottom: '16px' }} />

      {/* Footer */}
      <SkeletonDivider />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <ShimmerBlock width="100px" height="14px" borderRadius="4px" />
        <ShimmerBlock width="120px" height="14px" borderRadius="4px" />
      </div>
    </div>
  );
}
