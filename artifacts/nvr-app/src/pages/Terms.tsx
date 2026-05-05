import { Link } from "wouter";

export default function Terms() {
  return (
    <div className="min-h-screen pt-20 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Terms of Service</h1>
          <p className="text-muted-foreground text-sm">Last updated: May 4, 2026</p>
        </div>

        <div className="prose prose-sm max-w-none text-muted-foreground space-y-5">
          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">1. Acceptance of Terms</h2>
            <p>By accessing or using NVR 7.7 AI ("Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">2. Use of the Service</h2>
            <p>You may use NVR 7.7 AI for lawful purposes only. You agree not to use the Service to generate harmful, illegal, or abusive content. You are responsible for all activity under your account.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">3. Subscriptions and Billing</h2>
            <p>Paid plans are billed monthly. You can cancel at any time. Charges are non-refundable except as described in our Refund Policy. We reserve the right to change pricing with 30 days notice.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">4. Intellectual Property</h2>
            <p>The NVR 7.7 AI brand, interface, and underlying technology are owned by NVR AI. Content you generate using the Service is yours, subject to applicable law and these terms.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">5. Limitation of Liability</h2>
            <p>NVR AI is provided "as is." We are not liable for any indirect, incidental, or consequential damages arising from your use of the Service. AI-generated content may be inaccurate — always verify important information.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">6. Termination</h2>
            <p>We reserve the right to suspend or terminate accounts that violate these terms. You may delete your account at any time by contacting support.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">7. Changes to Terms</h2>
            <p>We may update these terms at any time. Continued use of the Service after changes constitutes acceptance of the new terms.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">8. Contact</h2>
            <p>
              For questions about these Terms, contact us at:{" "}
              <a href="mailto:info@nvrai.chat" className="text-cyan-400 hover:underline">
                info@nvrai.chat
              </a>
            </p>
          </section>
        </div>

        <div className="pt-6 mt-6 border-t border-[hsl(var(--border))]">
          <p className="text-xs text-muted-foreground">
            See also:{" "}
            <Link href="/privacy" className="text-cyan-400 hover:underline">Privacy Policy</Link>
            {" · "}
            <Link href="/refund" className="text-cyan-400 hover:underline">Refund Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
