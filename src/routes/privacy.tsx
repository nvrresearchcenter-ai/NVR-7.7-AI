import { createFileRoute } from '@tanstack/react-router'
import { Footer } from '../components/Footer'

export const Route = createFileRoute('/privacy')({
  component: Privacy,
})

function Privacy() {
  return (
    <div>
      <LegalHero tag="Legal" title="Privacy Policy" updated="May 1, 2026" />
      <LegalBody>
        <p>
          NVR Technologies, Inc. ("we", "us", or "our") is committed to protecting your personal information. This Privacy Policy explains what data we collect, how we use it, and your rights regarding that data when you use NVR 7.7 (the "Service").
        </p>

        <h2>1. Information We Collect</h2>
        <p>We collect the following categories of information:</p>
        <ul>
          <li><strong style={{ color: 'var(--text-primary)' }}>Account information:</strong> Name, email address, company name, and billing details provided during registration.</li>
          <li><strong style={{ color: 'var(--text-primary)' }}>Usage data:</strong> Features accessed, pages visited, actions taken within the Service, and timestamps.</li>
          <li><strong style={{ color: 'var(--text-primary)' }}>Technical data:</strong> IP address, browser type, device identifiers, operating system, and referring URLs.</li>
          <li><strong style={{ color: 'var(--text-primary)' }}>Customer data:</strong> Data you upload, process, or generate through the Service, such as event streams and analytics inputs.</li>
          <li><strong style={{ color: 'var(--text-primary)' }}>Communications:</strong> Messages you send us, including support requests, feedback, and email correspondence.</li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <p>We use your information to:</p>
        <ul>
          <li>Provide, operate, and improve the Service</li>
          <li>Process payments and manage your subscription</li>
          <li>Send transactional emails such as receipts, security alerts, and account notifications</li>
          <li>Respond to support requests and provide customer service</li>
          <li>Monitor and analyze usage trends to improve features and performance</li>
          <li>Detect and prevent fraud, abuse, or security incidents</li>
          <li>Comply with legal obligations</li>
        </ul>

        <h2>3. Legal Basis for Processing (GDPR)</h2>
        <p>
          For users in the European Economic Area, we process personal data based on: contractual necessity (to provide the Service), legitimate interests (security, fraud prevention, product improvement), your consent (for marketing communications), and legal obligation (compliance with applicable law).
        </p>

        <h2>4. Data Sharing</h2>
        <p>We do not sell your personal data. We may share it with:</p>
        <ul>
          <li><strong style={{ color: 'var(--text-primary)' }}>Service providers:</strong> Hosting, payment processing, analytics, and customer support vendors who process data on our behalf under strict data processing agreements.</li>
          <li><strong style={{ color: 'var(--text-primary)' }}>Legal authorities:</strong> When required by law, court order, or to protect the rights and safety of users and the public.</li>
          <li><strong style={{ color: 'var(--text-primary)' }}>Business transfers:</strong> In connection with a merger, acquisition, or sale of assets, subject to standard confidentiality protections.</li>
        </ul>

        <h2>5. Cookies and Tracking</h2>
        <p>
          We use essential cookies required for the Service to function, as well as analytics cookies (e.g., session tracking) to understand how the Service is used. You may disable non-essential cookies through your browser settings; however, this may affect certain features.
        </p>

        <h2>6. Data Retention</h2>
        <p>
          We retain your account information for as long as your account is active. Upon cancellation, we retain data for up to 90 days to enable account recovery, after which it is deleted or anonymized. Certain legal or compliance obligations may require us to retain data for longer periods.
        </p>

        <h2>7. Data Security</h2>
        <p>
          We implement industry-standard security measures including AES-256 encryption at rest, TLS 1.3 in transit, access controls, and regular security audits. We are SOC 2 Type II certified. No system is completely secure; please contact us immediately if you suspect a security incident.
        </p>

        <h2>8. International Transfers</h2>
        <p>
          Your data may be processed in the United States and other countries where our service providers operate. For transfers from the EEA or UK, we use Standard Contractual Clauses or other approved transfer mechanisms.
        </p>

        <h2>9. Your Rights</h2>
        <p>Depending on your jurisdiction, you may have the right to:</p>
        <ul>
          <li>Access, correct, or delete your personal data</li>
          <li>Object to or restrict certain processing</li>
          <li>Request data portability in a machine-readable format</li>
          <li>Withdraw consent at any time (where processing is based on consent)</li>
          <li>Lodge a complaint with your local data protection authority</li>
        </ul>
        <p>
          To exercise any of these rights, contact us at <a href="mailto:privacy@nvr77.io">privacy@nvr77.io</a>.
        </p>

        <h2>10. Children's Privacy</h2>
        <p>
          The Service is not directed at individuals under the age of 18. We do not knowingly collect personal data from children. If we learn that we have collected data from a child, we will delete it promptly.
        </p>

        <h2>11. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy periodically. Material changes will be communicated via email or prominent notice within the Service at least 14 days before taking effect. Your continued use of the Service constitutes acceptance of the updated policy.
        </p>

        <h2>12. Contact Us</h2>
        <p>
          For privacy-related questions or to exercise your rights, contact our Privacy team at <a href="mailto:privacy@nvr77.io">privacy@nvr77.io</a> or write to NVR Technologies, Inc., 228 Park Ave S, Suite 43700, New York, NY 10003. Our Data Protection Officer can be reached at <a href="mailto:dpo@nvr77.io">dpo@nvr77.io</a>.
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
