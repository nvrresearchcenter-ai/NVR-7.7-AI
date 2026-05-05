import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, Link } from "wouter";
import {
  Terminal, Rocket, Shield, RotateCcw, ChevronDown, Square,
  CheckCircle2, Loader2, AlertTriangle, FileCode, Folder,
  FolderOpen, ChevronRight, Mic, Paperclip, Lock, Plus,
  Eye, EyeOff, X, Maximize2, Minimize2, Zap, Bug,
  Scan, Server, FileSearch, Palette, ShieldCheck,
  ArrowUp, Monitor, Globe, ShoppingCart,
  List, AlertCircle, GitCommit, Play, Activity,
  Sun, Moon, Settings, Bot, Key,
  Code2, Copy, Save, ExternalLink, ClipboardCopy,
} from "lucide-react";
import {
  startAgentTask, pollAgentStatus, approveAgentTask, stopAgentTask,
  addSecret, getSecretKeys, runAgentScan, runAgentFix, runAgentDeploy,
  runAgentReview, runTerminalCommand, listAgentFiles,
  generateCode, saveGeneratedFile,
  type AgentStatus, type ScanResult, type FixResult, type ReviewReport,
} from "@/lib/api";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/authContext";
import { useUsage } from "@/lib/usageContext";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import ConnectDomainModal from "@/components/ConnectDomainModal";
import BuyDomainModal from "@/components/BuyDomainModal";

// ─── Types ────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySpeechRecognition = any;
type AgentModel = "nvr-7.7" | "nvr-8.8" | "nvr-9.9";
type AgentActivity = "idle" | "thinking" | "editing" | "building" | "deploying" | "error" | "complete";
interface FileNode { name: string; type: "file" | "folder"; ext?: string; path?: string; size?: number; children?: FileNode[]; }
interface ChatMsg { role: "user" | "assistant"; content: string; }

// ─── Model definitions ────────────────────────────────────────────────────────

const MODEL_INFO: Record<AgentModel, { label: string; desc: string; badge: string; badgeCls: string }> = {
  "nvr-7.7": {
    label: "NVR 7.7 Smart",
    desc:  "General Purpose — UI design, code generation & everyday build tasks",
    badge: "Smart",
    badgeCls: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  },
  "nvr-8.8": {
    label: "NVR 8.8 Agent",
    desc:  "Deep Diagnostics — static analysis, bug detection & intelligent auto-fix",
    badge: "Pro",
    badgeCls: "bg-cyan-500/15 text-cyan-400 border-cyan-500/25",
  },
  "nvr-9.9": {
    label: "NVR 9.9 Super",
    desc:  "Full Autonomy — live production deployments, server orchestration & CI/CD",
    badge: "Super",
    badgeCls: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  },
};

const QUICK_PROMPTS = [
  "Build a production-ready SaaS landing page",
  "Design a mobile-first dashboard UI",
  "Scan, diagnose & auto-fix all errors",
  "Deploy to production with zero downtime",
  "Create a premium UI design system",
  "Write a full business proposal",
] as const;

const CODEGEN_EXAMPLES = [
  { icon: "🔐", title: "Login Page",     desc: "Email/password + OAuth",           prompt: "A modern login page with email/password fields, Google OAuth button, and a branded split-screen layout" },
  { icon: "💳", title: "Pricing Card",   desc: "3 tiers with highlighted plan",     prompt: "A pricing card with Free, Pro, Enterprise tiers, feature lists, highlighted recommended tier, and CTA buttons" },
  { icon: "✨", title: "Animated Hero",  desc: "Gradient bg, animated headline",    prompt: "An animated hero section with gradient background, floating particles, headline text animation, and two CTA buttons" },
  { icon: "✅", title: "Todo List",      desc: "Add, complete, delete, filter",     prompt: "A full-featured todo list with add/complete/delete tasks, filter by status (all/active/done), and localStorage" },
  { icon: "📊", title: "Dashboard",      desc: "KPI cards, chart, data table",      prompt: "An analytics dashboard with 4 KPI metric cards, a line chart area, a data table with pagination, and a dark sidebar" },
  { icon: "💬", title: "Chat UI",        desc: "Bubbles, typing indicator, input",  prompt: "A ChatGPT-style chat interface with user/assistant message bubbles, typing indicator, and sticky bottom input bar" },
] as const;

const EXT_COLORS: Record<string, string> = {
  tsx: "text-blue-400", ts: "text-blue-400", jsx: "text-yellow-400",
  js: "text-yellow-400", html: "text-orange-400", css: "text-pink-400",
  json: "text-green-400", md: "text-gray-400", sh: "text-cyan-400", ico: "text-gray-400",
};

const DEMO_FILES: FileNode[] = [
  { name: "src", type: "folder", children: [
    { name: "App.tsx", type: "file", ext: "tsx" },
    { name: "pages", type: "folder", children: [
      { name: "Agent.tsx", type: "file", ext: "tsx" },
      { name: "Chat.tsx", type: "file", ext: "tsx" },
    ]},
    { name: "components", type: "folder", children: [
      { name: "Navbar.tsx", type: "file", ext: "tsx" },
    ]},
    { name: "lib", type: "folder", children: [
      { name: "api.ts", type: "file", ext: "ts" },
    ]},
  ]},
  { name: "package.json", type: "file", ext: "json" },
  { name: "vite.config.ts", type: "file", ext: "ts" },
];

// ─── File tree component ──────────────────────────────────────────────────────

