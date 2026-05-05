import { useLocation } from "wouter";
import { MessageSquare, DollarSign, Bot, Sparkles, Code2, Image, Zap, ArrowRight } from "lucide-react";
import { useTheme } from "@/lib/theme";
import Logo from "@/components/Logo";

const features = [
  { icon: MessageSquare, label: "AI Chat", desc: "English & বাংলা supported" },
  { icon: Code2,         label: "Coding Help", desc: "Debug, build, review code" },
  { icon: Image,         label: "Image Generation", desc: "Logos, posters, banners" },
  { icon: Bot,           label: "Agent Workspace", desc: "Project builder & live monitor" },
];

export default function Home() {
  const [, navigate] = useLocation();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const bg      = isDark ? "bg-[#0d0d0d]" : "bg-[#f8f8f8]";
  const heading = isDark ? "text-white" : "text-gray-900";
  const sub     = isDark ? "text-gray-400" : "text-gray-500";
  const card    = isDark ? "bg-[#141414] border-[#222]" : "bg-white border-gray-200 shadow-sm";
  const label   = isDark ? "text-gray-300" : "text-gray-700";
  const desc    = isDark ? "text-gray-600" : "text-gray-400";

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center px-4 pt-14 pb-20 ${bg}`}>

      {/* Hero */}
      <div className="text-center max-w-2xl mx-auto space-y-5 mb-12">
        <div className="flex justify-center mb-2">
          <Logo size="lg" showText={false} />
        </div>

        <div>
          <h1 className={`text-4xl sm:text-5xl font-extrabold tracking-tight mb-3 ${heading}`}>
            AI intelligence for
            <span className="text-cyan-500"> every layer</span>
          </h1>
          <p className={`text-base sm:text-lg leading-relaxed max-w-lg mx-auto ${sub}`}>
            Chat, coding, design, image generation, and agent support in one AI system.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate("/chat")}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-sm transition-all shadow-lg shadow-cyan-500/25"
          >
            <MessageSquare className="w-4 h-4" />
            Start Chat
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate("/agent")}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl border font-semibold text-sm transition-all ${
              isDark
                ? "bg-[#1a1a1a] border-[#333] text-white hover:border-cyan-500/40"
                : "bg-white border-gray-300 text-gray-800 hover:border-cyan-400 shadow-sm"
            }`}
          >
            <Bot className="w-4 h-4 text-purple-400" />
            Agent Mode
          </button>
          <button
            onClick={() => navigate("/pricing")}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl border font-semibold text-sm transition-all ${
              isDark
                ? "bg-[#1a1a1a] border-[#333] text-gray-300 hover:border-cyan-500/40"
                : "bg-white border-gray-200 text-gray-600 hover:border-cyan-300 shadow-sm"
            }`}
          >
            <DollarSign className="w-4 h-4 text-cyan-400" />
            View Pricing
          </button>
        </div>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl w-full">
        {features.map(({ icon: Icon, label: name, desc: d }) => (
          <div
            key={name}
            className={`flex flex-col items-center text-center gap-2 px-4 py-5 rounded-2xl border transition-all hover:-translate-y-0.5 cursor-default ${card}`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isDark ? "bg-cyan-500/10" : "bg-cyan-50"}`}>
              <Icon className="w-4.5 h-4.5 w-5 h-5 text-cyan-500" />
            </div>
            <p className={`text-xs font-semibold ${label}`}>{name}</p>
            <p className={`text-xs leading-relaxed ${desc}`}>{d}</p>
          </div>
        ))}
      </div>

      {/* Free plan note */}
      <div className="mt-8 flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
        <p className={`text-xs ${desc}`}>
          Free: 20 chats + 2 image generations to start.{" "}
          <button onClick={() => navigate("/pricing")} className="text-cyan-500 hover:underline font-medium">
            See all plans →
          </button>
        </p>
      </div>
    </div>
  );
}
