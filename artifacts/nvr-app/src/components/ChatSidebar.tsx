import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  X, Plus, Zap, FolderOpen, Image as ImageIcon,
  Sparkles, MessageSquare, Clock, Crown, ChevronRight,
  Trash2, CheckCircle2, XCircle,
} from "lucide-react";
import { useUsage, PLAN_LABELS, PLAN_COLORS } from "@/lib/usageContext";
import { useTheme } from "@/lib/theme";
import { fetchHealth, type HealthStatus } from "@/lib/api";

export interface RecentChat {
  id: string;
  title: string;
  timestamp: number;
  messageCount: number;
  messages: { role: string; content: string }[];
}

function fmtTime(ms: number) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return "< 1m";
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return "just now";
}

interface Props {
  open: boolean;
  onClose: () => void;
  recentChats: RecentChat[];
  onNewChat: () => void;
  onLoadChat: (chat: RecentChat) => void;
  onDeleteChat: (id: string) => void;
  onShowUpgrade: () => void;
  onImageMode: () => void;
}

export default function ChatSidebar({
  open, onClose, recentChats, onNewChat, onLoadChat, onDeleteChat, onShowUpgrade, onImageMode,
}: Props) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { usage } = useUsage();
  const [, navigate] = useLocation();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);

  // Fetch health status once when sidebar first opens
  useEffect(() => {
    if (!open || health) return;
    fetchHealth().then(setHealth).catch(() => {});
  }, [open, health]);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const chatsLeft = usage ? Math.max(0, usage.chatLimit - usage.chatCount) : null;
  const imagesLeft = usage ? Math.max(0, usage.imageLimit - usage.imageCount) : null;
  const isFree = !usage || usage.plan === "free";
  const planLabel = usage ? (PLAN_LABELS[usage.plan] ?? usage.plan) : "Free";
  const planColor = usage ? (PLAN_COLORS[usage.plan] ?? "text-gray-400") : "text-gray-400";

  const bg = isDark ? "bg-[#0d1117]" : "bg-white";
  const border = isDark ? "border-[#1a2230]" : "border-gray-100";
  const textPrimary = isDark ? "text-white" : "text-gray-900";
  const textSub = isDark ? "text-[#5a7090]" : "text-gray-400";
  const rowHover = isDark ? "hover:bg-white/5" : "hover:bg-gray-50";
  const divider = isDark ? "bg-[#1a2230]" : "bg-gray-100";

  const navItems = [
    { icon: FolderOpen, label: "Projects", action: () => { onClose(); navigate("/agent"); }, accent: "text-purple-400" },
    { icon: ImageIcon, label: "Images", action: () => { onClose(); onImageMode(); }, accent: "text-pink-400" },
    { icon: Sparkles, label: "Explore Modes", action: () => { onClose(); }, accent: "text-cyan-400" },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        ref={overlayRef}
        onClick={onClose}
        className={`fixed inset-0 z-40 transition-all duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        style={{ background: open ? (isDark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.3)") : "transparent", backdropFilter: open ? "blur(2px)" : "none" }}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-[280px] flex flex-col border-r shadow-2xl transition-transform duration-300 ease-out ${bg} ${border} ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Top — logo + close */}
        <div className={`flex items-center justify-between px-4 py-4 border-b ${border}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <p className={`text-[15px] font-bold tracking-tight leading-none ${textPrimary}`}>NVR <span className="text-cyan-400">7.7</span> AI</p>
              <p className={`text-[10px] mt-0.5 ${planColor} font-medium`}>{planLabel}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${isDark ? "text-[#5a7090] hover:text-white hover:bg-white/8" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* New Chat button */}
        <div className="px-3 pt-3 pb-2">
          <button
            onClick={() => { onNewChat(); onClose(); }}
            className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              isDark
                ? "bg-cyan-500/15 border border-cyan-500/25 text-cyan-400 hover:bg-cyan-500/22"
                : "bg-cyan-50 border border-cyan-200 text-cyan-600 hover:bg-cyan-100"
            }`}
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        {/* Navigation */}
        <div className="px-3 pb-2">
          <p className={`px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${textSub}`}>Explore</p>
          {navItems.map(({ icon: Icon, label, action, accent }) => (
            <button key={label} onClick={action} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all text-left ${rowHover} ${textPrimary}`}>
              <Icon className={`w-4 h-4 flex-shrink-0 ${accent}`} />
              {label}
            </button>
          ))}
        </div>

        <div className={`mx-3 h-px ${divider}`} />

        {/* Recent Chats */}
        <div className="flex-1 overflow-y-auto px-3 py-2 scrollbar-thin">
          <p className={`px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${textSub}`}>Recent</p>
          {recentChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2 select-none">
              <MessageSquare className={`w-8 h-8 ${textSub} opacity-40`} />
              <p className={`text-xs ${textSub}`}>No recent chats yet</p>
            </div>
          ) : (
            recentChats.map((chat) => (
              <div key={chat.id} className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${rowHover}`} onClick={() => { onLoadChat(chat); onClose(); }}>
                <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${textSub}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] font-medium truncate ${textPrimary}`}>{chat.title}</p>
                  <p className={`text-[10px] ${textSub}`}>{timeAgo(chat.timestamp)} · {chat.messageCount} msg{chat.messageCount !== 1 ? "s" : ""}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id); }}
                  className={`opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${isDark ? "hover:bg-red-500/15 text-red-400" : "hover:bg-red-50 text-red-400"}`}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>

        <div className={`mx-3 h-px ${divider}`} />

        {/* Usage strip */}
        {usage && (
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <p className={`text-[11px] font-semibold ${textSub}`}>Usage</p>
              {usage.resetIn > 0 && (
                <div className={`flex items-center gap-1 text-[10px] ${textSub}`}>
                  <Clock className="w-3 h-3" />
                  <span>resets in {fmtTime(usage.resetIn)}</span>
                </div>
              )}
            </div>

            {/* Chats */}
            <div className="mb-2">
              <div className="flex justify-between mb-1">
                <span className={`text-[11px] ${textSub}`}>Chats</span>
                <span className={`text-[11px] font-medium ${chatsLeft === 0 ? "text-red-400" : textPrimary}`}>
                  {chatsLeft ?? "—"} / {usage.chatLimit} left
                </span>
              </div>
              <div className={`h-1 rounded-full ${isDark ? "bg-[#1a2230]" : "bg-gray-100"}`}>
                <div
                  className={`h-1 rounded-full transition-all ${chatsLeft === 0 ? "bg-red-400" : "bg-cyan-400"}`}
                  style={{ width: `${Math.max(0, ((chatsLeft ?? 0) / usage.chatLimit) * 100)}%` }}
                />
              </div>
            </div>

            {/* Images */}
            <div>
              <div className="flex justify-between mb-1">
                <span className={`text-[11px] ${textSub}`}>Images</span>
                <span className={`text-[11px] font-medium ${imagesLeft === 0 ? "text-red-400" : textPrimary}`}>
                  {imagesLeft ?? "—"} / {usage.imageLimit} left
                </span>
              </div>
              <div className={`h-1 rounded-full ${isDark ? "bg-[#1a2230]" : "bg-gray-100"}`}>
                <div
                  className={`h-1 rounded-full transition-all ${imagesLeft === 0 ? "bg-red-400" : "bg-purple-400"}`}
                  style={{ width: `${Math.max(0, ((imagesLeft ?? 0) / usage.imageLimit) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* System status (debug/admin) */}
        {health && (
          <div className="px-4 pb-3">
            <p className={`text-[10px] font-semibold uppercase tracking-wider mb-2 ${textSub}`}>System Status</p>
            <div className="space-y-1">
              {[
                { label: "OpenAI", ok: health.openai_configured },
                { label: "XAPI Tools", ok: health.xapi_configured },
              ].map(({ label, ok }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className={`text-[11px] ${textSub}`}>{label}</span>
                  <div className={`flex items-center gap-1 text-[11px] font-medium ${ok ? "text-emerald-400" : "text-red-400"}`}>
                    {ok
                      ? <><CheckCircle2 className="w-3 h-3" />Connected</>
                      : <><XCircle className="w-3 h-3" />Missing</>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upgrade CTA for free users */}
        {isFree && (
          <div className="px-3 pb-4">
            <button
              onClick={() => { onShowUpgrade(); onClose(); }}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500/15 to-purple-500/10 border border-cyan-500/20 transition-all hover:from-cyan-500/20 hover:to-purple-500/15"
            >
              <div className="flex items-center gap-2.5">
                <Crown className="w-4 h-4 text-amber-400" />
                <div className="text-left">
                  <p className={`text-[12px] font-bold ${textPrimary}`}>Upgrade Plan</p>
                  <p className={`text-[10px] ${textSub}`}>From $7/mo · Unlimited chats</p>
                </div>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 ${textSub}`} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
