"use client"

export function ProductCardSkeleton() {
  return (
    <div className="card" style={{ pointerEvents: 'none' }}>
      <div className="skeleton" style={{ height: '160px', marginBottom: '0.75rem' }} />
      <div className="skeleton" style={{ height: '12px', marginBottom: '0.5rem' }} />
      <div className="skeleton" style={{ height: '12px', width: '60%', marginBottom: '0.75rem' }} />
      <div className="skeleton" style={{ height: '16px', width: '35%' }} />
    </div>
  )
}