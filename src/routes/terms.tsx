import { createFileRoute, Link } from '@tanstack/react-router'
import { Footer } from '../components/Footer'

export const Route = createFileRoute('/terms')({
  component: Terms,
})

function Terms() {
  return (
    <div>
      <LegalHero
        tag="Legal"
        title="Terms of Service"
        updated="May 1, 2026"
      />
      <LegalBody>
        <p>
          These Terms of Service ("Terms") govern your access to and use of NVR 7.7 ("Service"), operated by NVR Technologies, Inc. ("we", "us", or "our"). By accessing or using the Service, you agree to be bound by these Terms.
        </p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By creating an account or using the Service, you represent that you are at least 18 years old, have the legal authority to enter into these Terms, and agree to comply with them. If you are using the Service on behalf of an organization, you represent that you have authority to bind that organization.
        </p>

        <h2>2. Description of Service</h2>
        <p>
          NVR 7.7 provides an AI-powered intelligence and analytics platform, including real-time data analysis, automated workflow tools, event processing, and related software-as-a-service features. We reserve the right to modify, suspend, or discontinue any portion of the Service at any time with reasonable notice.
        </p>

        <h2>3. Account Registration</h2>
        <p>
          You must provide accurate, complete, and current information when creating an account. You are responsible for safeguarding your login credentials and for all activity that occurs under your account. Notify us immediately at security@nvr77.io if you suspect unauthorized access.
        </p>

        <h2>4. Subscription and Billing</h2>
        <p>
          The Service is offered at $25.00 USD per month. Billing begins after your 14-day free trial period ends. Subscriptions renew automatically each billing cycle unless cancelled. You authorize us to charge your payment method on file for recurring fees. Overage fees apply at $0.80 per 100,000 events beyond your monthly included limit.
        </p>

        <h2>5. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Service for any unlawful purpose or in violation of any applicable regulations</li>
          <li>Attempt to reverse engineer, decompile, or extract source code from the Service</li>
          <li>Introduce malware, viruses, or any code designed to disrupt, damage, or gain unauthorized access</li>
          <li>Resell, sublicense, or otherwise commercialize the Service without our written consent</li>
          <li>Exceed usage limits or circumvent rate limiting mechanisms</li>
          <li>Use automated tools to scrape or extract data in bulk without written authorization</li>
        </ul>

        <h2>6. Intellectual Property</h2>
        <p>
          The Service and all associated software, designs, trademarks, and documentation are the exclusive property of NVR Technologies, Inc. and its licensors. These Terms do not grant you any rights to our intellectual property except the limited right to use the Service as described herein. You retain ownership of all data and content you submit to the Service.
        </p>

        <h2>7. Data and Privacy</h2>
        <p>
          Your use of the Service is also governed by our <a href="/privacy">Privacy Policy</a>, which is incorporated into these Terms by reference. We process your data as described in the Privacy Policy and in accordance with applicable data protection law.
        </p>

        <h2>8. Confidentiality</h2>
        <p>
          Each party may have access to the other's confidential information. Both parties agree to protect such information with at least the same degree of care used to protect their own confidential information, but no less than reasonable care, and not to disclose it to third parties without consent.
        </p>

        <h2>9. Disclaimers</h2>
        <p>
          The Service is provided "as is" and "as available" without warranties of any kind, either express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement. We do not warrant that the Service will be error-free, uninterrupted, or free from security vulnerabilities.
        </p>

        <h2>10. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, NVR Technologies, Inc. shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising from your use of or inability to use the Service. Our aggregate liability shall not exceed the amount paid by you to us in the three months preceding the claim.
        </p>

        <h2>11. Termination</h2>
        <p>
          Either party may terminate these Terms at any time. We may suspend or terminate your account immediately if you breach these Terms. Upon termination, your right to access the Service ceases and we may delete your data in accordance with our data retention policy. Sections that by their nature should survive termination will do so.
        </p>

        <h2>12. Governing Law</h2>
        <p>
          These Terms are governed by the laws of the State of Delaware, USA, without regard to conflict of law principles. Any disputes must be resolved in the federal or state courts located in Delaware, and you consent to the exclusive jurisdiction of such courts.
        </p>

        <h2>13. Changes to Terms</h2>
        <p>
          We may update these Terms from time to time. Material changes will be communicated via email or in-app notification at least 14 days before taking effect. Continued use of the Service after changes take effect constitutes acceptance of the revised Terms.
        </p>

        <h2>14. Contact</h2>
        <p>
          For questions about these Terms, contact us at <a href="mailto:legal@nvr77.io">legal@nvr77.io</a> or NVR Technologies, Inc., 228 Park Ave S, Suite 43700, New York, NY 10003.
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
      <div
        className="legal-content"
        style={{
          maxWidth: '760px',
          margin: '0 auto',
        }}
      >
        {children}
      </div>
    </section>
  )
}

export { LegalHero, LegalBody }
