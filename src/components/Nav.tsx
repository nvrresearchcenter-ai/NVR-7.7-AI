import { Link } from '@tanstack/react-router'
import { useState } from 'react'

export function Nav() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: '1px solid var(--border)',
        background: 'rgba(6, 10, 18, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '32px',
        }}
      >
        {/* Logo */}
        <Link
          to="/"
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              background: 'var(--accent)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="2" width="6" height="6" rx="1.5" fill="#060a12" />
              <rect x="10" y="2" width="6" height="6" rx="1.5" fill="#060a12" opacity="0.6" />
              <rect x="2" y="10" width="6" height="6" rx="1.5" fill="#060a12" opacity="0.6" />
              <rect x="10" y="10" width="6" height="6" rx="1.5" fill="#060a12" opacity="0.3" />
            </svg>
          </div>
          <span
            style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 800,
              fontSize: '1.125rem',
              color: 'var(--text-primary)',
              letterSpacing: '-0.03em',
            }}
          >
            NVR<span style={{ color: 'var(--accent)' }}> 7.7</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flex: 1,
          }}
          className="desktop-nav"
        >
          <NavLink to="/">Home</NavLink>
          <NavLink to="/features">Features</NavLink>
          <NavLink to="/pricing">Pricing</NavLink>
          <NavLink to="/faq">FAQ</NavLink>
          <NavLink to="/agent">Agent</NavLink>
          <NavLink to="/generate">Generate</NavLink>
        </nav>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <a href="/login" className="btn-ghost" style={{ padding: '8px 20px', fontSize: '0.8125rem' }}>
            Log in
          </a>
          <Link to="/pricing" className="btn-primary" style={{ padding: '8px 20px', fontSize: '0.8125rem' }}>
            Get Started
          </Link>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              padding: '4px',
            }}
            className="mobile-menu-btn"
            aria-label="Toggle menu"
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2">
              {menuOpen ? (
                <>
                  <line x1="4" y1="4" x2="18" y2="18" />
                  <line x1="18" y1="4" x2="4" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="7" x2="19" y2="7" />
                  <line x1="3" y1="12" x2="19" y2="12" />
                  <line x1="3" y1="17" x2="19" y2="17" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          style={{
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-surface)',
            padding: '16px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
        >
          <MobileNavLink to="/" onClick={() => setMenuOpen(false)}>Home</MobileNavLink>
          <MobileNavLink to="/features" onClick={() => setMenuOpen(false)}>Features</MobileNavLink>
          <MobileNavLink to="/pricing" onClick={() => setMenuOpen(false)}>Pricing</MobileNavLink>
          <MobileNavLink to="/faq" onClick={() => setMenuOpen(false)}>FAQ</MobileNavLink>
          <MobileNavLink to="/agent" onClick={() => setMenuOpen(false)}>Agent</MobileNavLink>
          <MobileNavLink to="/generate" onClick={() => setMenuOpen(false)}>Generate</MobileNavLink>
          <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
            <a href="/login" className="btn-ghost" style={{ flex: 1, justifyContent: 'center', padding: '10px 16px' }}>
              Log in
            </a>
            <Link to="/pricing" className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '10px 16px' }} onClick={() => setMenuOpen(false)}>
              Get Started
            </Link>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </header>
  )
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      style={{
        padding: '6px 14px',
        borderRadius: '6px',
        color: 'var(--text-secondary)',
        textDecoration: 'none',
        fontSize: '0.875rem',
        fontWeight: 500,
        transition: 'color 0.15s, background 0.15s',
      }}
      activeProps={{
        style: {
          color: 'var(--text-primary)',
          background: 'rgba(255,255,255,0.05)',
        },
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLAnchorElement
        el.style.color = 'var(--text-primary)'
        el.style.background = 'rgba(255,255,255,0.05)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLAnchorElement
        el.style.color = 'var(--text-secondary)'
        el.style.background = 'transparent'
      }}
    >
      {children}
    </Link>
  )
}

function MobileNavLink({ to, children, onClick }: { to: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      style={{
        padding: '12px 16px',
        borderRadius: '8px',
        color: 'var(--text-secondary)',
        textDecoration: 'none',
        fontSize: '0.9375rem',
        fontWeight: 500,
        transition: 'color 0.15s, background 0.15s',
      }}
    >
      {children}
    </Link>
  )
}
