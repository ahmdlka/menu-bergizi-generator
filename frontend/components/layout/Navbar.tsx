"use client"

import Link from "next/link"
import { useCart } from "@/context/CartContext"

export function Navbar() {
  const { items } = useCart()

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'var(--bg-glass)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{
        maxWidth: '80rem', margin: '0 auto',
        padding: '1rem 1.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>

        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <i className="fa-solid fa-bag-shopping" style={{ color: 'var(--accent)', fontSize: '1.25rem' }}></i>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.35rem', color: 'var(--text-heading)', letterSpacing: '-0.02em' }}>
            Alpro<span style={{ color: 'var(--accent)' }}>Shop</span>
          </span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Link href="/products" style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)',
            color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500,
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.color = 'var(--text-heading)'
              ;(e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'
              ;(e.currentTarget as HTMLElement).style.background = 'transparent'
            }}
          >
            <i className="fa-solid fa-store" style={{ fontSize: '0.75rem' }}></i>
            Products
          </Link>

          <Link href="/categories" style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)',
            color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500,
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.color = 'var(--text-heading)'
              ;(e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'
              ;(e.currentTarget as HTMLElement).style.background = 'transparent'
            }}
          >
            <i className="fa-solid fa-layer-group" style={{ fontSize: '0.75rem' }}></i>
            Categories
          </Link>

          <Link href="/cart" className="btn-primary" style={{ position: 'relative' }}>
            <i className="fa-solid fa-cart-shopping"></i>
            Cart ({items.length})
          </Link>
        </div>
      </div>
    </nav>
  )
}