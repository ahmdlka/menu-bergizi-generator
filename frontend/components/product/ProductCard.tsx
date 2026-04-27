"use client"

import { Product } from "@/types/product"
import Link from "next/link"
import Image from "next/image"

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/products/${product.id}`}>
      <div className="card">
        <div style={{
          background: '#ffffff', borderRadius: 'var(--radius-md)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: '160px', marginBottom: '0.75rem', padding: '0.75rem',
        }}>
          <Image
            width={300} height={300}
            src={product.image} alt={product.title}
            style={{ height: '120px', width: 'auto', objectFit: 'contain' }}
          />
        </div>

        <h3 style={{
          fontSize: '0.8rem',
          fontFamily: 'var(--font-body)',
          fontWeight: 500,
          color: 'var(--text-body)',
          lineHeight: 1.5,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
          marginBottom: '0.5rem',
        }}>
          {product.title}
        </h3>

        <p className="price">${product.price}</p>
      </div>
    </Link>
  )
}