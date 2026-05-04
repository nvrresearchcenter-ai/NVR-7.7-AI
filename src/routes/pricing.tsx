import { createFileRoute, Link } from '@tanstack/react-router'
import { Footer } from '../components/Footer'

export const Route = createFileRoute('/pricing')({
  component: Pricing,
})

type Plan = {
  name: string
  agentLevel: 'Standard' | 'VVIP' | 'Super Agent'
  price: number
  blurb: string
  features: string[]
  highlight?: boolean
  cta: string
}

const PLANS: Plan[] = [
  {
    name: 'Spark',
    agentLevel: 'Standard',
    price: 7,
    blurb: 'For solo builders kicking the tires.',
    features: [
      'Standard agent',
      '50 agent runs / mo',
      '1 project',
      'Community support',
      'Basic activity log',
    ],
    cta: 'Start with Spark',
  },
  {
    name: 'Pro',
    agentLevel: 'Standard',
    price: 20,
    blurb: 'Daily-driver intelligence for individuals.',
    features: [
      'Standard agent',
      '500 agent runs / mo',
      'Unlimited projects',
      'Priority queue',
      'Email support',
      'Full activity log',
    ],
    cta: 'Choose Pro',
  },
  {
    name: 'VVIP',
    agentLevel: 'VVIP',
    price: 35,
    blurb: 'Elevated agent with team-grade tooling.',
    features: [
      'VVIP agent · faster reasoning',
      '2,500 agent runs / mo',
      'Unlimited team seats',
      'Custom workflows',
      'API access',
      '4-hour SLA support',
      'SSO / SAML',
    ],
    highlight: true,
    cta: 'Go VVIP',
  },
  {
    name: 'Super Agent',
    agentLevel: 'Super Agent',
    price: 259,
    blurb: 'Maxed-out autonomy for serious operators.',
    features: [
      'Super Agent · top-tier model',
      'Unlimited agent runs',
      'Dedicated compute pool',
      'Concurrent multi-agent runs',
      'Private model cache',
      '15-min SLA + named contact',
      'SOC 2, audit logs, residency',
      'White-glove onboarding',
    ],
    cta: 'Unlock Super Agent',
  },
]

const LEVEL_COLOR: Record<Plan['agentLevel'], string> = {
  Standard: 'var(--text-secondary)',
  VVIP: 'var(--accent)',
  'Super Agent': '#a78bfa',
}

