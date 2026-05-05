import { Check, Star, Rocket, Crown, Zap, AlertCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useTheme } from "@/lib/theme";

const InfinityIcon = () => (
  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
    <path d="M12 12c-2-2.5-4-4-6-4a4 4 0 0 0 0 8c2 0 4-1.5 6-4z"/>
    <path d="M12 12c2 2.5 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.5-6 4z"/>
  </svg>
);

const PAYMENT_METHODS = [
  { id: "usd", label: "USD · Visa / Mastercard / Stripe", note: "Connect Stripe to activate" },
  { id: "bdt", label: "BDT · bKash / Nagad / Rocket", note: "Connect SSLCommerz to activate" },
  { id: "crypto", label: "Crypto · USDT / BTC / ETH", note: "Connect Coinbase Commerce to activate" },
];

const plans = [
  {
    id: "free",
    name: "Free",
    subtitle: "Get started for free",
    price: "$0",
    period: "/mo",
    icon: Zap,
    accent: "from-gray-500 to-gray-600",
    ring: "border-gray-200",
    ringDark: "border-gray-700/50",
    highlight: false,
    badge: null as string | null,
    features: [
      "Limited daily AI chat (10 messages)",
      "Basic code generation (5/day)",
      "Basic image & logo prompts",
      "No agent workspace access",
      "Fair-use cooldown after limit",
    ],
    cta: "Start Free",
    ctaClass: "bg-gray-700 hover:bg-gray-600 text-white",
  },
  {
    id: "basic",
    name: "NVR 7.7 Smart",
    subtitle: "Basic Plan",
    price: "$7",
    period: "/mo",
    badge: null as string | null,
    icon: Star,
    accent: "from-blue-500 to-blue-700",
    ring: "border-blue-200",
    ringDark: "border-blue-500/25",
    highlight: false,
    features: [
      "More daily AI chat (100 messages)",
      "Faster responses & priority queue",
      "Code help, debugging & review",
      "Basic image, logo & banner tools",
      "Email support",
    ],
    cta: "Start Basic",
    ctaClass: "bg-blue-600 hover:bg-blue-500 text-white",
  },
  {
    id: "pro",
    name: "NVR 8.7 AI Pro",
    subtitle: "Pro Standard Plus",
    price: "$20",
    period: "/mo",
    badge: "Most Popular" as string | null,
    icon: Rocket,
    accent: "from-cyan-500 to-cyan-700",
    ring: "border-cyan-300",
    ringDark: "border-cyan-500/40",
    highlight: true,
    features: [
      "Unlimited AI chat (fair-use)",
      "NVR 8.8 Agent workspace",
      "Project scanner & code fixer",
      "Code generator with live preview",
      "Image, logo & design generation",
      "Higher priority responses",
    ],
    cta: "Go Pro",
    ctaClass: "bg-cyan-500 hover:bg-cyan-400 text-black font-semibold",
  },
  {
    id: "agent",
    name: "NVR 8.8 Agent",
    subtitle: "Developer Agent",
    price: "$35",
    period: "/mo",
    badge: null as string | null,
    icon: Crown,
    accent: "from-purple-500 to-purple-700",
    ring: "border-purple-200",
    ringDark: "border-purple-500/30",
    highlight: false,
    features: [
      "NVR 8.8 Agent full access",
      "Full agent workspace & file tools",
      "Project builder & bug fixer",
      "Terminal guidance & live preview",
      "Deploy assistant",
      "Permission gate before risky actions",
      "GitHub & Cloudflare integration",
    ],
    cta: "Activate Agent",
    ctaClass: "bg-purple-600 hover:bg-purple-500 text-white",
  },
  {
    id: "ultra",
    name: "NVR 9.9 Super Agent",
    subtitle: "Ultra Super Agent",
    price: "$259",
    period: "/mo",
    badge: "Elite" as string | null,
    icon: InfinityIcon,
    accent: "from-amber-400 to-orange-600",
    ring: "border-amber-200",
    ringDark: "border-amber-500/35",
    highlight: false,
    features: [
      "NVR 9.9 Super + Ultra Research",
      "Full autonomous workflow",
      "Backend + frontend + DB planning",
      "Live deploy with real terminal logs",
      "Custom domain & secrets manager",
      "GitHub / Netlify / Vercel integration",
      "Unlimited monthly access",
    ],
    cta: "Go Ultra",
    ctaClass: "bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-black font-semibold",
  },
];

