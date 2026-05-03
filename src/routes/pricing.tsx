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

          <UltraPlanCard />

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
              a: 'Choose NVR 7.8 for lightweight AI assistance, NVR PRO for project support and design prompts, and NVR 9.9 — Super Agent ($259/month) when you need a fully autonomous AI system with live deployment, terminal control, and unlimited usage.',
            },
            {
              q: 'What is included in NVR 9.9 — Super Agent?',
              a: 'NVR 9.9 — Super Agent ($259/month) is a fully autonomous AI system. It includes Live Deployment AI, full frontend + backend + deploy control, AI Terminal Control with permission-based execution, Auto Agent decision-making, project scanner, world-level analysis, website builder, logo/poster/30-sec video generation, multi-agent collaboration, API integration, and unlimited usage at the highest priority.',
            },
            {
              q: 'Is Live Deployment AI exclusive to NVR 9.9?',
              a: 'Yes. Live Deployment AI and the Super Agent autonomous system are exclusive to NVR 9.9 and are not included in NVR 7.8 or NVR PRO.',
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
  pricePrefix = '$',
  priceSuffix = 'USD / month',
  subtitle,
  features,
  featured = false,
}: {
  tag: string
  name: string
  price: string
  pricePrefix?: string
  priceSuffix?: string
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
        border: featured ? '1px solid rgba(var(--accent-rgb),0.55)' : '1px solid var(--border-bright)',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: featured ? '0 24px 70px rgba(0, 200, 240, 0.12)' : 'none',
        position: 'relative',
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
        <div style={{ position: 'absolute', top: 0, right: 0, width: '220px', height: '220px', background: 'radial-gradient(circle, rgba(var(--accent-rgb),0.09) 0%, transparent 70%)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="tag" style={{ marginBottom: '24px' }}>{tag}</div>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.25rem)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>
            {name}
          </h2>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', marginBottom: '8px' }}>
            {pricePrefix && (
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-secondary)', marginTop: '8px' }}>{pricePrefix}</span>
            )}
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '4rem', color: 'var(--text-primary)', lineHeight: 1 }}>{price}</span>
            <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '1rem', color: 'var(--text-muted)', marginTop: '32px' }}>{priceSuffix}</span>
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

      <div className="pricing-features-panel" style={{ padding: '48px', background: featured ? 'linear-gradient(135deg, rgba(17,24,39,1), rgba(7,18,30,1))' : 'var(--bg-elevated)', position: 'relative', zIndex: 1 }}>
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
                  background: 'rgba(var(--accent-rgb),0.12)',
                  border: '1px solid rgba(var(--accent-rgb),0.3)',
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

const ULTRA_FEATURES: { label: string; icon: 'rocket' | 'cube' | 'terminal' | 'spark' | 'scan' | 'globe' | 'wand' | 'film' | 'doc' | 'infinite' | 'mesh' | 'plug' }[] = [
  { label: 'Live Deployment AI (instant publish to production)', icon: 'rocket' },
  { label: 'Full system control (frontend + backend + deploy)', icon: 'cube' },
  { label: 'AI Terminal Control (safe execution with permission)', icon: 'terminal' },
  { label: 'Auto Agent Mode (AI makes decisions)', icon: 'spark' },
  { label: 'Project Scanner (detect & fix errors)', icon: 'scan' },
  { label: 'World-level analysis + research AI', icon: 'globe' },
  { label: 'Website builder + editor AI', icon: 'wand' },
  { label: 'Logo, poster, and 30-sec video generation', icon: 'film' },
  { label: 'Policy / network / system writing AI', icon: 'doc' },
  { label: 'Unlimited usage (highest priority)', icon: 'infinite' },
  { label: 'Multi-agent collaboration system', icon: 'mesh' },
  { label: 'API + system integration ready', icon: 'plug' },
]

