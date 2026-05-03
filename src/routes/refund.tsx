import { createFileRoute } from '@tanstack/react-router'
import { Footer } from '../components/Footer'

export const Route = createFileRoute('/refund')({
  component: Refund,
})

function Refund() {
  return (
    <div>
      <LegalHero tag="Legal" title="Refund Policy" updated="May 1, 2026" />
      <LegalBody>
        <p>
          At NVR Technologies, Inc., we stand behind the quality of NVR 7.7. This Refund Policy describes when and how refunds are issued for subscriptions to the Service.
        </p>

        <h2>1. Free Trial</h2>
        <p>
          All new accounts begin with a 14-day free trial. No credit card is required to start the trial. You will not be charged unless you actively add a payment method and confirm your subscription before or at the end of the trial period.
        </p>

        <h2>2. Satisfaction Guarantee</h2>
        <p>
          If you are not satisfied with NVR 7.7 within the first <strong style={{ color: 'var(--text-primary)' }}>30 days</strong> of your first paid subscription, you may request a full refund of your initial payment. To qualify:
        </p>
        <ul>
          <li>The refund request must be submitted within 30 calendar days of the first charge</li>
          <li>This guarantee applies to first-time subscribers only</li>
          <li>Accounts that have previously received a refund under this policy are not eligible</li>
        </ul>

        <h2>3. Prorated Refunds</h2>
        <p>
          We do not offer prorated refunds for mid-cycle cancellations. When you cancel your subscription, you retain access to the Service until the end of your current billing period. No partial refunds are issued for unused days.
        </p>

        <h2>4. Billing Errors</h2>
        <p>
          If you believe you were charged in error — for example, due to a technical issue or a duplicate transaction — please contact us within 60 days of the charge. We will review the claim and, if an error is confirmed, issue a full refund of the incorrect amount within 5–10 business days.
        </p>

        <h2>5. Overage Charges</h2>
        <p>
          Overage fees are charged for events processed beyond your monthly included limit. These fees are non-refundable as they reflect compute resources already consumed. If you believe an overage charge is inaccurate, contact billing within 30 days and we will audit your usage logs.
        </p>

        <h2>6. Exceptional Circumstances</h2>
        <p>
          We may, at our sole discretion, issue full or partial refunds in exceptional circumstances such as extended service outages materially affecting your use of the platform, documented billing system errors, or other situations deemed warranted by our support team. Such exceptions do not create a precedent or obligation for future refunds.
        </p>

        <h2>7. How to Request a Refund</h2>
        <p>To request a refund:</p>
        <ul>
          <li>Email <a href="mailto:billing@nvr77.io">billing@nvr77.io</a> with your account email, the invoice number (if available), and a brief description of the reason</li>
          <li>Our team will respond within 2 business days</li>
          <li>Approved refunds are processed to your original payment method within 5–10 business days, depending on your bank or card issuer</li>
        </ul>

        <h2>8. Chargebacks</h2>
        <p>
          We encourage you to contact us before initiating a chargeback with your bank. Chargebacks that are successfully disputed by us may result in account suspension. We are committed to resolving billing disputes fairly and quickly through direct communication.
        </p>

        <h2>9. Changes to This Policy</h2>
        <p>
          We may update this Refund Policy at any time. Changes will be communicated via email or in-app notification and take effect 14 days after notice is given. Continued use of the Service after that date constitutes acceptance of the revised policy.
        </p>

        <h2>10. Contact</h2>
        <p>
          Questions about refunds? Reach our billing team at <a href="mailto:billing@nvr77.io">billing@nvr77.io</a> or NVR Technologies, Inc., 228 Park Ave S, Suite 43700, New York, NY 10003.
        </p>
      </LegalBody>
      <Footer />
    </div>
  )
}

function LegalHero({ tag, title, updated }: { tag: string; title: string; updated: string }) {
  return (
    <section
      style={{
        padding: '64px 24px 48px',
        borderBottom: '1px solid var(--border)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 80% at 50% 0%, rgba(0,200,240,0.05) 0%, transparent 70%)' }} />
      <div style={{ maxWidth: '760px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div className="tag" style={{ marginBottom: '16px', display: 'inline-flex' }}>{tag}</div>
        <h1 style={{ fontSize: 'clamp(1.875rem, 4vw, 2.75rem)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>
          {title}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontFamily: 'DM Mono, monospace' }}>
          Last updated: {updated}
        </p>
      </div>
    </section>
  )
}

function LegalBody({ children }: { children: React.ReactNode }) {
  return (
    <section style={{ padding: '48px 24px 64px' }}>
      <div className="legal-content" style={{ maxWidth: '760px', margin: '0 auto' }}>
        {children}
      </div>
    </section>
  )
}
