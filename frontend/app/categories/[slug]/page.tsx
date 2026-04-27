"use client"

import { useParams, useRouter } from "next/navigation"
import { useProducts } from "@/hooks/useProducts"
import { ProductCard } from "@/components/product/ProductCard"
import { ProductCardSkeleton } from "@/components/product/ProductCardSkeleton"
import type { Product } from "@/types/product"

export default function CategoryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const categorySlug = params.slug ? decodeURIComponent(params.slug as string) : undefined
  const { data, isLoading } = useProducts(categorySlug)

  return (
    <div>
      <button onClick={() => router.back()} style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500,
        marginBottom: '1.5rem', padding: 0, transition: 'color 0.2s',
      }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-heading)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}
      >
        <i className="fa-solid fa-arrow-left" style={{ fontSize: '0.75rem' }}></i>
        Back to Categories
      </button>

      <h1 className="page-title" style={{ textTransform: 'capitalize' }}>{categorySlug}</h1>
      <p className="page-subtitle" style={{ marginBottom: '2rem' }}>
        {isLoading ? 'Fetching products...' : `Found ${data?.length || 0} products`}
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: '1.25rem',
      }}>
        {isLoading
          ? Array.from({ length: 10 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : data?.map((p: Product) => <ProductCard key={p.id} product={p} />)
        }
      </div>

      {!isLoading && data?.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '5rem 2rem',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)', marginTop: '2rem',
        }}>
          <p style={{ color: 'var(--text-faint)', fontSize: '1.1rem' }}>
            No products found in this category.
          </p>
        </div>
      )}
    </div>
  )
}