function UltraIcon({ name }: { name: string }) {
  const stroke = 'url(#ultraGrad)'
  const common = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (name) {
    case 'rocket': return <svg {...common}><path d="M5 19c0-4 3-9 8-12s8-3 9-3-1 5-3 9-7 7-12 8l-2-2z"/><circle cx="14" cy="10" r="1.5"/></svg>
    case 'cube': return <svg {...common}><path d="M12 3l8 4.5v9L12 21 4 16.5v-9z"/><path d="M4 7.5L12 12l8-4.5M12 12v9"/></svg>
    case 'terminal': return <svg {...common}><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9l3 3-3 3M13 15h4"/></svg>
    case 'spark': return <svg {...common}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/></svg>
    case 'scan': return <svg {...common}><path d="M4 8V5a1 1 0 011-1h3M16 4h3a1 1 0 011 1v3M20 16v3a1 1 0 01-1 1h-3M8 20H5a1 1 0 01-1-1v-3M8 12h8"/></svg>
    case 'globe': return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></svg>
    case 'wand': return <svg {...common}><path d="M5 19l11-11M14 5l2 2M17 8l2 2M19 14l-1 1M5 5l1 1"/></svg>
    case 'film': return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 9h4M3 15h4M17 9h4M17 15h4M9 5v14M15 5v14"/></svg>
    case 'doc': return <svg {...common}><path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h6"/></svg>
    case 'infinite': return <svg {...common}><path d="M6 12c0-2.5 1.8-4 4-4s2.5 1.5 4 4 1.5 4 4 4 4-1.5 4-4-1.8-4-4-4-2.5 1.5-4 4-1.5 4-4 4-4-1.5-4-4z"/></svg>
    case 'mesh': return <svg {...common}><circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/><circle cx="12" cy="12" r="2"/><path d="M8 6h8M6 8v8M18 8v8M8 18h8M7.5 7.5l3 3M16.5 7.5l-3 3M7.5 16.5l3-3M16.5 16.5l-3-3"/></svg>
    case 'plug': return <svg {...common}><path d="M9 3v4M15 3v4M7 7h10v4a5 5 0 01-10 0V7zM12 16v5"/></svg>
    default: return null
  }
}

