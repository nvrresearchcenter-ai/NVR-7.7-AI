import { Check, Star, Rocket, Crown, Zap } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useTheme } from "@/lib/theme";

const InfinityIcon = () => (
  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
    <path d="M12 12c-2-2.5-4-4-6-4a4 4 0 0 0 0 8c2 0 4-1.5 6-4z"/>
    <path d="M12 12c2 2.5 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.5-6 4z"/>
  </svg>
);

const plans = [
  {
    id: "spark",
    name: "NVR 7.8 AI",
    subtitle: "Spark Standard",
    price: "$7",
    period: "/mo",
    icon: Star,
    accent: "from-blue-500 to-blue-700",
    ring: "border-blue-200",
    ringDark: "border-blue-500/25",
    highlight: false,
    features: [
      "Standard AI chat",
      "Prompt writing help",
      "Coding guidance",
      "Logo, poster, banner & image help",
      "Usage limits with cooldown",
      "Upgrade prompt when limit ends",
    ],
    cta: "Start Spark",
    ctaClass: "bg-blue-600 hover:bg-blue-500 text-white",
  },
  {
    id: "pro",
    name: "NVR 8.7 AI",
    subtitle: "Pro Standard Plus",
    price: "$20",
    period: "/mo",
    badge: "Most Popular",
    icon: Rocket,
    accent: "from-cyan-500 to-cyan-700",
    ring: "border-cyan-300",
    ringDark: "border-cyan-500/40",
    highlight: true,
    features: [
      "Unlimited AI chat with fair-use cooldown",
      "Prompt, coding & website help",
      "Logo, poster, banner & image generation",
      "Higher priority responses",
      "No agent workspace access",
    ],
    cta: "Go Pro",
    ctaClass: "bg-cyan-500 hover:bg-cyan-400 text-black font-semibold",
  },
  {
    id: "agent",
    name: "NVR 8.8 Agent",
    subtitle: "Development Agent",
    price: "$35",
    period: "/mo",
    icon: Crown,
    accent: "from-purple-500 to-purple-700",
    ring: "border-purple-200",
    ringDark: "border-purple-500/30",
    highlight: false,
    features: [
      "Agent workspace access",
      "Project builder",
      "Code scanner",
      "Bug fixer",
      "Terminal guidance",
      "Live monitor",
      "Permission before risky actions",
    ],
    cta: "Activate Agent",
    ctaClass: "bg-purple-600 hover:bg-purple-500 text-white",
  },
  {
    id: "super",
    name: "NVR 9.9 Super Agent",
    subtitle: "Ultra Super Agent",
    price: "$259",
    period: "/mo",
    badge: "Elite",
    icon: InfinityIcon,
    accent: "from-amber-400 to-orange-600",
    ring: "border-amber-200",
    ringDark: "border-amber-500/35",
    highlight: false,
    features: [
      "Everything in Development Agent",
      "Super agent mode",
      "Live deploy workflow",
      "GitHub / project scan support",
      "Local & server workflow guidance",
      "Permission control for critical actions",
      "Unlimited monthly access",
    ],
    cta: "Go Super",
    ctaClass: "bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-black font-semibold",
  },
];

export default function Pricing() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [, navigate] = useLocation();

  return (
    <div className={`min-h-screen pt-20 pb-16 px-4 ${isDark ? "bg-[#0d0d0d]" : "bg-[#f8f8f8]"}`}>
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className={`text-[28px] sm:text-[36px] font-bold leading-tight ${isDark ? "text-white" : "text-black"}`}>
            NVR 7.7 AI — Powerful Multi-Mode Intelligence System
          </h1>
          <p className={`text-[14px] sm:text-[16px] mt-[6px] ${isDark ? "text-[#aaaaaa]" : "text-[#666666]"}`}>
            Built for Chat, Code, Image, Business &amp; Autonomous AI Agents
          </p>
        </div>

        {/* Paid plans grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
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
                      plan.id === "super"
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
                <p className={`text-xs mb-3 ${isDark ? "text-gray-500" : "text-gray-400"}`}>{plan.subtitle}</p>

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
                  onClick={() => navigate(`/checkout?plan=${plan.id}`)}
                  className={`w-full py-2.5 rounded-xl text-sm transition-all ${plan.ctaClass}`}
                >
                  {plan.cta}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer links */}
        <div className={`mt-10 text-center text-sm space-y-2 ${isDark ? "text-gray-600" : "text-gray-400"}`}>
          <p>All plans include NVR 7.7 AI access. Cancel anytime.</p>
          <p>
            Questions?{" "}
            <a href="mailto:info@nvrai.chat" className="text-cyan-500 hover:underline">info@nvrai.chat</a>
          </p>
          <p>
            <Link href="/refund" className="hover:text-cyan-500 underline underline-offset-2">Refund Policy</Link>
            {" · "}
            <Link href="/terms" className="hover:text-cyan-500 underline underline-offset-2">Terms</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