export default function Pricing() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [, navigate] = useLocation();

  return (
    <div className={`min-h-screen pt-20 pb-20 px-4 ${isDark ? "bg-[#0d0d0d]" : "bg-[#f8f8f8]"}`}>
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className={`text-[28px] sm:text-[38px] font-bold leading-tight ${isDark ? "text-white" : "text-black"}`}>
            NVR 7.7 AI — Plans & Pricing
          </h1>
          <p className={`text-[14px] sm:text-[16px] mt-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            Chat · Code · Image · Agent Workspace · Autonomous Deploy
          </p>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border p-5 transition-all hover:-translate-y-0.5 ${
                  plan.highlight
                    ? isDark
                      ? `${plan.ringDark} bg-[#0f1a1a] ring-1 ring-cyan-500/20 shadow-lg shadow-cyan-500/10`
                      : `${plan.ring} bg-white ring-1 ring-cyan-300/50 shadow-lg shadow-cyan-500/10`
                    : isDark
                      ? `${plan.ringDark} bg-[#141414]`
                      : `${plan.ring} bg-white shadow-sm`
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm whitespace-nowrap ${
                      plan.id === "ultra"
                        ? "bg-gradient-to-r from-amber-400 to-orange-500 text-black"
                        : "bg-cyan-500 text-black"
                    }`}>
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${plan.accent} flex items-center justify-center mb-3 shadow-md`}>
                  <Icon />
                </div>

                <h2 className={`text-sm font-bold mb-0.5 ${isDark ? "text-white" : "text-gray-900"}`}>{plan.name}</h2>
                <p className={`text-[11px] mb-3 ${isDark ? "text-gray-500" : "text-gray-400"}`}>{plan.subtitle}</p>

                <div className="mb-4 flex items-baseline gap-0.5">
                  <span className={`text-2xl font-extrabold ${isDark ? "text-white" : "text-gray-900"}`}>{plan.price}</span>
                  <span className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>{plan.period}</span>
                </div>

                <ul className="space-y-1.5 flex-1 mb-5">
                  {plan.features.map((f) => (
                    <li key={f} className={`flex items-start gap-2 text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                      <Check className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => plan.id === "free" ? navigate("/login") : navigate(`/checkout?plan=${plan.id}`)}
                  className={`w-full py-2.5 rounded-xl text-sm transition-all ${plan.ctaClass}`}
                >
                  {plan.cta}
                </button>
              </div>
            );
          })}
        </div>

        {/* Payment methods section */}
        <div className={`mt-12 rounded-2xl border p-6 ${isDark ? "bg-[#111] border-[#222]" : "bg-white border-gray-200 shadow-sm"}`}>
          <div className="flex items-start gap-3 mb-5">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className={`text-sm font-bold mb-0.5 ${isDark ? "text-white" : "text-gray-900"}`}>Payment Methods</h3>
              <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                Payment gateways are not yet connected. Once configured, the following methods will be available:
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PAYMENT_METHODS.map((pm) => (
              <div key={pm.id} className={`flex items-center gap-3 p-3 rounded-xl border ${isDark ? "bg-[#181818] border-[#2a2a2a]" : "bg-gray-50 border-gray-200"}`}>
                <div className="w-2 h-2 rounded-full bg-gray-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className={`text-xs font-medium truncate ${isDark ? "text-gray-300" : "text-gray-700"}`}>{pm.label}</p>
                  <p className={`text-[10px] mt-0.5 ${isDark ? "text-gray-600" : "text-gray-400"}`}>{pm.note}</p>
                </div>
              </div>
            ))}
          </div>
          <p className={`mt-4 text-[11px] text-center ${isDark ? "text-gray-600" : "text-gray-400"}`}>
            To connect a payment provider, contact{" "}
            <a href="mailto:nvraisupport@gmail.com" className="text-cyan-500 hover:underline">nvraisupport@gmail.com</a>
          </p>
        </div>

        {/* Enterprise note */}
        <div className={`mt-6 rounded-2xl border p-5 text-center ${isDark ? "bg-[#111] border-[#222]" : "bg-white border-gray-200 shadow-sm"}`}>
          <h3 className={`text-sm font-bold mb-1 ${isDark ? "text-white" : "text-gray-900"}`}>Enterprise / Team Plan</h3>
          <p className={`text-xs mb-3 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
            Custom domain · Team workspace · Advanced security · Business support · Custom SLA
          </p>
          <a href="mailto:nvraisupport@gmail.com"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm font-semibold hover:bg-cyan-500/20 transition-all">
            Contact for Enterprise Pricing
          </a>
        </div>

        {/* Footer */}
        <div className={`mt-8 text-center text-xs space-y-2 ${isDark ? "text-gray-600" : "text-gray-400"}`}>
          <p>All plans include NVR 7.7 AI access. Cancel anytime. No hidden fees.</p>
          <p>
            <Link href="/refund" className="hover:text-cyan-500 underline underline-offset-2">Refund Policy</Link>
            {" · "}
            <Link href="/terms" className="hover:text-cyan-500 underline underline-offset-2">Terms</Link>
            {" · "}
            <Link href="/privacy" className="hover:text-cyan-500 underline underline-offset-2">Privacy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
