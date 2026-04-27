"use client"

import { useParams } from "next/navigation"
import Image from "next/image"
import { useProduct } from "@/hooks/useProduct"
import { Button } from "@/components/ui/Button"
import { useCart } from "@/context/CartContext"

export default function ProductDetailPage() {
  const { id } = useParams()
  const { data } = useProduct(id as string)
  const { addItem } = useCart()

  if (!data) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', flexDirection: 'column', gap: '1rem' }}>
      <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
      <p style={{ color: 'var(--text-faint)', fontSize: '0.875rem' }}>Loading product...</p>
    </div>
  )

  return (
    <div className="card" style={{
      maxWidth: '56rem', margin: '0 auto',
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem',
      padding: '2rem', borderRadius: 'var(--radius-xl)',
    }}>
      {/* Image */}
      <div style={{
        background: '#ffffff', borderRadius: 'var(--radius-lg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '300px', padding: '2rem',
      }}>
        <Image
          src={data.image} alt={data.title}
          width={320} height={320}
          style={{ height: '260px', width: 'auto', objectFit: 'contain' }}
        />
      </div>

      {/* Info */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <span className="badge" style={{ marginBottom: '1rem', alignSelf: 'flex-start' }}>
          {data.category}
        </span>

        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '1.5rem', fontWeight: 800,
          color: 'var(--text-heading)',
          lineHeight: 1.3, marginBottom: '1rem',
        }}>
          {data.title}
        </h1>

        <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          {data.description}
        </p>

        <p className="text-gradient" style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '2.2rem', fontWeight: 800,
          marginBottom: '1.5rem',
        }}>
          ${data.price}
        </p>

        <Button onClick={() => addItem(data)}>
          <i className="fa-solid fa-cart-plus"></i>
          Add to Cart
        </Button>
      </div>
    </div>
  )
}