import { ShimmerBlock } from '@/components/ui/Skeleton';

export default function SkeletonVTuberCard() {
  return (
    <div
      className="glass"
      style={{
        padding: '20px',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Avatar + Name row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <ShimmerBlock width="52px" height="52px" borderRadius="50%" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <ShimmerBlock width="60%" height="16px" borderRadius="6px" />
          <ShimmerBlock width="40%" height="12px" borderRadius="6px" />
        </div>
      </div>

      {/* Description lines */}
      <ShimmerBlock width="100%" height="12px" borderRadius="6px" />
      <ShimmerBlock width="80%" height="12px" borderRadius="6px" />

      {/* Tags */}
      <div style={{ display: 'flex', gap: '6px' }}>
        <ShimmerBlock width="60px" height="22px" borderRadius="8px" />
        <ShimmerBlock width="80px" height="22px" borderRadius="8px" />
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
        <ShimmerBlock width="70px" height="12px" borderRadius="6px" />
        <ShimmerBlock width="50px" height="12px" borderRadius="6px" />
      </div>
    </div>
  );
}
