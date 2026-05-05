import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import {
  ArrowUp, Mic, MicOff, Zap, Copy, Check,
  Image as ImageIcon, AlertCircle, Clock, Volume2, VolumeX,
  X, ChevronRight, Sparkles, Crown, Paperclip, Video, VideoOff,
  Plus, Camera, Globe, Palette, Wrench, AudioLines, Search, Layers,
  FileText, Code2, Settings,
  ThumbsUp, ThumbsDown, Share2, MoreHorizontal, RefreshCw, Bookmark, Flag,
} from "lucide-react";
import { sendChat, generateImage, type ChatMessage, type SendChatResult } from "@/lib/api";
import { useTheme } from "@/lib/theme";
import { useUsage, PLAN_LABELS, PLAN_COLORS } from "@/lib/usageContext";
import ChatSidebar, { type RecentChat } from "@/components/ChatSidebar";

const RECENT_KEY = "nvr-recent-chats";
const MAX_RECENT = 30;

function loadRecentChats(): RecentChat[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as RecentChat[]; }
  catch { return []; }
}

function saveRecentChats(chats: RecentChat[]): void {
  localStorage.setItem(RECENT_KEY, JSON.stringify(chats.slice(0, MAX_RECENT)));
}

function makeId(): string {
  return `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function deriveChatTitle(messages: ChatMessage[]): string {
  const first = messages.find((m) => m.role === "user");
  if (!first) return "New Chat";
  return first.content.slice(0, 60) + (first.content.length > 60 ? "…" : "");
}

// ─── Types ────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySpeechRecognition = any;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(ms: number) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// ─── Upgrade Modal ────────────────────────────────────────────────────────────

interface UpgradeModalProps {
  onClose: () => void;
  isDark: boolean;
  plan: string;
  chatsLeft: number | null;
  imagesLeft: number | null;
  navigate: (path: string) => void;
}

const PLAN_BENEFITS: Record<string, string[]> = {
  free: ["20 chats / 12 hours", "2 image generations", "Basic AI responses", "English & বাংলা support"],
  spark: ["500 chats / session", "50 image generations", "Faster responses", "Priority support", "30-min cooldown only"],
  pro: ["5,000 chats / session", "200 image generations", "Fastest GPT model", "No wait times", "Code & design help"],
  agent: ["Unlimited chats", "Unlimited images", "Agent Workspace", "API access", "Dedicated support"],
  super: ["Everything in Agent", "Custom AI personas", "White-label option", "Team seats", "SLA guarantee"],
};

function UpgradeModal({ onClose, isDark, plan, chatsLeft, imagesLeft, navigate }: UpgradeModalProps) {
  const overlay = isDark ? "bg-black/70" : "bg-black/40";
  const card = isDark ? "bg-[#161616] border-[#2a2a2a] text-white" : "bg-white border-gray-200 text-gray-900";
  const sub = isDark ? "text-gray-400" : "text-gray-500";
  const row = isDark ? "bg-[#1e1e1e] border-[#2a2a2a]" : "bg-gray-50 border-gray-200";
  const benefits = PLAN_BENEFITS[plan] ?? PLAN_BENEFITS.free;
  const planLabel = PLAN_LABELS[plan as keyof typeof PLAN_LABELS] ?? plan;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${overlay} backdrop-blur-sm`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`w-full max-w-sm rounded-2xl border shadow-xl ${card} overflow-hidden`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center">
              <Crown className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-[15px]">Upgrade your NVR AI plan</h2>
              <p className={`text-xs ${sub}`}>Unlock more power</p>
            </div>
          </div>
          <button onClick={onClose} className={`p-1.5 rounded-lg hover:bg-white/5 transition-colors ${sub}`}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current usage */}
        <div className={`mx-5 mb-4 rounded-xl border p-3 ${row}`}>
          <div className="flex items-center justify-between mb-2.5">
            <span className={`text-xs font-medium ${sub}`}>Current plan</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${isDark ? "border-[#2a2a2a] bg-[#111]" : "border-gray-200 bg-white"} ${PLAN_COLORS[plan as keyof typeof PLAN_COLORS] ?? "text-gray-400"}`}>
              {planLabel}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className={`text-center rounded-lg px-2 py-2 ${isDark ? "bg-[#111]" : "bg-white border border-gray-100"}`}>
              <p className="text-lg font-bold text-cyan-400">{chatsLeft ?? "—"}</p>
              <p className={`text-[11px] ${sub}`}>chats left</p>
            </div>
            <div className={`text-center rounded-lg px-2 py-2 ${isDark ? "bg-[#111]" : "bg-white border border-gray-100"}`}>
              <p className="text-lg font-bold text-purple-400">{imagesLeft ?? "—"}</p>
              <p className={`text-[11px] ${sub}`}>images left</p>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="px-5 mb-4">
          <p className={`text-xs font-medium mb-2 ${sub}`}>What you get with {planLabel}</p>
          <ul className="space-y-1.5">
            {benefits.map((b) => (
              <li key={b} className="flex items-center gap-2 text-sm">
                <Sparkles className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div className="px-5 pb-5 flex flex-col gap-2">
          <button
            onClick={() => { navigate("/pricing"); onClose(); }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-semibold text-sm transition-all shadow-sm"
          >
            View Plans <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={onClose} className={`w-full py-2 rounded-xl text-sm transition-all ${isDark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"}`}>
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, isDark, onDone }: { message: string; isDark: boolean; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium border transition-all ${
      isDark ? "bg-[#1e1e1e] border-[#333] text-white" : "bg-white border-gray-200 text-gray-800 shadow-md"
    }`}>
      {message}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageMode, setImageMode] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [limitError, setLimitError] = useState<string | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Voice input state
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<AnySpeechRecognition>(null);

  // TTS state
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);

  // File upload state
  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Video AI mode
  const [videoMode, setVideoMode] = useState(false);

  // Add to Chat sheet
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [webSearch, setWebSearch] = useState(false);
  const [voiceConvMode, setVoiceConvMode] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Message actions
  const [likedSet, setLikedSet] = useState<Set<number>>(new Set());
  const [dislikedSet, setDislikedSet] = useState<Set<number>>(new Set());
  const [moreMenuIdx, setMoreMenuIdx] = useState<number | null>(null);
  const [webSearchSet, setWebSearchSet] = useState<Set<number>>(new Set());

  // Assistant mode
  const [assistantMode, setAssistantMode] = useState("normal");

  // Sidebar + recent chats
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [recentChats, setRecentChats] = useState<RecentChat[]>(() => loadRecentChats());
  const [chatId, setChatId] = useState<string>(() => makeId());

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { usage, refresh } = useUsage();
  const [, navigate] = useLocation();

  // Auto-scroll
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 180) + "px";
    }
  }, [input]);

  // Cooldown timer
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!usage?.isCoolingDown) return;
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [usage?.isCoolingDown]);

  // Stop TTS when component unmounts
  useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);

  // Listen for navbar logo click event to open sidebar
  useEffect(() => {
    const handler = () => setSidebarOpen(true);
    window.addEventListener("nvr:open-sidebar", handler);
    return () => window.removeEventListener("nvr:open-sidebar", handler);
  }, []);

  // Auto-save current conversation to recent chats (debounced)
  useEffect(() => {
    if (messages.length < 2) return;
    const t = setTimeout(() => {
      const title = deriveChatTitle(messages);
      const entry: RecentChat = {
        id: chatId,
        title,
        timestamp: Date.now(),
        messageCount: messages.length,
        messages: messages.slice(-30).map((m) => ({ role: m.role, content: m.content.slice(0, 500) })),
      };
      setRecentChats((prev) => {
        const filtered = prev.filter((c) => c.id !== chatId);
        const updated = [entry, ...filtered].slice(0, MAX_RECENT);
        saveRecentChats(updated);
        return updated;
      });
    }, 1500);
    return () => clearTimeout(t);
  }, [messages, chatId]);

  // ── Send message ──────────────────────────────────────────────────────────

  const handleSend = async () => {
    const text = input.trim();
    if ((!text && !attachedFile) || loading) return;
    setLimitError(null);

    // Build the full message content (append file context if attached)
    let fullContent = text;
    if (attachedFile) {
      if (attachedFile.content.startsWith("data:image")) {
        fullContent = text
          ? `${text}\n\n[Attached image: ${attachedFile.name}]`
          : `[Attached image: ${attachedFile.name}]`;
      } else {
        fullContent = text
          ? `${text}\n\n[File: ${attachedFile.name}]\n${attachedFile.content}`
          : `[File: ${attachedFile.name}]\n${attachedFile.content}`;
      }
      setAttachedFile(null);
    }

    setInput("");
    setLoading(true);

    if (imageMode) {
      const newMsgs: ChatMessage[] = [...messages, { role: "user", content: `🖼️ ${fullContent}` }];
      setMessages(newMsgs);
      try {
        const url = await generateImage(fullContent);
        setMessages([...newMsgs, { role: "assistant", content: `__IMAGE__${url}` }]);
        refresh();
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Image generation failed.";
        setLimitError(msg);
        setMessages([...newMsgs, { role: "assistant", content: msg }]);
      }
    } else {
      const newMsgs: ChatMessage[] = [...messages, { role: "user", content: fullContent }];
      setMessages(newMsgs);
      try {
        const result: SendChatResult = await sendChat(newMsgs, "chat", assistantMode);
        const assistantIdx = newMsgs.length;
        setMessages([...newMsgs, { role: "assistant", content: result.reply }]);
        if (result.webSearchUsed) {
          setWebSearchSet((prev) => new Set([...prev, assistantIdx]));
        }
        refresh();
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Something went wrong.";
        setLimitError(msg);
        setMessages([...newMsgs, { role: "assistant", content: msg }]);
      }
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // ── File upload ────────────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isText = file.type.startsWith("text/") || file.name.endsWith(".txt") || file.name.endsWith(".pdf");
    if (isText) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        setAttachedFile({ name: file.name, content: content.slice(0, 4000) });
        setToast(`File attached: ${file.name}`);
      };
      reader.readAsText(file);
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        setAttachedFile({ name: file.name, content: dataUrl });
        setToast(`Image attached: ${file.name}`);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  // ── Video AI mode ──────────────────────────────────────────────────────────

  const handleVideoToggle = () => {
    setVideoMode((prev) => {
      const next = !prev;
      setToast(next ? "Video AI Mode ON — camera input coming soon." : "Video AI Mode OFF");
      return next;
    });
  };

  // ── Copy ──────────────────────────────────────────────────────────────────

  const copyText = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  // ── Voice input ───────────────────────────────────────────────────────────

  const handleMic = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      setToast("Voice input is not supported on this browser.");
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => prev ? `${prev} ${transcript}` : transcript);
    };
    recognition.onerror = () => {
      setListening(false);
      setToast("Microphone error. Please check browser permissions.");
    };
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [listening]);

  // ── Share message ─────────────────────────────────────────────────────────

  const handleShare = useCallback(async (text: string) => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "NVR AI Response", text });
        return;
      } catch { /* user cancelled */ }
    }
    await navigator.clipboard.writeText(text);
    setToast("Copied to clipboard (share not supported on this browser).");
  }, []);

  // ── Regenerate last assistant response ────────────────────────────────────

  const handleRegenerate = useCallback(async (msgIdx: number) => {
    const userMsgs = messages.slice(0, msgIdx);
    if (!userMsgs.length) return;
    setMoreMenuIdx(null);
    setLoading(true);
    setLimitError(null);
    try {
      const result: SendChatResult = await sendChat(userMsgs, "chat", assistantMode);
      setMessages((prev) => {
        const next = [...prev];
        next[msgIdx] = { role: "assistant", content: result.reply };
        return next;
      });
      if (result.webSearchUsed) {
        setWebSearchSet((prev) => new Set([...prev, msgIdx]));
      } else {
        setWebSearchSet((prev) => { const n = new Set(prev); n.delete(msgIdx); return n; });
      }
      refresh();
    } catch (e: unknown) {
      setLimitError(e instanceof Error ? e.message : "Something went wrong.");
    }
    setLoading(false);
  }, [messages, assistantMode, refresh]);

  // ── Text-to-speech ────────────────────────────────────────────────────────

  const handleSpeak = useCallback((text: string, idx: number) => {
    if (!window.speechSynthesis) {
      setToast("Text-to-speech is not supported on this browser.");
      return;
    }

    if (speakingIdx === idx) {
      window.speechSynthesis.cancel();
      setSpeakingIdx(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1;
    utter.onend = () => setSpeakingIdx(null);
    utter.onerror = () => setSpeakingIdx(null);
    setSpeakingIdx(idx);
    window.speechSynthesis.speak(utter);
  }, [speakingIdx]);

  // ── Sidebar handlers ──────────────────────────────────────────────────────

  const handleNewChat = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeakingIdx(null);
    setMessages([]);
    setLimitError(null);
    setInput("");
    setAttachedFile(null);
    setChatId(makeId());
  }, []);

  const handleLoadChat = useCallback((chat: RecentChat) => {
    window.speechSynthesis?.cancel();
    setSpeakingIdx(null);
    setMessages(chat.messages as ChatMessage[]);
    setLimitError(null);
    setInput("");
    setChatId(chat.id);
  }, []);

  const handleDeleteChat = useCallback((id: string) => {
    setRecentChats((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      saveRecentChats(updated);
      return updated;
    });
    if (id === chatId) handleNewChat();
  }, [chatId, handleNewChat]);

  // ── Derived values ────────────────────────────────────────────────────────

  const chatsLeft = usage ? Math.max(0, usage.chatLimit - usage.chatCount) : null;
  const imagesLeft = usage ? Math.max(0, usage.imageLimit - usage.imageCount) : null;

  const bg = isDark ? "bg-[#0b0f14]" : "bg-[#f7f7f8]";
  const aiBubble = isDark ? "bg-[#141920] border border-[#1e2632] text-gray-100" : "bg-white border border-gray-200 text-gray-800 shadow-sm";
  const iconBtn = isDark ? "text-gray-500 hover:text-gray-300 hover:bg-white/5" : "text-gray-400 hover:text-gray-700 hover:bg-gray-50";

  return (
    <>
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <ChatSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        recentChats={recentChats}
        onNewChat={handleNewChat}
        onLoadChat={handleLoadChat}
        onDeleteChat={handleDeleteChat}
        onShowUpgrade={() => setShowUpgrade(true)}
        onImageMode={() => { setImageMode(true); setToast("Image generation mode ON — describe your image."); }}
      />

    <div className={`flex flex-col h-screen pt-14 ${bg}`}>
      {/* ── Cooldown banner ───────────────────────────────────────────────── */}
      {usage?.isCoolingDown && (
        <div className={`px-4 py-2 flex items-center gap-2 border-b text-sm ${isDark ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-amber-50 border-amber-200 text-amber-700"}`}>
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span>Cooldown active — resumes in {fmtTime(Math.max(0, usage.cooldownUntil - Date.now()))}</span>
        </div>
      )}

      {/* ── Messages ──────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 scrollbar-thin">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center select-none">
            {/* NVR AI graphic */}
            <div className="relative">
              <div className={`w-[72px] h-[72px] rounded-[22px] flex items-center justify-center ${isDark ? "bg-[#0f1720]" : "bg-white"}`}
                style={{ boxShadow: isDark ? "0 0 0 1px rgba(6,182,212,0.2), 0 8px 32px rgba(6,182,212,0.12)" : "0 0 0 1px rgba(6,182,212,0.15), 0 8px 32px rgba(6,182,212,0.08)" }}
              >
                <Zap className="w-9 h-9 text-cyan-400" style={{ filter: "drop-shadow(0 0 8px rgba(6,182,212,0.6))" }} />
              </div>
              {/* Orbit ring */}
              <div className="absolute inset-[-10px] rounded-full border border-cyan-400/15 animate-spin" style={{ animationDuration: "8s" }} />
              <div className="absolute inset-[-20px] rounded-full border border-cyan-400/8 animate-spin" style={{ animationDuration: "14s", animationDirection: "reverse" }} />
              {/* Dots */}
              <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 w-1.5 h-1.5 bg-cyan-400 rounded-full opacity-60" />
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-3 w-1 h-1 bg-cyan-400 rounded-full opacity-40" />
            </div>

            {/* Title only */}
            <p className={`text-xl font-semibold tracking-tight ${isDark ? "text-gray-100" : "text-gray-800"}`}>
              How can I help you today?
            </p>
          </div>
        )}

        <div className="max-w-3xl mx-auto space-y-5">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-cyan-500 flex-shrink-0 flex items-center justify-center mt-0.5">
                  <Zap className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <div className={`group flex flex-col gap-1 max-w-[82%] ${m.role === "user" ? "items-end" : "items-start"}`}>
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${m.role === "user" ? "bg-cyan-500 text-white rounded-br-sm" : `${aiBubble} rounded-bl-sm`}`}>
                  {m.content.startsWith("__IMAGE__") ? (
                    <img src={m.content.replace("__IMAGE__", "")} alt="Generated" className="rounded-xl max-w-xs w-full" />
                  ) : (
                    <pre className="whitespace-pre-wrap font-sans">{m.content}</pre>
                  )}
                </div>
                {m.role === "assistant" && webSearchSet.has(i) && (
                  <div className="flex items-center gap-1.5 mt-0.5 px-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                      <Globe className="w-2.5 h-2.5" />
                      Live Data
                    </span>
                  </div>
                )}
                {m.role === "assistant" && !m.content.startsWith("__IMAGE__") && (
                  <div className="relative flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">

                    {/* Copy */}
                    <button onClick={() => copyText(m.content, i)} title="Copy" className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${copiedIdx === i ? "text-cyan-400" : iconBtn}`}>
                      {copiedIdx === i ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>

                    {/* Like */}
                    <button
                      onClick={() => {
                        setLikedSet((s) => { const n = new Set(s); n.has(i) ? n.delete(i) : (n.add(i), setDislikedSet((d) => { const nd = new Set(d); nd.delete(i); return nd; })); return n; });
                      }}
                      title="Good response"
                      className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${likedSet.has(i) ? "text-green-400" : iconBtn}`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>

                    {/* Dislike */}
                    <button
                      onClick={() => {
                        setDislikedSet((s) => { const n = new Set(s); n.has(i) ? n.delete(i) : (n.add(i), setLikedSet((l) => { const nl = new Set(l); nl.delete(i); return nl; })); return n; });
                      }}
                      title="Bad response"
                      className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${dislikedSet.has(i) ? "text-red-400" : iconBtn}`}
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>

                    {/* Read aloud */}
                    <button onClick={() => handleSpeak(m.content, i)} title={speakingIdx === i ? "Stop" : "Read aloud"} className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${speakingIdx === i ? "text-cyan-400" : iconBtn}`}>
                      {speakingIdx === i ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>

                    {/* Share */}
                    <button onClick={() => handleShare(m.content)} title="Share" className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${iconBtn}`}>
                      <Share2 className="w-3.5 h-3.5" />
                    </button>

                    {/* More */}
                    <div className="relative">
                      <button onClick={() => setMoreMenuIdx(moreMenuIdx === i ? null : i)} title="More options" className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${moreMenuIdx === i ? "text-cyan-400" : iconBtn}`}>
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                      {moreMenuIdx === i && (
                        <>
                          <div className="fixed inset-0 z-30" onClick={() => setMoreMenuIdx(null)} />
                          <div className={`absolute bottom-8 left-0 z-40 w-44 rounded-xl border shadow-xl overflow-hidden text-sm ${isDark ? "bg-[#161c28] border-[#1e2632]" : "bg-white border-gray-200"}`}
                            style={{ animation: "slideUpFade 0.14s ease-out" }}
                          >
                            <button onClick={() => handleRegenerate(i)} className={`w-full flex items-center gap-2.5 px-3 py-2.5 transition-all text-left ${isDark ? "hover:bg-white/5 text-gray-200" : "hover:bg-gray-50 text-gray-800"}`}>
                              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" /> Regenerate
                            </button>
                            <button onClick={() => { navigator.clipboard.writeText(m.content); setMoreMenuIdx(null); setToast("Saved to clipboard."); }} className={`w-full flex items-center gap-2.5 px-3 py-2.5 transition-all text-left ${isDark ? "hover:bg-white/5 text-gray-200" : "hover:bg-gray-50 text-gray-800"}`}>
                              <Bookmark className="w-3.5 h-3.5 text-blue-400" /> Save
                            </button>
                            <button onClick={() => { setMoreMenuIdx(null); setToast("Response reported. Thank you for your feedback."); }} className={`w-full flex items-center gap-2.5 px-3 py-2.5 transition-all text-left ${isDark ? "hover:bg-white/5 text-gray-200" : "hover:bg-gray-50 text-gray-800"}`}>
                              <Flag className="w-3.5 h-3.5 text-red-400" /> Report
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {m.role === "user" && (
                <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 text-xs font-bold ${isDark ? "bg-[#2a2a2a] text-gray-400" : "bg-gray-100 text-gray-500"}`}>
                  U
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-cyan-500 flex-shrink-0 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <div className={`px-4 py-3 rounded-2xl rounded-bl-sm border ${isDark ? "bg-[#1e1e1e] border-[#333]" : "bg-white border-gray-200 shadow-sm"}`}>
                <div className="flex gap-1">
                  {[0, 150, 300].map((d) => (
                    <span key={d} className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Input area ────────────────────────────────────────────────────── */}
      <div className={`px-4 sm:px-6 pb-6 pt-3 ${isDark ? "bg-[#0b0f14]" : "bg-[#f7f7f8]"}`}>
        <div className="max-w-[820px] mx-auto">

          {/* Hidden file inputs */}
          <input ref={fileInputRef} type="file" accept="image/*,.pdf,.txt" className="hidden" onChange={handleFileChange} />
          <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

          {/* Error bar */}
          {limitError && (
            <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-2xl text-xs border ${isDark ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-red-50 border-red-200 text-red-600"}`}>
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="flex-1">{limitError}</span>
              {(limitError.includes("upgrade") || limitError.includes("limit")) && (
                <button onClick={() => setShowUpgrade(true)} className="text-cyan-500 font-semibold ml-1 whitespace-nowrap">Upgrade →</button>
              )}
            </div>
          )}

          {/* Pills: attached file + video mode + web search */}
          {(attachedFile || videoMode || webSearch || voiceConvMode) && (
            <div className="flex flex-wrap gap-2 mb-3">
              {attachedFile && (
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${isDark ? "bg-[#1a2a1a] border-green-500/25 text-green-400" : "bg-green-50 border-green-200 text-green-700"}`}>
                  <Paperclip className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="max-w-[180px] truncate">{attachedFile.name}</span>
                  <button onClick={() => setAttachedFile(null)} className="ml-0.5 hover:opacity-70"><X className="w-3 h-3" /></button>
                </div>
              )}
              {webSearch && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold bg-blue-500/10 border-blue-500/25 text-blue-400">
                  <Globe className="w-3.5 h-3.5" /> Web Search ON
                  <button onClick={() => setWebSearch(false)} className="ml-0.5 hover:opacity-70"><X className="w-3 h-3" /></button>
                </div>
              )}
              {videoMode && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold bg-purple-500/10 border-purple-500/25 text-purple-400">
                  <Video className="w-3.5 h-3.5" /> Video AI Mode
                  <button onClick={() => setVideoMode(false)} className="ml-0.5 hover:opacity-70"><X className="w-3 h-3" /></button>
                </div>
              )}
              {voiceConvMode && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold bg-cyan-500/10 border-cyan-500/25 text-cyan-400">
                  <AudioLines className="w-3.5 h-3.5 animate-pulse" /> Voice Conversation ON
                  <button onClick={() => setVoiceConvMode(false)} className="ml-0.5 hover:opacity-70"><X className="w-3 h-3" /></button>
                </div>
              )}
            </div>
          )}

          {/* ── Assistant mode pills ─────────────────────────────────── */}
          {(() => {
            const modes = [
              { id: "normal",        label: "Normal Chat",    icon: Zap },
              { id: "coding",        label: "Coding Help",    icon: Code2 },
              { id: "business",      label: "Business Help",  icon: ChevronRight },
              { id: "promptBuilder", label: "Prompt Builder", icon: Sparkles },
              { id: "imageLogo",     label: "Image / Logo",   icon: Palette },
              { id: "agentPlanning", label: "Agent Planning", icon: Wrench },
            ];
            return (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none" style={{ scrollbarWidth: "none" }}>
                {modes.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setAssistantMode(id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 border ${
                      assistantMode === id
                        ? "bg-cyan-500 border-cyan-500 text-black shadow-sm"
                        : isDark
                        ? "border-[#1e2632] text-[#5a7090] hover:border-[#2a3545] hover:text-gray-300 bg-transparent"
                        : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 bg-transparent"
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    {label}
                  </button>
                ))}
              </div>
            );
          })()}

          {/* ── Add to NVR Chat — floating glass card ────────────────── */}
          {showAddSheet && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowAddSheet(false)} />
              <div
                className={`relative z-40 mb-4 rounded-[24px] border overflow-hidden ${isDark ? "bg-[#0d1117]/95 border-[#1e2632]" : "bg-white/96 border-gray-200"}`}
                style={{
                  boxShadow: isDark ? "0 16px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(6,182,212,0.06)" : "0 16px 60px rgba(0,0,0,0.14)",
                  backdropFilter: "blur(24px)",
                  animation: "slideUpFade 0.18s ease-out",
                }}
              >
                {/* Header */}
                <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? "border-[#1a2230]" : "border-gray-100"}`}>
                  <div>
                    <p className={`text-[13px] font-bold tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>Add to NVR Chat</p>
                    <p className={`text-[11px] mt-0.5 ${isDark ? "text-[#4a6070]" : "text-gray-400"}`}>Attach files, enable tools, or start a mode</p>
                  </div>
                  <button
                    onClick={() => setShowAddSheet(false)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${isDark ? "bg-[#1a2230] text-[#5a7090] hover:text-white" : "bg-gray-100 text-gray-400 hover:text-gray-700"}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Tool grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5">
                  {[
                    {
                      icon: Camera,
                      label: "Camera",
                      sub: "Take a photo",
                      accent: "text-orange-400",
                      bg: isDark ? "bg-orange-500/8" : "bg-orange-50",
                      border: isDark ? "border-orange-500/15" : "border-orange-100",
                      action: () => { setShowAddSheet(false); setToast("Camera access coming soon."); },
                    },
                    {
                      icon: ImageIcon,
                      label: "Photos",
                      sub: "Upload an image",
                      accent: "text-pink-400",
                      bg: isDark ? "bg-pink-500/8" : "bg-pink-50",
                      border: isDark ? "border-pink-500/15" : "border-pink-100",
                      action: () => { setShowAddSheet(false); photoInputRef.current?.click(); },
                    },
                    {
                      icon: Paperclip,
                      label: "Files",
                      sub: "PDF, TXT, code",
                      accent: "text-cyan-400",
                      bg: isDark ? "bg-cyan-500/8" : "bg-cyan-50",
                      border: isDark ? "border-cyan-500/15" : "border-cyan-100",
                      action: () => { setShowAddSheet(false); fileInputRef.current?.click(); },
                    },
                    {
                      icon: Globe,
                      label: "Web Search",
                      sub: webSearch ? "Enabled" : "Off — tap to enable",
                      accent: webSearch ? "text-blue-400" : isDark ? "text-gray-400" : "text-gray-500",
                      bg: webSearch ? (isDark ? "bg-blue-500/12" : "bg-blue-50") : isDark ? "bg-[#141a22]" : "bg-gray-50",
                      border: webSearch ? (isDark ? "border-blue-500/25" : "border-blue-200") : isDark ? "border-[#1e2632]" : "border-gray-200",
                      action: () => { setWebSearch(!webSearch); setShowAddSheet(false); },
                      badge: webSearch ? "ON" : null,
                    },
                    {
                      icon: Sparkles,
                      label: "Image Gen",
                      sub: "Create AI images",
                      accent: "text-purple-400",
                      bg: isDark ? "bg-purple-500/8" : "bg-purple-50",
                      border: isDark ? "border-purple-500/15" : "border-purple-100",
                      action: () => { setShowAddSheet(false); setImageMode(true); setToast("Image generation mode ON — describe your image."); },
                    },
                    {
                      icon: FileText,
                      label: "PDF / Doc",
                      sub: "Analyze documents",
                      accent: "text-amber-400",
                      bg: isDark ? "bg-amber-500/8" : "bg-amber-50",
                      border: isDark ? "border-amber-500/15" : "border-amber-100",
                      action: () => { setShowAddSheet(false); fileInputRef.current?.click(); },
                    },
                    {
                      icon: Code2,
                      label: "Code Tools",
                      sub: "Debug & review",
                      accent: "text-green-400",
                      bg: isDark ? "bg-green-500/8" : "bg-green-50",
                      border: isDark ? "border-green-500/15" : "border-green-100",
                      action: () => { setShowAddSheet(false); setToast("Code tools coming soon."); },
                    },
                    {
                      icon: Settings,
                      label: "Voice Settings",
                      sub: "Conversation mode",
                      accent: "text-indigo-400",
                      bg: isDark ? "bg-indigo-500/8" : "bg-indigo-50",
                      border: isDark ? "border-indigo-500/15" : "border-indigo-100",
                      action: () => { setShowAddSheet(false); setVoiceConvMode(!voiceConvMode); setToast(voiceConvMode ? "Voice mode OFF." : "Voice conversation mode ON."); },
                    },
                  ].map(({ icon: Icon, label, sub, accent, bg, border, action, badge }) => (
                    <button
                      key={label}
                      onClick={action}
                      className={`group relative flex flex-col items-start gap-3 p-4 rounded-2xl border transition-all text-left hover:scale-[1.02] active:scale-[0.98] ${bg} ${border}`}
                    >
                      {badge && (
                        <span className="absolute top-3 right-3 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500 text-white">{badge}</span>
                      )}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? "bg-[#0d1117]" : "bg-white"} shadow-sm border ${isDark ? "border-[#1e2632]" : "border-gray-100"}`}>
                        <Icon className={`w-[18px] h-[18px] ${accent}`} />
                      </div>
                      <div>
                        <p className={`text-[13px] font-semibold leading-tight ${isDark ? "text-gray-100" : "text-gray-800"}`}>{label}</p>
                        <p className={`text-[11px] mt-0.5 leading-tight ${isDark ? "text-gray-500" : "text-gray-400"}`}>{sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── Premium input card ───────────────────────────────────── */}
          <div
            className={`rounded-[28px] border transition-all ${
              isDark ? "bg-[#131820] border-[#1e2632]" : "bg-white border-gray-200"
            }`}
            style={{
              boxShadow: isDark
                ? "0 2px 24px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.02) inset"
                : "0 2px 20px rgba(0,0,0,0.07), 0 1px 0 rgba(255,255,255,1) inset",
            }}
          >
            {/* Textarea */}
            <div className="px-5 pt-5 pb-1">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  listening ? "Listening…"
                  : voiceConvMode ? "Speak now…"
                  : imageMode ? "Describe an image…"
                  : "Chat with NVR AI"
                }
                rows={1}
                className={`w-full bg-transparent resize-none outline-none text-[15px] leading-relaxed font-[inherit] ${
                  isDark ? "text-white placeholder:text-[#3a4a5e]" : "text-gray-900 placeholder:text-gray-400"
                } ${listening || voiceConvMode ? "placeholder:text-cyan-400" : ""}`}
                style={{ minHeight: "26px", maxHeight: "180px" }}
              />
            </div>

            {/* Divider */}
            <div className={`mx-4 h-px mt-3 ${isDark ? "bg-[#1a2230]" : "bg-gray-100"}`} />

            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3">
              {/* LEFT — + */}
              <button
                onClick={() => setShowAddSheet(!showAddSheet)}
                title="Add to chat"
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                  showAddSheet
                    ? "bg-cyan-500 text-black shadow-md"
                    : isDark
                    ? "bg-[#1a2230] text-[#5a7090] hover:bg-[#1e2a3a] hover:text-gray-200"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-800"
                }`}
              >
                <Plus className="w-[17px] h-[17px]" strokeWidth={2.5} />
              </button>

              {/* RIGHT — mic + voice + send */}
              <div className="flex items-center gap-2">
                {/* Mic */}
                <button
                  onClick={handleMic}
                  title={listening ? "Stop" : "Voice input"}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    listening
                      ? "bg-cyan-500/15 text-cyan-400"
                      : isDark
                      ? "text-[#4a6070] hover:text-gray-300 hover:bg-white/5"
                      : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {listening
                    ? <span className="flex items-end gap-[2px] h-[18px] w-[18px]">
                        {[1,2,3,4].map((i) => (
                          <span key={i} className="bg-cyan-400 rounded-full w-[3px] animate-bounce" style={{ height: `${5+i*3}px`, animationDelay: `${i*0.1}s`, animationDuration: "0.6s" }} />
                        ))}
                      </span>
                    : <Mic className="w-[18px] h-[18px]" />
                  }
                </button>

                {/* Voice-wave (black circle) */}
                <button
                  onClick={() => { setVoiceConvMode(!voiceConvMode); if (!voiceConvMode) { handleMic(); setToast("Voice conversation ON."); } else setToast("Voice conversation OFF."); }}
                  title={voiceConvMode ? "End voice" : "Voice conversation"}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    voiceConvMode
                      ? "bg-cyan-500 text-black shadow-md"
                      : isDark
                      ? "bg-[#0b0f14] text-gray-300 border border-[#2a3545] hover:border-[#3a4a5e]"
                      : "bg-gray-900 text-white hover:bg-black"
                  }`}
                >
                  <AudioLines className={`w-[16px] h-[16px] ${voiceConvMode ? "animate-pulse" : ""}`} />
                </button>

                {/* Send */}
                <button
                  onClick={handleSend}
                  disabled={(!input.trim() && !attachedFile) || loading}
                  title="Send"
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                    (input.trim() || attachedFile) && !loading
                      ? isDark ? "bg-white text-black hover:bg-gray-100 shadow-sm" : "bg-gray-900 text-white hover:bg-black shadow-sm"
                      : isDark ? "bg-[#1a2230] text-[#2a3a4a] cursor-not-allowed" : "bg-gray-100 text-gray-300 cursor-not-allowed"
                  }`}
                >
                  {loading
                    ? <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    : <ArrowUp className="w-[16px] h-[16px]" />
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Upgrade modal ─────────────────────────────────────────────────── */}
      {showUpgrade && (
        <UpgradeModal
          onClose={() => setShowUpgrade(false)}
          isDark={isDark}
          plan={usage?.plan ?? "free"}
          chatsLeft={chatsLeft}
          imagesLeft={imagesLeft}
          navigate={navigate}
        />
      )}

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && (
        <Toast message={toast} isDark={isDark} onDone={() => setToast(null)} />
      )}
    </div>
    </>
  );
}
