'use client';

// ==========================================================================
// Reusable shimmer block — the building block for all skeleton components
// ==========================================================================
export function ShimmerBlock({
  width,
  height,
  borderRadius = '8px',
}: {
  width: string;
  height: string;
  borderRadius?: string;
}) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background:
          'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.03) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 2s ease-in-out infinite',
      }}
    />
  );
}

// ==========================================================================
// Skeleton avatar + name row
// ==========================================================================
export function SkeletonUserRow({ size = 36 }: { size?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <ShimmerBlock width={`${size}px`} height={`${size}px`} borderRadius="50%" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <ShimmerBlock width="120px" height="12px" borderRadius="4px" />
        <ShimmerBlock width="60px" height="10px" borderRadius="4px" />
      </div>
    </div>
  );
}

// ==========================================================================
// Skeleton text lines
// ==========================================================================
export function SkeletonText({ lines = 3 }: { lines?: number }) {
  const widths = ['100%', '85%', '60%'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {Array.from({ length: lines }).map((_, i) => (
        <ShimmerBlock
          key={i}
          width={widths[i] || '70%'}
          height="12px"
          borderRadius="4px"
        />
      ))}
    </div>
  );
}

// ==========================================================================
// Skeleton tags row
// ==========================================================================
export function SkeletonTags({ count = 2 }: { count?: number }) {
  return (
    <div style={{ display: 'flex', gap: '6px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <ShimmerBlock key={i} width={`${50 + i * 20}px`} height="18px" borderRadius="6px" />
      ))}
    </div>
  );
}

// ==========================================================================
// Skeleton action buttons (like, comment)
// ==========================================================================
export function SkeletonActions() {
  return (
    <div style={{ display: 'flex', gap: '16px' }}>
      {[0, 1].map((i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <ShimmerBlock width="18px" height="18px" borderRadius="50%" />
          <ShimmerBlock width="24px" height="10px" borderRadius="4px" />
        </div>
      ))}
    </div>
  );
}

// ==========================================================================
// Skeleton divider
// ==========================================================================
export function SkeletonDivider() {
  return <div style={{ height: '1px', background: 'rgba(255,255,255,0.04)', marginBottom: '10px' }} />;
}
