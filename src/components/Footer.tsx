export function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-surface)',
        padding: '48px 24px 32px',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '40px',
          marginBottom: '40px',
        }}
      >
        {/* Brand */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '12px',
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                background: 'var(--accent)',
                borderRadius: '7px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
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
                fontSize: '1rem',
                color: 'var(--text-primary)',
              }}
            >
              NVR <span style={{ color: 'var(--accent)' }}>7.7</span>
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', lineHeight: 1.6 }}>
            AI-powered intelligence for modern infrastructure.
          </p>
        </div>

        {/* Product */}
        <div>
          <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Product
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <FooterLink href="/">Home</FooterLink>
            <FooterLink href="/pricing">Pricing</FooterLink>
            <FooterLink href="/faq">FAQ</FooterLink>
          </div>
        </div>

        {/* Legal */}
        <div>
          <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Legal
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <FooterLink href="/terms">Terms of Service</FooterLink>
            <FooterLink href="/privacy">Privacy Policy</FooterLink>
            <FooterLink href="/refund">Refund Policy</FooterLink>
          </div>
        </div>

        {/* Account */}
        <div>
          <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Account
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <FooterLink href="/login">Log In</FooterLink>
            <FooterLink href="/pricing">Sign Up</FooterLink>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          paddingTop: '24px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
          &copy; 2026 NVR 7.7. All rights reserved.
        </p>
        <div style={{ display: 'flex', gap: '20px' }}>
          <FooterLink href="/terms">Terms</FooterLink>
          <FooterLink href="/privacy">Privacy</FooterLink>
          <FooterLink href="/refund">Refunds</FooterLink>
        </div>
      </div>
    </footer>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      style={{
        color: 'var(--text-muted)',
        textDecoration: 'none',
        fontSize: '0.875rem',
        transition: 'color 0.15s',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--accent)' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-muted)' }}
    >
      {children}
    </a>
  )
}
