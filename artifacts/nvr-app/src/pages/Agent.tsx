import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import {
  Terminal, Rocket, Shield, RotateCcw, ChevronDown, Square,
  CheckCircle2, Loader2, AlertTriangle, FileCode, Folder,
  FolderOpen, ChevronRight, Mic, MicOff, Paperclip, Lock, Plus,
  Eye, EyeOff, Activity, X, Maximize2, Minimize2, Zap, Bug,
  Scan, Server, FileSearch, Palette, ShieldCheck,
  ArrowUp, Sparkles, Monitor, MonitorOff, Laptop, Globe,
  List, AlertCircle, GitCommit,
} from "lucide-react";
import {
  startAgentTask, pollAgentStatus, approveAgentTask, stopAgentTask,
  addSecret, getSecretKeys, runAgentScan, runAgentFix, runAgentDeploy,
  runAgentReview, runTerminalCommand, listAgentFiles,
  type AgentStatus, type ScanResult, type FixResult, type ReviewReport,
} from "@/lib/api";
import { useTheme } from "@/lib/theme";
import { useUsage } from "@/lib/usageContext";

// ─── Types ────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySpeechRecognition = any;
type AgentModel = "nvr-7.7" | "nvr-8.8" | "nvr-9.9";
interface FileNode { name: string; type: "file" | "folder"; ext?: string; path?: string; size?: number; children?: FileNode[]; }
interface ChatMsg { role: "user" | "assistant"; content: string; }

// ─── Model definitions ────────────────────────────────────────────────────────

const MODEL_INFO: Record<AgentModel, { label: string; desc: string; badge: string; badgeCls: string }> = {
  "nvr-7.7": {
    label: "NVR 7.7 Agent",
    desc:  "Smart Builder — general tasks, UI, code generation",
    badge: "Smart",
    badgeCls: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  },
  "nvr-8.8": {
    label: "NVR 8.8 Agent",
    desc:  "Code Scanner & Bug Fixer — deep analysis, debugging",
    badge: "Pro",
    badgeCls: "bg-cyan-500/15 text-cyan-400 border-cyan-500/25",
  },
  "nvr-9.9": {
    label: "NVR 9.9 Super Agent",
    desc:  "Live Deploy & Full Automation — production-grade",
    badge: "Super",
    badgeCls: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  },
};

// ─── Task categories ──────────────────────────────────────────────────────────

const TASK_CATEGORIES = [
  {
    icon: Globe, label: "Website", color: "blue",
    desc: "Landing pages, SaaS, auth, pricing pages",
    prompt: "Build a high-resolution SaaS landing page for NVR 7.7 AI with hero section, features grid, pricing table, testimonials, and call-to-action",
  },
  {
    icon: Laptop, label: "Mobile", color: "purple",
    desc: "Responsive UI, app screens, PWA design",
    prompt: "Create a mobile-responsive premium dashboard UI with bottom navigation, metrics cards, activity feed, and charts",
  },
  {
    icon: Palette, label: "Design", color: "pink",
    desc: "High-res UI, branding, premium layouts",
    prompt: "Design a premium high-resolution SaaS dashboard with modern UI components, data visualization, sidebar navigation, and clean typography",
  },
  {
    icon: FileCode, label: "Document", color: "amber",
    desc: "Business plans, pitch decks, proposals",
    prompt: "Create a comprehensive business proposal document with executive summary, market analysis, product roadmap, and financial projections",
  },
] as const;

const QUICK_PROMPTS = [
  "Build a SaaS landing page",
  "Create a mobile app UI",
  "Design a premium dashboard",
  "Scan and fix my project",
  "Deploy website safely",
  "Create business proposal",
] as const;

// ─── Capability chips (legacy) ────────────────────────────────────────────────

const CAPABILITIES = [
  { icon: Zap,         label: "Project Builder",    prompt: "Build a complete project structure for " },
  { icon: Scan,        label: "Code Scanner",        prompt: "Scan this project for issues and vulnerabilities" },
  { icon: Bug,         label: "Bug Fixer",           prompt: "Find and fix all bugs in my code" },
  { icon: Terminal,    label: "Terminal Guide",      prompt: "Write a terminal script to " },
  { icon: Rocket,      label: "Live Deploy",         prompt: "Guide me through deploying this project to production" },
  { icon: Server,      label: "Server Monitor",      prompt: "Set up server monitoring and health checks for " },
  { icon: Shield,      label: "Permission Control",  prompt: "Review and enforce permission controls for " },
  { icon: FileSearch,  label: "Review Report",       prompt: "Generate a full code review report for this project" },
  { icon: Palette,     label: "UI Designer",         prompt: "Design and build a premium UI component for " },
  { icon: ShieldCheck, label: "Security Check",      prompt: "Run a full security audit on this codebase" },
];

// ─── Demo file tree ───────────────────────────────────────────────────────────

const DEMO_FILES: FileNode[] = [
  { name: "src", type: "folder", children: [
    { name: "App.tsx", type: "file", ext: "tsx" },
    { name: "index.tsx", type: "file", ext: "tsx" },
    { name: "components", type: "folder", children: [
      { name: "Navbar.tsx", type: "file", ext: "tsx" },
      { name: "Button.tsx", type: "file", ext: "tsx" },
    ]},
    { name: "lib", type: "folder", children: [
      { name: "api.ts", type: "file", ext: "ts" },
    ]},
  ]},
  { name: "public", type: "folder", children: [
    { name: "index.html", type: "file", ext: "html" },
  ]},
  { name: "package.json", type: "file", ext: "json" },
  { name: "vite.config.ts", type: "file", ext: "ts" },
];

const EXT_COLORS: Record<string, string> = {
  tsx: "text-blue-400", ts: "text-blue-400", jsx: "text-yellow-400",
  js: "text-yellow-400", html: "text-orange-400", css: "text-pink-400",
  json: "text-green-400", md: "text-gray-400", sh: "text-cyan-400", ico: "text-gray-400",
};

// ─── File tree component ──────────────────────────────────────────────────────

