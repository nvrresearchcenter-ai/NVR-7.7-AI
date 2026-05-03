import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Footer } from '../components/Footer'

export const Route = createFileRoute('/faq')({
  component: FAQ,
})

const faqs = [
  {
    category: 'Product',
    items: [
      {
        q: 'What is NVR 7.7?',
        a: 'NVR 7.7 is an AI-powered intelligence platform that provides real-time analysis, automated threat detection, workflow automation, and deep analytics for modern infrastructure teams. Version 7.7 is the current stable release.',
      },
      {
        q: 'What makes NVR 7.7 different from other analytics platforms?',
        a: 'NVR 7.7 combines AI inference, event streaming, and workflow automation in a single product — no stitching together multiple tools. Our AI model continuously learns from your specific environment, improving detection accuracy over time without manual retraining.',
      },
      {
        q: 'How fast is the real-time analysis?',
        a: 'NVR 7.7 delivers an average end-to-end latency of under 14ms for event classification and anomaly detection. The system processes up to 2.4 million events per day on the standard plan.',
      },
      {
        q: 'Does NVR 7.7 integrate with my existing tools?',
        a: 'Yes. NVR 7.7 supports webhooks, a full REST API, and native integrations with Slack, PagerDuty, Datadog, Splunk, and 50+ other tools. Custom integrations can be built using the published API.',
      },
    ],
  },
  {
    category: 'Pricing & Billing',
    items: [
      {
        q: 'How much does NVR 7.7 cost?',
        a: 'NVR 7.7 is $25/month with a single plan that includes full platform access, unlimited projects and team seats, 10M events/month, priority support, and all enterprise features.',
      },
      {
        q: 'Is there a free trial?',
        a: 'Yes. All accounts start with a 14-day free trial with no credit card required. You get access to the full platform during the trial period.',
      },
      {
        q: 'What happens when I hit 10M events?',
        a: 'Additional events are charged at $0.80 per 100,000 events above the monthly limit. You will receive an in-app and email alert when you reach 80% of your limit so you can plan accordingly.',
      },
      {
        q: 'Can I cancel at any time?',
        a: 'Yes, you can cancel from your account dashboard with no cancellation fee. Access continues until the end of your current billing period. See our Refund Policy for details on refund eligibility.',
      },
    ],
  },
  {
    category: 'Security & Compliance',
    items: [
      {
        q: 'Is NVR 7.7 SOC 2 compliant?',
        a: 'Yes. NVR 7.7 is SOC 2 Type II certified. Our audit report is available to enterprise customers upon request under NDA.',
      },
      {
        q: 'Where is my data stored?',
        a: 'Data is stored in US-East and EU-West regions by default. Region selection for data residency is available on the Pro plan. All data is encrypted at rest with AES-256 and in transit with TLS 1.3.',
      },
      {
        q: 'Does NVR 7.7 support SSO?',
        a: 'Yes. We support SAML 2.0 and OIDC-based SSO, compatible with Okta, Azure AD, Google Workspace, and other major identity providers.',
      },
    ],
  },
]

function FAQ() {
  return (
    <div>
      {/* Hero */}
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
          <div className="tag" style={{ marginBottom: '20px', display: 'inline-flex' }}>FAQ</div>
          <h1 style={{ fontSize: 'clamp(2.25rem, 5vw, 3.5rem)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>
            Frequently asked questions
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.0625rem', maxWidth: '460px', margin: '0 auto' }}>
            Everything you need to know about NVR 7.7.
          </p>
        </div>
      </section>

      {/* FAQ body */}
      <section style={{ padding: '64px 24px 80px', maxWidth: '760px', margin: '0 auto' }}>
        {faqs.map((section) => (
          <div key={section.category} style={{ marginBottom: '52px' }}>
            <p
              style={{
                fontFamily: 'Syne, sans-serif',
                fontWeight: 700,
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--accent)',
                marginBottom: '20px',
              }}
            >
              {section.category}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {section.items.map((item, i) => (
                <FAQItem key={i} question={item.q} answer={item.a} />
              ))}
            </div>
          </div>
        ))}

        <div
          style={{
            marginTop: '40px',
            padding: '32px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            textAlign: 'center',
          }}
        >
          <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.125rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
            Still have questions?
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
            Our team typically responds within 4 hours on business days.
          </p>
          <a href="mailto:support@nvr77.io" className="btn-primary" style={{ display: 'inline-flex' }}>
            Contact support
          </a>
        </div>
      </section>

      <Footer />
    </div>
  )
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ borderBottom: '1px solid var(--border)', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          textAlign: 'left',
          padding: '20px 0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          color: 'var(--text-primary)',
          fontFamily: 'Syne, sans-serif',
          fontWeight: 600,
          fontSize: '1rem',
        }}
      >
        {question}
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          stroke="var(--text-muted)"
          strokeWidth="2"
          style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s ease' }}
        >
          <path d="M4 7l5 5 5-5" />
        </svg>
      </button>
      {open && (
        <div
          style={{
            paddingBottom: '20px',
            color: 'var(--text-secondary)',
            fontSize: '0.9375rem',
            lineHeight: 1.7,
            animation: 'fadeUp 0.2s ease',
          }}
        >
          {answer}
        </div>
      )}
    </div>
  )
}