function UltraPlanCard() {
  return (
    <div className="ultra-wrap" style={{ position: 'relative', marginTop: '32px' }}>
      {/* MOST POWERFUL ribbon */}
      <div className="ultra-ribbon">
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 10px var(--accent)' }} />
        Most Powerful
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-live)', boxShadow: '0 0 10px var(--accent-live)' }} />
      </div>

      {/* Outer aura */}
      <div className="ultra-aura" aria-hidden />
      {/* Animated conic ring */}
      <div className="ultra-ring" aria-hidden />

      <div className="ultra-card">
        {/* Inner energy line sweep */}
        <div className="ultra-sweep" aria-hidden />
        {/* Grid backdrop */}
        <div className="ultra-grid" aria-hidden />
        {/* Corner glow blobs */}
        <div className="ultra-blob ultra-blob-cyan" aria-hidden />
        <div className="ultra-blob ultra-blob-green" aria-hidden />

        <div className="ultra-inner">
          {/* HEAD */}
          <div className="ultra-head">
            <div className="ultra-badge-row">
              <div className="ultra-badge">
                <span className="ultra-blink" />
                Ultra AI · Live System
              </div>
              <div className="ultra-status">
                <span className="ultra-status-dot" />
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.7rem', letterSpacing: '0.12em', color: 'var(--accent-live-soft)', textTransform: 'uppercase' }}>Live AI</span>
              </div>
            </div>

            <p className="ultra-eyebrow">NVR 9.9 — Super Agent</p>

            <h2 className="ultra-headline">
              Full Autonomous <span className="ultra-headline-accent">AI System</span>
            </h2>
            <p className="ultra-subhead">Build, analyze, and deploy everything — instantly.</p>

            <div className="ultra-price-row">
              <div className="ultra-price">
                <span className="ultra-price-prefix">$</span>
                <span className="ultra-price-amount">259</span>
                <span className="ultra-price-suffix">/ month</span>
              </div>
              <div className="ultra-price-meta">
                <span style={{ color: 'var(--accent-live-soft)' }}>Highest priority compute</span>
                <span style={{ color: 'var(--text-muted)' }}>·</span>
                <span style={{ color: 'var(--text-muted)' }}>Unlimited usage</span>
              </div>
            </div>

            <a href="/login" className="ultra-cta">
              <span className="ultra-cta-glow" aria-hidden />
              <span className="ultra-cta-label">Activate Super Agent</span>
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </a>
            <p className="ultra-cta-meta">Permission-controlled deployment · Cancel any time</p>
          </div>

          {/* FEATURES */}
          <div className="ultra-features-wrap">
            <div className="ultra-features-head">
              <span className="ultra-features-title">Capabilities</span>
              <span className="ultra-features-count">12 systems online</span>
            </div>
            <div className="ultra-features-grid">
              {ULTRA_FEATURES.map((f) => (
                <div key={f.label} className="ultra-feature">
                  <span className="ultra-feature-icon">
                    <UltraIcon name={f.icon} />
                  </span>
                  <span className="ultra-feature-label">{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Shared SVG gradient for icons */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
        <defs>
          <linearGradient id="ultraGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--accent-live)" />
          </linearGradient>
        </defs>
      </svg>

      <style>{`
        .ultra-wrap {
          --u-cyan: 0, 200, 240;
          --u-green: 34, 230, 160;
          margin-left: -16px;
          margin-right: -16px;
        }
        @media (max-width: 760px) {
          .ultra-wrap { margin-left: 0; margin-right: 0; }
        }
        .ultra-ribbon {
          position: absolute;
          top: -16px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 4;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 8px 18px;
          border-radius: 100px;
          background: linear-gradient(90deg, rgba(var(--u-cyan),0.25), rgba(var(--u-green),0.28));
          border: 1px solid rgba(var(--u-cyan),0.55);
          color: #eaffff;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 0.78rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          box-shadow: 0 0 30px rgba(var(--u-cyan),0.35), 0 0 50px rgba(var(--u-green),0.25);
          backdrop-filter: blur(10px);
        }
        .ultra-aura {
          position: absolute;
          inset: -40px;
          border-radius: 36px;
          background:
            radial-gradient(circle at 20% 30%, rgba(var(--u-cyan),0.22), transparent 55%),
            radial-gradient(circle at 80% 75%, rgba(var(--u-green),0.18), transparent 55%);
          filter: blur(30px);
          z-index: 0;
          animation: ultraAura 6s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes ultraAura {
          0%, 100% { opacity: 0.85; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.02); }
        }
        .ultra-ring {
          position: absolute;
          inset: -2px;
          border-radius: 26px;
          padding: 2px;
          background: conic-gradient(from var(--ring-angle, 0deg),
            rgba(var(--u-cyan),0.9),
            rgba(var(--u-green),0.9),
            rgba(var(--u-cyan),0.2),
            rgba(var(--u-green),0.9),
            rgba(var(--u-cyan),0.9));
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
                  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
                  mask-composite: exclude;
          opacity: 0.85;
          animation: ultraRing 8s linear infinite;
          z-index: 1;
          pointer-events: none;
        }
        @property --ring-angle {
          syntax: '<angle>';
          inherits: false;
          initial-value: 0deg;
        }
        @keyframes ultraRing {
          to { --ring-angle: 360deg; }
        }
        .ultra-card {
          position: relative;
          z-index: 2;
          border-radius: 24px;
          background:
            linear-gradient(155deg, rgba(8,16,28,0.92), rgba(6,12,22,0.88) 55%, rgba(7,22,28,0.92));
          border: 1px solid rgba(var(--u-cyan),0.35);
          backdrop-filter: blur(20px) saturate(140%);
          -webkit-backdrop-filter: blur(20px) saturate(140%);
          overflow: hidden;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.04),
            inset 0 0 60px rgba(var(--u-cyan),0.06),
            0 30px 80px rgba(0,0,0,0.55),
            0 0 40px rgba(var(--u-cyan),0.18),
            0 0 80px rgba(var(--u-green),0.12);
          transition: transform 0.4s ease, box-shadow 0.4s ease;
        }
        .ultra-card:hover {
          transform: translateY(-2px);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.05),
            inset 0 0 80px rgba(var(--u-cyan),0.1),
            0 40px 100px rgba(0,0,0,0.6),
            0 0 60px rgba(var(--u-cyan),0.32),
            0 0 110px rgba(var(--u-green),0.22);
        }
        .ultra-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(var(--u-cyan),0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(var(--u-cyan),0.07) 1px, transparent 1px);
          background-size: 44px 44px;
          mask-image: radial-gradient(ellipse 70% 80% at 50% 0%, #000 0%, transparent 75%);
          -webkit-mask-image: radial-gradient(ellipse 70% 80% at 50% 0%, #000 0%, transparent 75%);
          opacity: 0.55;
          pointer-events: none;
        }
        .ultra-sweep {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(115deg, transparent 35%, rgba(var(--u-cyan),0.18) 48%, rgba(var(--u-green),0.18) 52%, transparent 65%);
          background-size: 250% 250%;
          animation: ultraSweep 7s linear infinite;
          mix-blend-mode: screen;
          opacity: 0.7;
        }
        @keyframes ultraSweep {
          0% { background-position: 200% 0; }
          100% { background-position: -100% 0; }
        }
        .ultra-blob {
          position: absolute;
          width: 360px;
          height: 360px;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          opacity: 0.55;
        }
        .ultra-blob-cyan { top: -120px; left: -120px; background: rgba(var(--u-cyan),0.5); animation: ultraFloat1 9s ease-in-out infinite; }
        .ultra-blob-green { bottom: -140px; right: -120px; background: rgba(var(--u-green),0.45); animation: ultraFloat2 11s ease-in-out infinite; }
        @keyframes ultraFloat1 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(20px,30px); } }
        @keyframes ultraFloat2 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-25px,-20px); } }

        .ultra-inner {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: 1.05fr 1.25fr;
          gap: 0;
        }
        .ultra-head {
          padding: 56px 48px;
          border-right: 1px solid rgba(var(--u-cyan),0.18);
          position: relative;
        }
        .ultra-badge-row {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
          margin-bottom: 28px;
        }
        .ultra-badge {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 7px 14px;
          border-radius: 100px;
          background: linear-gradient(90deg, rgba(var(--u-cyan),0.18), rgba(var(--u-green),0.22));
          border: 1px solid rgba(var(--u-cyan),0.55);
          color: #d6fff7;
          font-family: 'DM Mono', monospace;
          font-size: 0.72rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          box-shadow: 0 0 20px rgba(var(--u-cyan),0.28);
        }
        .ultra-blink {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent-live);
          box-shadow: 0 0 12px var(--accent-live);
          animation: ultraBlink 1.4s ease-in-out infinite;
        }
        @keyframes ultraBlink {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(0.85); }
        }
        .ultra-status {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          border-radius: 100px;
          background: rgba(0,0,0,0.35);
          border: 1px solid rgba(var(--u-green),0.4);
        }
        .ultra-status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--accent-live);
          box-shadow: 0 0 14px var(--accent-live);
          animation: ultraBlink 1.6s ease-in-out infinite;
        }
        .ultra-eyebrow {
          font-family: 'DM Mono', monospace;
          font-size: 0.78rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--accent);
          margin: 0 0 14px;
        }
        .ultra-headline {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: clamp(2.1rem, 4.4vw, 3.2rem);
          line-height: 1.05;
          letter-spacing: -0.025em;
          color: #ffffff;
          margin: 0 0 14px;
          text-shadow: 0 0 40px rgba(var(--u-cyan),0.25);
        }
        .ultra-headline-accent {
          background: linear-gradient(120deg, #5cf0ff 0%, #58f7b6 60%, #b6ffe8 100%);
          -webkit-background-clip: text;
                  background-clip: text;
          color: transparent;
          filter: drop-shadow(0 0 18px rgba(var(--u-green),0.45));
        }
        .ultra-subhead {
          color: #b8d4e0;
          font-size: 1.02rem;
          line-height: 1.55;
          margin: 0 0 30px;
          max-width: 28rem;
        }
        .ultra-price-row {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 18px 20px;
          border-radius: 14px;
          border: 1px solid rgba(var(--u-cyan),0.25);
          background: linear-gradient(135deg, rgba(0,0,0,0.45), rgba(var(--u-cyan),0.06));
          margin-bottom: 26px;
        }
        .ultra-price {
          display: flex;
          align-items: flex-start;
          gap: 4px;
        }
        .ultra-price-prefix {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 1.4rem;
          color: #aee6ff;
          margin-top: 10px;
        }
        .ultra-price-amount {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: clamp(3rem, 6vw, 4.4rem);
          line-height: 1;
          background: linear-gradient(120deg, #5cf0ff, #58f7b6);
          -webkit-background-clip: text;
                  background-clip: text;
          color: transparent;
          filter: drop-shadow(0 0 24px rgba(var(--u-green),0.45));
        }
        .ultra-price-suffix {
          font-family: 'DM Sans', sans-serif;
          font-size: 1.05rem;
          color: var(--text-secondary);
          margin-top: 32px;
        }
        .ultra-price-meta {
          display: flex;
          gap: 8px;
          font-family: 'DM Mono', monospace;
          font-size: 0.74rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .ultra-cta {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 16px 24px;
          border-radius: 12px;
          background: linear-gradient(90deg, #00c8f0 0%, #1be0d3 50%, #22e6a0 100%);
          color: #04141a;
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 1rem;
          letter-spacing: 0.04em;
          text-decoration: none;
          border: 1px solid rgba(255,255,255,0.18);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.35),
            0 12px 32px rgba(var(--u-cyan),0.35),
            0 0 0 1px rgba(var(--u-green),0.25);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          overflow: hidden;
        }
        .ultra-cta:hover {
          transform: translateY(-2px) scale(1.015);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.45),
            0 18px 50px rgba(var(--u-cyan),0.55),
            0 0 0 1px rgba(var(--u-green),0.45),
            0 0 60px rgba(var(--u-green),0.35);
        }
        .ultra-cta-glow {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent);
          transform: translateX(-100%);
          transition: transform 0.6s ease;
        }
        .ultra-cta:hover .ultra-cta-glow {
          transform: translateX(100%);
        }
        .ultra-cta-label { position: relative; z-index: 1; }
        .ultra-cta svg { position: relative; z-index: 1; }
        .ultra-cta-meta {
          color: var(--text-muted);
          font-size: 0.78rem;
          text-align: center;
          margin: 12px 0 0;
        }

        .ultra-features-wrap {
          padding: 56px 48px;
          background: linear-gradient(180deg, rgba(8,16,28,0.5), rgba(6,12,22,0.7));
          position: relative;
        }
        .ultra-features-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(var(--u-cyan),0.15);
        }
        .ultra-features-title {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 0.95rem;
          color: #ffffff;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .ultra-features-count {
          font-family: 'DM Mono', monospace;
          font-size: 0.74rem;
          letter-spacing: 0.12em;
          color: var(--accent-live-soft);
          text-transform: uppercase;
        }
        .ultra-features-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px 18px;
        }
        .ultra-feature {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(255,255,255,0.02), rgba(var(--u-cyan),0.04));
          border: 1px solid rgba(var(--u-cyan),0.14);
          transition: border-color 0.2s ease, transform 0.2s ease, background 0.2s ease;
        }
        .ultra-feature:hover {
          border-color: rgba(var(--u-green),0.5);
          background: linear-gradient(135deg, rgba(var(--u-cyan),0.08), rgba(var(--u-green),0.06));
          transform: translateY(-1px);
        }
        .ultra-feature-icon {
          flex-shrink: 0;
          width: 30px;
          height: 30px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(var(--u-cyan),0.18), rgba(var(--u-green),0.18));
          border: 1px solid rgba(var(--u-cyan),0.4);
          box-shadow: inset 0 0 12px rgba(var(--u-cyan),0.22);
        }
        .ultra-feature-label {
          font-size: 0.88rem;
          line-height: 1.45;
          color: #e7f4ff;
        }

        @media (max-width: 880px) {
          .ultra-inner { grid-template-columns: 1fr !important; }
          .ultra-head { border-right: 0 !important; border-bottom: 1px solid rgba(var(--u-cyan),0.18) !important; padding: 40px 28px !important; }
          .ultra-features-wrap { padding: 40px 28px !important; }
          .ultra-features-grid { grid-template-columns: 1fr !important; }
          .ultra-aura { inset: -20px !important; }
        }
      `}</style>
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
