import { createFileRoute, Link } from '@tanstack/react-router'
import { Footer } from '../components/Footer'

export const Route = createFileRoute('/pricing')({
  component: Pricing,
})

type Plan = {
  name: string
  level: string
  price: string
  cadence: string
  tagline: string
  features: string[]
  highlight?: boolean
  ultra?: boolean
}

const PLANS: Plan[] = [
  {
    name: 'NVR Lite',
    level: 'Starter',
    price: '7',
    cadence: '/ month',
    tagline: 'Light AI assistance for everyday prompts and quick research.',
    features: [
      'AI chat for everyday prompts',
      'Project notes and quick writing',
      'Basic content guidance',
      'Research summaries',
      'Monthly access',
    ],
  },
  {
    name: 'NVR Standard',
    level: 'Standard Agent',
    price: '20',
    cadence: '/ month',
    tagline: 'Standard agent for project work, content, and design prompts.',
    features: [
      'Standard Agent access',
      'Project + website work prompts',
      'Logo and poster generation prompts',
      '30-second video prompts',
      'Coding and design guidance',
      'Priority response speed',
    ],
    highlight: true,
  },
  {
    name: 'NVR VVIP',
    level: 'VVIP Agent',
    price: '35',
    cadence: '/ month',
    tagline: 'VVIP agent with deeper analysis, faster compute, and full toolset.',
    features: [
      'VVIP Agent access',
      'Advanced research + analysis',
      'Full design + content toolset',
      'Multi-step project planning',
      'High-priority compute',
      'Extended chat memory',
      'VVIP support channel',
    ],
  },
  {
    name: 'NVR 9.9',
    level: 'Super Agent',
    price: '259',
    cadence: '/ month',
    tagline: 'Fully autonomous AI system with live deploy and unlimited usage.',
    features: [
      'Super Agent autonomous mode',
      'Live deployment AI',
      'Frontend + backend + deploy control',
      'Terminal control with permission',
      'Project scanner & error fixer',
      'Multi-agent collaboration',
      'API + system integration',
      'Unlimited usage · highest priority',
    ],
    ultra: true,
  },
]

