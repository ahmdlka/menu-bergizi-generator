"use client"

import { useProducts } from "@/hooks/useProducts"
import { ProductCard } from "@/components/product/ProductCard"
import { ProductCardSkeleton } from "@/components/product/ProductCardSkeleton"

export default function ProductsPage() {
  const { data, isLoading } = useProducts()

  return (
    <div>
      <h1 className="page-title">All Products</h1>
      <p className="page-subtitle" style={{ marginBottom: '2rem' }}>
        Browse our full collection
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: '1.25rem',
      }}>
        {isLoading
          ? Array.from({ length: 10 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : data?.map((p) => <ProductCard key={p.id} product={p} />)
        }
      </div>
    </div>
  )
}