function FileTree({ nodes, depth = 0, isDark, changedFiles }: {
  nodes: FileNode[];
  depth?: number;
  isDark: boolean;
  changedFiles?: Set<string>;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({ src: true, routes: true });
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

// ─── Main component ───────────────────────────────────────────────────────────

export default function Agent() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
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
  const [autoAgentMode, setAutoAgentMode]   = useState(false);

  // Action results
  const [scanData, setScanData]             = useState<ScanResult | null>(null);
  const [fixData, setFixData]               = useState<FixResult | null>(null);
  const [reviewData, setReviewData]         = useState<ReviewReport | null>(null);
  const [actionLoading, setActionLoading]   = useState<"scan" | "fix" | "deploy" | "review" | "terminal" | null>(null);
  const [actionError, setActionError]       = useState<string | null>(null);

  // Deploy confirm modal
  const [deployConfirm, setDeployConfirm]   = useState<{ message: string } | null>(null);

  // Terminal with real input
  const [terminalInput, setTerminalInput]   = useState("");
  const [terminalHistory, setTerminalHistory] = useState<{ cmd: string; out: string; blocked?: boolean }[]>([]);

  // Progress bar stage
  type ProgressStage = "idle" | "thinking" | "scanning" | "planning" | "fixing" | "testing" | "review" | "waiting" | "complete";
  const [progressStage, setProgressStage]   = useState<ProgressStage>("idle");

  // Panel state
  const [terminalOpen, setTerminalOpen]     = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [liveMonitorOpen, setLiveMonitorOpen] = useState(false);
  const [serverMode, setServerMode]         = useState<"local" | "server">("local");

  // Real file tree
  const [fileTree, setFileTree]             = useState<FileNode[]>([]);
  const [fileTreeLoading, setFileTreeLoading] = useState(false);
  const [changedFiles, setChangedFiles]     = useState<Set<string>>(new Set());

  // Mic state
  const [listening, setListening]           = useState(false);
  const recognitionRef                      = useRef<AnySpeechRecognition>(null);

  // File attachment
  const [attachedFile, setAttachedFile]     = useState<{ name: string; content: string } | null>(null);
  const fileInputRef                        = useRef<HTMLInputElement>(null);

  const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isRunning]);
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 180) + "px";
    }
  }, [input]);
  useEffect(() => { getSecretKeys().then(setSecretKeys).catch(() => {}); }, []);

  const loadFileTree = useCallback(async () => {
    setFileTreeLoading(true);
    try {
      const data = await listAgentFiles();
      if (data.tree?.length > 0) setFileTree(data.tree as unknown as FileNode[]);
    } catch { /* keep demo fallback on error */ }
    finally { setFileTreeLoading(false); }
  }, []);
  useEffect(() => { void loadFileTree(); }, [loadFileTree]);

  // ── Polling ──────────────────────────────────────────────────────────────

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
          stopPolling(); setIsRunning(false);
          if (status.result) setMessages((prev) => [...prev, { role: "assistant", content: status.result }]);
          if (status.filesChanged?.length) {
            setChangedFiles((prev) => { const n = new Set(prev); status.filesChanged.forEach((f) => n.add(f)); return n; });
            listAgentFiles().then((d) => { if (d.tree?.length) setFileTree(d.tree as unknown as FileNode[]); }).catch(() => {});
          }
        }
      } catch { stopPolling(); setIsRunning(false); }
    }, 1200);
  }, [stopPolling]);

  // ── Send ─────────────────────────────────────────────────────────────────

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

    setInput(""); setUpgradeRequired(false);
    setMessages((prev) => [...prev, { role: "user", content: msg }]);

    // Map frontend model keys to backend model strings
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
    stopPolling(); setIsRunning(false);
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

  // ── Action button helpers ──────────────────────────────────────────────────

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
    const fixSummary = fixData ? `Fixed ${fixData.changed_files.length} files, tests: ${fixData.test_result}` : "";
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
    setTerminalInput("");
    setActionLoading("terminal");
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

  // ── Mic ──────────────────────────────────────────────────────────────────

  const handleMic = useCallback(() => {
    const SR = (window as AnySpeechRecognition).SpeechRecognition || (window as AnySpeechRecognition).webkitSpeechRecognition;
    if (!SR) { alert("Voice input not supported on this browser."); return; }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = new SR();
    rec.lang = "en-US"; rec.continuous = false; rec.interimResults = false;
    rec.onresult = (e: AnySpeechRecognition) => {
      const transcript = e.results[0]?.[0]?.transcript ?? "";
      if (transcript) setInput((prev) => prev ? `${prev} ${transcript}` : transcript);
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
    const isText = file.type.startsWith("text/") || ["txt", "pdf", "md", "json", "ts", "tsx", "js", "jsx", "py", "sh", "yaml", "yml"].some((ext) => file.name.endsWith(`.${ext}`));
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAttachedFile({ name: file.name, content: ev.target?.result as string });
    };
    if (isText) reader.readAsText(file); else reader.readAsDataURL(file);
    e.target.value = "";
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  const fmtTime  = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const canAgent = true; // all users have full agent access
  const currentStep = agentStatus?.steps.find((s) => s.status === "running")?.label;
  const statusLabel = isRunning
    ? agentStatus?.status === "waiting_permission" ? "Waiting for permission" : currentStep ?? "Working…"
    : agentStatus?.status === "completed" ? "Completed"
    : agentStatus?.status === "stopped"   ? "Stopped"
    : "Ready";

  // ── Theme tokens ──────────────────────────────────────────────────────────

  const bg        = isDark ? "bg-[#0b0f14]"         : "bg-[#f5f5f5]";
  const panelBg   = isDark ? "bg-[#111518] border-[#1e2329]" : "bg-white border-gray-200";
  const cardBg    = isDark ? "bg-[#141920] border-[#1e2329]" : "bg-white border-gray-200 shadow-sm";
  const borderCol = isDark ? "border-[#1e2329]"     : "border-gray-200";
  const textMuted = isDark ? "text-gray-500"         : "text-gray-400";
  const textBase  = isDark ? "text-gray-300"         : "text-gray-700";
  const msgBg     = isDark ? "bg-[#141920] border border-[#1e2329] text-gray-100" : "bg-white border border-gray-200 text-gray-800 shadow-sm";
  const inputCls  = isDark
    ? "bg-[#111518] border-[#2a3040] focus-within:border-cyan-500/50 focus-within:shadow-[0_0_0_3px_rgba(6,182,212,0.06)]"
    : "bg-white border-gray-200 focus-within:border-cyan-400 focus-within:shadow-[0_0_0_3px_rgba(6,182,212,0.08)] shadow-sm";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={`flex flex-col h-screen pt-14 ${bg}`}>

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
            <p className={`text-xs mb-5 ${textMuted}`}>
              This may involve: deploy, delete, payment, database, server, or secret changes. NVR Agent will not proceed without your explicit approval.
            </p>
            <div className="flex gap-3">
              <button onClick={handlePermissionDeny} className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${isDark ? "border-[#2a3040] text-gray-300 hover:bg-white/5" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                Cancel
              </button>
              <button onClick={handlePermissionAllow} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-cyan-500 hover:bg-cyan-400 text-black transition-all">
                Allow &amp; Continue
              </button>
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
            <p className={`text-xs mb-5 ${textMuted}`}>
              This action will push your latest build to the live server. NVR Agent will not deploy without your explicit approval.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeployConfirm(null)} className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${isDark ? "border-[#2a3040] text-gray-300 hover:bg-white/5" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                Cancel
              </button>
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
              <input
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_"))}
                placeholder="SECRET_KEY_NAME"
                className={`w-full px-3 py-2.5 rounded-xl border text-sm font-mono outline-none transition-all ${isDark ? "bg-[#0b0f14] border-[#2a3040] text-white placeholder:text-gray-600 focus:border-cyan-500/60" : "bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-400"}`}
              />
              <div className="relative">
                <input
                  type={showSecretValue ? "text" : "password"}
                  value={secretValue}
                  onChange={(e) => setSecretValue(e.target.value)}
                  placeholder="Secret value"
                  className={`w-full px-3 py-2.5 pr-10 rounded-xl border text-sm outline-none transition-all ${isDark ? "bg-[#0b0f14] border-[#2a3040] text-white placeholder:text-gray-600 focus:border-cyan-500/60" : "bg-gray-50 border-gray-200 text-gray-900 focus:border-cyan-400"}`}
                />
                <button type="button" onClick={() => setShowSecretValue(!showSecretValue)} className={`absolute right-3 top-1/2 -translate-y-1/2 ${textMuted}`}>
                  {showSecretValue ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <button onClick={handleSaveSecret} className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-sm transition-all">
                Save Secret Securely
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Layout ───────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: File Explorer */}
        <div className={`hidden lg:flex flex-col w-52 xl:w-60 border-r flex-shrink-0 ${panelBg}`}>
          <div className={`flex items-center justify-between px-3 py-2 border-b ${borderCol}`}>
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-semibold uppercase tracking-wider ${textMuted}`}>Explorer</span>
              {fileTree.length > 0 && (
                <span className="text-[10px] px-1 py-0.5 rounded bg-cyan-500/15 text-cyan-400 font-semibold leading-none">live</span>
              )}
            </div>
            <button
              onClick={() => void loadFileTree()}
              title="Refresh file tree"
              className={`p-1 rounded transition-all ${isDark ? "text-gray-600 hover:text-cyan-400" : "text-gray-400 hover:text-cyan-500"} ${fileTreeLoading ? "animate-spin text-cyan-400" : ""}`}
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {fileTreeLoading && fileTree.length === 0 ? (
              <div className={`flex items-center gap-1.5 px-3 py-4 text-xs ${textMuted}`}>
                <Loader2 className="w-3 h-3 animate-spin" /> Loading files…
              </div>
            ) : (
              <FileTree
                nodes={fileTree.length > 0 ? fileTree : DEMO_FILES}
                isDark={isDark}
                changedFiles={changedFiles}
              />
            )}
          </div>
          <div className={`border-t p-2 ${borderCol}`}>
            <button
              onClick={() => setShowSecretModal(true)}
              className={`w-full flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${isDark ? "bg-[#1e2329] text-gray-400 hover:text-white hover:bg-[#252d38]" : "bg-gray-50 text-gray-500 hover:text-gray-800 hover:bg-gray-100"}`}
            >
              <Plus className="w-3 h-3" />
              <Lock className="w-3 h-3 text-cyan-400" />
              Add Secret
            </button>
          </div>
        </div>

        {/* Center: Main content */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Sub-header row 1: status + controls */}
          <div className={`flex items-center justify-between px-4 py-2 border-b flex-shrink-0 ${isDark ? "bg-[#0b0f14] border-[#1e2329]" : "bg-white border-gray-200"}`}>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isRunning || actionLoading ? "bg-cyan-400 animate-pulse" : agentStatus?.status === "completed" ? "bg-green-400" : "bg-gray-500"}`} />
              <span className={`text-xs font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                {actionLoading === "scan" ? "Scanning project…" : actionLoading === "fix" ? "Fixing errors…" : actionLoading === "deploy" ? "Deploying…" : actionLoading === "review" ? "Generating report…" : statusLabel}
              </span>
              {isRunning && <span className={`text-xs font-mono ${textMuted}`}>{fmtTime(elapsed)}</span>}
            </div>
            <div className="flex items-center gap-2">
              {/* Auto Agent Mode toggle */}
              <button
                onClick={() => setAutoAgentMode(!autoAgentMode)}
                title={autoAgentMode ? "Auto Agent Mode: ON" : "Auto Agent Mode: OFF"}
                className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${autoAgentMode ? "bg-cyan-500/15 border-cyan-500/30 text-cyan-400" : isDark ? "border-[#2a3040] text-gray-500 hover:text-gray-300" : "border-gray-200 text-gray-400 hover:text-gray-600"}`}
              >
                <Zap className={`w-3 h-3 ${autoAgentMode ? "text-cyan-400" : ""}`} />
                <span className="hidden md:inline">Auto</span>
                <span className={`w-1.5 h-1.5 rounded-full ${autoAgentMode ? "bg-cyan-400 animate-pulse" : "bg-gray-500"}`} />
              </button>
              <button
                onClick={() => setRightPanelOpen(!rightPanelOpen)}
                className={`hidden lg:flex p-1.5 rounded-lg border text-xs transition-all ${isDark ? "border-[#2a3040] text-gray-400 hover:text-white" : "border-gray-200 text-gray-400 hover:text-gray-700"}`}
                title="Toggle Agent Power panel"
              >
                <Activity className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => { setMessages([]); setAgentStatus(null); setCurrentTaskId(null); stopPolling(); setIsRunning(false); setElapsed(0); setUpgradeRequired(false); setScanData(null); setFixData(null); setReviewData(null); setActionError(null); setProgressStage("idle"); }}
                className={`p-1.5 rounded-lg border transition-all ${isDark ? "border-[#2a3040] text-gray-400 hover:text-white" : "border-gray-200 text-gray-400 hover:text-gray-700"}`}
                title="Clear conversation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Sub-header row 2: action buttons */}
          <div className={`flex items-center gap-2 px-4 py-2 border-b flex-shrink-0 overflow-x-auto ${isDark ? "bg-[#080c10] border-[#1e2329]" : "bg-gray-50 border-gray-200"}`}>
            {/* Scan */}
            <button
              onClick={handleScan}
              disabled={!!actionLoading || isRunning}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${actionLoading === "scan" ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400 animate-pulse" : canAgent ? isDark ? "border-[#2a3040] text-gray-300 hover:border-cyan-500/40 hover:text-cyan-400 hover:bg-cyan-500/8 bg-[#111518]" : "border-gray-200 text-gray-600 hover:border-cyan-300 hover:text-cyan-600 hover:bg-cyan-50 bg-white" : isDark ? "border-[#2a3040] text-gray-600 bg-[#111518]" : "border-gray-200 text-gray-400 bg-white"}`}
            >
              {actionLoading === "scan" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Scan className="w-3.5 h-3.5" />}
              Scan Project
            </button>

            {/* Fix Errors */}
            <button
              onClick={handleFix}
              disabled={!!actionLoading || isRunning}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${actionLoading === "fix" ? "bg-amber-500/20 border-amber-500/40 text-amber-400 animate-pulse" : canAgent ? isDark ? "border-[#2a3040] text-gray-300 hover:border-amber-500/40 hover:text-amber-400 hover:bg-amber-500/8 bg-[#111518]" : "border-gray-200 text-gray-600 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50 bg-white" : isDark ? "border-[#2a3040] text-gray-600 bg-[#111518]" : "border-gray-200 text-gray-400 bg-white"}`}
            >
              {actionLoading === "fix" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bug className="w-3.5 h-3.5" />}
              Fix Errors
            </button>

            {/* Deploy Now */}
            <button
              onClick={() => handleDeploy(false)}
              disabled={!!actionLoading || isRunning}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${actionLoading === "deploy" ? "bg-green-500/20 border-green-500/40 text-green-400 animate-pulse" : canAgent ? isDark ? "border-[#2a3040] text-gray-300 hover:border-green-500/40 hover:text-green-400 hover:bg-green-500/8 bg-[#111518]" : "border-gray-200 text-gray-600 hover:border-green-300 hover:text-green-600 hover:bg-green-50 bg-white" : isDark ? "border-[#2a3040] text-gray-600 bg-[#111518]" : "border-gray-200 text-gray-400 bg-white"}`}
            >
              {actionLoading === "deploy" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Rocket className="w-3.5 h-3.5" />}
              Deploy Now
            </button>

            {/* Review Report */}
            <button
              onClick={handleReview}
              disabled={!!actionLoading || isRunning}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${actionLoading === "review" ? "bg-purple-500/20 border-purple-500/40 text-purple-400 animate-pulse" : canAgent ? isDark ? "border-[#2a3040] text-gray-300 hover:border-purple-500/40 hover:text-purple-400 hover:bg-purple-500/8 bg-[#111518]" : "border-gray-200 text-gray-600 hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50 bg-white" : isDark ? "border-[#2a3040] text-gray-600 bg-[#111518]" : "border-gray-200 text-gray-400 bg-white"}`}
            >
              {actionLoading === "review" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSearch className="w-3.5 h-3.5" />}
              Review Report
            </button>

            {/* Auto Agent badge */}
            {autoAgentMode && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 text-xs font-semibold flex-shrink-0 ml-auto">
                <Zap className="w-3 h-3" />
                Auto Mode ON
              </div>
            )}

          </div>

          {/* Progress bar */}
          {progressStage !== "idle" && (
            <div className={`px-4 py-2 border-b flex-shrink-0 ${isDark ? "bg-[#080c10] border-[#1e2329]" : "bg-white border-gray-200"}`}>
              {(() => {
                const stages: { id: string; label: string }[] = [
                  { id: "thinking",  label: "Thinking" },
                  { id: "scanning",  label: "Scanning" },
                  { id: "planning",  label: "Planning" },
                  { id: "fixing",    label: "Fixing" },
                  { id: "testing",   label: "Testing" },
                  { id: "review",    label: "Review" },
                  { id: "waiting",   label: "Permission" },
                  { id: "complete",  label: "Complete" },
                ];
                const idx = stages.findIndex((s) => s.id === progressStage);
                const pct = idx < 0 ? 0 : Math.round(((idx + 1) / stages.length) * 100);
                return (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[11px] font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                        {stages.find((s) => s.id === progressStage)?.label ?? progressStage}
                      </span>
                      <span className={`text-[11px] font-mono ${isDark ? "text-cyan-400" : "text-cyan-600"}`}>{pct}%</span>
                    </div>
                    <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? "bg-[#1e2329]" : "bg-gray-100"}`}>
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${progressStage === "complete" ? "bg-green-400" : "bg-gradient-to-r from-cyan-500 to-cyan-400"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 overflow-x-auto">
                      {stages.map((s, i) => (
                        <span key={s.id} className={`text-[10px] font-medium whitespace-nowrap flex-shrink-0 ${i < idx ? "text-green-400" : i === idx ? "text-cyan-400 font-bold" : textMuted}`}>
                          {i < idx ? "✓" : i === idx ? "→" : "○"} {s.label}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Action error banner */}
          {actionError && (
            <div className={`px-4 py-2.5 flex items-center justify-between border-b text-sm flex-shrink-0 ${isDark ? "bg-red-500/8 border-red-500/15 text-red-400" : "bg-red-50 border-red-200 text-red-700"}`}>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs">{actionError}</span>
              </div>
              <button onClick={() => setActionError(null)} className="text-xs ml-2 opacity-60 hover:opacity-100"><X className="w-3.5 h-3.5" /></button>
            </div>
          )}

          {/* System ready banner */}
          {!actionError && (
            <div className={`px-4 py-2 flex items-center gap-3 border-b text-xs flex-shrink-0 ${isDark ? "bg-[#060d14] border-[#1a2030]" : "bg-white border-gray-200"}`}>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className={`font-semibold ${isDark ? "text-green-400" : "text-green-600"}`}>Agent Online</span>
              </div>
              <span className={isDark ? "text-gray-700" : "text-gray-300"}>|</span>
              <div className="flex items-center gap-3 overflow-x-auto">
                {([
                  { label: "File Engine",      ok: true  },
                  { label: "TS Scan",          ok: true  },
                  { label: "Build Runner",     ok: true  },
                  { label: "Terminal AI",      ok: true  },
                  { label: "Permission Gate",  ok: true  },
                  { label: "Cloudflare DNS",   ok: true  },
                  { label: "GitHub",           ok: true  },
                  { label: "Vercel",           ok: false, pending: true },
                ] as { label: string; ok: boolean; pending?: boolean }[]).map(({ label, ok, pending }) => (
                  <span key={label} className={`flex items-center gap-1 whitespace-nowrap flex-shrink-0 ${pending ? isDark ? "text-amber-500/70" : "text-amber-600" : ok ? isDark ? "text-cyan-500/80" : "text-cyan-700" : isDark ? "text-gray-600" : "text-gray-400"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${pending ? "bg-amber-400" : ok ? "bg-cyan-400" : "bg-gray-500"}`} />
                    {label}
                    {pending && <span className={isDark ? "text-amber-600" : "text-amber-400"}>(pending)</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Scrollable area */}
          <div className="flex-1 overflow-y-auto">

            {/* ── Empty state: Hero + Prompt Card ──────────────────────── */}
            {messages.length === 0 && (
              <div className="max-w-2xl mx-auto px-4 py-8">

                {/* Hero title */}
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold mb-4 bg-cyan-500/10 border-cyan-500/25 text-cyan-400">
                    <Zap className="w-3 h-3" />
                    REAL Auto Agent Mode · Active
                  </div>
                  <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
                    What do you want to build?
                  </h1>
                  <p className={`text-sm leading-relaxed max-w-md mx-auto ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    NVR Agent reads your real code, runs builds, fixes errors, and deploys — with your permission at every risky step.
                  </p>
                </div>

                {/* Prompt card */}
                <div className={`rounded-2xl border transition-all mb-3 ${isDark ? "bg-[#111518] border-[#1e2329] focus-within:border-cyan-500/40 focus-within:shadow-[0_0_0_4px_rgba(6,182,212,0.06)]" : "bg-white border-gray-200 focus-within:border-cyan-400 focus-within:shadow-[0_0_0_4px_rgba(6,182,212,0.08)] shadow-md"}`}>

                  {/* Attached file pill */}
                  {attachedFile && (
                    <div className="px-4 pt-3">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium ${isDark ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-green-50 border-green-200 text-green-700"}`}>
                        <Paperclip className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="max-w-[220px] truncate">{attachedFile.name}</span>
                        <button onClick={() => setAttachedFile(null)} className="ml-0.5 hover:opacity-60 transition-opacity"><X className="w-3 h-3" /></button>
                      </div>
                    </div>
                  )}

                  {/* Textarea */}
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder={listening ? "Listening…" : "Ask NVR Agent to build, fix, design, deploy, or scan…"}
                    rows={4}
                    className={`w-full bg-transparent resize-none outline-none text-[15px] px-4 pt-4 pb-2 leading-relaxed ${isDark ? "text-white placeholder:text-gray-600" : "text-gray-900 placeholder:text-gray-400"} ${listening ? "placeholder:text-cyan-400" : ""}`}
                    style={{ minHeight: "110px" }}
                  />

                  {/* Bottom toolbar of prompt card */}
                  <div className={`flex items-center justify-between px-2 pb-2.5 pt-2 border-t ${borderCol}`}>
                    {/* LEFT: + file button + model selector */}
                    <div className="flex items-center gap-1 min-w-0">
                      {/* + File upload (prominent) */}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        title="Upload code files, images, zip, pdf, txt"
                        className={`p-2 rounded-xl transition-all flex-shrink-0 ${attachedFile ? "text-green-400 bg-green-500/10" : isDark ? "text-[#888] hover:text-[#00ffff] hover:bg-white/5" : "text-gray-400 hover:text-cyan-500 hover:bg-gray-50"}`}
                      >
                        <Plus className="w-[18px] h-[18px]" />
                      </button>

                      {/* Model selector */}
                      <div className="relative">
                        <button
                          onClick={() => setShowModelMenu(!showModelMenu)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all ${isDark ? "border-[#2a3040] text-gray-300 hover:border-cyan-500/40 bg-[#0b0f14]" : "border-gray-200 text-gray-600 hover:border-cyan-300 bg-gray-50"}`}
                        >
                          <Rocket className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                          <span className="hidden sm:inline max-w-32 truncate">{MODEL_INFO[model].label}</span>
                          <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform flex-shrink-0 ${showModelMenu ? "rotate-180" : ""}`} />
                        </button>
                        {showModelMenu && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowModelMenu(false)} />
                            <div className={`absolute left-0 bottom-full mb-2 w-72 rounded-2xl border shadow-2xl z-20 overflow-hidden ${isDark ? "bg-[#141920] border-[#2a3040]" : "bg-white border-gray-200"}`}>
                              {(Object.entries(MODEL_INFO) as [AgentModel, typeof MODEL_INFO[AgentModel]][]).map(([key, info]) => (
                                <button
                                  key={key}
                                  onClick={() => { setModel(key); setShowModelMenu(false); }}
                                  className={`w-full text-left px-4 py-3 text-xs transition-all flex items-start gap-3 ${model === key ? isDark ? "bg-cyan-500/10" : "bg-cyan-50" : isDark ? "hover:bg-white/5" : "hover:bg-gray-50"}`}
                                >
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
                    </div>

                    {/* RIGHT: mic + paperclip + monitor + run */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {/* Mic with waveform */}
                      <button
                        onClick={handleMic}
                        title={listening ? "Stop listening" : "Voice input"}
                        className={`p-2 rounded-xl transition-all relative ${listening ? "text-cyan-400 bg-cyan-500/10" : isDark ? "text-[#888] hover:text-[#00ffff] hover:bg-white/5" : "text-gray-400 hover:text-cyan-500 hover:bg-gray-50"}`}
                      >
                        {listening ? (
                          <span className="flex items-end gap-[2px] h-[18px] w-[18px]">
                            {[1, 2, 3, 4].map((i) => (
                              <span key={i} className="bg-cyan-400 rounded-full w-[3px] animate-bounce" style={{ height: `${6 + i * 3}px`, animationDelay: `${i * 0.1}s`, animationDuration: "0.6s" }} />
                            ))}
                          </span>
                        ) : (
                          <Mic className="w-[18px] h-[18px]" />
                        )}
                      </button>

                      {/* Paperclip */}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        title="Attach file"
                        className={`p-2 rounded-xl transition-all ${attachedFile ? "text-green-400 bg-green-500/10" : isDark ? "text-[#888] hover:text-[#00ffff] hover:bg-white/5" : "text-gray-400 hover:text-cyan-500 hover:bg-gray-50"}`}
                      >
                        <Paperclip className="w-[18px] h-[18px]" />
                      </button>

                      {/* Live Monitor toggle */}
                      <button
                        onClick={() => setLiveMonitorOpen(!liveMonitorOpen)}
                        title={liveMonitorOpen ? "Close Live Monitor" : "Open Live Monitor"}
                        className={`p-2 rounded-xl transition-all ${liveMonitorOpen ? "text-cyan-400 bg-cyan-500/10" : isDark ? "text-[#888] hover:text-[#00ffff] hover:bg-white/5" : "text-gray-400 hover:text-cyan-500 hover:bg-gray-50"}`}
                      >
                        {liveMonitorOpen ? <MonitorOff className="w-[18px] h-[18px]" /> : <Monitor className="w-[18px] h-[18px]" />}
                      </button>

                      {/* Run button */}
                      <button
                        onClick={() => handleSend()}
                        disabled={(!input.trim() && !attachedFile) || isRunning}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${(input.trim() || attachedFile) && !isRunning ? "bg-cyan-500 hover:bg-cyan-400 text-black shadow-sm active:scale-95" : isDark ? "bg-[#1e2329] text-gray-600 cursor-not-allowed" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
                      >
                        {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" />}
                        <span className="hidden sm:inline">{isRunning ? "Running…" : "Run"}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Task Categories */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
                  {TASK_CATEGORIES.map(({ icon: Icon, label, color, desc, prompt: p }) => (
                    <button
                      key={label}
                      onClick={() => setInput(p)}
                      className={`flex flex-col items-start gap-2.5 p-3.5 rounded-2xl border text-left transition-all ${isDark ? "border-[#1e2329] bg-[#0d1117] hover:border-cyan-500/30 hover:bg-[#0f1419]" : "border-gray-200 bg-white hover:border-cyan-300 hover:bg-cyan-50/30 shadow-sm"}`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        color === "blue"   ? isDark ? "bg-blue-500/15"   : "bg-blue-50"   :
                        color === "purple" ? isDark ? "bg-purple-500/15" : "bg-purple-50" :
                        color === "pink"   ? isDark ? "bg-pink-500/15"   : "bg-pink-50"   :
                                            isDark ? "bg-amber-500/15"  : "bg-amber-50"
                      }`}>
                        <Icon className={`w-4 h-4 ${
                          color === "blue"   ? "text-blue-400"   :
                          color === "purple" ? "text-purple-400" :
                          color === "pink"   ? "text-pink-400"   :
                          "text-amber-400"
                        }`} />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-semibold mb-0.5 ${isDark ? "text-white" : "text-gray-900"}`}>{label}</p>
                        <p className={`text-[11px] leading-snug ${textMuted}`}>{desc}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Quick prompt chips */}
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {QUICK_PROMPTS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setInput(p)}
                      className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${isDark ? "border-[#1e2329] bg-[#111518] text-gray-400 hover:border-cyan-500/40 hover:text-cyan-400 hover:bg-cyan-500/8" : "border-gray-200 bg-white text-gray-500 hover:border-cyan-300 hover:text-cyan-600 hover:bg-cyan-50 shadow-sm"}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                {/* Power message */}
                <p className={`text-center text-[11px] leading-relaxed max-w-lg mx-auto ${isDark ? "text-gray-600" : "text-gray-400"}`}>
                  NVR Agent — plan · build · scan · fix · deploy. Permission always required for deploy, delete, secrets, database, and server changes.
                </p>
              </div>
            )}

            {/* ── Conversation messages ─────────────────────────────────── */}
            {messages.length > 0 && (
              <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
                {messages.map((m, i) => (
                  <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    {m.role === "assistant" && (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-700 flex-shrink-0 flex items-center justify-center mt-0.5">
                        <Rocket className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${m.role === "user" ? "bg-cyan-500 text-white rounded-br-sm" : `${msgBg} rounded-bl-sm`}`}>
                      <pre className="whitespace-pre-wrap font-sans">{m.content}</pre>
                    </div>
                  </div>
                ))}

                {isRunning && (
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-700 flex-shrink-0 flex items-center justify-center">
                      <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                    </div>
                    <div className={`px-4 py-3 rounded-2xl rounded-bl-sm border ${isDark ? "bg-[#141920] border-[#1e2329]" : "bg-white border-gray-200 shadow-sm"}`}>
                      <p className="text-xs text-cyan-400 animate-pulse">NVR Agent is working… {currentStep ? `(${currentStep})` : ""}</p>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}

            {/* ── Scan Results Panel ────────────────────────────────────── */}
            {scanData && (
              <div className={`mx-4 mb-3 rounded-2xl border overflow-hidden ${isDark ? "bg-[#0d1117] border-[#1e2329]" : "bg-white border-gray-200 shadow-sm"}`}>
                <div className={`flex items-center justify-between px-4 py-3 border-b ${borderCol} ${isDark ? "bg-[#111518]" : "bg-gray-50"}`}>
                  <div className="flex items-center gap-2">
                    <Scan className="w-3.5 h-3.5 text-cyan-400" />
                    <span className={`text-xs font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Scan Results</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${scanData.severity === "critical" ? "bg-red-500/15 text-red-400" : scanData.severity === "high" ? "bg-orange-500/15 text-orange-400" : scanData.severity === "medium" ? "bg-amber-500/15 text-amber-400" : "bg-green-500/15 text-green-400"}`}>
                      {scanData.severity.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs ${textMuted}`}>{scanData.files_scanned} files · {scanData.issues_found} issues</span>
                    <button onClick={() => setScanData(null)} className={textMuted}><X className="w-3.5 h-3.5" /></button>
                  </div>
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
                  {scanData.suggested_fixes.length > 0 && (
                    <div>
                      <p className={`text-[11px] font-semibold mb-1.5 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Suggested Fixes</p>
                      {scanData.suggested_fixes.map((f, i) => (
                        <p key={i} className={`text-[11px] leading-5 ${textMuted}`}>→ {f}</p>
                      ))}
                    </div>
                  )}
                  {scanData.security_warnings.length > 0 && scanData.security_warnings[0] && (
                    <div className={`px-3 py-2 rounded-xl border ${isDark ? "bg-red-500/5 border-red-500/15" : "bg-red-50 border-red-200"}`}>
                      <p className={`text-[11px] font-semibold mb-1 ${isDark ? "text-red-300" : "text-red-700"}`}>⚠ Security Warnings</p>
                      {scanData.security_warnings.map((w, i) => (
                        <p key={i} className={`text-[11px] ${isDark ? "text-red-400/80" : "text-red-600"}`}>{w}</p>
                      ))}
                    </div>
                  )}
                  <button onClick={handleFix} disabled={!!actionLoading} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold hover:bg-amber-500/20 transition-all">
                    <Bug className="w-3.5 h-3.5" /> Fix These Errors Automatically
                  </button>
                </div>
              </div>
            )}

            {/* ── Fix Results Panel ─────────────────────────────────────── */}
            {fixData && (
              <div className={`mx-4 mb-3 rounded-2xl border overflow-hidden ${isDark ? "bg-[#0d1117] border-[#1e2329]" : "bg-white border-gray-200 shadow-sm"}`}>
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
                <div className="p-4 space-y-3">
                  <p className={`text-xs leading-relaxed ${textBase}`}>{fixData.summary}</p>
                  {fixData.changed_files.length > 0 && (
                    <div>
                      <p className={`text-[11px] font-semibold mb-1.5 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Changed Files</p>
                      <div className="flex flex-wrap gap-1">
                        {fixData.changed_files.map((f) => (
                          <span key={f} className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${isDark ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-green-50 text-green-600 border border-green-200"}`}>{f}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {fixData.skipped_files.length > 0 && (
                    <div>
                      <p className={`text-[11px] font-semibold mb-1.5 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Skipped (Sensitive)</p>
                      {fixData.skipped_files.map((f, i) => (
                        <p key={i} className={`text-[11px] font-mono ${isDark ? "text-amber-400/70" : "text-amber-600"}`}>⚠ {f}</p>
                      ))}
                    </div>
                  )}
                  {fixData.diff_preview && (
                    <div className={`px-3 py-2 rounded-xl font-mono text-[11px] leading-5 overflow-x-auto ${isDark ? "bg-[#080c10] text-gray-400 border border-[#1e2329]" : "bg-gray-50 text-gray-600 border border-gray-200"}`}>
                      <pre className="whitespace-pre-wrap">{fixData.diff_preview}</pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Review Report Panel ───────────────────────────────────── */}
            {reviewData && (
              <div className={`mx-4 mb-3 rounded-2xl border overflow-hidden ${isDark ? "bg-[#0d1117] border-[#1e2329]" : "bg-white border-gray-200 shadow-sm"}`}>
                <div className={`flex items-center justify-between px-4 py-3 border-b ${borderCol} ${isDark ? "bg-[#111518]" : "bg-gray-50"}`}>
                  <div className="flex items-center gap-2">
                    <FileSearch className="w-3.5 h-3.5 text-purple-400" />
                    <span className={`text-xs font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Review Report</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${reviewData.deployment_readiness === "ready" ? "bg-green-500/15 text-green-400" : reviewData.deployment_readiness === "needs_work" ? "bg-amber-500/15 text-amber-400" : "bg-red-500/15 text-red-400"}`}>
                      {reviewData.deployment_readiness === "ready" ? "Deploy Ready" : reviewData.deployment_readiness === "needs_work" ? "Needs Work" : "Not Ready"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold ${reviewData.readiness_score >= 80 ? "text-green-400" : reviewData.readiness_score >= 50 ? "text-amber-400" : "text-red-400"}`}>{reviewData.readiness_score}%</span>
                    <button onClick={() => setReviewData(null)} className={textMuted}><X className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {/* Readiness bar */}
                  <div>
                    <div className={`h-2 rounded-full overflow-hidden ${isDark ? "bg-[#1e2329]" : "bg-gray-100"}`}>
                      <div className={`h-full rounded-full transition-all duration-700 ${reviewData.readiness_score >= 80 ? "bg-green-400" : reviewData.readiness_score >= 50 ? "bg-amber-400" : "bg-red-400"}`} style={{ width: `${reviewData.readiness_score}%` }} />
                    </div>
                  </div>
                  <p className={`text-xs leading-relaxed ${textBase}`}>{reviewData.summary}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className={`text-[11px] font-semibold mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>✓ Scanned</p>
                      <p className={`text-[11px] ${textMuted}`}>{reviewData.scanned}</p>
                    </div>
                    <div>
                      <p className={`text-[11px] font-semibold mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>✓ Fixed</p>
                      <p className={`text-[11px] ${textMuted}`}>{reviewData.fixed}</p>
                    </div>
                  </div>
                  {reviewData.needs_attention.length > 0 && (
                    <div>
                      <p className={`text-[11px] font-semibold mb-1.5 ${isDark ? "text-amber-300" : "text-amber-700"}`}>⚠ Needs Attention</p>
                      {reviewData.needs_attention.map((item, i) => (
                        <p key={i} className={`text-[11px] leading-5 ${isDark ? "text-amber-400/70" : "text-amber-600"}`}>→ {item}</p>
                      ))}
                    </div>
                  )}
                  {reviewData.security_warnings.length > 0 && reviewData.security_warnings[0] && (
                    <div className={`px-3 py-2 rounded-xl border ${isDark ? "bg-red-500/5 border-red-500/15" : "bg-red-50 border-red-200"}`}>
                      <p className={`text-[11px] font-semibold mb-1 ${isDark ? "text-red-300" : "text-red-700"}`}>⚠ Security</p>
                      {reviewData.security_warnings.map((w, i) => (
                        <p key={i} className={`text-[11px] ${isDark ? "text-red-400/80" : "text-red-600"}`}>{w}</p>
                      ))}
                    </div>
                  )}
                  <div className={`px-3 py-2 rounded-xl ${isDark ? "bg-cyan-500/8 border border-cyan-500/15" : "bg-cyan-50 border border-cyan-200"}`}>
                    <p className={`text-[11px] font-semibold ${isDark ? "text-cyan-300" : "text-cyan-700"}`}>→ Next: {reviewData.next_action}</p>
                  </div>
                  {reviewData.deployment_readiness === "ready" && (
                    <button onClick={() => handleDeploy(false)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold hover:bg-green-500/20 transition-all">
                      <Rocket className="w-3.5 h-3.5" /> Deploy Now
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Review Report (shown after agent completes) ───────────────── */}
          {agentStatus?.status === "completed" && agentStatus.filesChanged.length > 0 && (
            <div className={`mx-4 mb-2 rounded-2xl border p-4 flex-shrink-0 ${isDark ? "bg-[#0f1a0f] border-green-500/20" : "bg-green-50 border-green-200"}`}>
              <div className="flex items-center gap-2 mb-3">
                <List className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                <span className={`text-xs font-semibold ${isDark ? "text-green-300" : "text-green-700"}`}>Review Report</span>
                <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold bg-green-500/15 text-green-400`}>Completed</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-start gap-2">
                  <GitCommit className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className={`text-[11px] font-semibold mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Files Referenced</p>
                    <div className="flex flex-wrap gap-1">
                      {agentStatus.filesChanged.map((f) => (
                        <span key={f} className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${isDark ? "bg-[#1e2329] text-cyan-400" : "bg-white text-cyan-600 border border-cyan-200"}`}>{f}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-400 flex-shrink-0" />
                  <p className={`text-[11px] ${isDark ? "text-gray-400" : "text-gray-600"}`}>Task completed. Review the output above and give the next instruction.</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Agent Terminal / Live Logs ────────────────────────────────── */}
          <div className={`border-t flex-shrink-0 ${borderCol}`}>
            {/* Terminal header */}
            <button
              onClick={() => setTerminalOpen(!terminalOpen)}
              className={`w-full flex items-center gap-2 px-4 py-2 text-xs font-medium transition-colors ${isDark ? "bg-[#080c10] text-gray-500 hover:text-gray-300" : "bg-gray-100 text-gray-400 hover:text-gray-600"}`}
            >
              <Terminal className="w-3 h-3 text-cyan-400" />
              <span className={`font-semibold ${isDark ? "text-gray-400" : "text-gray-600"}`}>Agent Terminal / Live Logs</span>
              <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded font-mono ${serverMode === "server" ? "bg-green-500/15 text-green-400" : isDark ? "bg-[#1e2329] text-gray-500" : "bg-gray-200 text-gray-500"}`}>
                {serverMode === "server" ? "● live server" : "○ simulation"}
              </span>
              {terminalOpen ? <Minimize2 className="w-3 h-3 ml-auto" /> : <Maximize2 className="w-3 h-3 ml-auto" />}
            </button>
            {terminalOpen && (
              <div className="bg-[#050810] flex flex-col" style={{ height: "160px" }}>
                {/* Scrollable log area */}
                <div className="flex-1 overflow-y-auto px-4 py-2 font-mono text-xs space-y-0.5">
                  <div className="text-gray-600">$ Local terminal connected ({serverMode === "server" ? "live server mode" : "simulation mode"})</div>
                  <div className="text-gray-600">$ NVR Agent ready. Type a safe command below or view agent logs above.</div>
                  {agentStatus?.logs.map((log, i) => (
                    <div key={i} className="text-green-400 leading-5">{log}</div>
                  ))}
                  {terminalHistory.map((entry, i) => (
                    <div key={`h_${i}`}>
                      <div className="text-cyan-400">$ {entry.cmd}</div>
                      <div className={`whitespace-pre-wrap leading-5 ${entry.blocked ? "text-red-400" : "text-green-300"}`}>{entry.out}</div>
                    </div>
                  ))}
                  {actionLoading === "terminal" && (
                    <div className="flex items-center gap-1 text-cyan-400 animate-pulse">
                      <span>$</span>
                      <span className="inline-block w-1.5 h-3 bg-cyan-400 rounded-sm animate-pulse" />
                    </div>
                  )}
                  {isRunning && !actionLoading && (
                    <div className="flex items-center gap-1 text-cyan-400 animate-pulse">
                      <span>▶ Agent working…</span>
                    </div>
                  )}
                </div>
                {/* Command input */}
                <div className={`flex items-center gap-2 border-t px-3 py-1.5 ${borderCol}`}>
                  <span className="text-green-400 font-mono text-xs flex-shrink-0">$</span>
                  <input
                    value={terminalInput}
                    onChange={(e) => setTerminalInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleTerminalRun(); }}
                    placeholder="npm run build · ls · cat file.ts · grep pattern · git status"
                    disabled={actionLoading === "terminal"}
                    className="flex-1 bg-transparent font-mono text-xs text-green-300 outline-none placeholder:text-gray-700"
                  />
                  <button
                    onClick={handleTerminalRun}
                    disabled={!terminalInput.trim() || actionLoading === "terminal"}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all flex-shrink-0 ${terminalInput.trim() && actionLoading !== "terminal" ? "bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30" : "text-gray-700 cursor-not-allowed"}`}
                  >
                    {actionLoading === "terminal" ? <Loader2 className="w-3 h-3 animate-spin" /> : "Run"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Input (conversation mode) ─────────────────────────────────── */}
          {messages.length > 0 && (
            <div className={`px-4 py-3 border-t flex-shrink-0 ${isDark ? "border-[#1e2329] bg-[#0b0f14]" : "border-gray-200 bg-white"}`}>
              {/* File attachment pill */}
              {attachedFile && (
                <div className={`inline-flex items-center gap-2 mb-2 px-3 py-1.5 rounded-xl border text-xs font-medium ${isDark ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-green-50 border-green-200 text-green-700"}`}>
                  <Paperclip className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="max-w-[200px] truncate">{attachedFile.name}</span>
                  <button onClick={() => setAttachedFile(null)} className="ml-0.5 hover:opacity-60"><X className="w-3 h-3" /></button>
                </div>
              )}
              <div className={`flex items-end rounded-[20px] border transition-all ${inputCls}`}>
                {/* Left: + file + mic */}
                <div className="flex items-center pl-2 pb-2.5 gap-0.5 flex-shrink-0">
                  <button onClick={() => fileInputRef.current?.click()} title="Attach file" className={`p-2 rounded-xl transition-all ${attachedFile ? "text-green-400 bg-green-500/10" : isDark ? "text-[#888] hover:text-[#00ffff] hover:bg-white/5" : "text-gray-400 hover:text-cyan-500 hover:bg-gray-50"}`}>
                    <Plus className="w-[18px] h-[18px]" />
                  </button>
                  <button onClick={handleMic} title={listening ? "Stop listening" : "Voice input"} className={`p-2 rounded-xl transition-all ${listening ? "text-cyan-400 bg-cyan-500/10" : isDark ? "text-[#888] hover:text-[#00ffff] hover:bg-white/5" : "text-gray-400 hover:text-cyan-500 hover:bg-gray-50"}`}>
                    {listening ? (
                      <span className="flex items-end gap-[2px] h-[18px] w-[18px]">
                        {[1,2,3,4].map((i) => (
                          <span key={i} className="bg-cyan-400 rounded-full w-[3px] animate-bounce" style={{ height: `${5 + i*3}px`, animationDelay: `${i*0.1}s`, animationDuration: "0.55s" }} />
                        ))}
                      </span>
                    ) : <Mic className="w-[18px] h-[18px]" />}
                  </button>
                </div>
                {/* Textarea */}
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder={listening ? "Listening…" : "Give NVR Agent the next task…"}
                  rows={1}
                  className={`flex-1 min-w-0 bg-transparent resize-none outline-none text-[15px] py-3 leading-relaxed ${isDark ? "text-white placeholder:text-[#555]" : "text-gray-900 placeholder:text-gray-400"} ${listening ? "placeholder:text-cyan-400" : ""}`}
                  style={{ minHeight: "46px" }}
                />
                {/* Right: paperclip + monitor + stop/run */}
                <div className="flex items-center pr-2 pb-2.5 gap-1 flex-shrink-0">
                  <button onClick={() => fileInputRef.current?.click()} title="Attach file" className={`p-2 rounded-xl transition-all ${attachedFile ? "text-green-400 bg-green-500/10" : isDark ? "text-[#888] hover:text-[#00ffff] hover:bg-white/5" : "text-gray-400 hover:text-cyan-500 hover:bg-gray-50"}`}>
                    <Paperclip className="w-[17px] h-[17px]" />
                  </button>
                  <button onClick={() => setLiveMonitorOpen(!liveMonitorOpen)} title="Live Monitor" className={`p-2 rounded-xl transition-all ${liveMonitorOpen ? "text-cyan-400 bg-cyan-500/10" : isDark ? "text-[#888] hover:text-[#00ffff] hover:bg-white/5" : "text-gray-400 hover:text-cyan-500 hover:bg-gray-50"}`}>
                    {liveMonitorOpen ? <MonitorOff className="w-[17px] h-[17px]" /> : <Monitor className="w-[17px] h-[17px]" />}
                  </button>
                  {isRunning ? (
                    <button onClick={handleStop} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 text-xs font-medium border border-red-500/20 transition-all">
                      <Square className="w-3.5 h-3.5" /> Stop
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSend()}
                      disabled={!input.trim() && !attachedFile}
                      className={`p-2.5 rounded-xl transition-all active:scale-95 ${(input.trim() || attachedFile) ? "bg-cyan-500 hover:bg-cyan-400 text-white shadow-sm" : isDark ? "bg-[#1e2329] text-gray-600 cursor-not-allowed" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Live Monitor floating panel (mobile + when toggled) ──────────── */}
        {liveMonitorOpen && (
          <div className={`absolute right-0 top-14 bottom-0 z-30 w-80 flex flex-col border-l shadow-2xl lg:hidden ${isDark ? "bg-[#111518] border-[#1e2329]" : "bg-white border-gray-200"}`}>
            <div className={`flex items-center justify-between px-4 py-2.5 border-b ${borderCol}`}>
              <div className="flex items-center gap-2">
                <Monitor className="w-3.5 h-3.5 text-cyan-400" />
                <span className={`text-xs font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Live Monitor</span>
                {isRunning && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />}
              </div>
              <button onClick={() => setLiveMonitorOpen(false)} className={textMuted}><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 font-mono text-xs bg-[#050810]">
              <div className="text-green-500">▶ Live Monitor connected</div>
              <div className={`text-gray-600`}>Mode: {serverMode === "server" ? "Live Server" : "Local (simulation)"}</div>
              {agentStatus?.logs.map((log, i) => <div key={i} className="text-green-400 leading-5">{log}</div>)}
              {isRunning && <div className="text-cyan-400 animate-pulse">▶ Agent working…</div>}
              {!isRunning && !agentStatus && <div className="text-gray-700">$ Awaiting task…</div>}
            </div>
          </div>
        )}

        {/* ── Right: Agent Power Panel (desktop) ──────────────────────────── */}
        {rightPanelOpen && (
          <div className={`hidden lg:flex flex-col w-64 xl:w-72 border-l flex-shrink-0 ${panelBg}`}>
            {/* Panel header with Live Monitor toggle */}
            <div className={`flex items-center justify-between px-4 py-2.5 border-b ${borderCol}`}>
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span className={`text-xs font-semibold uppercase tracking-wider ${textMuted}`}>
                  {liveMonitorOpen ? "Live Monitor" : "Agent Power"}
                </span>
              </div>
              <button
                onClick={() => setLiveMonitorOpen(!liveMonitorOpen)}
                title={liveMonitorOpen ? "Show Agent Power" : "Show Live Monitor"}
                className={`p-1 rounded-lg transition-all ${liveMonitorOpen ? "text-cyan-400" : textMuted + " hover:text-cyan-400"}`}
              >
                {liveMonitorOpen ? <Activity className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
              </button>
            </div>

            {liveMonitorOpen ? (
              /* ── Live Monitor content ── */
              <div className="flex-1 overflow-y-auto">
                <div className="font-mono text-xs p-3 bg-[#050810] h-full min-h-0">
                  <div className="text-green-500 mb-1">▶ Live Monitor connected</div>
                  <div className={`mb-1 ${serverMode === "server" ? "text-green-400" : "text-gray-600"}`}>
                    Mode: {serverMode === "server" ? "● Live Server" : "○ Simulation"}
                  </div>
                  <div className="text-gray-600 mb-2">───────────────</div>
                  {isRunning && (
                    <div className="text-cyan-400 animate-pulse mb-1">▶ Agent working…{currentStep ? ` (${currentStep})` : ""}</div>
                  )}
                  {agentStatus?.logs.map((log, i) => (
                    <div key={i} className="text-green-400 leading-5">{log}</div>
                  ))}
                  {!isRunning && !agentStatus && (
                    <>
                      <div className="text-gray-700">$ NVR Agent ready.</div>
                      <div className="text-gray-700">$ Logs will appear here…</div>
                    </>
                  )}
                  {agentStatus?.status === "completed" && (
                    <div className="text-green-300 mt-1">✓ Task completed successfully.</div>
                  )}
                  {isRunning && (
                    <div className="flex items-center gap-1 text-cyan-400 mt-1 animate-pulse">
                      <span>$</span>
                      <span className="inline-block w-1.5 h-3 bg-cyan-400 animate-pulse rounded-sm" />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* ── Agent Power content ── */
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {/* Status card */}
                <div className={`rounded-2xl border p-4 ${cardBg}`}>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs ${textMuted}`}>Current Mode</span>
                      <span className={`text-xs font-semibold ${isDark ? "text-cyan-400" : "text-cyan-600"}`}>NVR Agent</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs ${textMuted}`}>Status</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        isRunning ? "bg-cyan-500/15 text-cyan-400"
                        : agentStatus?.status === "completed" ? "bg-green-500/15 text-green-400"
                        : agentStatus?.status === "waiting_permission" ? "bg-amber-500/15 text-amber-400"
                        : isDark ? "bg-white/5 text-gray-400" : "bg-gray-100 text-gray-500"
                      }`}>{statusLabel}</span>
                    </div>
                    {isRunning && (
                      <div className="flex items-center justify-between">
                        <span className={`text-xs ${textMuted}`}>Elapsed</span>
                        <span className="text-xs font-mono text-cyan-400">{fmtTime(elapsed)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className={`text-xs ${textMuted}`}>Safety</span>
                      <span className={`text-xs ${isDark ? "text-amber-400" : "text-amber-600"}`}>Permission required</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs ${textMuted}`}>Live Deploy</span>
                      <span className="text-xs text-green-400">Available</span>
                    </div>
                  </div>
                </div>

                {/* Local / Server mode toggle */}
                <div className={`rounded-2xl border p-4 ${cardBg}`}>
                  <p className={`text-xs font-semibold mb-3 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Environment Mode</p>
                  <div className={`flex rounded-xl overflow-hidden border ${borderCol}`}>
                    <button
                      onClick={() => setServerMode("local")}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-all ${serverMode === "local" ? "bg-cyan-500 text-black" : isDark ? "text-gray-400 hover:bg-white/5" : "text-gray-500 hover:bg-gray-50"}`}
                    >
                      <Laptop className="w-3 h-3" />
                      Local
                    </button>
                    <button
                      onClick={() => setServerMode("server")}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-all ${serverMode === "server" ? "bg-cyan-500 text-black" : isDark ? "text-gray-400 hover:bg-white/5" : "text-gray-500 hover:bg-gray-50"}`}
                    >
                      <Globe className="w-3 h-3" />
                      Live Server
                    </button>
                  </div>
                  <p className={`text-[11px] mt-2 leading-relaxed ${textMuted}`}>
                    {serverMode === "server"
                      ? "Connected to live server environment"
                      : "Running on local machine (Mac / PC / Phone)"}
                  </p>
                </div>

                {/* Model info */}
                <div className={`rounded-2xl border p-4 ${cardBg}`}>
                  <p className={`text-xs font-semibold mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Active Model</p>
                  <div className="flex items-center gap-2 mb-1">
                    <Rocket className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                    <span className={`text-xs font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{MODEL_INFO[model].label}</span>
                  </div>
                  <p className={`text-xs ${textMuted} leading-relaxed`}>{MODEL_INFO[model].desc}</p>
                </div>

                {/* Steps */}
                {agentStatus?.steps && agentStatus.steps.length > 0 && (
                  <div className={`rounded-2xl border p-4 ${cardBg}`}>
                    <p className={`text-xs font-semibold mb-3 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Progress</p>
                    <div className="space-y-2">
                      {agentStatus.steps.map((step, i) => (
                        <div key={i} className="flex items-center gap-2.5">
                          {step.status === "done"    && <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />}
                          {step.status === "running" && <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin flex-shrink-0" />}
                          {step.status === "pending" && <div className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 ${isDark ? "border-[#2a3040]" : "border-gray-200"}`} />}
                          <span className={`text-xs ${step.status === "running" ? "text-cyan-400 font-medium" : step.status === "done" ? (isDark ? "text-gray-400" : "text-gray-500") : textMuted}`}>
                            {step.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Safety note */}
                <div className={`rounded-2xl border p-4 ${isDark ? "bg-amber-500/5 border-amber-500/15" : "bg-amber-50 border-amber-200"}`}>
                  <div className="flex items-start gap-2">
                    <Shield className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className={`text-xs font-semibold mb-1.5 ${isDark ? "text-amber-300" : "text-amber-700"}`}>Safety First</p>
                      <ul className={`text-[11px] leading-relaxed space-y-0.5 ${isDark ? "text-amber-400/70" : "text-amber-600"}`}>
                        {["deploy", "delete", "payment", "database", "secrets", "server changes"].map((item) => (
                          <li key={item} className="flex items-center gap-1.5">
                            <AlertCircle className="w-2.5 h-2.5 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Powered-by badge */}
                <div className={`rounded-2xl border p-3 flex items-center gap-2.5 ${isDark ? "bg-cyan-500/5 border-cyan-500/15" : "bg-cyan-50 border-cyan-200"}`}>
                  <Zap className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                  <div>
                    <p className={`text-[11px] font-semibold ${isDark ? "text-cyan-300" : "text-cyan-700"}`}>NVR Agent Engine</p>
                    <p className={`text-[10px] leading-snug ${isDark ? "text-cyan-500/70" : "text-cyan-600"}`}>Powered by GPT-4o · Scan, Fix, Review, Deploy</p>
                  </div>
                </div>

                {/* Stop button if running */}
                {isRunning && (
                  <button
                    onClick={handleStop}
                    className="w-full py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 text-sm font-semibold border border-red-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Square className="w-4 h-4" /> Stop Agent
                  </button>
                )}
              </div>
            )}

            {/* Secret button at bottom */}
            <div className={`border-t p-3 ${borderCol}`}>
              <button
                onClick={() => setShowSecretModal(true)}
                className={`w-full flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${isDark ? "bg-[#1e2329] text-gray-400 hover:text-white hover:bg-[#252d38]" : "bg-gray-50 text-gray-500 hover:text-gray-800 hover:bg-gray-100"}`}
              >
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                Manage Secrets
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.txt,.md,.json,.ts,.tsx,.js,.jsx,.py,.sh,.yaml,.yml"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
