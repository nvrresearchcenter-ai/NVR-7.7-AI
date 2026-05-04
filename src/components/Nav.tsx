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
          padding: '0 20px',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        {/* Logo */}
        <Link
          to="/"
          style={{
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: '34px',
              height: '34px',
              background: 'var(--accent)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 0 16px rgba(0, 200, 240, 0.35)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="2" width="6" height="6" rx="1.5" fill="#060a12" />
              <rect x="10" y="2" width="6" height="6" rx="1.5" fill="#060a12" opacity="0.6" />
              <rect x="2" y="10" width="6" height="6" rx="1.5" fill="#060a12" opacity="0.6" />
              <rect x="10" y="10" width="6" height="6" rx="1.5" fill="#060a12" opacity="0.3" />
            </svg>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              lineHeight: 1,
              fontFamily: 'Syne, sans-serif',
              letterSpacing: '0.02em',
            }}
          >
            <span
              style={{
                fontWeight: 800,
                fontSize: '0.95rem',
                color: 'var(--text-primary)',
                lineHeight: 1,
              }}
            >
              NVR
            </span>
            <span
              style={{
                fontFamily: 'DM Mono, monospace',
                fontWeight: 500,
                fontSize: '0.7rem',
                color: 'var(--accent)',
                marginTop: '3px',
                letterSpacing: '0.08em',
                lineHeight: 1,
              }}
            >
              7.7
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            flex: 1,
            justifyContent: 'center',
          }}
          className="desktop-nav"
        >
          <NavLink to="/">Home</NavLink>
          <NavLink to="/pricing">Pricing</NavLink>
          <NavLink to="/faq">FAQ</NavLink>
          <NavLink to="/agent">Agent</NavLink>
          <NavLink to="/generate">Generate</NavLink>
        </nav>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <Link
            to="/login"
            className="btn-ghost"
            style={{ padding: '7px 16px', fontSize: '0.8125rem' }}
          >
            Log in
          </Link>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              display: 'none',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              width: '38px',
              height: '38px',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            className="mobile-menu-btn"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {menuOpen ? (
                <>
                  <line x1="5" y1="5" x2="17" y2="17" />
                  <line x1="17" y1="5" x2="5" y2="17" />
                </>
              ) : (
                <>
                  <line x1="4" y1="7" x2="18" y2="7" />
                  <line x1="4" y1="12" x2="18" y2="12" />
                  <line x1="4" y1="17" x2="18" y2="17" />
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
            padding: '12px 20px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          <MobileNavLink to="/" onClick={() => setMenuOpen(false)}>Home</MobileNavLink>
          <MobileNavLink to="/pricing" onClick={() => setMenuOpen(false)}>Pricing</MobileNavLink>
          <MobileNavLink to="/faq" onClick={() => setMenuOpen(false)}>FAQ</MobileNavLink>
          <MobileNavLink to="/agent" onClick={() => setMenuOpen(false)}>Agent</MobileNavLink>
          <MobileNavLink to="/generate" onClick={() => setMenuOpen(false)}>Generate</MobileNavLink>
          <Link
            to="/login"
            className="btn-ghost"
            style={{ marginTop: '12px', justifyContent: 'center', padding: '11px 16px' }}
            onClick={() => setMenuOpen(false)}
          >
            Log in
          </Link>
          <Link
            to="/signup"
            className="btn-primary"
            style={{ marginTop: '8px', justifyContent: 'center', padding: '11px 16px' }}
            onClick={() => setMenuOpen(false)}
          >
            Get Started
          </Link>
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
        padding: '12px 14px',
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