function FileTree({ nodes, depth = 0, isDark, changedFiles }: {
  nodes: FileNode[];
  depth?: number;
  isDark: boolean;
  changedFiles?: Set<string>;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({ src: true, pages: true });
  return (
    <div>
      {nodes.map((node) => (
        <div key={node.path ?? node.name}>
          <div
            className={`flex items-center gap-1.5 py-0.5 rounded cursor-pointer text-xs transition-colors ${isDark ? "hover:bg-white/5 text-gray-400 hover:text-white" : "hover:bg-gray-100 text-gray-500 hover:text-gray-800"}`}
            style={{ paddingLeft: `${8 + depth * 12}px`, paddingRight: 8 }}
            onClick={() => node.type === "folder" && setOpen((o) => ({ ...o, [node.name]: !o[node.name] }))}
          >
            {node.type === "folder" ? (
              <>
                {open[node.name] ? <ChevronDown className="w-3 h-3 flex-shrink-0" /> : <ChevronRight className="w-3 h-3 flex-shrink-0" />}
                {open[node.name] ? <FolderOpen className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" /> : <Folder className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                <span className="font-medium truncate">{node.name}</span>
              </>
            ) : (
              <>
                <span className="w-3 flex-shrink-0" />
                <FileCode className={`w-3.5 h-3.5 flex-shrink-0 ${EXT_COLORS[node.ext ?? ""] ?? "text-gray-400"}`} />
                <span className="truncate flex-1">{node.name}</span>
                {changedFiles?.has(node.name) && (
                  <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-cyan-400 ml-1" title="Modified by agent" />
                )}
              </>
            )}
          </div>
          {node.type === "folder" && open[node.name] && node.children && (
            <FileTree nodes={node.children} depth={depth + 1} isDark={isDark} changedFiles={changedFiles} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Animated NVR Logo ────────────────────────────────────────────────────────

function AnimatedNvrLogo({ activity, size = 28 }: { activity: AgentActivity; size?: number }) {
  const glowMap: Record<AgentActivity, string> = {
    idle:      "shadow-[0_0_8px_rgba(6,182,212,0.35)]",
    thinking:  "shadow-[0_0_14px_rgba(6,182,212,0.6)]",
    editing:   "shadow-[0_0_16px_rgba(6,182,212,0.7)]",
    building:  "shadow-[0_0_18px_rgba(6,182,212,0.8)]",
    deploying: "shadow-[0_0_18px_rgba(34,197,94,0.8)]",
    error:     "shadow-[0_0_16px_rgba(239,68,68,0.8)]",
    complete:  "shadow-[0_0_16px_rgba(34,197,94,0.7)]",
  };
  const bgMap: Record<AgentActivity, string> = {
    idle:      "from-cyan-500 to-cyan-700",
    thinking:  "from-cyan-400 to-cyan-600",
    editing:   "from-cyan-400 to-blue-600",
    building:  "from-cyan-400 to-blue-500",
    deploying: "from-green-400 to-cyan-500",
    error:     "from-red-400 to-red-600",
    complete:  "from-green-400 to-green-600",
  };
  const animMap: Record<AgentActivity, string> = {
    idle:      "animate-[nvrIdle_3s_ease-in-out_infinite]",
    thinking:  "animate-[nvrPulse_1.4s_ease-in-out_infinite]",
    editing:   "animate-[nvrPulse_0.9s_ease-in-out_infinite]",
    building:  "animate-[nvrPulse_0.65s_ease-in-out_infinite]",
    deploying: "animate-[nvrPulse_0.7s_ease-in-out_infinite]",
    error:     "animate-[nvrError_1.2s_ease-in-out_infinite]",
    complete:  "animate-none",
  };
  return (
    <>
      <style>{`
        @keyframes nvrIdle { 0%,100%{opacity:0.7;transform:scale(1)} 50%{opacity:1;transform:scale(1.04)} }
        @keyframes nvrPulse { 0%,100%{opacity:0.85;transform:scale(1)} 50%{opacity:1;transform:scale(1.08)} }
        @keyframes nvrError { 0%,100%{opacity:0.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.05)} }
      `}</style>
      <div
        className={`rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0 ${bgMap[activity]} ${glowMap[activity]} ${animMap[activity]}`}
        style={{ width: size, height: size }}
      >
        <Zap className="text-white" style={{ width: size * 0.5, height: size * 0.5 }} />
      </div>
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Agent() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const { user } = useAuth();
  const { usage } = useUsage();
  const [, navigate] = useLocation();

  // Core agent state
  const [messages, setMessages]           = useState<ChatMsg[]>([]);
  const [input, setInput]                 = useState("");
  const [model, setModel]                 = useState<AgentModel>("nvr-8.8");
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [agentStatus, setAgentStatus]     = useState<AgentStatus | null>(null);
  const [isRunning, setIsRunning]         = useState(false);
  const [elapsed, setElapsed]             = useState(0);
  const [upgradeRequired, setUpgradeRequired] = useState(false);

  // Permission + secret modals
  const [permissionData, setPermissionData] = useState<{ taskId: string; reason: string } | null>(null);
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [secretKey, setSecretKey]     = useState("");
  const [secretValue, setSecretValue] = useState("");
  const [showSecretValue, setShowSecretValue] = useState(false);
  const [secretKeys, setSecretKeys]   = useState<string[]>([]);
  const [secretSaved, setSecretSaved] = useState(false);

  // Auto Agent Mode
  const [autoAgentMode, setAutoAgentMode] = useState(false);

  // Action results
  const [scanData, setScanData]           = useState<ScanResult | null>(null);
  const [fixData, setFixData]             = useState<FixResult | null>(null);
  const [reviewData, setReviewData]       = useState<ReviewReport | null>(null);
  const [actionLoading, setActionLoading] = useState<"scan" | "fix" | "deploy" | "review" | "terminal" | null>(null);
  const [actionError, setActionError]     = useState<string | null>(null);

  // Deploy confirm modal
  const [deployConfirm, setDeployConfirm] = useState<{ message: string } | null>(null);

  // Terminal
  const [terminalInput, setTerminalInput]     = useState("");
  const [terminalHistory, setTerminalHistory] = useState<{ cmd: string; out: string; blocked?: boolean }[]>([]);

  // Progress stage
  type ProgressStage = "idle" | "thinking" | "scanning" | "planning" | "fixing" | "testing" | "review" | "waiting" | "complete";
  const [progressStage, setProgressStage] = useState<ProgressStage>("idle");

  // Domain modals
  const [showConnectDomain, setShowConnectDomain] = useState(false);
  const [showBuyDomain, setShowBuyDomain]         = useState(false);

  // Panel state
  const [terminalOpen, setTerminalOpen]         = useState(false);
  const [terminalMinimized, setTerminalMinimized] = useState(false);
  const [rightPanelOpen, setRightPanelOpen]     = useState(false);
  const [livePreviewOpen, setLivePreviewOpen]   = useState(false);
  const [previewKey, setPreviewKey]             = useState(0);
  const [settingsPanelTab, setSettingsPanelTab] = useState<"Domain" | "Secrets" | "Deploy" | "Stats">("Domain");
  const [rightDrawerTab, setRightDrawerTab]     = useState<"files" | "settings">("files");

  // Real file tree
  const [fileTree, setFileTree]               = useState<FileNode[]>([]);
  const [fileTreeLoading, setFileTreeLoading] = useState(false);
  const [changedFiles, setChangedFiles]       = useState<Set<string>>(new Set());

  // Mic
  const [listening, setListening] = useState(false);
  const recognitionRef            = useRef<AnySpeechRecognition>(null);

  // File attachment
  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string } | null>(null);
  const fileInputRef                    = useRef<HTMLInputElement>(null);

  const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Code Generator state ──────────────────────────────────────────────────
  const [agentMode, setAgentMode]     = useState<"agent" | "codegen">("agent");
  const [cgOutput, setCgOutput]       = useState("");
  const [cgGenerating, setCgGenerating] = useState(false);
  const [cgCopied, setCgCopied]       = useState(false);
  const [cgSaved, setCgSaved]         = useState(false);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isRunning]);
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 140) + "px";
    }
  }, [input]);
  useEffect(() => { getSecretKeys().then(setSecretKeys).catch(() => {}); }, []);

  // ── Derived agent activity state ──────────────────────────────────────────

  const agentActivity: AgentActivity = (() => {
    if (actionError) return "error";
    if (actionLoading === "deploy" || progressStage === "thinking" && isRunning) return "deploying";
    if (actionLoading === "terminal") return "building";
    if (isRunning) {
      if (progressStage === "scanning" || progressStage === "planning") return "thinking";
      if (progressStage === "fixing") return "editing";
      if (progressStage === "testing") return "building";
      return "thinking";
    }
    if (agentStatus?.status === "completed") return "complete";
    return "idle";
  })();

  const activityLabel: Record<AgentActivity, string> = {
    idle: "Idle",
    thinking: "Thinking",
    editing: "Editing",
    building: "Building",
    deploying: "Deploying",
    error: "Error",
    complete: "Complete",
  };

  const activityColor: Record<AgentActivity, string> = {
    idle: "text-gray-500",
    thinking: "text-cyan-400",
    editing: "text-blue-400",
    building: "text-cyan-400",
    deploying: "text-green-400",
    error: "text-red-400",
    complete: "text-green-400",
  };

  // ── File tree ─────────────────────────────────────────────────────────────

  const loadFileTree = useCallback(async () => {
    setFileTreeLoading(true);
    try {
      const data = await listAgentFiles();
      if (data.tree?.length > 0) setFileTree(data.tree as unknown as FileNode[]);
    } catch { /* keep demo fallback */ }
    finally { setFileTreeLoading(false); }
  }, []);
  useEffect(() => { void loadFileTree(); }, [loadFileTree]);

  // ── Polling ───────────────────────────────────────────────────────────────

  const stopPolling = useCallback(() => {
    if (pollRef.current)  { clearInterval(pollRef.current);  pollRef.current  = null; }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const startPolling = useCallback((taskId: string) => {
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    pollRef.current  = setInterval(async () => {
      try {
        const status = await pollAgentStatus(taskId);
        setAgentStatus(status);
        if (status.status === "waiting_permission" && status.requiresPermission) {
          setPermissionData({ taskId, reason: status.requiresPermission });
        }
        if (status.status === "completed" || status.status === "stopped") {
          stopPolling(); setIsRunning(false); setProgressStage("complete");
          if (status.result) setMessages((prev) => [...prev, { role: "assistant", content: status.result }]);
          if (status.filesChanged?.length) {
            setChangedFiles((prev) => { const n = new Set(prev); status.filesChanged.forEach((f) => n.add(f)); return n; });
            listAgentFiles().then((d) => { if (d.tree?.length) setFileTree(d.tree as unknown as FileNode[]); }).catch(() => {});
          }
        }
      } catch { stopPolling(); setIsRunning(false); }
    }, 1200);
  }, [stopPolling]);

  // ── Send ──────────────────────────────────────────────────────────────────

  const handleSend = async (text?: string) => {
    let msg = (text ?? input).trim();
    if (!msg && !attachedFile) return;
    if (isRunning) return;

    if (attachedFile) {
      msg = msg
        ? `${msg}\n\n[Attached file: ${attachedFile.name}]\n${attachedFile.content.startsWith("data:") ? "[binary file]" : attachedFile.content.slice(0, 3000)}`
        : `[Attached file: ${attachedFile.name}]\n${attachedFile.content.startsWith("data:") ? "[binary file]" : attachedFile.content.slice(0, 3000)}`;
      setAttachedFile(null);
    }

    setInput(""); setUpgradeRequired(false); setProgressStage("thinking");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);

    const backendModel = model === "nvr-9.9" ? "nvr-9.9" : "nvr-8.8";

    try {
      const result = await startAgentTask(msg, backendModel);
      setCurrentTaskId(result.taskId); setAgentStatus(null); setIsRunning(true);
      if (result.status === "waiting_permission" && result.requiresPermission) {
        setPermissionData({ taskId: result.taskId, reason: result.requiresPermission });
        setIsRunning(false);
      } else {
        startPolling(result.taskId);
      }
    } catch (e: unknown) {
      const err = e as Error & { upgradeRequired?: boolean };
      setProgressStage("idle");
      if (err.upgradeRequired) {
        setUpgradeRequired(true);
        setMessages((prev) => [...prev, { role: "assistant", content: "⚠️ Agent Mode requires NVR 8.8 Agent or NVR 9.9 Super Agent plan. Please upgrade to unlock full agent power." }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: err.message || "Agent backend is being connected. Please try again shortly." }]);
      }
      setIsRunning(false);
    }
  };

  const handleStop = async () => {
    if (currentTaskId) await stopAgentTask(currentTaskId);
    stopPolling(); setIsRunning(false); setProgressStage("idle");
    setMessages((prev) => [...prev, { role: "assistant", content: "Agent stopped. Ready for the next task." }]);
  };

  const handlePermissionAllow = async () => {
    if (!permissionData) return;
    const { taskId } = permissionData;
    setPermissionData(null); setIsRunning(true);
    await approveAgentTask(taskId, true);
    startPolling(taskId);
  };

  const handlePermissionDeny = async () => {
    if (!permissionData) return;
    await approveAgentTask(permissionData.taskId, false);
    setPermissionData(null);
    setMessages((prev) => [...prev, { role: "assistant", content: "Action cancelled. No changes were made." }]);
  };

  const handleSaveSecret = async () => {
    if (!secretKey.trim() || !secretValue.trim()) return;
    try {
      await addSecret(secretKey.trim(), secretValue.trim());
      const keys = await getSecretKeys();
      setSecretKeys(keys); setSecretKey(""); setSecretValue(""); setSecretSaved(true);
      setTimeout(() => setSecretSaved(false), 3000);
    } catch { /* ignore */ }
  };

  // ── Action helpers ────────────────────────────────────────────────────────

  const pollAction = useCallback((taskId: string, onDone: (result: string) => void) => {
    const iv = setInterval(async () => {
      try {
        const st = await pollAgentStatus(taskId);
        if (st.status === "completed" || st.status === "stopped") {
          clearInterval(iv);
          setActionLoading(null);
          onDone(st.result);
        }
      } catch { clearInterval(iv); setActionLoading(null); }
    }, 1200);
  }, []);

  const handleBuild = async () => {
    setTerminalOpen(true); setTerminalMinimized(false);
    setActionLoading("terminal"); setActionError(null);
    const cmd = "pnpm run build";
    try {
      const r = await runTerminalCommand(cmd);
      setTerminalHistory((prev) => [...prev, { cmd, out: r.output, blocked: r.blocked }]);
    } catch (e: unknown) {
      const err = e as Error;
      setActionError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleScan = async () => {
    setActionLoading("scan"); setActionError(null); setScanData(null);
    setProgressStage("scanning");
    try {
      const r = await runAgentScan("NVR AI full-stack React+TypeScript+Express app");
      pollAction(r.taskId, (result) => {
        setProgressStage("complete");
        try {
          const parsed = JSON.parse(result) as { type: string; data: ScanResult };
          if (parsed.type === "scan") setScanData(parsed.data);
          else setActionError("Scan returned unexpected data.");
        } catch { setActionError("Failed to parse scan results."); }
      });
    } catch (e: unknown) {
      const err = e as Error & { upgradeRequired?: boolean };
      setActionLoading(null); setProgressStage("idle");
      setActionError(err.upgradeRequired ? "Upgrade to Agent plan to use project scan." : err.message);
    }
  };

  const handleFix = async () => {
    setActionLoading("fix"); setActionError(null); setFixData(null);
    setProgressStage("fixing");
    const issues = scanData?.issues.map((i) => `${i.file}: ${i.message}`) ?? [];
    try {
      const r = await runAgentFix(issues, "NVR AI React+TypeScript+Express project");
      pollAction(r.taskId, (result) => {
        setProgressStage("testing");
        setTimeout(() => setProgressStage("complete"), 1000);
        try {
          const parsed = JSON.parse(result) as { type: string; data: FixResult };
          if (parsed.type === "fix") setFixData(parsed.data);
          else setActionError("Fix returned unexpected data.");
        } catch { setActionError("Failed to parse fix results."); }
      });
    } catch (e: unknown) {
      const err = e as Error & { upgradeRequired?: boolean };
      setActionLoading(null); setProgressStage("idle");
      setActionError(err.upgradeRequired ? "Upgrade to Agent plan to use auto fix." : err.message);
    }
  };

  const handleDeploy = async (confirmed = false) => {
    if (!confirmed) {
      setActionLoading("deploy");
      try {
        const r = await runAgentDeploy(false);
        setActionLoading(null);
        if (r.requiresPermission && r.message) {
          setDeployConfirm({ message: r.message });
        }
      } catch (e: unknown) {
        const err = e as Error & { upgradeRequired?: boolean };
        setActionLoading(null);
        setActionError(err.upgradeRequired ? "Live Deploy requires NVR 9.9 Super Agent plan." : err.message);
      }
      return;
    }
    setDeployConfirm(null);
    setActionLoading("deploy"); setProgressStage("thinking");
    setTerminalOpen(true); setTerminalMinimized(false);
    try {
      const r = await runAgentDeploy(true);
      if (r.taskId) {
        pollAction(r.taskId, (result) => {
          setProgressStage("complete");
          setMessages((prev) => [...prev, { role: "assistant", content: result }]);
        });
      } else {
        setActionLoading(null); setProgressStage("idle");
      }
    } catch (e: unknown) {
      const err = e as Error;
      setActionLoading(null); setProgressStage("idle");
      setActionError(err.message);
    }
  };

  const handleReview = async () => {
    setActionLoading("review"); setActionError(null); setReviewData(null);
    setProgressStage("review");
    const scanSummary = scanData ? `Found ${scanData.issues_found} issues, severity: ${scanData.severity}` : "";
    const fixSummary  = fixData  ? `Fixed ${fixData.changed_files.length} files, tests: ${fixData.test_result}` : "";
    try {
      const r = await runAgentReview("NVR AI React+TypeScript+Express project", scanSummary, fixSummary);
      pollAction(r.taskId, (result) => {
        setProgressStage("complete");
        try {
          const parsed = JSON.parse(result) as { type: string; data: ReviewReport };
          if (parsed.type === "review") setReviewData(parsed.data);
          else setActionError("Review returned unexpected data.");
        } catch { setActionError("Failed to parse review report."); }
      });
    } catch (e: unknown) {
      const err = e as Error & { upgradeRequired?: boolean };
      setActionLoading(null); setProgressStage("idle");
      setActionError(err.upgradeRequired ? "Upgrade to Agent plan to generate review reports." : err.message);
    }
  };

  const handleTerminalRun = async () => {
    const cmd = terminalInput.trim();
    if (!cmd) return;
    setTerminalInput(""); setTerminalOpen(true); setTerminalMinimized(false); setActionLoading("terminal");
    try {
      const r = await runTerminalCommand(cmd);
      setTerminalHistory((prev) => [...prev, { cmd, out: r.output, blocked: r.blocked }]);
    } catch (e: unknown) {
      const err = e as Error;
      setTerminalHistory((prev) => [...prev, { cmd, out: `Error: ${err.message}`, blocked: false }]);
    } finally {
      setActionLoading(null);
    }
  };

  // ── Code Generator ────────────────────────────────────────────────────────

  const handleCodeGen = async (prompt: string) => {
    if (!prompt.trim()) return;
    setInput("");
    setCgOutput("");
    setCgGenerating(true);
    setActionError(null);
    try {
      const result = await generateCode(prompt.trim());
      setCgOutput(result.code);
    } catch (e: unknown) {
      const err = e as Error;
      setActionError(err.message || "Code generation failed. Please try again.");
    } finally {
      setCgGenerating(false);
    }
  };

  // ── Mic ───────────────────────────────────────────────────────────────────

  const handleMic = useCallback(() => {
    const SR = (window as AnySpeechRecognition).SpeechRecognition || (window as AnySpeechRecognition).webkitSpeechRecognition;
    if (!SR) { alert("Voice input not supported on this browser."); return; }
    if (listening) { recognitionRef.current?.stop(); setListening(false); return; }
    const rec = new SR();
    rec.lang = "en-US"; rec.continuous = false; rec.interimResults = false;
    rec.onresult = (e: AnySpeechRecognition) => {
      const t = e.results[0]?.[0]?.transcript ?? "";
      if (t) setInput((prev) => prev ? `${prev} ${t}` : t);
    };
    rec.onerror = () => setListening(false);
    rec.onend   = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  }, [listening]);

  // ── File upload ───────────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isText = file.type.startsWith("text/") || ["txt","pdf","md","json","ts","tsx","js","jsx","py","sh","yaml","yml"].some((ext) => file.name.endsWith(`.${ext}`));
    const reader = new FileReader();
    reader.onload = (ev) => setAttachedFile({ name: file.name, content: ev.target?.result as string });
    if (isText) reader.readAsText(file); else reader.readAsDataURL(file);
    e.target.value = "";
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  const fmtTime    = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const currentStep = agentStatus?.steps.find((s) => s.status === "running")?.label;
  const recentChangedFiles = [...changedFiles].slice(-5);

  // ── Theme tokens ──────────────────────────────────────────────────────────

  const bg        = isDark ? "bg-[#0b0f14]"      : "bg-[#f0f2f5]";
  const panelBg   = isDark ? "bg-[#111518] border-[#1e2329]" : "bg-white border-gray-200";
  const cardBg    = isDark ? "bg-[#141920] border-[#1e2329]" : "bg-white border-gray-200 shadow-sm";
  const borderCol = isDark ? "border-[#1e2329]"  : "border-gray-200";
  const textMuted = isDark ? "text-gray-500"      : "text-gray-400";
  const textBase  = isDark ? "text-gray-300"      : "text-gray-700";
  const msgBg     = isDark ? "bg-[#141920] border border-[#1e2329] text-gray-100" : "bg-white border border-gray-200 text-gray-800 shadow-sm";
  const composerBg = isDark
    ? "bg-[#0c1018]/96 backdrop-blur-xl border-[#1c2535] shadow-[0_12px_40px_rgba(0,0,0,0.55)] focus-within:border-cyan-500/35 focus-within:shadow-[0_12px_48px_rgba(0,0,0,0.55),0_0_0_1px_rgba(6,182,212,0.10)]"
    : "bg-white/96 backdrop-blur-xl border-gray-200/80 shadow-[0_12px_40px_rgba(0,0,0,0.10)] focus-within:border-cyan-400/50 focus-within:shadow-[0_12px_48px_rgba(0,0,0,0.12),0_0_0_1px_rgba(6,182,212,0.12)]";

  // ── Clear session ─────────────────────────────────────────────────────────
  const clearSession = () => {
    setMessages([]); setAgentStatus(null); setCurrentTaskId(null);
    stopPolling(); setIsRunning(false); setElapsed(0);
    setUpgradeRequired(false); setScanData(null); setFixData(null);
    setReviewData(null); setActionError(null); setProgressStage("idle");
    setChangedFiles(new Set());
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={`flex flex-col h-screen ${bg}`}>
      <style>{`
        @keyframes drawerSlideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes termSlideUp { from { opacity: 0; transform: translateY(24px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes workPanelIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes previewIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>

      {/* ── Permission Modal ──────────────────────────────────────────────── */}
      {permissionData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${isDark ? "bg-[#141920] border-[#2a3040]" : "bg-white border-gray-200"}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Permission Required</h3>
                <p className={`text-xs ${textMuted}`}>NVR Agent needs your approval to proceed</p>
              </div>
            </div>
            <div className={`text-xs px-3 py-2.5 rounded-xl mb-4 font-mono leading-relaxed ${isDark ? "bg-[#0b0f14] text-amber-300 border border-amber-500/20" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
              {permissionData.reason}
            </div>
            <p className={`text-xs mb-5 ${textMuted}`}>This may involve: deploy, delete, payment, database, server, or secret changes.</p>
            <div className="flex gap-3">
              <button onClick={handlePermissionDeny} className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${isDark ? "border-[#2a3040] text-gray-300 hover:bg-white/5" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>Cancel</button>
              <button onClick={handlePermissionAllow} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-cyan-500 hover:bg-cyan-400 text-black transition-all">Allow &amp; Continue</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Deploy Confirm Modal ──────────────────────────────────────────── */}
      {deployConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${isDark ? "bg-[#141920] border-[#2a3040]" : "bg-white border-gray-200"}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 flex items-center justify-center flex-shrink-0">
                <Rocket className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Deploy to Production</h3>
                <p className={`text-xs ${textMuted}`}>NVR 9.9 Super Agent — Live Deploy</p>
              </div>
            </div>
            <div className={`text-sm px-3 py-3 rounded-xl mb-4 leading-relaxed ${isDark ? "bg-[#0b0f14] text-gray-300 border border-cyan-500/20" : "bg-cyan-50 text-gray-700 border border-cyan-200"}`}>
              {deployConfirm.message}
            </div>
            <p className={`text-xs mb-5 ${textMuted}`}>This action will push your latest build to the live server.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeployConfirm(null)} className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${isDark ? "border-[#2a3040] text-gray-300 hover:bg-white/5" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>Cancel</button>
              <button onClick={() => handleDeploy(true)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-cyan-500 hover:bg-cyan-400 text-black transition-all flex items-center justify-center gap-2">
                <Rocket className="w-4 h-4" /> Deploy Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Secret Modal ──────────────────────────────────────────────────── */}
      {showSecretModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className={`w-full max-w-sm rounded-2xl border p-6 shadow-2xl ${isDark ? "bg-[#141920] border-[#2a3040]" : "bg-white border-gray-200"}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-cyan-400" />
                <h3 className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Add Secret</h3>
              </div>
              <button onClick={() => setShowSecretModal(false)} className={textMuted}><X className="w-4 h-4" /></button>
            </div>
            <p className={`text-xs mb-4 ${textMuted}`}>Secrets are stored securely. Never paste keys directly into the chat.</p>
            {secretSaved && (
              <div className="mb-3 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5" /> Secret saved securely.
              </div>
            )}
            {secretKeys.length > 0 && (
              <div className="mb-3">
                <p className={`text-xs mb-1.5 ${textMuted}`}>Stored keys:</p>
                <div className="flex flex-wrap gap-1.5">
                  {secretKeys.map((k) => (
                    <span key={k} className={`text-xs px-2 py-0.5 rounded font-mono ${isDark ? "bg-[#1e2329] text-gray-400" : "bg-gray-100 text-gray-600"}`}>{k}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-2.5">
              <input value={secretKey} onChange={(e) => setSecretKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_"))} placeholder="SECRET_KEY_NAME"
                className={`w-full px-3 py-2.5 rounded-xl border text-sm font-mono outline-none transition-all ${isDark ? "bg-[#0b0f14] border-[#2a3040] text-white placeholder:text-gray-600 focus:border-cyan-500/60" : "bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-400"}`} />
              <div className="relative">
                <input type={showSecretValue ? "text" : "password"} value={secretValue} onChange={(e) => setSecretValue(e.target.value)} placeholder="Secret value"
                  className={`w-full px-3 py-2.5 pr-10 rounded-xl border text-sm outline-none transition-all ${isDark ? "bg-[#0b0f14] border-[#2a3040] text-white placeholder:text-gray-600 focus:border-cyan-500/60" : "bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-400"}`} />
                <button type="button" onClick={() => setShowSecretValue(!showSecretValue)} className={`absolute right-3 top-1/2 -translate-y-1/2 ${textMuted}`}>
                  {showSecretValue ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <button onClick={handleSaveSecret} className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-sm transition-all">Save Secret Securely</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Live Preview Overlay ──────────────────────────────────────────── */}
      {livePreviewOpen && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ animation: "previewIn 0.18s ease" }}>
          <div className={`flex items-center justify-between px-4 py-2.5 border-b flex-shrink-0 ${isDark ? "bg-[#0d1117] border-[#1e2329]" : "bg-white border-gray-200"}`}>
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-cyan-400" />
              <span className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Live Preview</span>
              {isRunning && <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 animate-pulse font-bold">Updating…</span>}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreviewKey((k) => k + 1)}
                title="Refresh preview"
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all ${isDark ? "border-[#2a3040] text-gray-400 hover:text-cyan-400 hover:border-cyan-500/40" : "border-gray-200 text-gray-600 hover:text-cyan-600"}`}>
                <RotateCcw className="w-3 h-3" /> Refresh
              </button>
              <button
                onClick={() => { void navigator.clipboard.writeText(window.location.origin + "/"); }}
                title="Copy live link"
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all ${isDark ? "border-[#2a3040] text-gray-400 hover:text-white hover:border-gray-500" : "border-gray-200 text-gray-600 hover:text-gray-900"}`}>
                <ClipboardCopy className="w-3 h-3" /> Copy Link
              </button>
              <a href="/" target="_blank" rel="noopener noreferrer"
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all ${isDark ? "border-[#2a3040] text-gray-400 hover:text-white hover:border-gray-500" : "border-gray-200 text-gray-600 hover:text-gray-900"}`}>
                <ExternalLink className="w-3 h-3" /> Full Screen
              </a>
              <button onClick={() => setLivePreviewOpen(false)} className={`p-1.5 rounded-lg transition-all ${isDark ? "text-gray-500 hover:text-white hover:bg-white/8" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"}`}>
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <iframe
            src="/"
            className="flex-1 w-full border-0"
            title="Live Preview"
            key={`preview-${previewKey}-${agentStatus?.status === "completed" ? "done" : "run"}`}
          />
        </div>
      )}

      {/* ── Top Bar ───────────────────────────────────────────────────────── */}
      <div className={`flex items-center gap-0.5 px-3 h-11 border-b flex-shrink-0 ${isDark ? "bg-[#0d1117] border-[#1e2329]" : "bg-white border-gray-200"}`}>

        {/* Logo */}
        <div className="flex items-center gap-1.5 mr-3 flex-shrink-0">
          <AnimatedNvrLogo activity={agentActivity} size={24} />
          <span className={`text-sm font-bold hidden sm:block ${isDark ? "text-white" : "text-gray-900"}`}>
            <span className="text-cyan-400">NVR</span> AI
          </span>
        </div>

        {/* Nav */}
        <Link href="/chat" className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex-shrink-0 ${isDark ? "text-gray-400 hover:text-white hover:bg-white/6" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"}`}>
          Chat
        </Link>
        <button onClick={() => setAgentMode("agent")}
          className={`flex items-center px-2.5 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 transition-all ${agentMode === "agent" ? isDark ? "bg-cyan-500/15 text-cyan-400" : "bg-cyan-50 text-cyan-600" : isDark ? "text-gray-400 hover:text-white hover:bg-white/6" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"}`}>
          Agent
        </button>
        <button onClick={() => { setAgentMode("codegen"); setCgOutput(""); }}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 transition-all ${agentMode === "codegen" ? isDark ? "bg-purple-500/15 text-purple-400" : "bg-purple-50 text-purple-600" : isDark ? "text-gray-400 hover:text-purple-400 hover:bg-purple-500/8" : "text-gray-500 hover:text-purple-600 hover:bg-purple-50"}`}>
          <Code2 className="w-3 h-3" />
          <span className="hidden sm:inline">Code Gen</span>
        </button>
        <button onClick={() => handleDeploy(false)} disabled={!!actionLoading || isRunning}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ml-0.5 flex-shrink-0 ${
            actionLoading === "deploy"
              ? "bg-green-500/20 text-green-400 border border-green-500/30 animate-pulse"
              : isDark ? "text-gray-400 hover:text-green-400 hover:bg-green-500/8" : "text-gray-500 hover:text-green-600 hover:bg-green-50"
          }`}>
          {actionLoading === "deploy" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Rocket className="w-3 h-3" />}
          <span className="hidden sm:inline">Deploy</span>
        </button>
        <button onClick={() => setShowConnectDomain(true)}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex-shrink-0 ${isDark ? "text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/8" : "text-gray-500 hover:text-cyan-600 hover:bg-cyan-50"}`}>
          <Globe className="w-3 h-3" />
          <span className="hidden sm:inline">Domain</span>
        </button>

        <div className="flex-1" />

        {/* Status dot */}
        <div className="flex items-center gap-1.5 mr-2 flex-shrink-0">
          <span className={`w-1.5 h-1.5 rounded-full ${
            agentActivity === "error" ? "bg-red-400" :
            agentActivity === "complete" ? "bg-green-400" :
            agentActivity === "idle" ? "bg-green-400" :
            "bg-cyan-400 animate-pulse"
          }`} />
          <span className={`text-[11px] hidden md:block font-medium ${activityColor[agentActivity]}`}>
            {isRunning && elapsed > 0 ? `${activityLabel[agentActivity]} · ${fmtTime(elapsed)}` : activityLabel[agentActivity]}
          </span>
        </div>

        {/* Theme */}
        <button onClick={toggleTheme} className={`p-1.5 rounded-lg transition-all flex-shrink-0 ${isDark ? "text-gray-500 hover:text-gray-200 hover:bg-white/6" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"}`}>
          {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>

        {/* Files toggle */}
        <button onClick={() => { setRightPanelOpen(!rightPanelOpen); setRightDrawerTab("files"); }}
          className={`p-1.5 rounded-lg transition-all flex-shrink-0 ${rightPanelOpen && rightDrawerTab === "files" ? isDark ? "bg-cyan-500/15 text-cyan-400" : "bg-cyan-50 text-cyan-600" : isDark ? "text-gray-500 hover:text-gray-200 hover:bg-white/6" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"}`}
          title="Project files">
          <FolderOpen className="w-3.5 h-3.5" />
        </button>

        {/* Settings toggle */}
        <button onClick={() => { setRightPanelOpen(!rightPanelOpen); setRightDrawerTab("settings"); }}
          className={`p-1.5 rounded-lg transition-all flex-shrink-0 ${rightPanelOpen && rightDrawerTab === "settings" ? isDark ? "bg-cyan-500/15 text-cyan-400" : "bg-cyan-50 text-cyan-600" : isDark ? "text-gray-500 hover:text-gray-200 hover:bg-white/6" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"}`}
          title="Settings">
          <Settings className="w-3.5 h-3.5" />
        </button>

        {/* Clear */}
        <button onClick={clearSession} className={`p-1.5 rounded-lg transition-all flex-shrink-0 ${isDark ? "text-gray-500 hover:text-red-400 hover:bg-red-500/8" : "text-gray-400 hover:text-red-500 hover:bg-red-50"}`} title="Clear session">
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Avatar */}
        {user && (
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ml-0.5 ${isDark ? "bg-cyan-500/20 text-cyan-400" : "bg-cyan-100 text-cyan-700"}`}>
            {(user.name ?? user.email ?? "U")[0].toUpperCase()}
          </div>
        )}
      </div>

      {/* ── Main Layout ───────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0 relative">

          {/* ── Progress bar ──────────────────────────────────────────────── */}
          {progressStage !== "idle" && progressStage !== "complete" && (
            <div className={`px-4 py-2 border-b flex-shrink-0 ${isDark ? "bg-[#080c10] border-[#1e2329]" : "bg-white border-gray-200"}`}>
              {(() => {
                const stages = ["thinking","scanning","planning","fixing","testing","review","waiting"];
                const idx = stages.indexOf(progressStage);
                const pct = idx < 0 ? 10 : Math.round(((idx + 1) / stages.length) * 100);
                return (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[11px] font-semibold capitalize ${isDark ? "text-gray-400" : "text-gray-600"}`}>{progressStage}…</span>
                      <span className={`text-[11px] font-mono ${isDark ? "text-cyan-400" : "text-cyan-600"}`}>{pct}%</span>
                    </div>
                    <div className={`h-1 rounded-full overflow-hidden ${isDark ? "bg-[#1e2329]" : "bg-gray-100"}`}>
                      <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ── Error banner ──────────────────────────────────────────────── */}
          {actionError && (
            <div className={`px-4 py-2.5 flex items-center justify-between border-b text-sm flex-shrink-0 ${isDark ? "bg-red-500/8 border-red-500/15 text-red-400" : "bg-red-50 border-red-200 text-red-700"}`}>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs">{actionError}</span>
              </div>
              <button onClick={() => setActionError(null)} className="ml-2 opacity-60 hover:opacity-100"><X className="w-3.5 h-3.5" /></button>
            </div>
          )}

          {/* ── Scrollable message area ────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto pb-28">

            {/* ── Code Generator view ───────────────────────────────────── */}
            {agentMode === "codegen" && (
              <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <Code2 className={`w-5 h-5 ${isDark ? "text-purple-400" : "text-purple-600"}`} />
                    <h2 className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Code Generator</h2>
                  </div>
                  <p className={`text-sm ${textMuted}`}>Describe any UI component — NVR generates production-ready React + Tailwind code instantly.</p>
                </div>

                {/* Example cards */}
                {!cgOutput && !cgGenerating && (
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${textMuted}`}>Quick examples</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {CODEGEN_EXAMPLES.map((ex) => (
                        <button key={ex.title}
                          onClick={() => { setInput(ex.prompt); textareaRef.current?.focus(); }}
                          className={`text-left p-4 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${isDark ? "bg-[#111820] border-[#1e2a38] hover:border-purple-500/40 hover:bg-purple-500/5" : "bg-white border-gray-200 hover:border-purple-300 hover:bg-purple-50 shadow-sm"}`}>
                          <span className="text-2xl block mb-2">{ex.icon}</span>
                          <span className={`text-xs font-bold block mb-0.5 ${isDark ? "text-white" : "text-gray-900"}`}>{ex.title}</span>
                          <span className={`text-[11px] ${textMuted}`}>{ex.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Loading */}
                {cgGenerating && (
                  <div className={`rounded-2xl border p-8 flex flex-col items-center gap-3 ${isDark ? "bg-[#111820] border-[#1e2a38]" : "bg-white border-gray-200 shadow-sm"}`}>
                    <AnimatedNvrLogo activity="building" size={44} />
                    <p className={`text-sm font-semibold ${isDark ? "text-gray-200" : "text-gray-700"}`}>Generating code…</p>
                    <p className={`text-xs ${textMuted}`}>Creating a production-ready React component</p>
                  </div>
                )}

                {/* Output */}
                {cgOutput && !cgGenerating && (
                  <>
                    <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-[#0d1117] border-[#1e2329]" : "bg-white border-gray-200 shadow-sm"}`}>
                      <div className={`flex items-center justify-between px-4 py-3 border-b ${borderCol} ${isDark ? "bg-[#111518]" : "bg-gray-50"}`}>
                        <div className="flex items-center gap-2">
                          <Code2 className="w-3.5 h-3.5 text-purple-400" />
                          <span className={`text-xs font-bold ${isDark ? "text-white" : "text-gray-900"}`}>GeneratedComponent.tsx</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 font-bold border border-purple-500/20">React · TypeScript</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => { void navigator.clipboard.writeText(cgOutput); setCgCopied(true); setTimeout(() => setCgCopied(false), 2000); }}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${cgCopied ? isDark ? "bg-green-500/15 border-green-500/30 text-green-400" : "bg-green-50 border-green-300 text-green-600" : isDark ? "border-[#2a3040] text-gray-400 hover:text-white hover:border-gray-500" : "border-gray-200 text-gray-600 hover:text-gray-900"}`}>
                            <Copy className="w-3 h-3" />{cgCopied ? "Copied!" : "Copy"}
                          </button>
                          <button
                            onClick={() => setLivePreviewOpen(true)}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${isDark ? "border-[#2a3040] text-gray-400 hover:text-cyan-400 hover:border-cyan-500/40" : "border-gray-200 text-gray-600 hover:text-cyan-600 hover:border-cyan-300"}`}>
                            <Monitor className="w-3 h-3" />Preview
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                await saveGeneratedFile("artifacts/nvr-app/src/components/GeneratedComponent.tsx", cgOutput);
                                setCgSaved(true); setTimeout(() => setCgSaved(false), 3000);
                                setTerminalOpen(true); setTerminalMinimized(false);
                                const buildResult = await runTerminalCommand("pnpm --filter @workspace/nvr-app run build 2>&1 | tail -20");
                                setTerminalHistory((prev) => [...prev, { cmd: "pnpm --filter @workspace/nvr-app run build", out: buildResult.output, blocked: buildResult.blocked }]);
                              } catch { /* ignore */ }
                            }}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${cgSaved ? isDark ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-400" : "bg-cyan-50 border-cyan-300 text-cyan-600" : isDark ? "border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10" : "border-cyan-300 text-cyan-600 hover:bg-cyan-50"}`}>
                            <Save className="w-3 h-3" />{cgSaved ? "Saved!" : "Save to Project"}
                          </button>
                          <button onClick={() => { setCgOutput(""); setInput(""); }} className={`p-1.5 rounded-lg transition-all ${isDark ? "text-gray-500 hover:text-white" : "text-gray-400 hover:text-gray-700"}`}>
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="max-h-[480px] overflow-y-auto">
                        <pre className={`p-5 text-[12px] leading-relaxed font-mono whitespace-pre-wrap break-all ${isDark ? "text-gray-300" : "text-gray-800"}`}>{cgOutput}</pre>
                      </div>
                    </div>
                    <button
                      onClick={() => { setAgentMode("agent"); setInput(`Integrate this generated component into the project:\n\n${cgOutput.slice(0, 400)}…`); }}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all ${isDark ? "border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/8 hover:border-cyan-500/50" : "border-cyan-300 text-cyan-600 hover:bg-cyan-50"}`}>
                      <Zap className="w-4 h-4" />
                      Send to Agent — save &amp; integrate into project
                    </button>
                  </>
                )}
              </div>
            )}

            {/* ── Agent mode ────────────────────────────────────────────── */}
            {agentMode === "agent" && <>

            {/* Empty state */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center min-h-full px-4 py-16">
                <div className="w-full max-w-xl flex flex-col items-center gap-6">

                  {/* Hero */}
                  <div className="flex flex-col items-center gap-3 text-center">
                    <AnimatedNvrLogo activity={agentActivity} size={48} />
                    <div>
                      <h1 className={`text-xl font-bold tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>
                        NVR <span className="text-cyan-400">Agent</span> Workspace
                      </h1>
                      <p className={`text-sm mt-1 ${textMuted}`}>Build, fix, scan & deploy — from one command</p>
                    </div>
                  </div>

                  {/* 3 action buttons */}
                  <div className="flex items-center gap-3 w-full max-w-sm">
                    <button onClick={handleBuild} disabled={!!actionLoading || isRunning}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-semibold text-sm border transition-all ${
                        actionLoading === "terminal"
                          ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300 animate-pulse"
                          : isDark ? "bg-[#0e2030] border-cyan-500/25 text-cyan-300 hover:border-cyan-500/50 hover:shadow-[0_4px_20px_rgba(6,182,212,0.15)]"
                          : "bg-cyan-50 border-cyan-200 text-cyan-700 hover:border-cyan-300"
                      }`}>
                      {actionLoading === "terminal" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                      Build
                    </button>
                    <button onClick={handleFix} disabled={!!actionLoading || isRunning}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-semibold text-sm border transition-all ${
                        actionLoading === "fix"
                          ? "bg-amber-500/20 border-amber-500/40 text-amber-300 animate-pulse"
                          : isDark ? "bg-[#1e1505] border-amber-500/25 text-amber-300 hover:border-amber-500/50 hover:shadow-[0_4px_20px_rgba(245,158,11,0.15)]"
                          : "bg-amber-50 border-amber-200 text-amber-700 hover:border-amber-300"
                      }`}>
                      {actionLoading === "fix" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bug className="w-4 h-4" />}
                      Fix
                    </button>
                    <button onClick={() => handleDeploy(false)} disabled={!!actionLoading || isRunning}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-semibold text-sm border transition-all ${
                        actionLoading === "deploy"
                          ? "bg-green-500/20 border-green-500/40 text-green-300 animate-pulse"
                          : isDark ? "bg-[#051a0e] border-green-500/25 text-green-300 hover:border-green-500/50 hover:shadow-[0_4px_20px_rgba(34,197,94,0.15)]"
                          : "bg-green-50 border-green-200 text-green-700 hover:border-green-300"
                      }`}>
                      {actionLoading === "deploy" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                      Deploy
                    </button>
                  </div>

                  {/* Quick prompts */}
                  <div className="flex flex-wrap justify-center gap-2">
                    {QUICK_PROMPTS.map((p) => (
                      <button key={p} onClick={() => { setInput(p); textareaRef.current?.focus(); }}
                        className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all hover:scale-[1.02] active:scale-[0.98] ${isDark ? "border-[#1e2632] bg-[#0a0f16] text-gray-500 hover:border-cyan-500/50 hover:text-cyan-300 hover:bg-cyan-500/8" : "border-gray-200 bg-white text-gray-500 hover:border-cyan-300 hover:text-cyan-600 hover:bg-cyan-50 shadow-sm"}`}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Conversation messages ──────────────────────────────────── */}
            {messages.length > 0 && (
              <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
                {messages.map((m, i) => (
                  <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    {m.role === "assistant" && (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-700 flex-shrink-0 flex items-center justify-center mt-0.5 shadow-[0_2px_8px_rgba(6,182,212,0.3)]">
                        <Zap className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${m.role === "user" ? "bg-gradient-to-br from-cyan-500 to-cyan-600 text-white rounded-br-sm shadow-[0_2px_12px_rgba(6,182,212,0.3)]" : `${msgBg} rounded-bl-sm`}`}>
                      {m.role === "user"
                        ? <p className="whitespace-pre-wrap">{m.content}</p>
                        : <MarkdownRenderer content={m.content} isDark={isDark} />
                      }
                    </div>
                  </div>
                ))}

                {isRunning && (
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-700 flex-shrink-0 flex items-center justify-center shadow-[0_2px_8px_rgba(6,182,212,0.3)]">
                      <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                    </div>
                    <div className={`px-4 py-3 rounded-2xl rounded-bl-sm border ${isDark ? "bg-[#141920] border-[#1e2329]" : "bg-white border-gray-200 shadow-sm"}`}>
                      <p className="text-xs text-cyan-400 animate-pulse font-medium">{currentStep ? `${currentStep}…` : "NVR Agent is working…"}</p>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}

            {/* ── Scan Results Panel ─────────────────────────────────────── */}
            {scanData && (
              <div className={`mx-4 mb-3 rounded-2xl border overflow-hidden max-w-2xl mx-auto ${isDark ? "bg-[#0d1117] border-[#1e2329]" : "bg-white border-gray-200 shadow-sm"}`}>
                <div className={`flex items-center justify-between px-4 py-3 border-b ${borderCol} ${isDark ? "bg-[#111518]" : "bg-gray-50"}`}>
                  <div className="flex items-center gap-2">
                    <Scan className="w-3.5 h-3.5 text-cyan-400" />
                    <span className={`text-xs font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Scan Results</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${scanData.severity === "critical" ? "bg-red-500/15 text-red-400" : scanData.severity === "high" ? "bg-orange-500/15 text-orange-400" : scanData.severity === "medium" ? "bg-amber-500/15 text-amber-400" : "bg-green-500/15 text-green-400"}`}>
                      {scanData.severity.toUpperCase()}
                    </span>
                    <span className={`text-xs ${textMuted}`}>{scanData.files_scanned} files · {scanData.issues_found} issues</span>
                  </div>
                  <button onClick={() => setScanData(null)} className={textMuted}><X className="w-3.5 h-3.5" /></button>
                </div>
                <div className="p-4 space-y-3">
                  <p className={`text-xs leading-relaxed ${textBase}`}>{scanData.summary}</p>
                  {scanData.issues.length > 0 && (
                    <div className="space-y-1.5">
                      {scanData.issues.slice(0, 6).map((issue, i) => (
                        <div key={i} className={`flex items-start gap-2 px-3 py-2 rounded-xl border ${isDark ? "border-[#1e2329] bg-[#141920]" : "border-gray-100 bg-gray-50"}`}>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold mt-0.5 flex-shrink-0 ${issue.severity === "critical" ? "bg-red-500/15 text-red-400" : issue.severity === "high" ? "bg-orange-500/15 text-orange-400" : issue.severity === "medium" ? "bg-amber-500/15 text-amber-400" : "bg-blue-500/15 text-blue-400"}`}>
                            {issue.type}
                          </span>
                          <div className="min-w-0">
                            <span className={`text-[11px] font-mono ${isDark ? "text-cyan-400" : "text-cyan-600"}`}>{issue.file}{issue.line ? `:${issue.line}` : ""}</span>
                            <p className={`text-[11px] leading-relaxed ${textMuted}`}>{issue.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <button onClick={handleFix} disabled={!!actionLoading} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold hover:bg-amber-500/20 transition-all">
                    <Bug className="w-3.5 h-3.5" /> Fix These Errors Automatically
                  </button>
                </div>
              </div>
            )}

            {/* ── Fix Results Panel ──────────────────────────────────────── */}
            {fixData && (
              <div className={`mx-4 mb-3 rounded-2xl border overflow-hidden max-w-2xl mx-auto ${isDark ? "bg-[#0d1117] border-[#1e2329]" : "bg-white border-gray-200 shadow-sm"}`}>
                <div className={`flex items-center justify-between px-4 py-3 border-b ${borderCol} ${isDark ? "bg-[#111518]" : "bg-gray-50"}`}>
                  <div className="flex items-center gap-2">
                    <Bug className="w-3.5 h-3.5 text-amber-400" />
                    <span className={`text-xs font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Auto Fix Results</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${fixData.test_result === "passed" ? "bg-green-500/15 text-green-400" : fixData.test_result === "failed" ? "bg-red-500/15 text-red-400" : "bg-gray-500/15 text-gray-400"}`}>
                      Tests {fixData.test_result}
                    </span>
                    {fixData.backup_created && <span className="text-[10px] text-green-400">✓ backup</span>}
                  </div>
                  <button onClick={() => setFixData(null)} className={textMuted}><X className="w-3.5 h-3.5" /></button>
                </div>
                <div className="p-4 space-y-2">
                  <p className={`text-xs ${textBase}`}>{fixData.summary}</p>
                  {fixData.changed_files.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {fixData.changed_files.map((f) => (
                        <span key={f} className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${isDark ? "bg-[#1e2329] text-cyan-400" : "bg-cyan-50 text-cyan-600 border border-cyan-200"}`}>{f}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Review Report Panel ────────────────────────────────────── */}
            {reviewData && (
              <div className={`mx-4 mb-3 rounded-2xl border overflow-hidden max-w-2xl mx-auto ${isDark ? "bg-[#0d1117] border-[#1e2329]" : "bg-white border-gray-200 shadow-sm"}`}>
                <div className={`flex items-center justify-between px-4 py-3 border-b ${borderCol} ${isDark ? "bg-[#111518]" : "bg-gray-50"}`}>
                  <div className="flex items-center gap-2">
                    <FileSearch className="w-3.5 h-3.5 text-purple-400" />
                    <span className={`text-xs font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Review Report</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${reviewData.deployment_readiness === "ready" ? "bg-green-500/15 text-green-400" : "bg-amber-500/15 text-amber-400"}`}>
                      {reviewData.deployment_readiness === "ready" ? "Deploy Ready" : "Needs Work"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold ${reviewData.readiness_score >= 80 ? "text-green-400" : reviewData.readiness_score >= 50 ? "text-amber-400" : "text-red-400"}`}>{reviewData.readiness_score}%</span>
                    <button onClick={() => setReviewData(null)} className={textMuted}><X className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div className={`h-2 rounded-full overflow-hidden ${isDark ? "bg-[#1e2329]" : "bg-gray-100"}`}>
                    <div className={`h-full rounded-full ${reviewData.readiness_score >= 80 ? "bg-green-400" : "bg-amber-400"}`} style={{ width: `${reviewData.readiness_score}%` }} />
                  </div>
                  <p className={`text-xs leading-relaxed ${textBase}`}>{reviewData.summary}</p>
                  {reviewData.deployment_readiness === "ready" && (
                    <button onClick={() => handleDeploy(false)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold hover:bg-green-500/20 transition-all">
                      <Rocket className="w-3.5 h-3.5" /> Deploy Now
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── Agent completion summary ───────────────────────────────── */}
            {agentStatus?.status === "completed" && agentStatus.filesChanged.length > 0 && (
              <div className={`mx-4 mb-3 rounded-2xl border p-4 max-w-2xl mx-auto ${isDark ? "bg-[#0f1a0f] border-green-500/20" : "bg-green-50 border-green-200"}`}>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                  <span className={`text-xs font-semibold ${isDark ? "text-green-300" : "text-green-700"}`}>Task Complete</span>
                  <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 font-bold">{agentStatus.filesChanged.length} files</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {agentStatus.filesChanged.map((f) => (
                    <span key={f} className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${isDark ? "bg-[#1e2329] text-cyan-400" : "bg-white text-cyan-600 border border-cyan-200"}`}>{f}</span>
                  ))}
                </div>
              </div>
            )}

            </>}
          </div>{/* end scrollable */}

          {/* ── Fixed Bottom Composer ─────────────────────────────────────── */}
          <div className="fixed bottom-0 left-0 right-0 z-30 md:bottom-3 md:left-4 md:right-auto md:w-[520px] px-3 pb-3 md:px-0 md:pb-0">

            {/* Attached file pill */}
            {attachedFile && (
              <div className="mb-1.5 ml-1">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium ${isDark ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-green-50 border-green-200 text-green-700"}`}>
                  <Paperclip className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="max-w-[200px] truncate">{attachedFile.name}</span>
                  <button onClick={() => setAttachedFile(null)} className="ml-0.5 opacity-60 hover:opacity-100"><X className="w-3 h-3" /></button>
                </div>
              </div>
            )}

            {/* Single-row composer */}
            <div className={`flex items-center gap-2 px-3 min-h-[60px] rounded-2xl border transition-all duration-200 ${composerBg}`}>

              {/* Left: animated logo + model selector */}
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setShowModelMenu(!showModelMenu)}
                  className={`flex items-center gap-1.5 pl-1 pr-2 py-1.5 rounded-xl border text-[11px] font-semibold transition-all whitespace-nowrap ${isDark ? "border-[#1e2632] bg-[#0c1018] text-gray-300 hover:border-cyan-500/40 hover:text-cyan-300" : "border-gray-200 bg-gray-50 text-gray-600 hover:border-cyan-300 hover:text-cyan-600"}`}>
                  <AnimatedNvrLogo activity={agentActivity} size={20} />
                  {MODEL_INFO[model].label}
                  <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform flex-shrink-0 ${showModelMenu ? "rotate-180" : ""}`} />
                </button>
                {showModelMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowModelMenu(false)} />
                    <div className={`absolute left-0 bottom-full mb-2 w-72 rounded-2xl border shadow-2xl z-20 overflow-hidden ${isDark ? "bg-[#141920] border-[#2a3040]" : "bg-white border-gray-200"}`}>
                      {(Object.entries(MODEL_INFO) as [AgentModel, typeof MODEL_INFO[AgentModel]][]).map(([key, info]) => (
                        <button key={key} onClick={() => { setModel(key); setShowModelMenu(false); }}
                          className={`w-full text-left px-4 py-3 text-xs transition-all flex items-start gap-3 ${model === key ? isDark ? "bg-cyan-500/10" : "bg-cyan-50" : isDark ? "hover:bg-white/5" : "hover:bg-gray-50"}`}>
                          <Rocket className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${model === key ? "text-cyan-400" : textMuted}`} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className={`font-semibold ${model === key ? (isDark ? "text-cyan-400" : "text-cyan-600") : (isDark ? "text-white" : "text-gray-900")}`}>{info.label}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-bold ${info.badgeCls}`}>{info.badge}</span>
                            </div>
                            <p className={`text-xs leading-relaxed ${textMuted}`}>{info.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Center: auto-growing textarea */}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    agentMode === "codegen" ? void handleCodeGen(input) : void handleSend();
                  }
                }}
                placeholder={
                  listening ? "Listening…" :
                  agentMode === "codegen" ? "Describe the UI component you want to generate…" :
                  messages.length === 0 ? "Ask NVR Agent to build, fix, scan, or deploy…" :
                  "Give the next instruction…"
                }
                rows={1}
                style={{ minHeight: "36px", maxHeight: "120px" }}
                className={`flex-1 min-w-0 bg-transparent resize-none outline-none text-[14px] leading-relaxed py-[7px] px-1 ${isDark ? "text-white placeholder:text-[#3d4a5c]" : "text-gray-900 placeholder:text-gray-400"} ${listening ? "placeholder:text-cyan-400 placeholder:animate-pulse" : ""}`}
              />

              {/* Right: icon buttons */}
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <button onClick={() => setLivePreviewOpen(true)} title="Live preview"
                  className={`p-1.5 rounded-xl transition-all ${livePreviewOpen ? "text-cyan-400 bg-cyan-500/10" : isDark ? "text-[#606878] hover:text-cyan-400 hover:bg-white/5" : "text-gray-400 hover:text-cyan-500 hover:bg-gray-50"}`}>
                  <Monitor className="w-[16px] h-[16px]" />
                </button>
                <button onClick={handleMic} title={listening ? "Stop" : "Voice input"}
                  className={`p-1.5 rounded-xl transition-all ${listening ? "text-cyan-400 bg-cyan-500/10" : isDark ? "text-[#606878] hover:text-cyan-400 hover:bg-white/5" : "text-gray-400 hover:text-cyan-500 hover:bg-gray-50"}`}>
                  {listening ? (
                    <span className="flex items-end gap-[2px] w-[16px] h-[16px]">
                      {[1,2,3,4].map((i) => (
                        <span key={i} className="bg-cyan-400 rounded-full w-[2.5px] animate-bounce" style={{ height: `${4 + i*3}px`, animationDelay: `${i*0.1}s`, animationDuration: "0.55s" }} />
                      ))}
                    </span>
                  ) : <Mic className="w-[16px] h-[16px]" />}
                </button>
                <button onClick={() => fileInputRef.current?.click()} title="Attach file"
                  className={`p-1.5 rounded-xl transition-all ${attachedFile ? "text-green-400 bg-green-500/10" : isDark ? "text-[#606878] hover:text-cyan-400 hover:bg-white/5" : "text-gray-400 hover:text-cyan-500 hover:bg-gray-50"}`}>
                  <Paperclip className="w-[16px] h-[16px]" />
                </button>
                {isRunning || cgGenerating ? (
                  <button
                    onClick={isRunning ? handleStop : () => setCgGenerating(false)}
                    className="w-7 h-7 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/20 transition-all flex items-center justify-center" title="Stop">
                    <Square className="w-3 h-3" />
                  </button>
                ) : (
                  <button
                    onClick={() => agentMode === "codegen" ? void handleCodeGen(input) : void handleSend()}
                    disabled={!input.trim() && !attachedFile}
                    title="Send (Enter)"
                    className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all active:scale-90 ${(input.trim() || attachedFile) ? "bg-cyan-500 hover:bg-cyan-400 text-white shadow-[0_2px_14px_rgba(6,182,212,0.5)]" : isDark ? "bg-[#161b22] text-[#3a4455] cursor-not-allowed" : "bg-gray-100 text-gray-300 cursor-not-allowed"}`}>
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* ── Right Drawer (slide-over overlay) ────────────────────────────── */}
        {rightPanelOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]" onClick={() => setRightPanelOpen(false)} />
            <div className={`fixed right-0 top-0 bottom-0 z-50 w-72 flex flex-col shadow-2xl border-l ${isDark ? "bg-[#0e1218] border-[#1e2632]" : "bg-white border-gray-200"}`}
              style={{ animation: "drawerSlideIn 0.22s cubic-bezier(0.4,0,0.2,1)" }}>

              {/* Drawer header */}
              <div className={`flex items-center justify-between px-4 py-3 border-b flex-shrink-0 ${isDark ? "border-[#1e2632]" : "border-gray-100"}`}>
                <div className="flex items-center gap-1.5">
                  {rightDrawerTab === "files"
                    ? <><FolderOpen className="w-3.5 h-3.5 text-cyan-400" /><span className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Project Files</span></>
                    : <><Settings className="w-3.5 h-3.5 text-cyan-400" /><span className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Settings</span></>
                  }
                </div>
                <button onClick={() => setRightPanelOpen(false)} className={`p-1.5 rounded-lg transition-all ${isDark ? "text-gray-500 hover:text-white hover:bg-white/8" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"}`}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Tab bar */}
              <div className={`flex border-b flex-shrink-0 ${isDark ? "border-[#1e2632]" : "border-gray-100"}`}>
                {(["files", "settings"] as const).map((tab) => (
                  <button key={tab} onClick={() => setRightDrawerTab(tab)}
                    className={`flex-1 py-2.5 text-[12px] font-semibold transition-all border-b-2 capitalize ${rightDrawerTab === tab ? "border-cyan-400 text-cyan-400" : `border-transparent ${textMuted}`}`}>
                    {tab === "files" ? "Files" : "Settings"}
                  </button>
                ))}
              </div>

              {/* Drawer content */}
              <div className="flex-1 overflow-y-auto">

                {/* ── FILES ─────────────────────────────────────────────── */}
                {rightDrawerTab === "files" && (
                  <div className="flex flex-col h-full">
                    <div className={`flex items-center justify-between px-3 py-2 border-b ${isDark ? "border-[#1e2632]" : "border-gray-100"}`}>
                      <span className={`text-[11px] font-semibold ${textMuted}`}>
                        Explorer{fileTree.length > 0 && <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400 font-bold">live</span>}
                      </span>
                      <button onClick={() => void loadFileTree()} title="Refresh"
                        className={`p-1 rounded transition-all ${fileTreeLoading ? "animate-spin text-cyan-400" : `${textMuted} hover:text-cyan-400`}`}>
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto py-1">
                      {fileTreeLoading && fileTree.length === 0
                        ? <div className={`flex items-center gap-1.5 px-3 py-4 text-xs ${textMuted}`}><Loader2 className="w-3 h-3 animate-spin" /> Loading…</div>
                        : <FileTree nodes={fileTree.length > 0 ? fileTree : DEMO_FILES} isDark={isDark} changedFiles={changedFiles} />
                      }
                    </div>
                  </div>
                )}

                {/* ── SETTINGS ──────────────────────────────────────────── */}
                {rightDrawerTab === "settings" && (
                  <div className="p-3 space-y-3">

                    {/* Sub-nav */}
                    <div className={`flex rounded-xl overflow-hidden border text-[11px] font-semibold ${isDark ? "border-[#1e2632]" : "border-gray-200"}`}>
                      {(["Domain", "Secrets", "Deploy", "Stats"] as const).map((s) => (
                        <button key={s} onClick={() => setSettingsPanelTab(s)}
                          className={`flex-1 py-2 transition-all ${settingsPanelTab === s ? isDark ? "bg-cyan-500/15 text-cyan-400" : "bg-cyan-50 text-cyan-600" : `${textMuted} ${isDark ? "hover:bg-white/5" : "hover:bg-gray-50"}`}`}>
                          {s}
                        </button>
                      ))}
                    </div>

                    {/* Domain */}
                    {settingsPanelTab === "Domain" && (
                      <div className="space-y-2">
                        <div className={`rounded-xl border p-3 ${cardBg}`}>
                          <p className={`text-[11px] font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>Connected Domain</p>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                            <a href="https://nvrai.chat" target="_blank" rel="noopener noreferrer" className={`text-xs font-mono ${isDark ? "text-cyan-400 hover:text-cyan-300" : "text-cyan-600"}`}>nvrai.chat</a>
                          </div>
                          <button onClick={() => setShowConnectDomain(true)} className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold border transition-all ${isDark ? "border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10" : "border-cyan-300 text-cyan-600 hover:bg-cyan-50"}`}>
                            <Globe className="w-3.5 h-3.5" /> Connect Domain
                          </button>
                        </div>
                        <button onClick={() => setShowBuyDomain(true)} className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold border transition-all ${isDark ? "border-[#1e2632] text-gray-400 hover:text-purple-400 hover:border-purple-500/30" : "border-gray-200 text-gray-500 hover:text-purple-600 hover:bg-purple-50"}`}>
                          <ShoppingCart className="w-3.5 h-3.5" /> Buy New Domain
                        </button>
                      </div>
                    )}

                    {/* Secrets */}
                    {settingsPanelTab === "Secrets" && (
                      <div className="space-y-2">
                        {[
                          { label: "OpenAI API Key", ok: true },
                          { label: "Session Secret",  ok: true },
                          { label: "Cloudflare",       ok: true },
                          { label: "GitHub Token",     ok: true },
                          { label: "Netlify Token",    ok: true },
                          { label: "Google OAuth",     ok: true },
                          { label: "X API Key",        ok: true },
                        ].map(({ label, ok }) => (
                          <div key={label} className={`flex items-center justify-between p-2.5 rounded-xl border ${isDark ? "border-[#1e2329] bg-[#0d1117]" : "border-gray-200 bg-gray-50"}`}>
                            <div className="flex items-center gap-2 min-w-0">
                              <Key className={`w-3 h-3 flex-shrink-0 ${ok ? "text-cyan-400" : "text-gray-500"}`} />
                              <span className={`text-[11px] font-medium truncate ${isDark ? "text-gray-300" : "text-gray-700"}`}>{label}</span>
                            </div>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ml-2 flex-shrink-0 ${ok ? isDark ? "bg-green-500/15 text-green-400" : "bg-green-50 text-green-600" : isDark ? "bg-red-500/15 text-red-400" : "bg-red-50 text-red-600"}`}>
                              {ok ? "Set" : "Missing"}
                            </span>
                          </div>
                        ))}
                        <button onClick={() => setShowSecretModal(true)} className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-all ${isDark ? "border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10" : "border-cyan-300 text-cyan-600 hover:bg-cyan-50"}`}>
                          <Plus className="w-3.5 h-3.5" /> Add Secret
                        </button>
                      </div>
                    )}

                    {/* Deploy */}
                    {settingsPanelTab === "Deploy" && (
                      <div className="space-y-2">
                        <div className={`rounded-xl border p-3 ${cardBg}`}>
                          <p className={`text-[11px] font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>Live Site</p>
                          <a href="https://nvrai.chat" target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 text-xs font-mono mb-3 ${isDark ? "text-cyan-400 hover:text-cyan-300" : "text-cyan-600"}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> nvrai.chat
                          </a>
                          <button onClick={() => handleDeploy(false)} disabled={!!actionLoading || isRunning}
                            className={`w-full py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${isDark ? "border-green-500/30 text-green-400 hover:bg-green-500/10" : "border-green-300 text-green-600 hover:bg-green-50"}`}>
                            {actionLoading === "deploy" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Rocket className="w-3.5 h-3.5" />}
                            {actionLoading === "deploy" ? "Deploying…" : "Deploy Now"}
                          </button>
                        </div>
                        <p className={`text-[10px] text-center ${textMuted}`}>Preview first. Live only after approval.</p>
                      </div>
                    )}

                    {/* Stats */}
                    {settingsPanelTab === "Stats" && (
                      <div className="space-y-2">
                        <div className={`rounded-xl border p-3 ${cardBg}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-xs font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Auto Mode</span>
                            <button onClick={() => setAutoAgentMode(!autoAgentMode)} className={`relative w-9 h-5 rounded-full transition-all ${autoAgentMode ? "bg-cyan-500" : isDark ? "bg-[#2a3040]" : "bg-gray-200"}`}>
                              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${autoAgentMode ? "translate-x-4" : "translate-x-0"}`} />
                            </button>
                          </div>
                          <p className={`text-[11px] ${textMuted}`}>{autoAgentMode ? "Agent acts autonomously" : "Agent waits for instructions"}</p>
                        </div>
                        <div className={`rounded-xl border p-3 ${cardBg} space-y-2`}>
                          <div className="flex items-center justify-between">
                            <span className={`text-[11px] ${textMuted}`}>Status</span>
                            <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold ${isRunning ? "bg-cyan-500/15 text-cyan-400" : agentStatus?.status === "completed" ? "bg-green-500/15 text-green-400" : isDark ? "bg-white/5 text-gray-400" : "bg-gray-100 text-gray-500"}`}>
                              {isRunning ? "Running" : agentStatus?.status === "completed" ? "Done" : "Ready"}
                            </span>
                          </div>
                          {isRunning && <div className="flex items-center justify-between"><span className={`text-[11px] ${textMuted}`}>Elapsed</span><span className="text-[11px] font-mono text-cyan-400">{fmtTime(elapsed)}</span></div>}
                          <div className="flex items-center justify-between"><span className={`text-[11px] ${textMuted}`}>Messages</span><span className={`text-[11px] font-mono ${isDark ? "text-white" : "text-gray-900"}`}>{messages.length}</span></div>
                          <div className="flex items-center justify-between"><span className={`text-[11px] ${textMuted}`}>Model</span><span className={`text-[11px] truncate font-medium ${isDark ? "text-cyan-400" : "text-cyan-600"}`}>{MODEL_INFO[model].label}</span></div>
                        </div>
                        {isRunning && (
                          <button onClick={handleStop} className="w-full py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 text-xs font-semibold border border-red-500/20 transition-all flex items-center justify-center gap-2">
                            <Square className="w-3.5 h-3.5" /> Stop Agent
                          </button>
                        )}
                        {agentStatus?.logs && agentStatus.logs.length > 0 && (
                          <div className={`rounded-xl border p-3 ${cardBg}`}>
                            <p className={`text-[11px] font-bold mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Logs</p>
                            <div className="space-y-0.5 max-h-32 overflow-y-auto font-mono">
                              {agentStatus.logs.map((log, i) => <div key={i} className="text-[10px] text-green-400 leading-5">{log}</div>)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Current Work Panel (floating, bottom-right on desktop) ────────── */}
      {(isRunning || (agentStatus && agentStatus.status !== "idle") || actionLoading) && (
        <div
          className={`fixed bottom-5 right-5 z-30 w-64 rounded-2xl border shadow-2xl overflow-hidden hidden md:flex flex-col ${isDark ? "bg-[#0e1218] border-[#1e2a38]" : "bg-white border-gray-200"}`}
          style={{ animation: "workPanelIn 0.2s cubic-bezier(0.4,0,0.2,1)" }}
        >
          {/* Header */}
          <div className={`flex items-center justify-between px-3 py-2.5 border-b ${isDark ? "border-[#1e2a38] bg-[#111820]" : "border-gray-100 bg-gray-50"}`}>
            <div className="flex items-center gap-2">
              <Activity className={`w-3.5 h-3.5 ${activityColor[agentActivity]}`} />
              <span className={`text-xs font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Current Work</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${
                agentActivity === "error" ? "bg-red-400" :
                agentActivity === "complete" ? "bg-green-400" :
                agentActivity === "idle" ? "bg-gray-500" :
                "bg-cyan-400 animate-pulse"
              }`} />
              <span className={`text-[10px] font-semibold ${activityColor[agentActivity]}`}>{activityLabel[agentActivity]}</span>
            </div>
          </div>

          {/* Body */}
          <div className="p-3 space-y-2">

            {/* Current action */}
            <div className={`rounded-xl p-2.5 border ${isDark ? "bg-[#141920] border-[#1e2329]" : "bg-gray-50 border-gray-100"}`}>
              <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${textMuted}`}>Action</p>
              <p className={`text-xs font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                {actionLoading === "terminal" ? "Running build…"
                  : actionLoading === "deploy" ? "Deploying to production…"
                  : actionLoading === "scan" ? "Scanning codebase…"
                  : actionLoading === "fix" ? "Auto-fixing errors…"
                  : actionLoading === "review" ? "Generating review…"
                  : isRunning ? currentStep ?? "Processing task…"
                  : agentStatus?.status === "completed" ? "Task completed"
                  : "Standing by"
                }
              </p>
              {isRunning && elapsed > 0 && (
                <p className={`text-[10px] mt-1 font-mono ${isDark ? "text-cyan-400/70" : "text-cyan-600/70"}`}>{fmtTime(elapsed)} elapsed</p>
              )}
            </div>

            {/* Changed files */}
            {recentChangedFiles.length > 0 && (
              <div className={`rounded-xl p-2.5 border ${isDark ? "bg-[#141920] border-[#1e2329]" : "bg-gray-50 border-gray-100"}`}>
                <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${textMuted}`}>Last Changed</p>
                <div className="space-y-1">
                  {recentChangedFiles.map((f) => (
                    <div key={f} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                      <span className={`text-[11px] font-mono truncate ${isDark ? "text-gray-300" : "text-gray-700"}`}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error status */}
            {agentActivity === "error" && actionError && (
              <div className={`rounded-xl p-2.5 border ${isDark ? "bg-red-500/8 border-red-500/20" : "bg-red-50 border-red-200"}`}>
                <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${isDark ? "text-red-400" : "text-red-600"}`}>Error</p>
                <p className={`text-[11px] leading-relaxed ${isDark ? "text-red-300" : "text-red-700"}`}>{actionError.slice(0, 80)}</p>
              </div>
            )}

            {/* Complete status */}
            {agentActivity === "complete" && (
              <div className={`rounded-xl p-2.5 border ${isDark ? "bg-green-500/8 border-green-500/20" : "bg-green-50 border-green-200"}`}>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                  <p className={`text-[11px] font-medium ${isDark ? "text-green-300" : "text-green-700"}`}>Task completed successfully</p>
                </div>
              </div>
            )}

            {/* Stop button */}
            {isRunning && (
              <button onClick={handleStop} className="w-full py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[11px] font-semibold border border-red-500/20 transition-all flex items-center justify-center gap-1.5">
                <Square className="w-3 h-3" /> Stop Agent
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Floating Terminal Panel ───────────────────────────────────────── */}
      {terminalOpen && (
        <div
          className="fixed bottom-4 left-4 z-50 flex flex-col rounded-2xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.7)] border border-[#1e2a3a]"
          style={{
            width: "min(560px, calc(100vw - 32px))",
            height: terminalMinimized ? "42px" : "300px",
            background: "#09090b",
            transition: "height 0.22s cubic-bezier(0.4,0,0.2,1)",
            animation: "termSlideUp 0.22s cubic-bezier(0.4,0,0.2,1)",
            marginBottom: "80px",
          }}
        >
          {/* Title bar */}
          <div className="flex items-center gap-2 px-3 py-2 flex-shrink-0 select-none" style={{ background: "#111117", borderBottom: terminalMinimized ? "none" : "1px solid #1e2a3a" }}>
            <div className="flex items-center gap-1.5 mr-1">
              <button onClick={() => { setTerminalOpen(false); setTerminalMinimized(false); }} className="w-3 h-3 rounded-full bg-[#ff5f57] hover:bg-[#ff4045] transition-colors" title="Close" />
              <button onClick={() => setTerminalMinimized(!terminalMinimized)} className="w-3 h-3 rounded-full bg-[#febc2e] hover:bg-[#f5a800] transition-colors" title="Minimize" />
              <div className="w-3 h-3 rounded-full bg-[#28c840] opacity-40 cursor-not-allowed" />
            </div>
            <Terminal className="w-3 h-3 text-cyan-400 flex-shrink-0" />
            <span className="text-[12px] font-semibold text-gray-300 tracking-tight">NVR Terminal</span>
            <div className="flex items-center gap-1 ml-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_5px_rgba(74,222,128,0.7)]" />
              <span className="text-[10px] text-green-400 font-mono">live</span>
            </div>
            {actionLoading === "terminal" && <Loader2 className="w-3 h-3 text-cyan-400 animate-spin ml-1" />}
            <div className="ml-auto flex items-center gap-1">
              {terminalHistory.length > 0 && (
                <button
                  onClick={() => {
                    const logs = terminalHistory.map((e) => `❯ ${e.cmd}\n${e.out}`).join("\n\n");
                    void navigator.clipboard.writeText(logs);
                  }}
                  title="Copy logs"
                  className="p-1 rounded hover:bg-white/5 text-gray-500 hover:text-cyan-400 transition-colors">
                  <ClipboardCopy className="w-3 h-3" />
                </button>
              )}
              <button onClick={() => setTerminalMinimized(!terminalMinimized)} className="p-1 rounded hover:bg-white/5 text-gray-500 hover:text-gray-300">
                {terminalMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {!terminalMinimized && (
            <>
              <div className="flex-1 overflow-y-auto px-4 py-3 font-mono text-xs space-y-1 min-h-0">
                <div className="text-gray-600">$ NVR Agent Terminal — ready</div>
                {agentStatus?.logs.map((log, i) => (
                  <div key={i} className="text-green-400 leading-5">{log}</div>
                ))}
                {terminalHistory.map((entry, i) => (
                  <div key={`th_${i}`} className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-cyan-500">❯</span>
                      <span className="text-cyan-300">{entry.cmd}</span>
                    </div>
                    <div className={`pl-4 whitespace-pre-wrap leading-relaxed ${entry.blocked ? "text-red-400" : "text-gray-300"}`}>{entry.out}</div>
                  </div>
                ))}
                {actionLoading === "terminal" && (
                  <div className="flex items-center gap-2 text-cyan-400">
                    <span className="text-cyan-500">❯</span>
                    <span className="inline-block w-1.5 h-3.5 bg-cyan-400 rounded-sm animate-pulse" />
                  </div>
                )}
                {isRunning && !actionLoading && (
                  <div className="flex items-center gap-2 text-cyan-400 animate-pulse">
                    <span>▶</span>
                    <span>Agent working{currentStep ? ` — ${currentStep}` : "…"}</span>
                  </div>
                )}
                {agentStatus?.status === "completed" && !isRunning && (
                  <div className="text-green-400 mt-1">✓ Task completed successfully.</div>
                )}
                {agentStatus?.status === "error" && !isRunning && (
                  <div className="text-red-400 mt-1">✗ Task failed — check errors above.</div>
                )}
              </div>

              <div className="flex items-center gap-2 px-3 py-2 flex-shrink-0" style={{ borderTop: "1px solid #1e2a3a", background: "#0c0c10" }}>
                <span className="text-cyan-500 font-mono text-xs flex-shrink-0">❯</span>
                <input
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") void handleTerminalRun(); }}
                  placeholder="npm run build · ls · git status …"
                  disabled={actionLoading === "terminal"}
                  className="flex-1 bg-transparent font-mono text-xs text-gray-200 outline-none placeholder:text-gray-700 caret-cyan-400"
                />
                <button
                  onClick={() => void handleTerminalRun()}
                  disabled={!terminalInput.trim() || actionLoading === "terminal"}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex-shrink-0 ${terminalInput.trim() && actionLoading !== "terminal" ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30" : "text-gray-700 cursor-not-allowed"}`}
                >
                  Run
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Terminal trigger (when closed, has history) ───────────────────── */}
      {!terminalOpen && terminalHistory.length > 0 && (
        <button
          onClick={() => { setTerminalOpen(true); setTerminalMinimized(false); }}
          className="fixed bottom-20 left-4 z-40 md:bottom-24 flex items-center gap-2 px-3 py-2 rounded-xl bg-[#111117] border border-[#1e2a3a] text-xs font-medium text-gray-400 hover:text-cyan-400 hover:border-cyan-500/40 shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-all"
          title="Open terminal"
        >
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span>Terminal</span>
          <span className="px-1.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-400 text-[10px] font-bold">{terminalHistory.length}</span>
        </button>
      )}

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*,.pdf,.txt,.md,.json,.ts,.tsx,.js,.jsx,.py,.sh,.yaml,.yml" className="hidden" onChange={handleFileChange} />

      {/* Domain modals */}
      {showConnectDomain && <ConnectDomainModal onClose={() => setShowConnectDomain(false)} onConnected={() => setShowConnectDomain(false)} />}
      {showBuyDomain && <BuyDomainModal onClose={() => setShowBuyDomain(false)} />}

      {/* Suppress unused import warnings */}
      {false && <>{usage}{navigate}{Server}{Shield}{Scan}{FileSearch}{Palette}{ShieldCheck}{Activity}{Server}{List}{GitCommit}{Bot}{CheckCircle2}</>}
    </div>
  );
}
