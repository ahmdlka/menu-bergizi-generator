"use client"

import Link from "next/link"
import { useCategories } from "@/hooks/useCategories"

const categoryIcons: Record<string, string> = {
  "electronics": "fa-solid fa-microchip",
  "jewelery": "fa-solid fa-gem",
  "men's clothing": "fa-solid fa-shirt",
  "women's clothing": "fa-solid fa-vest",
}

export default function CategoriesPage() {
  const { data: categories, isLoading } = useCategories()

  return (
    <div style={{ maxWidth: '48rem', margin: '0 auto' }}>
      <h1 className="page-title">All Categories</h1>
      <p className="page-subtitle" style={{ marginBottom: '2rem' }}>
        Browse by category to find what you need
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: '80px', borderRadius: 'var(--radius-lg)' }} />
            ))
          : categories?.map((c) => (
              <Link key={c.id} href={`/categories/${encodeURIComponent(c.name.toLowerCase())}`}>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-card-hover)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <i className={categoryIcons[c.name.toLowerCase()] ?? 'fa-solid fa-tag'}
                      style={{ color: 'var(--accent)', fontSize: '1rem' }}
                    ></i>
                  </div>
                  <div>
                    <h2 style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '0.95rem', fontWeight: 700,
                      color: 'var(--text-heading)',
                      textTransform: 'capitalize',
                      marginBottom: '0.15rem',
                    }}>
                      {c.name}
                    </h2>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-faint)', margin: 0 }}>
                      View products →
                    </p>
                  </div>
                </div>
              </Link>
            ))
        }
      </div>
    </div>
  )
}