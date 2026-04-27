"use client"

import { useCart } from "@/context/CartContext"
import Image from "next/image"
import Link from "next/link"

export default function CartPage() {
  const { items, removeItem } = useCart()
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <div style={{ maxWidth: '42rem', margin: '0 auto' }}>
      <h1 className="page-title">Your Cart</h1>
      <p className="page-subtitle" style={{ marginBottom: '2rem' }}>
        {items.length} item{items.length !== 1 ? 's' : ''} in your bag
      </p>

      {items.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '5rem 2rem',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
        }}>
          <i className="fa-solid fa-cart-shopping" style={{ fontSize: '3rem', color: 'var(--text-faint)', marginBottom: '1rem', display: 'block' }}></i>
          <p style={{ color: 'var(--text-faint)', marginBottom: '1.5rem' }}>Your cart is empty</p>
          <Link href="/products" className="btn-primary">
            <i className="fa-solid fa-arrow-left"></i>
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {items.map((item) => (
            <div key={item.id} className="card" style={{
              display: 'flex', alignItems: 'center', gap: '1rem',
              padding: '1rem',
            }}>
              <div style={{
                background: '#ffffff', borderRadius: 'var(--radius-sm)',
                width: '72px', height: '72px', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Image src={item.image} alt={item.title} width={60} height={60}
                  style={{ height: '52px', width: 'auto', objectFit: 'contain' }}
                />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: '0.875rem', fontWeight: 500,
                  color: 'var(--text-body)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  margin: 0,
                }}>
                  {item.title}
                </p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-faint)', margin: '0.2rem 0 0' }}>
                  Qty: <span style={{ color: 'var(--accent)', fontWeight: 600 }}>x{item.quantity}</span>
                </p>
              </div>

              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p className="price" style={{ marginBottom: '0.35rem' }}>
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
                <button onClick={() => removeItem(item.id)} style={{
                  background: 'none', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', padding: '0.2rem 0.6rem',
                  color: 'var(--text-faint)', fontSize: '0.75rem',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.color = '#f87171'
                    ;(e.currentTarget as HTMLElement).style.borderColor = '#f87171'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.color = 'var(--text-faint)'
                    ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
                  }}
                >
                  <i className="fa-solid fa-trash-can" style={{ marginRight: '0.3rem' }}></i>
                  Remove
                </button>
              </div>
            </div>
          ))}

          {/* Total */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '1.25rem 1.5rem', marginTop: '0.5rem',
            background: 'var(--bg-card-hover)', border: '1px solid var(--border-hover)',
            borderRadius: 'var(--radius-lg)',
          }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Total</span>
            <span className="text-gradient" style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.8rem', fontWeight: 800,
            }}>
              ${total.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}