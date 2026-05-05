import { Link } from "wouter";

export default function Refund() {
  return (
    <div className="min-h-screen pt-20 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Refund Policy</h1>
          <p className="text-muted-foreground text-sm">Last updated: May 4, 2026</p>
        </div>

        <div className="text-muted-foreground space-y-5">
          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">Overview</h2>
            <p className="text-sm leading-relaxed">
              At NVR AI, we want you to be satisfied with your subscription. This policy outlines when and how refunds are issued.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">7-Day Money-Back Guarantee</h2>
            <p className="text-sm leading-relaxed">
              New subscribers are eligible for a full refund within 7 days of their first payment if they are not satisfied with the Service. This applies to first-time subscriptions only.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">Subscription Cancellations</h2>
            <p className="text-sm leading-relaxed">
              You may cancel your subscription at any time. Cancellations take effect at the end of the current billing period. We do not issue partial refunds for unused time in a billing cycle unless covered by the 7-day guarantee above.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">Non-Refundable Items</h2>
            <ul className="text-sm leading-relaxed space-y-1 list-disc list-inside">
              <li>Monthly subscription fees beyond the 7-day window</li>
              <li>Accounts suspended for Terms of Service violations</li>
              <li>One-time add-on purchases (if applicable)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">Service Outages</h2>
            <p className="text-sm leading-relaxed">
              If NVR AI experiences extended downtime (more than 24 consecutive hours), affected subscribers may be eligible for a prorated credit. This is evaluated on a case-by-case basis.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">How to Request a Refund</h2>
            <p className="text-sm leading-relaxed">
              To request a refund, email us at{" "}
              <a href="mailto:info@nvrai.chat" className="text-cyan-400 hover:underline">
                info@nvrai.chat
              </a>{" "}
              with your account email and reason for the refund request. We aim to respond within 2 business days.
            </p>
          </section>

          <div className="pt-4 border-t border-[hsl(var(--border))]">
            <p className="text-xs text-muted-foreground">
              See also:{" "}
              <Link href="/terms" className="text-cyan-400 hover:underline">Terms of Service</Link>
              {" · "}
              <Link href="/privacy" className="text-cyan-400 hover:underline">Privacy Policy</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
