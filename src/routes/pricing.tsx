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
            Clear plans. Premium support.
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', maxWidth: '480px', margin: '0 auto' }}>
            Clear monthly options for NVR analysis, project work, coding guidance, and design support.
          </p>
        </div>
      </section>

      {/* Pricing cards */}
      <section style={{ padding: '72px 24px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ maxWidth: '1000px', width: '100%', display: 'grid', gap: '24px' }}>
          <PlanCard
            tag="NVR 7.8 Package"
            name="NVR 7.8"
            price="7"
            subtitle="Entry access for fast AI assistance, content prompts, and lightweight project analysis."
            features={[
              'AI chat access for everyday prompts',
              'Fast project notes and task writing',
              'Basic website content guidance',
              'Research summaries and quick analysis',
              'Prompt help for design and coding tasks',
              'Monthly package access',
            ]}
          />

          <PlanCard
            tag="Premium plan"
            name="NVR PRO"
            price="20"
            subtitle="Chat + project assistant for website work, research, and design."
            features={[
              'Chat assistant with project ID support',
              'Can write rules, policies, and network system content',
              'Website work prompts and coding guidance',
              'Logo and poster generation prompts',
              '30-second video prompt support',
              'World-level analysis and task writing',
              'Fast AI response for business and project work',
            ]}
            featured
          />

          <style>{`
            @media (max-width: 760px) {
              .pricing-layout { grid-template-columns: 1fr !important; }
              .pricing-plan-panel { border-right: 0 !important; border-bottom: 1px solid var(--border) !important; padding: 32px !important; }
              .pricing-features-panel { padding: 32px !important; }
              .pricing-features-grid { grid-template-columns: 1fr !important; }
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
              q: 'Can I cancel at any time?',
              a: 'Yes. Plans are monthly and can be cancelled from the account area at any time.',
            },
            {
              q: 'Which plan should I choose?',
              a: 'Choose NVR 7.8 for lightweight AI assistance. Choose NVR PRO when you need project ID support, website work prompts, design prompts, policy writing, and deeper business task support.',
            },
            {
              q: 'Does NVR PRO include design and media prompts?',
              a: 'Yes. NVR PRO includes prompt support for logos, posters, and 30-second video concepts.',
            },
            {
              q: 'Can the assistant help with website work?',
              a: 'Yes. NVR PRO is built for website work prompts, coding guidance, research, and project task writing.',
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

function PlanCard({
  tag,
  name,
  price,
  subtitle,
  features,
  featured = false,
}: {
  tag: string
  name: string
  price: string
  subtitle: string
  features: string[]
  featured?: boolean
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1.2fr',
        gap: '0',
        border: featured ? '1px solid rgba(0,200,240,0.55)' : '1px solid var(--border-bright)',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: featured ? '0 24px 70px rgba(0, 200, 240, 0.12)' : 'none',
      }}
      className="pricing-layout"
    >
      <div
        className="pricing-plan-panel"
        style={{
          padding: '48px',
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: 0, right: 0, width: '220px', height: '220px', background: 'radial-gradient(circle, rgba(0,200,240,0.09) 0%, transparent 70%)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="tag" style={{ marginBottom: '24px' }}>{tag}</div>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.25rem)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>
            {name}
          </h2>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', marginBottom: '8px' }}>
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-secondary)', marginTop: '8px' }}>$</span>
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '4rem', color: 'var(--text-primary)', lineHeight: 1 }}>{price}</span>
            <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '1rem', color: 'var(--text-muted)', marginTop: '32px' }}>USD / month</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.65, marginBottom: '32px' }}>
            {subtitle}
          </p>
          <a href="/login" className={featured ? 'btn-primary' : 'btn-ghost'} style={{ width: '100%', justifyContent: 'center', fontSize: '0.9375rem', padding: '14px 24px', display: 'flex' }}>
            Get started
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </a>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', marginTop: '12px' }}>
            Billed monthly · Cancel any time
          </p>
        </div>
      </div>

      <div className="pricing-features-panel" style={{ padding: '48px', background: featured ? 'linear-gradient(135deg, rgba(17,24,39,1), rgba(7,18,30,1))' : 'var(--bg-elevated)' }}>
        <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '24px' }}>
          Included features
        </p>
        <div className="pricing-features-grid" style={{ display: 'grid', gridTemplateColumns: features.length > 6 ? '1fr 1fr' : '1fr', gap: '14px' }}>
          {features.map((feature) => (
            <div key={feature} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
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
                  marginTop: '2px',
                }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="var(--accent)" strokeWidth="2">
                  <path d="M2 5l2.5 2.5L8 3" />
                </svg>
              </div>
              <span style={{ fontSize: '0.9rem', color: feature.includes('World-level') || feature.includes('project ID') ? 'var(--text-primary)' : 'var(--text-secondary)', lineHeight: 1.45 }}>
                {feature}
              </span>
            </div>
          ))}
        </div>
      </div>
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
