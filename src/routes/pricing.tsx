import { createFileRoute, Link } from '@tanstack/react-router'
import { Footer } from '../components/Footer'

export const Route = createFileRoute('/pricing')({
  component: Pricing,
})

function Pricing() {
  return (
    <div>
      {/* Header */}
      <section
        style={{
          padding: '80px 24px 60px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 80% at 50% 0%, rgba(0,200,240,0.08) 0%, transparent 70%)' }} />
        <div className="grid-pattern" style={{ position: 'absolute', inset: 0, zIndex: 0 }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="tag" style={{ marginBottom: '20px', display: 'inline-flex' }}>Pricing</div>
          <h1
            style={{
              fontSize: 'clamp(2.25rem, 5vw, 3.5rem)',
              fontWeight: 800,
              color: 'var(--text-primary)',
              marginBottom: '16px',
            }}
          >
            One plan. Full power.
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', maxWidth: '480px', margin: '0 auto' }}>
            No tiers, no feature gates, no surprises. Everything NVR 7.7 offers for a single flat rate.
          </p>
        </div>
      </section>

      {/* Pricing card */}
      <section style={{ padding: '72px 24px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ maxWidth: '1000px', width: '100%' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1.2fr',
              gap: '0',
              border: '1px solid var(--border-bright)',
              borderRadius: '20px',
              overflow: 'hidden',
            }}
            className="pricing-layout"
          >
            {/* Left — plan details */}
            <div
              style={{
                padding: '48px',
                background: 'var(--bg-surface)',
                borderRight: '1px solid var(--border)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div style={{ position: 'absolute', top: 0, right: 0, width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(0,200,240,0.07) 0%, transparent 70%)' }} />
              <div className="tag" style={{ marginBottom: '24px' }}>Pro Plan</div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', marginBottom: '8px' }}>
                <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-secondary)', marginTop: '8px' }}>$</span>
                <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '4rem', color: 'var(--text-primary)', lineHeight: 1 }}>25</span>
                <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '1rem', color: 'var(--text-muted)', marginTop: '32px' }}>/month</span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '32px' }}>
                Billed monthly. Cancel any time. No long-term contracts.
              </p>
              <a href="/login" className="btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: '0.9375rem', padding: '14px 24px', display: 'flex' }}>
                Get started now
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              </a>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', marginTop: '12px' }}>
                14-day free trial · No credit card required
              </p>
            </div>

            {/* Right — features */}
            <div style={{ padding: '48px', background: 'var(--bg-elevated)' }}>
              <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '24px' }}>
                Everything included
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                {[
                  'Unlimited projects',
                  'Unlimited team seats',
                  'Real-time AI analysis',
                  'Automated workflows',
                  'Custom dashboards',
                  'Full API access',
                  'Priority support (4h SLA)',
                  'SOC 2 compliance',
                  'SSO / SAML',
                  'Audit logs',
                  'Model versioning',
                  'Data export (CSV, JSON)',
                  '10M events/month',
                  'Webhook integrations',
                  '99.97% uptime SLA',
                  'Dedicated onboarding',
                ].map((f) => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        background: 'rgba(0,200,240,0.12)',
                        border: '1px solid rgba(0,200,240,0.3)',
                        borderRadius: '5px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="var(--accent)" strokeWidth="2">
                        <path d="M2 5l2.5 2.5L8 3" />
                      </svg>
                    </div>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <style>{`
            @media (max-width: 680px) {
              .pricing-layout { grid-template-columns: 1fr !important; }
            }
          `}</style>
        </div>
      </section>

      {/* FAQ mini */}
      <section
        style={{
          padding: '0 24px 80px',
          maxWidth: '700px',
          margin: '0 auto',
        }}
      >
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center', marginBottom: '40px' }}>
          Common questions
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            {
              q: 'Do I get charged immediately?',
              a: 'No — your 14-day free trial starts immediately with no credit card required. You are only charged after the trial ends if you choose to continue.',
            },
            {
              q: 'Can I cancel at any time?',
              a: 'Yes. Cancel from your account dashboard at any time. You will retain access through the end of your current billing period.',
            },
            {
              q: 'What happens if I exceed 10M events?',
              a: 'Additional events are billed at $0.80 per 100k over the monthly included limit. You will receive an alert before any overage charges apply.',
            },
            {
              q: 'Do you offer annual billing?',
              a: 'Annual plans are available with a 20% discount. Contact our team at billing@nvr77.io to set one up.',
            },
          ].map((item, i) => (
            <PricingFAQ key={i} question={item.q} answer={item.a} />
          ))}
        </div>
        <p style={{ textAlign: 'center', marginTop: '32px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Have more questions?{' '}
          <Link to="/faq" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            View the full FAQ
          </Link>
        </p>
      </section>

      <Footer />
    </div>
  )
}

function PricingFAQ({ question, answer }: { question: string; answer: string }) {
  return (
    <details
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        overflow: 'hidden',
        cursor: 'pointer',
      }}
    >
      <summary
        style={{
          padding: '18px 24px',
          fontFamily: 'Syne, sans-serif',
          fontWeight: 600,
          fontSize: '0.9375rem',
          color: 'var(--text-primary)',
          listStyle: 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          userSelect: 'none',
        }}
      >
        {question}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--text-muted)" strokeWidth="2">
          <path d="M4 6l4 4 4-4" />
        </svg>
      </summary>
      <div style={{ padding: '0 24px 18px', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7 }}>
        {answer}
      </div>
    </details>
  )
}
