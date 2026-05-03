import { createFileRoute, Link } from '@tanstack/react-router'
import { Footer } from '../components/Footer'

export const Route = createFileRoute('/pricing')({
  component: Pricing,
})

type Plan = {
  name: string
  version: string
  tagline: string
  price: string
  priceSuffix?: string
  priceNote?: string
  features: string[]
  ctaLabel: string
  highlighted?: boolean
  badge?: string
}

const plans: Plan[] = [
  {
    name: 'Starter',
    version: 'NVR 7.8',
    tagline: 'Get hands-on with the essentials.',
    price: 'Set later',
    priceNote: 'Pricing announced soon',
    features: [
      'AI chat + image studio',
      'Logo & design generation',
      'Coding help — frontend + backend',
      'Prompt writing support',
      'Basic agent mode',
      'Fast responses',
      '30-minute cooldown after heavy usage',
    ],
    ctaLabel: 'Join the waitlist',
  },
  {
    name: 'Pro',
    version: 'NVR 8.8',
    tagline: 'The complete creative + engineering toolkit.',
    price: '$25',
    priceSuffix: '/month',
    priceNote: 'Billed monthly · Cancel anytime',
    features: [
      'Full AI assistant — chat + code + design',
      'Website builder — full stack',
      'Project scanner — find and fix errors',
      'Agent mode — auto task execution',
      'Terminal guidance AI',
      'Faster responses — priority speed',
      'Multi-language support',
      'Unlimited prompts (fair usage)',
    ],
    ctaLabel: 'Get started',
    highlighted: true,
    badge: 'Recommended',
  },
  {
    name: 'Super Agent',
    version: 'NVR 9.9',
    tagline: 'Autonomous agents for serious teams.',
    price: '$259',
    priceSuffix: '/month',
    priceNote: 'For power users and teams',
    features: [
      'Super Agent automation',
      'Full project builder — frontend + backend + deploy',
      'Project scanner + auto-fix system',
      'Terminal control — AI executes commands safely',
      'Advanced reasoning + research AI',
      'Multi-agent collaboration',
      'Ultra-fast response',
      'Unlimited usage — pro level',
      'API + system integration ready',
    ],
    ctaLabel: 'Go Super Agent',
  },
]

function Pricing() {
  return (
    <div>
      {/* Header */}
      <section
        style={{
          padding: '80px 24px 56px',
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
            Three plans. One platform.
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', maxWidth: '560px', margin: '0 auto' }}>
            Pick the level of AI horsepower you need — from quick creative help to fully autonomous agents.
          </p>

          {/* Payment badges */}
          <div
            style={{
              marginTop: '28px',
              display: 'inline-flex',
              flexWrap: 'wrap',
              gap: '8px',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginRight: '4px' }}>We accept:</span>
            <PaymentBadge label="USD" />
            <PaymentBadge label="BDT" />
            <PaymentBadge label="Crypto" />
          </div>
        </div>
      </section>

      {/* Plans */}
      <section style={{ padding: '64px 24px 32px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ maxWidth: '1200px', width: '100%' }}>
          <div className="plans-grid">
            {plans.map((plan) => (
              <PlanCard key={plan.version} plan={plan} />
            ))}
          </div>

          <style>{`
            .plans-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 20px;
              align-items: stretch;
            }
            @media (max-width: 980px) {
              .plans-grid { grid-template-columns: 1fr; max-width: 460px; margin: 0 auto; }
            }
          `}</style>
        </div>
      </section>

      {/* FAQ mini */}
      <section
        style={{
          padding: '24px 24px 80px',
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
              q: 'Can I switch plans later?',
              a: 'Yes — upgrade or downgrade at any time from your account dashboard. Changes take effect at the start of your next billing cycle.',
            },
            {
              q: 'How does crypto payment work?',
              a: 'We accept major cryptocurrencies via our payment processor at checkout. You will see the supported coins and the live conversion rate before confirming.',
            },
            {
              q: 'When will the Starter plan price be announced?',
              a: 'The Starter tier is opening soon. Join the waitlist and we will email you with the launch price before it goes live.',
            },
            {
              q: 'Is there a free trial?',
              a: 'Pro includes a 14-day free trial — no credit card required. Super Agent is available on request with a custom onboarding session.',
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

function PlanCard({ plan }: { plan: Plan }) {
  const highlighted = !!plan.highlighted
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        background: highlighted
          ? 'linear-gradient(180deg, rgba(0,200,240,0.08) 0%, var(--bg-elevated) 60%)'
          : 'var(--bg-surface)',
        border: highlighted ? '1px solid rgba(0,200,240,0.45)' : '1px solid var(--border-bright)',
        borderRadius: '20px',
        padding: '36px 28px 32px',
        overflow: 'hidden',
        boxShadow: highlighted
          ? '0 0 0 1px rgba(0,200,240,0.18), 0 20px 60px -20px rgba(0,200,240,0.35)'
          : '0 12px 40px -24px rgba(0,0,0,0.6)',
        transform: highlighted ? 'translateY(-6px)' : 'none',
        transition: 'transform 0.2s, border-color 0.2s',
      }}
    >
      {highlighted && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '220px',
            height: '220px',
            background: 'radial-gradient(circle at top right, rgba(0,200,240,0.18) 0%, transparent 65%)',
            pointerEvents: 'none',
          }}
        />
      )}

      {plan.badge && (
        <div
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'var(--accent)',
            color: '#060a12',
            fontFamily: 'Syne, sans-serif',
            fontWeight: 700,
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: '5px 10px',
            borderRadius: '999px',
          }}
        >
          {plan.badge}
        </div>
      )}

      <div style={{ position: 'relative' }}>
        <p
          style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}
        >
          {plan.version}
        </p>
        <h3
          style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: '1.6rem',
            color: 'var(--text-primary)',
            marginBottom: '8px',
          }}
        >
          {plan.name}
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '24px' }}>
          {plan.tagline}
        </p>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', marginBottom: '6px' }}>
          <span
            style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 800,
              fontSize: plan.price.length > 4 ? '2.4rem' : '3.2rem',
              color: 'var(--text-primary)',
              lineHeight: 1,
            }}
          >
            {plan.price}
          </span>
          {plan.priceSuffix && (
            <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              {plan.priceSuffix}
            </span>
          )}
        </div>
        {plan.priceNote && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '24px' }}>
            {plan.priceNote}
          </p>
        )}

        <a
          href="/login"
          className={highlighted ? 'btn-primary' : 'btn-ghost'}
          style={{
            width: '100%',
            justifyContent: 'center',
            fontSize: '0.9375rem',
            padding: '13px 20px',
            display: 'flex',
            marginBottom: '28px',
          }}
        >
          {plan.ctaLabel}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M3 8h10M9 4l4 4-4 4" />
          </svg>
        </a>

        <div
          style={{
            borderTop: '1px solid var(--border)',
            paddingTop: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {plan.features.map((feature) => (
            <div key={feature} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  marginTop: '2px',
                  background: highlighted ? 'rgba(0,200,240,0.18)' : 'rgba(0,200,240,0.1)',
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
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PaymentBadge({ label }: { label: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-bright)',
        borderRadius: '999px',
        fontFamily: 'DM Mono, monospace',
        fontSize: '0.75rem',
        letterSpacing: '0.06em',
        color: 'var(--text-secondary)',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: 'var(--accent)',
          boxShadow: '0 0 8px rgba(0,200,240,0.6)',
        }}
      />
      {label}
    </span>
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