function Pricing() {
  return (
    <div>
      {/* Header */}
      <section
        style={{
          padding: '80px 24px 48px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 70% 80% at 50% 0%, rgba(0,200,240,0.08) 0%, transparent 70%)',
          }}
        />
        <div className="grid-pattern" style={{ position: 'absolute', inset: 0, zIndex: 0 }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="tag" style={{ marginBottom: '20px', display: 'inline-flex' }}>
            Pricing
          </div>
          <h1
            style={{
              fontSize: 'clamp(2.25rem, 5vw, 3.5rem)',
              fontWeight: 800,
              color: 'var(--text-primary)',
              marginBottom: '16px',
            }}
          >
            Pick your <span style={{ color: 'var(--accent)' }}>agent level</span>
          </h1>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '1.0625rem',
              maxWidth: '560px',
              margin: '0 auto',
            }}
          >
            Four tiers, three agent classes. Start small or jump straight to Super Agent.
          </p>
        </div>
      </section>

      {/* Pricing grid */}
      <section style={{ padding: '64px 24px', display: 'flex', justifyContent: 'center' }}>
        <div
          style={{
            maxWidth: '1200px',
            width: '100%',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '20px',
            alignItems: 'stretch',
          }}
          className="plans-grid"
        >
          {PLANS.map((plan) => (
            <PlanCard key={plan.name} plan={plan} />
          ))}
        </div>
      </section>

      {/* Agent level legend */}
      <section style={{ padding: '0 24px 64px', maxWidth: '1100px', margin: '0 auto' }}>
        <div
          style={{
            border: '1px solid var(--border)',
            borderRadius: '16px',
            background: 'var(--bg-surface)',
            padding: '24px 28px',
          }}
        >
          <div
            style={{
              fontFamily: 'DM Mono, monospace',
              fontSize: '0.6875rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: '14px',
            }}
          >
            Agent levels
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
            }}
            className="levels-grid"
          >
            <LevelDescription
              level="Standard"
              desc="Solid baseline reasoning. Plans, executes, and pauses on side-effects. Built for everyday tasks."
            />
            <LevelDescription
              level="VVIP"
              desc="Faster, deeper reasoning with custom workflows, broader tool access, and team-grade controls."
            />
            <LevelDescription
              level="Super Agent"
              desc="Top-tier model, unlimited runs, multi-agent concurrency, and a private compute pool."
            />
          </div>
        </div>
      </section>

      {/* FAQ mini */}
      <section style={{ padding: '0 24px 80px', maxWidth: '700px', margin: '0 auto' }}>
        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            textAlign: 'center',
            marginBottom: '40px',
          }}
        >
          Common questions
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            {
              q: 'Can I switch tiers later?',
              a: 'Yes — upgrade or downgrade at any time. Charges are prorated to the day.',
            },
            {
              q: 'What counts as an agent run?',
              a: 'A single end-to-end execution from your prompt through the agent’s closing message, regardless of step count.',
            },
            {
              q: 'How is Super Agent different?',
              a: 'Super Agent uses the top-tier model with longer context, multi-agent concurrency, and a dedicated compute pool so your runs never queue behind anyone else.',
            },
            {
              q: 'Do you offer annual billing?',
              a: 'Yes — annual plans get 20% off. Contact billing@nvr77.io to set one up.',
            },
          ].map((item, i) => (
            <PricingFAQ key={i} question={item.q} answer={item.a} />
          ))}
        </div>
        <p
          style={{
            textAlign: 'center',
            marginTop: '32px',
            color: 'var(--text-muted)',
            fontSize: '0.9rem',
          }}
        >
          Have more questions?{' '}
          <Link to="/faq" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            View the full FAQ
          </Link>
        </p>
      </section>

      <Footer />

      <style>{`
        @media (max-width: 1080px) {
          .plans-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 560px) {
          .plans-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 760px) {
          .levels-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

function PlanCard({ plan }: { plan: Plan }) {
  const isHighlight = plan.highlight
  const isSuper = plan.agentLevel === 'Super Agent'

  return (
    <div
      style={{
        position: 'relative',
        background: isHighlight
          ? 'linear-gradient(180deg, rgba(0,200,240,0.08) 0%, var(--bg-surface) 60%)'
          : 'var(--bg-surface)',
        border: `1px solid ${isHighlight ? 'rgba(0,200,240,0.5)' : 'var(--border)'}`,
        borderRadius: '18px',
        padding: '28px 24px 24px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: isHighlight ? '0 16px 48px rgba(0, 200, 240, 0.12)' : 'none',
      }}
    >
      {isHighlight && (
        <div
          style={{
            position: 'absolute',
            top: '-12px',
            left: '24px',
            background: 'var(--accent)',
            color: 'var(--bg-base)',
            fontFamily: 'DM Mono, monospace',
            fontSize: '0.6875rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '4px 10px',
            borderRadius: '999px',
            fontWeight: 700,
          }}
        >
          Most popular
        </div>
      )}

      <div
        style={{
          fontFamily: 'DM Mono, monospace',
          fontSize: '0.6875rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: LEVEL_COLOR[plan.agentLevel],
          marginBottom: '8px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: LEVEL_COLOR[plan.agentLevel],
            display: 'inline-block',
          }}
        />
        {plan.agentLevel}
      </div>

      <h3
        style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 700,
          fontSize: '1.5rem',
          color: 'var(--text-primary)',
          marginBottom: '6px',
        }}
      >
        {plan.name}
      </h3>
      <p
        style={{
          color: 'var(--text-secondary)',
          fontSize: '0.875rem',
          lineHeight: 1.55,
          marginBottom: '20px',
          minHeight: '2.6em',
        }}
      >
        {plan.blurb}
      </p>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', marginBottom: '4px' }}>
        <span
          style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 700,
            fontSize: '1rem',
            color: 'var(--text-secondary)',
            marginTop: '8px',
          }}
        >
          $
        </span>
        <span
          style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: '3rem',
            color: 'var(--text-primary)',
            lineHeight: 1,
            letterSpacing: '-0.03em',
          }}
        >
          {plan.price}
        </span>
        <span
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '0.875rem',
            color: 'var(--text-muted)',
            marginTop: '24px',
          }}
        >
          /mo
        </span>
      </div>
      <p
        style={{
          color: 'var(--text-muted)',
          fontSize: '0.75rem',
          fontFamily: 'DM Mono, monospace',
          marginBottom: '20px',
        }}
      >
        Billed monthly · cancel any time
      </p>

      <Link
        to="/signup"
        className={isHighlight || isSuper ? 'btn-primary' : 'btn-ghost'}
        style={{
          width: '100%',
          justifyContent: 'center',
          fontSize: '0.875rem',
          padding: '11px 16px',
          display: 'flex',
          marginBottom: '24px',
          ...(isSuper
            ? {
                background: '#a78bfa',
                color: 'var(--bg-base)',
              }
            : {}),
        }}
      >
        {plan.cta}
      </Link>

      <div
        style={{
          borderTop: '1px solid var(--border)',
          paddingTop: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {plan.features.map((f) => (
          <div
            key={f}
            style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}
          >
            <div
              style={{
                width: '16px',
                height: '16px',
                background: 'rgba(0,200,240,0.12)',
                border: '1px solid rgba(0,200,240,0.3)',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '2px',
              }}
            >
              <svg
                width="9"
                height="9"
                viewBox="0 0 10 10"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="2"
              >
                <path d="M2 5l2.5 2.5L8 3" />
              </svg>
            </div>
            <span
              style={{
                fontSize: '0.8125rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
              }}
            >
              {f}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function LevelDescription({
  level,
  desc,
}: {
  level: Plan['agentLevel']
  desc: string
}) {
  return (
    <div>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          fontFamily: 'Syne, sans-serif',
          fontWeight: 700,
          fontSize: '0.9375rem',
          color: 'var(--text-primary)',
          marginBottom: '6px',
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: LEVEL_COLOR[level],
          }}
        />
        {level}
      </div>
      <div
        style={{
          color: 'var(--text-secondary)',
          fontSize: '0.8125rem',
          lineHeight: 1.6,
        }}
      >
        {desc}
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
      <div
        style={{
          padding: '0 24px 18px',
          color: 'var(--text-secondary)',
          fontSize: '0.9rem',
          lineHeight: 1.7,
        }}
      >
        {answer}
      </div>
    </details>
  )
}
