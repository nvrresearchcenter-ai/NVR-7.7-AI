import { Link } from "wouter";

export default function Privacy() {
  return (
    <div className="min-h-screen pt-20 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground text-sm">Last updated: May 4, 2026</p>
        </div>

        <div className="text-muted-foreground space-y-5">
          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">1. Information We Collect</h2>
            <p className="text-sm leading-relaxed">We collect information you provide directly to us, including your name, email address, payment details, and messages you send to NVR 7.7 AI. We also collect usage data such as pages visited and features used.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">2. How We Use Your Information</h2>
            <p className="text-sm leading-relaxed">We use your information to provide and improve the Service, process payments, send important service updates, and respond to support requests. We do not sell your personal data to third parties.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">3. AI Conversations</h2>
            <p className="text-sm leading-relaxed">Messages sent to NVR 7.7 AI are processed by OpenAI's API. Please review OpenAI's privacy policy at openai.com/privacy. Do not share sensitive personal information in chat sessions.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">4. Data Storage</h2>
            <p className="text-sm leading-relaxed">Your data is stored securely. We retain account data for as long as your account is active or as required by law. You may request deletion of your data at any time.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">5. Cookies</h2>
            <p className="text-sm leading-relaxed">We use essential cookies to maintain your session and preferences (such as theme settings). We do not use tracking or advertising cookies.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">6. Third-Party Services</h2>
            <p className="text-sm leading-relaxed">We use trusted third-party services including OpenAI (AI processing) and payment processors. These services have their own privacy policies.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">7. Your Rights</h2>
            <p className="text-sm leading-relaxed">You have the right to access, correct, or delete your personal data. Contact us at any time to exercise these rights.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-2">8. Contact</h2>
            <p className="text-sm leading-relaxed">
              For privacy questions, contact:{" "}
              <a href="mailto:info@nvrai.chat" className="text-cyan-400 hover:underline">
                info@nvrai.chat
              </a>
            </p>
          </section>
        </div>

        <div className="pt-6 mt-6 border-t border-[hsl(var(--border))]">
          <p className="text-xs text-muted-foreground">
            See also:{" "}
            <Link href="/terms" className="text-cyan-400 hover:underline">Terms of Service</Link>
            {" · "}
            <Link href="/refund" className="text-cyan-400 hover:underline">Refund Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
