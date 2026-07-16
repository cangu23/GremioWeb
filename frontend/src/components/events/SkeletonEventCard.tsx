'use client';

import { ShimmerBlock, SkeletonUserRow, SkeletonText, SkeletonDivider } from '@/components/ui/Skeleton';

export default function SkeletonEventCard() {
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
        background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
        opacity: 0.3,
      }} />

      {/* Title + status badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <ShimmerBlock width="180px" height="22px" borderRadius="4px" />
            <ShimmerBlock width="60px" height="18px" borderRadius="10px" />
          </div>
          <ShimmerBlock width="250px" height="14px" borderRadius="4px" />
        </div>
      </div>

      {/* Description */}
      <SkeletonText lines={2} />

      <div style={{ marginBottom: '16px' }} />

      {/* Footer */}
      <SkeletonDivider />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <SkeletonUserRow size={28} />
        <ShimmerBlock width="80px" height="14px" borderRadius="4px" />
      </div>
    </div>
  );
}
