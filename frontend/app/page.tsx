import Link from "next/link"

export default function HomePage() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: '72vh', textAlign: 'center', padding: '2rem 1rem',
    }}>

      <span className="badge" style={{ marginBottom: '1.75rem' }}>
        <i className="fa-solid fa-bolt"></i>
        New Collection Available
      </span>

      <h1 style={{
        fontFamily: 'var(--font-heading)',
        fontWeight: 800,
        fontSize: 'clamp(2.8rem, 7vw, 5.5rem)',
        lineHeight: 1.1,
        letterSpacing: '-0.03em',
        color: 'var(--text-heading)',
        marginBottom: '0.25rem',
      }}>
        Welcome to
      </h1>
      <h1 className="text-gradient" style={{
        fontFamily: 'var(--font-heading)',
        fontWeight: 800,
        fontSize: 'clamp(2.8rem, 7vw, 5.5rem)',
        lineHeight: 1.1,
        letterSpacing: '-0.03em',
        marginBottom: '1.5rem',
      }}>
        AlproShop
      </h1>

      <p style={{ maxWidth: '460px', marginBottom: '2.5rem', fontSize: '1.1rem' }}>
        Discover curated products at unbeatable prices. Shop the latest trends with confidence.
      </p>

      <Link href="/products" className="btn-primary" style={{ fontSize: '1rem', padding: '1rem 2.2rem' }}>
        Browse Products
        <i className="fa-solid fa-arrow-right"></i>
      </Link>
    </div>
  )
}