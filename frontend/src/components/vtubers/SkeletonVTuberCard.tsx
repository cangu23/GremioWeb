import { ShimmerBlock } from '@/components/ui/Skeleton';

export default function SkeletonVTuberCard() {
  return (
    <div
      className="glass"
      style={{
        padding: '20px',
        borderRadius: '18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        position: 'relative',
        overflow: 'hidden',
        background: 'rgba(18, 18, 26, 0.65)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        height: '240px',
      }}
    >
      {/* Header serial line */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <ShimmerBlock width="80px" height="14px" borderRadius="6px" />
        <ShimmerBlock width="60px" height="18px" borderRadius="12px" />
      </div>

      {/* Avatar + Name row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '4px' }}>
        <ShimmerBlock width="58px" height="58px" borderRadius="50%" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <ShimmerBlock width="65%" height="18px" borderRadius="6px" />
          <ShimmerBlock width="40%" height="12px" borderRadius="6px" />
          <ShimmerBlock width="80px" height="14px" borderRadius="6px" />
        </div>
      </div>

      {/* Description lines */}
      <ShimmerBlock width="100%" height="12px" borderRadius="6px" />

      {/* Tags */}
      <div style={{ display: 'flex', gap: '6px' }}>
        <ShimmerBlock width="70px" height="22px" borderRadius="8px" />
        <ShimmerBlock width="40px" height="22px" borderRadius="8px" />
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
        <ShimmerBlock width="80px" height="14px" borderRadius="6px" />
        <ShimmerBlock width="70px" height="14px" borderRadius="6px" />
      </div>
    </div>
  );
}
