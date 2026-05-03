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

          <PlanCard
            tag="Premium / Super Power"
            badge="LIVE AI"
            name="NVR 9.9"
            eyebrow="Super Agent"
            price="Custom"
            pricePrefix=""
            priceSuffix="Super Agent access"
            subtitle="Live Deployment AI connects to production, makes approved project changes, and publishes website updates instantly without manual release steps."
            features={[
              'Live Deployment AI (real-time publish to production)',
              'Direct Netlify/VPS integration',
              'Auto build + auto deploy system',
              'Instant UI update without refresh',
              'Smart error fixing before deploy',
              'Full project control (frontend + backend)',
              'Terminal execution AI (safe mode with permission)',
              'Super Agent decision-making system',
            ]}
            superPower
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
              a: 'Choose NVR 7.8 for lightweight AI assistance, NVR PRO for project support and design prompts, and NVR 9.9 when you need the exclusive Super Agent with Live Deployment AI.',
            },
            {
              q: 'Which plan includes Live Deployment AI?',
              a: 'Live Deployment AI is exclusive to NVR 9.9. It is not included with NVR 7.8 or NVR PRO.',
            },
            {
              q: 'Can NVR 9.9 update a production website?',
              a: 'Yes. NVR 9.9 is positioned for approved production changes through direct Netlify/VPS integration, auto build, auto deploy, and smart error fixing before release.',
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
  badge,
  name,
  eyebrow,
  price,
  pricePrefix = '$',
  priceSuffix = 'USD / month',
  subtitle,
  features,
  featured = false,
  superPower = false,
}: {
  tag: string
  badge?: string
  name: string
  eyebrow?: string
  price: string
  pricePrefix?: string
  priceSuffix?: string
  subtitle: string
  features: string[]
  featured?: boolean
  superPower?: boolean
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1.2fr',
        gap: '0',
        border: superPower ? '1px solid rgba(var(--accent-live-rgb),0.72)' : featured ? '1px solid rgba(var(--accent-rgb),0.55)' : '1px solid var(--border-bright)',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: superPower
          ? '0 0 0 1px rgba(var(--accent-rgb),0.28), 0 30px 100px rgba(var(--accent-live-rgb),0.16), 0 18px 70px rgba(var(--accent-rgb),0.18)'
          : featured
            ? '0 24px 70px rgba(0, 200, 240, 0.12)'
            : 'none',
        position: 'relative',
      }}
      className="pricing-layout"
    >
      {superPower && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(115deg, rgba(var(--accent-rgb),0.08), transparent 28%, rgba(var(--accent-live-rgb),0.1) 100%)',
            pointerEvents: 'none',
          }}
        />
      )}
      <div
        className="pricing-plan-panel"
        style={{
          padding: '48px',
          background: superPower ? 'linear-gradient(145deg, var(--bg-base), var(--bg-surface) 52%, rgba(var(--accent-live-rgb),0.08))' : 'var(--bg-surface)',
          borderRight: superPower ? '1px solid rgba(var(--accent-live-rgb),0.28)' : '1px solid var(--border)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: 0, right: 0, width: superPower ? '320px' : '220px', height: superPower ? '320px' : '220px', background: superPower ? 'radial-gradient(circle, rgba(var(--accent-live-rgb),0.18) 0%, rgba(var(--accent-rgb),0.08) 38%, transparent 70%)' : 'radial-gradient(circle, rgba(var(--accent-rgb),0.09) 0%, transparent 70%)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '24px' }}>
            <div className="tag">{tag}</div>
            {badge && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '5px 12px',
                  borderRadius: '100px',
                  border: '1px solid rgba(var(--accent-live-rgb),0.55)',
                  background: 'linear-gradient(90deg, rgba(var(--accent-rgb),0.16), rgba(var(--accent-live-rgb),0.18))',
                  boxShadow: '0 0 24px rgba(var(--accent-live-rgb),0.22)',
                  color: 'var(--accent-live-soft)',
                  fontFamily: 'DM Mono, monospace',
                  fontSize: '0.72rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-live)', boxShadow: '0 0 10px var(--accent-live)' }} />
                {badge}
              </div>
            )}
          </div>
          {eyebrow && (
            <p style={{ color: 'var(--accent-live)', fontFamily: 'DM Mono, monospace', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '10px' }}>
              {eyebrow}
            </p>
          )}
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.25rem)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>
            {name}
          </h2>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', marginBottom: '8px' }}>
            {pricePrefix && (
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-secondary)', marginTop: '8px' }}>{pricePrefix}</span>
            )}
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: price.length > 3 ? 'clamp(2.7rem, 6vw, 4rem)' : '4rem', color: superPower ? 'var(--accent-live-text)' : 'var(--text-primary)', lineHeight: 1 }}>{price}</span>
            <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '1rem', color: superPower ? 'var(--accent-live-muted)' : 'var(--text-muted)', marginTop: '32px' }}>{priceSuffix}</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.65, marginBottom: '32px' }}>
            {subtitle}
          </p>
          <a href="/login" className={featured || superPower ? 'btn-primary' : 'btn-ghost'} style={{ width: '100%', justifyContent: 'center', fontSize: '0.9375rem', padding: '14px 24px', display: 'flex', background: superPower ? 'linear-gradient(90deg, var(--accent), var(--accent-live))' : undefined }}>
            {superPower ? 'Activate Super Agent' : 'Get started'}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </a>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', marginTop: '12px' }}>
            {superPower ? 'Exclusive to NVR 9.9 · Permission-controlled deployment' : 'Billed monthly · Cancel any time'}
          </p>
        </div>
      </div>

      <div className="pricing-features-panel" style={{ padding: '48px', background: superPower ? 'linear-gradient(135deg, var(--bg-base), rgba(var(--accent-live-rgb),0.1))' : featured ? 'linear-gradient(135deg, rgba(17,24,39,1), rgba(7,18,30,1))' : 'var(--bg-elevated)', position: 'relative', zIndex: 1 }}>
        <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.875rem', color: superPower ? 'var(--accent-live-soft)' : 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '24px' }}>
          {superPower ? 'Exclusive NVR 9.9 features' : 'Included features'}
        </p>
        <div className="pricing-features-grid" style={{ display: 'grid', gridTemplateColumns: features.length > 6 ? '1fr 1fr' : '1fr', gap: '14px' }}>
          {features.map((feature) => (
            <div key={feature} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  background: superPower ? 'rgba(var(--accent-live-rgb),0.14)' : 'rgba(var(--accent-rgb),0.12)',
                  border: superPower ? '1px solid rgba(var(--accent-live-rgb),0.42)' : '1px solid rgba(var(--accent-rgb),0.3)',
                  borderRadius: '5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke={superPower ? 'var(--accent-live)' : 'var(--accent)'} strokeWidth="2">
                  <path d="M2 5l2.5 2.5L8 3" />
                </svg>
              </div>
              <span style={{ fontSize: '0.9rem', color: superPower || feature.includes('World-level') || feature.includes('project ID') ? 'var(--text-primary)' : 'var(--text-secondary)', lineHeight: 1.45 }}>
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
