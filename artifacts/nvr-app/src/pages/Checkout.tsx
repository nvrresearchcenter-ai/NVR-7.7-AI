import { useState } from "react";
import { useLocation, Link } from "wouter";
import {
  Check, Shield, Lock, CreditCard, Smartphone, Bitcoin,
  X, ChevronRight, Zap, Star, Rocket, Crown, ArrowLeft,
} from "lucide-react";

// ─── Plan data ────────────────────────────────────────────────────────────────

const PLANS = {
  spark: {
    id: "spark",
    name: "NVR 7.8 AI",
    subtitle: "Spark Standard",
    usdPrice: 7,
    period: "/month",
    icon: Star,
    accentFrom: "#3b82f6",
    accentTo: "#1d4ed8",
    features: [
      "Standard AI chat",
      "Prompt writing help",
      "Coding guidance",
      "Logo, poster, banner & image help",
      "Usage limits with cooldown",
    ],
  },
  pro: {
    id: "pro",
    name: "NVR 8.7 AI",
    subtitle: "Pro Standard Plus",
    usdPrice: 20,
    period: "/month",
    icon: Rocket,
    accentFrom: "#06b6d4",
    accentTo: "#0891b2",
    features: [
      "Unlimited AI chat with fair-use cooldown",
      "Prompt, coding & website help",
      "Logo, poster, banner & image generation",
      "Higher priority responses",
    ],
  },
  agent: {
    id: "agent",
    name: "NVR 8.8 Agent",
    subtitle: "Development Agent",
    usdPrice: 35,
    period: "/month",
    icon: Crown,
    accentFrom: "#a855f7",
    accentTo: "#7c3aed",
    features: [
      "Agent workspace access",
      "Project builder & code scanner",
      "Bug fixer & terminal guidance",
      "Live monitor",
      "Permission before risky actions",
    ],
  },
  super: {
    id: "super",
    name: "NVR 9.9 Super Agent",
    subtitle: "Ultra Super Agent",
    usdPrice: 259,
    period: "/month",
    icon: Zap,
    accentFrom: "#f59e0b",
    accentTo: "#ea580c",
    features: [
      "Everything in Development Agent",
      "Super agent mode & live deploy workflow",
      "GitHub / project scan support",
      "Permission control for critical actions",
      "Unlimited monthly access",
    ],
  },
} as const;

type PlanId = keyof typeof PLANS;
type Currency = "USD" | "BDT" | "CRYPTO";
type PaymentMethod = "card" | "mobile" | "crypto";

// BDT rate: approximate, updated by rate service in production
const BDT_RATE = 110;

function formatPrice(usd: number, currency: Currency): string {
  if (currency === "USD") return `$${usd}`;
  if (currency === "BDT") return `৳${Math.round(usd * BDT_RATE).toLocaleString()}`;
  return `${usd} USDT`;
}

// ─── Coming-soon modal ────────────────────────────────────────────────────────

