import { createFileRoute, Link } from '@tanstack/react-router'
import { Footer } from '../components/Footer'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Hero */}
      <section
        style={{
          position: 'relative',
          padding: '120px 24px 100px',
          overflow: 'hidden',
        }}
      >
        {/* Background grid */}
        <div
          className="grid-pattern"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
          }}
        />
        {/* Radial glow */}
        <div
          style={{
            position: 'absolute',
            top: '-10%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '900px',
            height: '600px',
            background: 'radial-gradient(ellipse, rgba(0,200,240,0.1) 0%, transparent 70%)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            maxWidth: '1100px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '64px',
            alignItems: 'center',
          }}
          className="hero-grid"
        >
          {/* Left content */}
          <div>
            <div className="tag animate-fade-up opacity-0" style={{ marginBottom: '24px' }}>
              <span style={{ width: '6px', height: '6px', background: 'var(--accent)', borderRadius: '50%', display: 'inline-block' }} />
              Version 7.7 — Now Available
            </div>

            <h1
              className="animate-fade-up opacity-0 delay-100"
              style={{
                fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                fontWeight: 800,
                color: 'var(--text-primary)',
                marginBottom: '20px',
              }}
            >
              AI intelligence for{' '}
              <span style={{ color: 'var(--accent)' }}>
                every layer
              </span>
            </h1>

            <p
              className="animate-fade-up opacity-0 delay-200"
              style={{
                fontSize: '1.125rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.7,
                marginBottom: '36px',
                maxWidth: '460px',
              }}
            >
              NVR 7.7 brings world analysis, coding guidance, design prompts, and
              network intelligence into one focused project workspace.
            </p>

            <div
              className="animate-fade-up opacity-0 delay-300"
              style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}
            >
              <Link to="/pricing" className="btn-primary" style={{ fontSize: '0.9375rem', padding: '13px 32px' }}>
                View plans
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              </Link>
              <Link to="/faq" className="btn-ghost" style={{ fontSize: '0.9375rem', padding: '13px 32px' }}>
                Learn more
              </Link>
            </div>

            {/* Stats row */}
            <div
              className="animate-fade-up opacity-0 delay-400"
              style={{
                display: 'flex',
                gap: '32px',
                marginTop: '52px',
                flexWrap: 'wrap',
              }}
            >
              {[
                { val: '99.97%', label: 'Uptime SLA' },
                { val: '<14ms', label: 'Avg. latency' },
                { val: '2.4M+', label: 'Events/day' },
              ].map((s) => (
                <div key={s.val}>
                  <p style={{ fontFamily: 'DM Mono, monospace', fontSize: '1.375rem', fontWeight: 500, color: 'var(--accent)', letterSpacing: '-0.02em', marginBottom: '2px' }}>
                    {s.val}
                  </p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — visual */}
          <div
            className="animate-fade-in opacity-0 delay-200 animate-float"
            style={{ position: 'relative' }}
          >
            <HeroDashboard />
          </div>
        </div>

        <style>{`
          @media (max-width: 768px) {
            .hero-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
          }
        `}</style>
      </section>

      {/* Logos / trust bar */}
      <section
        style={{
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
          padding: '28px 24px',
          background: 'var(--bg-surface)',
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', fontFamily: 'DM Mono, monospace', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '20px' }}>
            Trusted by teams at
          </p>
          <div style={{ display: 'flex', gap: '40px', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
            {['Meridian Labs', 'Vortex AI', 'Northgate', 'Axiom Corp', 'Strata IO'].map((name) => (
              <span key={name} style={{ color: 'var(--text-muted)', fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: '0.9375rem', opacity: 0.6 }}>
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '96px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ marginBottom: '64px' }}>
            <div className="tag" style={{ marginBottom: '16px' }}>Capabilities</div>
            <h2 style={{ fontSize: 'clamp(1.875rem, 3.5vw, 2.75rem)', fontWeight: 800, color: 'var(--text-primary)', maxWidth: '540px', marginBottom: '16px' }}>
              Built for precision, designed for scale
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', fontSize: '1.0625rem', lineHeight: 1.7 }}>
              Every component of NVR 7.7 is engineered for performance at the edge.
            </p>
          </div>

          {/* Asymmetric feature grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.5fr 1fr',
              gridTemplateRows: 'auto auto',
              gap: '20px',
            }}
            className="feature-grid"
          >
            {/* Big feature */}
            <div
              className="card"
              style={{
                gridRow: '1 / 3',
                padding: '40px',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div style={{ position: 'absolute', top: 0, right: 0, width: '240px', height: '240px', background: 'radial-gradient(circle, rgba(0,200,240,0.07) 0%, transparent 70%)' }} />
              <FeatureIcon>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <circle cx="11" cy="11" r="9" />
                  <path d="M11 2v2M11 18v2M2 11h2M18 11h2" />
                  <circle cx="11" cy="11" r="3" fill="currentColor" opacity="0.4" />
                </svg>
              </FeatureIcon>
              <h3 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '20px', marginBottom: '12px' }}>
                Real-Time AI Analysis
              </h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: '380px' }}>
                NVR 7.7 processes your data streams in real time — detecting anomalies, classifying events, and surfacing insights in under 14ms average latency. The AI model updates continuously from your usage patterns without retraining.
              </p>
              <div style={{ marginTop: '32px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {['Stream processing', 'Pattern detection', 'Auto-classification'].map((t) => (
                  <span key={t} style={{ padding: '5px 12px', border: '1px solid var(--border-bright)', borderRadius: '100px', fontSize: '0.8125rem', color: 'var(--text-secondary)', fontFamily: 'DM Mono, monospace' }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Small features */}
            <SmallFeature
              icon={
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M3 3h14v10H3zM7 17h6M10 13v4" />
                  <path d="M7 8l2 2 4-4" />
                </svg>
              }
              title="Automated Workflows"
              desc="Trigger actions from AI events without writing code. Connect any integration in minutes."
            />
            <SmallFeature
              icon={
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <rect x="2" y="2" width="7" height="7" rx="2" />
                  <rect x="11" y="2" width="7" height="7" rx="2" />
                  <rect x="2" y="11" width="7" height="7" rx="2" />
                  <rect x="11" y="11" width="7" height="7" rx="2" />
                </svg>
              }
              title="Unified Dashboard"
              desc="One pane of glass for all your AI metrics, event logs, and team activity."
            />
          </div>

          {/* Second row of features */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '20px',
              marginTop: '20px',
            }}
            className="feature-row"
          >
            {[
              {
                icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M10 2L2 7l8 5 8-5-8-5z"/><path d="M2 12l8 5 8-5"/></svg>,
                title: 'Model Versioning',
                desc: 'Track every model change with full rollback history and A/B performance comparisons.',
              },
              {
                icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75"><rect x="3" y="11" width="4" height="6" rx="1"/><rect x="8" y="7" width="4" height="10" rx="1"/><rect x="13" y="3" width="4" height="14" rx="1"/></svg>,
                title: 'Deep Analytics',
                desc: 'SQL-queryable event store with custom dashboards, funnels, and export to any BI tool.',
              },
              {
                icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M10 1L12.39 7.26L19 8.18L14.5 12.56L15.78 19L10 15.77L4.22 19L5.5 12.56L1 8.18L7.61 7.26z"/></svg>,
                title: 'Enterprise Security',
                desc: 'SOC 2 Type II, end-to-end encryption, SSO/SAML support, and tamper-proof audit logs.',
              },
            ].map((f) => (
              <div key={f.title} className="card" style={{ padding: '28px' }}>
                <FeatureIcon small>{f.icon}</FeatureIcon>
                <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)', margin: '16px 0 8px' }}>{f.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>

          <style>{`
            @media (max-width: 768px) {
              .feature-grid { grid-template-columns: 1fr !important; }
              .feature-row { grid-template-columns: 1fr !important; }
            }
          `}</style>
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          padding: '80px 24px',
          borderTop: '1px solid var(--border)',
          background: 'var(--bg-surface)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 100% at 50% 120%, rgba(0,200,240,0.07) 0%, transparent 70%)' }} />
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            maxWidth: '640px',
            margin: '0 auto',
            textAlign: 'center',
          }}
        >
          <div className="tag" style={{ marginBottom: '20px' }}>Simple pricing</div>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>
            Plans from <span style={{ color: 'var(--accent)' }}>$7/month</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.0625rem', lineHeight: 1.7, marginBottom: '36px' }}>
            Choose the NVR 7.8 package or upgrade to NVR PRO for chat, project assistance, research, coding, and design work.
          </p>
          <Link to="/pricing" className="btn-primary" style={{ fontSize: '1rem', padding: '15px 40px' }}>
            View pricing details
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 8h10M9 4l4 4-4 4" />
            </svg>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}

function HeroDashboard() {
  return (
    <div
      className="animate-pulse-glow"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-bright)',
        borderRadius: '20px',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Glow */}
      <div style={{ position: 'absolute', top: 0, right: 0, width: '180px', height: '180px', background: 'radial-gradient(circle, rgba(0,200,240,0.08) 0%, transparent 70%)' }} />

      {/* Header */}
      <div style={{ position: 'relative', zIndex: 1, marginBottom: '20px' }}>
        <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(1.35rem, 3vw, 2rem)', color: 'var(--text-primary)', lineHeight: 1.05, marginBottom: '8px' }}>
          NVR 7.7 AI Model
        </p>
        <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 'clamp(0.95rem, 2vw, 1.25rem)', background: 'linear-gradient(90deg, var(--accent), #22c55e)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1.25 }}>
          World analysis, coding, design, and network intelligence
        </p>
      </div>

      {/* Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Intelligence Overview</p>
          <p style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.7rem', color: 'var(--text-muted)' }}>LIVE • 1.4k events/s</p>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ width: '8px', height: '8px', background: '#22c55e', borderRadius: '50%', boxShadow: '0 0 6px #22c55e' }} />
          <span style={{ fontSize: '0.75rem', color: '#22c55e', fontFamily: 'DM Mono, monospace' }}>Nominal</span>
        </div>
      </div>

      {/* Chart bars */}
      <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', height: '80px', marginBottom: '20px' }}>
        {[42, 67, 55, 78, 91, 63, 84, 72, 95, 58, 88, 76].map((h, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${h}%`,
              background: i === 10 ? 'var(--accent)' : `rgba(0,200,240,${0.15 + (h / 100) * 0.3})`,
              borderRadius: '3px 3px 0 0',
              transition: 'height 0.3s ease',
            }}
          />
        ))}
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
        {[
          { label: 'Detections', val: '2,847', delta: '+12.3%', up: true },
          { label: 'Accuracy', val: '98.6%', delta: '+0.4%', up: true },
          { label: 'Alerts', val: '3', delta: '-8', up: false },
        ].map((m) => (
          <div key={m.label} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '10px', padding: '12px' }}>
            <p style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>{m.label}</p>
            <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '2px' }}>{m.val}</p>
            <p style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.65rem', color: m.up ? '#22c55e' : '#f87171' }}>{m.delta}</p>
          </div>
        ))}
      </div>

      {/* Recent events */}
      <div style={{ marginTop: '16px' }}>
        <p style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Recent Events</p>
        {[
          { type: 'DETECT', msg: 'Anomaly in feed #7 resolved', time: '0:04s' },
          { type: 'TASK', msg: 'Project brief compiled', time: '1:12s' },
          { type: 'ALERT', msg: 'Threshold breach — zone A3', time: '2:48s' },
        ].map((e, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{
                fontSize: '0.6rem',
                fontFamily: 'DM Mono, monospace',
                padding: '2px 6px',
                borderRadius: '3px',
                background: e.type === 'ALERT' ? 'rgba(248,113,113,0.15)' : 'rgba(0,200,240,0.1)',
                color: e.type === 'ALERT' ? '#f87171' : 'var(--accent)',
              }}>{e.type}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{e.msg}</span>
            </div>
            <span style={{ fontSize: '0.65rem', fontFamily: 'DM Mono, monospace', color: 'var(--text-muted)' }}>{e.time}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function FeatureIcon({ children, small }: { children: React.ReactNode; small?: boolean }) {
  return (
    <div
      style={{
        width: small ? '40px' : '48px',
        height: small ? '40px' : '48px',
        background: 'rgba(0,200,240,0.08)',
        border: '1px solid rgba(0,200,240,0.2)',
        borderRadius: small ? '10px' : '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--accent)',
      }}
    >
      {children}
    </div>
  )
}

function SmallFeature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="card" style={{ padding: '28px' }}>
      <FeatureIcon>{icon}</FeatureIcon>
      <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)', margin: '16px 0 8px' }}>{title}</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.65 }}>{desc}</p>
    </div>
  )
}
