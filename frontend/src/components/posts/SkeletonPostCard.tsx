'use client';

// ==========================================================================
// Helpers
// ==========================================================================
function ShimmerBlock({ width, height, borderRadius = '8px' }: { width: string; height: string; borderRadius?: string }) {
  return (
    <div style={{
      width,
      height,
      borderRadius,
      background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 2s ease-in-out infinite',
    }} />
  );
}

// ==========================================================================
// SkeletonPostCard
// ==========================================================================
export default function SkeletonPostCard({ withImage = false }: { withImage?: boolean }) {
  return (
    <div
      className="glass"
      style={{
        overflow: 'hidden',
        padding: '16px',
        animation: 'fadeInUp 0.4s ease-out',
      }}
    >
      {/* Header: avatar + username + time */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <ShimmerBlock width="36px" height="36px" borderRadius="50%" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <ShimmerBlock width="120px" height="12px" borderRadius="4px" />
          <ShimmerBlock width="60px" height="10px" borderRadius="4px" />
        </div>
        <ShimmerBlock width="20px" height="20px" borderRadius="50%" />
      </div>

      {/* Content lines */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
        <ShimmerBlock width="100%" height="12px" borderRadius="4px" />
        <ShimmerBlock width="85%" height="12px" borderRadius="4px" />
        <ShimmerBlock width="60%" height="12px" borderRadius="4px" />
      </div>

      {/* Optional image placeholder */}
      {withImage && (
        <div style={{ marginBottom: '12px', borderRadius: '10px', overflow: 'hidden' }}>
          <ShimmerBlock width="100%" height="180px" borderRadius="10px" />
        </div>
      )}

      {/* Tags row */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
        <ShimmerBlock width="50px" height="18px" borderRadius="6px" />
        <ShimmerBlock width="70px" height="18px" borderRadius="6px" />
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.04)', marginBottom: '10px' }} />

      {/* Actions: like + comment */}
      <div style={{ display: 'flex', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <ShimmerBlock width="18px" height="18px" borderRadius="50%" />
          <ShimmerBlock width="24px" height="10px" borderRadius="4px" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <ShimmerBlock width="18px" height="18px" borderRadius="50%" />
          <ShimmerBlock width="24px" height="10px" borderRadius="4px" />
        </div>
      </div>
    </div>
  );
}