function Pricing() {
  return (
    <div>
      <section
        style={{
          padding: '80px 24px 40px',
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
            Four plans. Three agent levels.
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '520px', margin: '0 auto' }}>
            Start light, upgrade to a Standard or VVIP agent, or unlock the fully
            autonomous Super Agent.
          </p>
        </div>
      </section>

      <section style={{ padding: '56px 24px 40px', display: 'flex', justifyContent: 'center' }}>
        <div className="plans-grid">
          {PLANS.map((p) => (
            <PlanCard key={p.name} plan={p} />
          ))}
        </div>
      </section>

      <section
        style={{
          padding: '24px 24px 80px',
          maxWidth: '700px',
          margin: '0 auto',
        }}
      >
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center', marginBottom: '32px' }}>
          Common questions
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {[
            {
              q: 'What are the agent levels?',
              a: 'Three live agent tiers: Standard Agent (NVR Standard, $20), VVIP Agent (NVR VVIP, $35), and Super Agent (NVR 9.9, $259). NVR Lite at $7 is an entry-level chat plan and does not include a live agent.',
            },
            {
              q: 'Can I cancel at any time?',
              a: 'Yes. Every plan is monthly and can be cancelled from the account area at any time.',
            },
            {
              q: 'What does the Super Agent do that other tiers do not?',
              a: 'Super Agent runs fully autonomously: it can read the project, edit files, run builds, deploy a live preview, and publish to production after approval. Standard and VVIP agents focus on chat, research, design, and project assistance without live deploy.',
            },
            {
              q: 'How is VVIP different from Standard?',
              a: 'VVIP unlocks deeper research, the full design and content toolset, multi-step planning, higher-priority compute, extended chat memory, and a dedicated VVIP support channel.',
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

      <style>{`
        .plans-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
          max-width: 1200px;
          width: 100%;
        }
        @media (max-width: 1100px) {
          .plans-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .plans-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}

function PlanCard({ plan }: { plan: Plan }) {
  const isUltra = plan.ultra
  const isHighlight = plan.highlight
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        padding: '28px 24px',
        borderRadius: '20px',
        background: isUltra
          ? 'linear-gradient(155deg, rgba(8,16,28,0.95), rgba(7,22,28,0.95))'
          : 'var(--bg-surface)',
        border: isUltra
          ? '1px solid rgba(0,200,240,0.55)'
          : isHighlight
            ? '1px solid rgba(0,200,240,0.4)'
            : '1px solid var(--border-bright)',
        boxShadow: isUltra
          ? '0 0 40px rgba(0,200,240,0.2), 0 0 80px rgba(34,230,160,0.12), inset 0 0 60px rgba(0,200,240,0.05)'
          : isHighlight
            ? '0 18px 40px -22px rgba(0,200,240,0.4)'
            : 'none',
        overflow: 'hidden',
      }}
    >
      {isUltra && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '180px',
            height: '180px',
            background: 'radial-gradient(circle, rgba(0,200,240,0.25) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
      )}

      <div
        style={{
          display: 'inline-flex',
          alignSelf: 'flex-start',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '999px',
          background: isUltra
            ? 'linear-gradient(90deg, rgba(0,200,240,0.18), rgba(34,230,160,0.22))'
            : 'rgba(0,200,240,0.08)',
          border: isUltra
            ? '1px solid rgba(0,200,240,0.5)'
            : '1px solid rgba(0,200,240,0.2)',
          color: isUltra ? '#d6fff7' : 'var(--accent)',
          fontFamily: 'DM Mono, monospace',
          fontSize: '0.68rem',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          marginBottom: '18px',
        }}
      >
        {isUltra && (
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '999px',
              background: 'var(--accent-live)',
              boxShadow: '0 0 8px var(--accent-live)',
            }}
          />
        )}
        {plan.level}
      </div>

      <h3
        style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 800,
          fontSize: '1.4rem',
          color: 'var(--text-primary)',
          margin: '0 0 8px',
        }}
      >
        {plan.name}
      </h3>

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', marginBottom: '10px' }}>
        <span
          style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 700,
            fontSize: '1.25rem',
            color: 'var(--text-secondary)',
            marginBottom: '8px',
          }}
        >
          $
        </span>
        <span
          style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: '3rem',
            lineHeight: 1,
            color: 'var(--text-primary)',
            background: isUltra
              ? 'linear-gradient(120deg, #5cf0ff, #58f7b6)'
              : 'none',
            WebkitBackgroundClip: isUltra ? 'text' : 'unset',
            backgroundClip: isUltra ? 'text' : 'unset',
            WebkitTextFillColor: isUltra ? 'transparent' : undefined,
          }}
        >
          {plan.price}
        </span>
        <span
          style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '0.875rem',
            color: 'var(--text-muted)',
            marginBottom: '8px',
          }}
        >
          {plan.cadence}
        </span>
      </div>

      <p
        style={{
          color: 'var(--text-secondary)',
          fontSize: '0.875rem',
          lineHeight: 1.55,
          margin: '0 0 22px',
        }}
      >
        {plan.tagline}
      </p>

      <a
        href="/login"
        className={isUltra || isHighlight ? 'btn-primary' : 'btn-ghost'}
        style={{
          width: '100%',
          justifyContent: 'center',
          fontSize: '0.875rem',
          padding: '12px 20px',
          marginBottom: '24px',
        }}
      >
        Get started
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M3 8h10M9 4l4 4-4 4" />
        </svg>
      </a>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {plan.features.map((f) => (
          <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <span
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '5px',
                background: 'rgba(0,200,240,0.12)',
                border: '1px solid rgba(0,200,240,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '2px',
              }}
            >
              <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="var(--accent)" strokeWidth="2">
                <path d="M2 5l2.5 2.5L8 3" />
              </svg>
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {f}
            </span>
          </div>
        ))}
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
          padding: '16px 22px',
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
      <div style={{ padding: '0 22px 16px', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7 }}>
        {answer}
      </div>
    </details>
  )
}