function ComingSoonModal({ onClose, plan }: { onClose: () => void; plan: typeof PLANS[PlanId] }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${plan.accentFrom}, ${plan.accentTo})` }}>
              <Lock className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Payment coming soon</h3>
              <p className="text-xs text-gray-500">{plan.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-white transition-colors rounded-lg hover:bg-white/5">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-white/4 border border-white/8 rounded-xl p-4 mb-4">
          <p className="text-sm text-gray-300 leading-relaxed">
            Live payment processing will be enabled soon. Your plan selection has been recorded.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            To activate your plan early, contact us at{" "}
            <a href="mailto:info@nvrai.chat" className="text-cyan-400 hover:underline">info@nvrai.chat</a>
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <a
            href="mailto:info@nvrai.chat?subject=Plan%20Upgrade%20Request&body=I%20want%20to%20upgrade%20to%20the%20plan"
            className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-sm text-center transition-all"
          >
            Contact us to activate
          </a>
          <button onClick={onClose} className="w-full py-2 text-sm text-gray-500 hover:text-gray-300 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main checkout component ──────────────────────────────────────────────────

export default function Checkout() {
  const [location] = useLocation();

  // Read plan from query string
  const params = new URLSearchParams(window.location.search);
  const rawPlan = params.get("plan") ?? "pro";
  const planId: PlanId = (rawPlan in PLANS ? rawPlan : "pro") as PlanId;
  const plan = PLANS[planId];

  const [currency, setCurrency] = useState<Currency>("USD");
  const [payMethod, setPayMethod] = useState<PaymentMethod>("card");
  const [email, setEmail] = useState("");
  const [showModal, setShowModal] = useState(false);

  void location; // satisfy linter

  const PlanIcon = plan.icon;

  const currencies: { id: Currency; label: string }[] = [
    { id: "USD", label: "$ USD" },
    { id: "BDT", label: "৳ BDT" },
    { id: "CRYPTO", label: "₿ USDT" },
  ];

  const payMethods: { id: PaymentMethod; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: "card",
      label: "Credit / Debit Card",
      icon: <CreditCard className="w-4 h-4" />,
      desc: "Visa, Mastercard, AMEX",
    },
    {
      id: "mobile",
      label: "Mobile Banking",
      icon: <Smartphone className="w-4 h-4" />,
      desc: "bKash, Nagad, Rocket",
    },
    {
      id: "crypto",
      label: "Crypto USDT",
      icon: <Bitcoin className="w-4 h-4" />,
      desc: "USDT (TRC-20 / ERC-20)",
    },
  ];

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Integrate Stripe or payment gateway here.
    // For now, show the coming-soon modal.
    setShowModal(true);
  };

  return (
    <div className="min-h-screen pt-14 flex bg-[#080c10]">

      {/* ── Left — dark summary panel ────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[42%] flex-col relative overflow-hidden border-r border-white/5 bg-[#060a0f]">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full blur-3xl opacity-60"
            style={{ background: `radial-gradient(circle, ${plan.accentFrom}15 0%, transparent 70%)` }} />
        </div>

        {/* Grid pattern */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: "linear-gradient(rgba(6,182,212,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.5) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }} />

        <div className="relative z-10 flex flex-col h-full px-10 py-10">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-10">
            <div className="w-8 h-8 rounded-xl bg-cyan-500 flex items-center justify-center shadow shadow-cyan-500/30">
              <svg viewBox="0 0 120 120" fill="none" className="w-5 h-5">
                <path d="M72 18L38 62h26L44 102l44-54H62L72 18z" fill="white" />
              </svg>
            </div>
            <span className="font-bold text-white tracking-tight">
              <span className="text-cyan-400">NVR</span> 7.7 AI
            </span>
          </div>

          {/* Plan card */}
          <div className="rounded-2xl border border-white/8 bg-white/4 backdrop-blur-sm p-5 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                style={{ background: `linear-gradient(135deg, ${plan.accentFrom}, ${plan.accentTo})` }}>
                <PlanIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{plan.name}</p>
                <p className="text-gray-500 text-xs">{plan.subtitle}</p>
              </div>
            </div>

            {/* Price display */}
            <div className="mb-4">
              <p className="text-4xl font-extrabold text-white">
                {formatPrice(plan.usdPrice, currency)}
              </p>
              <p className="text-gray-500 text-xs mt-0.5">
                per month · billed monthly
              </p>
            </div>

            {/* Features */}
            <ul className="space-y-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-400">
                  <Check className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Currency selector */}
          <div className="mb-2">
            <p className="text-xs text-gray-600 mb-2 uppercase tracking-wider font-medium">Currency</p>
            <div className="flex gap-1.5">
              {currencies.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCurrency(c.id)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    currency === c.id
                      ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-400"
                      : "border-white/8 text-gray-500 hover:text-gray-300 hover:border-white/15"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-gray-600 mb-8">Exchange rates and payment fees may apply.</p>

          {/* Back link */}
          <div className="mt-auto">
            <Link href="/pricing" className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-400 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to pricing
            </Link>
          </div>
        </div>
      </div>

      {/* ── Right — payment form ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-start overflow-y-auto py-10 px-6">
        {/* Mobile plan summary */}
        <div className="lg:hidden w-full max-w-md mb-6">
          <div className="rounded-2xl border border-white/10 bg-white/4 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${plan.accentFrom}, ${plan.accentTo})` }}>
                <PlanIcon className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold text-sm">{plan.name}</p>
                <p className="text-gray-500 text-xs">{plan.subtitle}</p>
              </div>
              <p className="text-white font-extrabold text-lg">{formatPrice(plan.usdPrice, currency)}<span className="text-xs text-gray-500 font-normal">/mo</span></p>
            </div>
            {/* Mobile currency */}
            <div className="flex gap-1.5 mt-3">
              {currencies.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCurrency(c.id)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    currency === c.id
                      ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-400"
                      : "border-white/8 text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full max-w-md">
          {/* Heading */}
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-white mb-1">Upgrade to NVR AI</h1>
            <p className="text-sm text-gray-500">Complete your order below</p>
          </div>

          <form onSubmit={handlePay} className="flex flex-col gap-5">
            {/* Contact email */}
            <div>
              <label className="block text-xs text-gray-400 font-medium mb-1.5 uppercase tracking-wider">
                Contact email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                required
                autoComplete="email"
                className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-gray-600 text-sm outline-none transition-all focus:border-cyan-500/50 focus:bg-white/8 focus:ring-2 focus:ring-cyan-500/10"
              />
            </div>

            {/* Payment method */}
            <div>
              <label className="block text-xs text-gray-400 font-medium mb-1.5 uppercase tracking-wider">
                Payment method
              </label>
              <div className="flex flex-col gap-2">
                {payMethods.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPayMethod(m.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                      payMethod === m.id
                        ? "border-cyan-500/50 bg-cyan-500/8 text-white"
                        : "border-white/8 bg-white/3 text-gray-400 hover:border-white/15 hover:bg-white/5"
                    }`}
                  >
                    <div className={`flex-shrink-0 ${payMethod === m.id ? "text-cyan-400" : "text-gray-500"}`}>
                      {m.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${payMethod === m.id ? "text-white" : "text-gray-300"}`}>
                        {m.label}
                      </p>
                      <p className="text-xs text-gray-600">{m.desc}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                      payMethod === m.id ? "border-cyan-400 bg-cyan-400" : "border-gray-600"
                    }`}>
                      {payMethod === m.id && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Payment details placeholder — swap for Stripe Elements when ready */}
            {payMethod === "card" && (
              <div className="rounded-xl border border-white/8 bg-white/3 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Lock className="w-3.5 h-3.5 text-gray-500" />
                  <p className="text-xs text-gray-500">Card details · Stripe integration</p>
                </div>
                <div className="space-y-2">
                  <div className="h-10 rounded-lg bg-white/5 border border-white/8 flex items-center px-3">
                    <span className="text-xs text-gray-600">Card number — coming soon</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-10 rounded-lg bg-white/5 border border-white/8 flex items-center px-3">
                      <span className="text-xs text-gray-600">MM / YY</span>
                    </div>
                    <div className="h-10 rounded-lg bg-white/5 border border-white/8 flex items-center px-3">
                      <span className="text-xs text-gray-600">CVC</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {payMethod === "mobile" && (
              <div className="rounded-xl border border-white/8 bg-white/3 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Smartphone className="w-3.5 h-3.5 text-gray-500" />
                  <p className="text-xs text-gray-500">Mobile banking · Integration coming soon</p>
                </div>
                <div className="h-10 rounded-lg bg-white/5 border border-white/8 flex items-center px-3">
                  <span className="text-xs text-gray-600">bKash / Nagad / Rocket number</span>
                </div>
              </div>
            )}

            {payMethod === "crypto" && (
              <div className="rounded-xl border border-white/8 bg-white/3 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Bitcoin className="w-3.5 h-3.5 text-gray-500" />
                  <p className="text-xs text-gray-500">Crypto USDT · Manual payment</p>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  After clicking Pay now, you'll receive wallet address instructions via email. TRC-20 and ERC-20 networks supported.
                </p>
              </div>
            )}

            {/* Order summary row */}
            <div className="rounded-xl border border-white/8 bg-white/3 p-4">
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-gray-400">{plan.name}</span>
                <span className="text-white font-semibold">{formatPrice(plan.usdPrice, currency)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 text-xs">Billing cycle</span>
                <span className="text-gray-400 text-xs">Monthly</span>
              </div>
              <div className="h-px bg-white/8 my-2.5" />
              <div className="flex justify-between items-center">
                <span className="text-white font-semibold text-sm">Total due today</span>
                <span className="text-white font-extrabold text-lg">{formatPrice(plan.usdPrice, currency)}</span>
              </div>
            </div>

            {/* Pay button */}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-black font-bold text-sm transition-all shadow-lg active:scale-[0.98]"
              style={{ background: `linear-gradient(135deg, ${plan.accentFrom}, ${plan.accentTo})` }}
            >
              <Lock className="w-4 h-4" />
              Pay now — {formatPrice(plan.usdPrice, currency)}
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Security badges */}
            <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
              <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Secure payment</span>
              <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> SSL encrypted</span>
            </div>

            {/* Legal */}
            <p className="text-center text-xs text-gray-600 leading-relaxed">
              By completing this purchase you agree to our{" "}
              <Link href="/terms" className="text-cyan-500 hover:underline underline-offset-2">Terms of Service</Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-cyan-500 hover:underline underline-offset-2">Privacy Policy</Link>.
              {" "}Cancel anytime.
            </p>
          </form>

          {/* Back link (mobile) */}
          <div className="lg:hidden mt-6 text-center">
            <Link href="/pricing" className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-400 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to pricing
            </Link>
          </div>
        </div>
      </div>

      {/* Coming-soon modal */}
      {showModal && <ComingSoonModal onClose={() => setShowModal(false)} plan={plan} />}
    </div>
  );
}
