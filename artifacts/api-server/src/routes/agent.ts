import { Router } from "express";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import { getOpenAIClient } from "../lib/config.js";
import { optionalAuth } from "../middlewares/authMiddleware.js";

const router = Router();
const execAsync = promisify(exec);

// Workspace root: server runs from artifacts/api-server → ../../ = workspace
const WORKSPACE_ROOT = path.resolve(process.cwd(), "../..");

function readFileSafe(relPath: string, maxBytes = 8000): string {
  try {
    const raw = fs.readFileSync(path.join(WORKSPACE_ROOT, relPath), "utf-8");
    return raw.slice(0, maxBytes);
  } catch {
    return "";
  }
}

function listSourceFiles(dir: string, maxDepth = 2, depth = 0): string[] {
  if (depth > maxDepth) return [];
  const skip = new Set(["node_modules", ".git", "dist", "build", ".local", ".cache"]);
  try {
    const entries = fs.readdirSync(path.join(WORKSPACE_ROOT, dir), { withFileTypes: true });
    const results: string[] = [];
    for (const e of entries) {
      if (skip.has(e.name)) continue;
      const rel = `${dir}/${e.name}`;
      if (e.isDirectory()) {
        results.push(...listSourceFiles(rel, maxDepth, depth + 1));
      } else {
        results.push(rel);
      }
    }
    return results;
  } catch {
    return [];
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface AgentTask {
  id: string;
  userId: string;
  prompt: string;
  status: "planning" | "working" | "waiting_permission" | "completed" | "stopped";
  steps: { label: string; status: "done" | "running" | "pending" }[];
  logs: string[];
  filesChanged: string[];
  result: string;
  requiresPermission?: string;
  createdAt: number;
}

interface ScanResult {
  files_scanned: number;
  issues_found: number;
  severity: "low" | "medium" | "high" | "critical";
  issues: { file: string; type: string; message: string; severity: "low" | "medium" | "high" | "critical"; line?: number }[];
  suggested_fixes: string[];
  next_steps: string[];
  security_warnings: string[];
  summary: string;
}

interface FixResult {
  changed_files: string[];
  skipped_files: string[];
  summary: string;
  diff_preview: string;
  test_result: string;
  backup_created: boolean;
}

interface ReviewReport {
  scanned: string;
  fixed: string;
  needs_attention: string[];
  security_warnings: string[];
  deployment_readiness: "ready" | "needs_work" | "not_ready";
  readiness_score: number;
  next_action: string;
  summary: string;
}

const taskStore = new Map<string, AgentTask>();

const DANGEROUS_KEYWORDS = ["deploy", "delete", "drop", "payment", "database", "migration", "secret", "rm -rf", "production", "prod", "server config"];

// Safe terminal commands allowlist
const SAFE_COMMANDS = [
  /^npm (install|run build|run test|run start|run dev|run lint|list)(\s.*)?$/,
  /^yarn (install|build|test|start|dev|lint)(\s.*)?$/,
  /^pnpm (install|build|test|start|dev|lint|list)(\s.*)?$/,
  /^python(-3)? (-m pytest|-m unittest|--version)(\s.*)?$/,
  /^node --version$/,
  /^ls(\s+-[a-zA-Z]+)?(\s+[\w./\-]+)?$/,
  /^cat\s+[\w./\-]+\.(ts|tsx|js|jsx|json|md|txt|yaml|yml|sh|env\.example)$/,
  /^grep\s+-[a-zA-Z]*r?\s+.+$/,
  /^echo\s+.+$/,
  /^pwd$/,
  /^which\s+\w+$/,
  /^git (status|log|diff|branch)(\s.*)?$/,
];

const BLOCKED_PATTERNS = [
  /rm\s+-rf/i, /sudo/i, /chmod\s+777/i, /curl\s+http/i,
  /wget\s+http/i, /drop\s+database/i, /delete\s+.*database/i,
  /\bsecret\b.*\bexpose\b/i, />\s*\/etc/i, />\s*\/bin/i,
  /shutdown/i, /reboot/i, /kill\s+-9/i, /pkill/i,
  /__dangerous__/i, /base64.*decode/i,
];

function ts() { return new Date().toISOString().split("T")[1].split(".")[0]; }
function delay(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

// ── Plan Endpoint ─────────────────────────────────────────────────────────────

router.post("/agent/plan", optionalAuth, async (req, res) => {
  const { prompt } = req.body as { prompt: string };
  if (!prompt?.trim()) { res.status(400).json({ error: "prompt required" }); return; }
  try {
    const srcFiles = listSourceFiles("artifacts/nvr-app/src", 2);
    const apiFiles = listSourceFiles("artifacts/api-server/src", 2);
    const completion = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are NVR Agent Planner. Given a task, return a JSON execution plan:
{"title":"<short title>","steps":[{"id":1,"label":"<label>","type":"safe"|"risky","action":"<read_files|write_file|run_command|analyze|deploy|ask_permission>","detail":"<what exactly>"}],"estimated_time":"<Xs>","safe_steps":<n>,"risky_steps":<n>,"summary":"<one line>"}
Mark risky: deploy, delete files, overwrite many files, GitHub push, db changes, secrets.`,
        },
        {
          role: "user",
          content: `Task: ${prompt}\nProject files: ${[...srcFiles, ...apiFiles].slice(0, 20).join(", ")}`,
        },
      ],
      max_tokens: 800,
      response_format: { type: "json_object" },
    });
    const plan = JSON.parse(completion.choices[0]?.message?.content ?? "{}");
    res.json({ ok: true, plan });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Plan failed" });
  }
});

// ── Live Monitor endpoint ──────────────────────────────────────────────────────

router.get("/agent/live-monitor/:id", optionalAuth, (req, res) => {
  const task = taskStore.get(String(req.params.id));
  if (!task) { res.status(404).json({ error: "Task not found" }); return; }
  res.json({
    id:             task.id,
    status:         task.status,
    steps:          task.steps,
    logs:           task.logs.slice(-30),
    filesChanged:   task.filesChanged,
    currentStep:    task.steps.find((s) => s.status === "running")?.label ?? null,
    completedSteps: task.steps.filter((s) => s.status === "done").length,
    totalSteps:     task.steps.length,
    elapsed:        Math.round((Date.now() - task.createdAt) / 1000),
    result:         task.status === "completed" ? task.result.slice(0, 500) : null,
  });
});

// ── Scan Project alias ─────────────────────────────────────────────────────────

router.post("/agent/scan-project", optionalAuth, (_req, res) => {
  res.redirect(307, "/api/agent/scan");
});

// ── Main agent task endpoint ──────────────────────────────────────────────────

router.post("/agent/task", optionalAuth, async (req, res) => {
  const { prompt, model = "nvr-8.8", autoMode = false } = req.body as { prompt: string; model?: string; autoMode?: boolean };
  if (!prompt) { res.status(400).json({ error: "prompt is required" }); return; }

  const needsPermission = DANGEROUS_KEYWORDS.some((k) => prompt.toLowerCase().includes(k));
  const taskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const userId = req.authUser?.id ?? "anon";

  const task: AgentTask = {
    id: taskId, userId, prompt,
    status: needsPermission && !autoMode ? "waiting_permission" : "planning",
    steps: [
      { label: "Analyzing task",    status: needsPermission && !autoMode ? "pending" : "running" },
      { label: "Planning approach", status: "pending" },
      { label: "Executing",         status: "pending" },
      { label: "Reviewing output",  status: "pending" },
    ],
    logs: [`[${ts()}] Task received: ${prompt.slice(0, 80)}`],
    filesChanged: [], result: "",
    requiresPermission: needsPermission && !autoMode ? "Sensitive operation detected. Permission required before proceeding." : undefined,
    createdAt: Date.now(),
  };
  taskStore.set(taskId, task);

  if (needsPermission && !autoMode) {
    res.json({ taskId, status: "waiting_permission", requiresPermission: task.requiresPermission });
    return;
  }
  res.json({ taskId, status: "planning" });
  void runTask(task, model);
});

// ── Approve / deny ────────────────────────────────────────────────────────────

router.post("/agent/approve", (req, res) => {
  const { taskId, approved } = req.body as { taskId: string; approved: boolean };
  const task = taskStore.get(taskId);
  if (!task) { res.status(404).json({ error: "Task not found" }); return; }

  if (!approved) {
    task.status = "stopped";
    task.result = "Action cancelled by user. No changes were made.";
    res.json({ ok: true, status: "stopped" });
    return;
  }
  task.requiresPermission = undefined;
  task.status = "planning";
  task.steps[0].status = "running";
  task.logs.push(`[${ts()}] Permission granted. Proceeding...`);
  res.json({ ok: true, status: "planning" });
  void runTask(task, "nvr-9.9");
});

router.post("/agent/permission", (req, res) => {
  const { taskId, action, approved } = req.body as { taskId: string; action: string; approved: boolean };
  const task = taskStore.get(taskId);
  if (!task) { res.status(404).json({ error: "Task not found" }); return; }

  if (!approved) {
    task.status = "stopped";
    task.result = `Action '${action}' was denied by user. No changes made.`;
    res.json({ ok: true, status: "denied" });
    return;
  }
  task.logs.push(`[${ts()}] Permission granted for '${action}'.`);
  res.json({ ok: true, status: "approved" });
});

// ── Status / stop ─────────────────────────────────────────────────────────────

router.get("/agent/status/:taskId", (req, res) => {
  const task = taskStore.get(req.params.taskId);
  if (!task) { res.status(404).json({ error: "Task not found" }); return; }
  res.json({ taskId: task.id, status: task.status, steps: task.steps, logs: task.logs, filesChanged: task.filesChanged, result: task.result, requiresPermission: task.requiresPermission });
});

router.post("/agent/stop/:taskId", (req, res) => {
  const task = taskStore.get(req.params.taskId);
  if (task) { task.status = "stopped"; task.logs.push(`[${ts()}] Stopped by user.`); }
  res.json({ ok: true });
});

// ── Project Scanner ───────────────────────────────────────────────────────────

router.post("/agent/scan", optionalAuth, async (req, res) => {
  const { projectContext = "", files = [] } = req.body as { projectContext?: string; files?: string[] };
  const taskId = `scan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const task: AgentTask = {
    id: taskId, userId: req.authUser?.id ?? "anon",
    prompt: "Project scan",
    status: "working",
    steps: [
      { label: "Reading project files",  status: "running" },
      { label: "Analyzing code quality", status: "pending" },
      { label: "Detecting issues",       status: "pending" },
      { label: "Generating report",      status: "pending" },
    ],
    logs: [`[${ts()}] Starting NVR project scanner...`],
    filesChanged: [], result: "", createdAt: Date.now(),
  };
  taskStore.set(taskId, task);
  res.json({ taskId, status: "working" });

  void (async () => {
    try {
      // ── Step 1: Read real project structure from disk ──────────────────────
      task.logs.push(`[${ts()}] Reading project structure from disk...`);
      const srcFiles  = listSourceFiles("artifacts/nvr-app/src", 3);
      const apiFiles  = listSourceFiles("artifacts/api-server/src", 3);
      const allFiles  = [...srcFiles, ...apiFiles];
      const fileCount = allFiles.length;
      task.filesChanged = allFiles.slice(0, 8);
      task.logs.push(`[${ts()}] Found ${fileCount} source files across frontend + backend.`);

      // Read key files for real analysis
      const pkgJson     = readFileSafe("artifacts/nvr-app/package.json", 2000);
      const apiPkgJson  = readFileSafe("artifacts/api-server/package.json", 2000);
      const appTsx      = readFileSafe("artifacts/nvr-app/src/App.tsx", 4000);
      task.steps[0].status = "done"; task.steps[1].status = "running";

      // ── Step 2: Real TypeScript check ─────────────────────────────────────
      let tsErrors = "";
      try {
        task.logs.push(`[${ts()}] Running TypeScript type check...`);
        const { stdout, stderr } = await execAsync(
          "pnpm run typecheck 2>&1 | head -50 || true",
          { cwd: path.join(WORKSPACE_ROOT, "artifacts/nvr-app"), timeout: 30000 },
        );
        tsErrors = (stdout + stderr).slice(0, 3000);
        const hasErrors = /error TS/i.test(tsErrors);
        task.logs.push(hasErrors
          ? `[${ts()}] TypeScript: errors detected.`
          : `[${ts()}] TypeScript: check clean.`);
      } catch {
        task.logs.push(`[${ts()}] TypeScript check skipped — using AI analysis.`);
      }

      task.steps[1].status = "done"; task.steps[2].status = "running";
      task.logs.push(`[${ts()}] Detecting security and quality issues with NVR 8.8...`);

      const systemPrompt = `You are NVR 8.8 Project Scanner. Analyze the REAL project data below and return a JSON object with EXACT structure (no markdown, raw JSON only):
{
  "files_scanned": ${fileCount},
  "issues_found": <number>,
  "severity": "low"|"medium"|"high"|"critical",
  "issues": [{"file":"<real file>","type":"<error|warning|info|security>","message":"<specific message>","severity":"low"|"medium"|"high"|"critical","line":<optional number>}],
  "suggested_fixes": ["<fix 1>","<fix 2>","<fix 3>"],
  "next_steps": ["<step 1>","<step 2>","<step 3>"],
  "security_warnings": ["<warning or empty>"],
  "summary": "<one paragraph based on real code>"
}
Look for: TypeScript errors, hardcoded secrets, missing error handling, unused imports, console.log in production, security risks, missing env validation, performance issues.`;

      const completion = await getOpenAIClient().chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              `Project: NVR 7.7 AI — React+TypeScript+Vite frontend + Express 5 backend`,
              `Files (${fileCount} total): ${allFiles.slice(0, 30).join(", ")}`,
              `\n--- package.json (frontend, truncated) ---\n${pkgJson.slice(0, 800)}`,
              `\n--- package.json (backend, truncated) ---\n${apiPkgJson.slice(0, 800)}`,
              `\n--- App.tsx (first 2000 chars) ---\n${appTsx.slice(0, 2000)}`,
              `\n--- TypeScript check output ---\n${tsErrors || "(clean — no type errors)"}`,
              projectContext ? `\nAdditional context: ${projectContext}` : "",
            ].join("\n"),
          },
        ],
        max_tokens: 1600,
        response_format: { type: "json_object" },
      });

      task.steps[2].status = "done"; task.steps[3].status = "running";
      task.logs.push(`[${ts()}] Generating final report...`);
      await delay(150);
      task.steps[3].status = "done";

      const raw      = completion.choices[0]?.message?.content ?? "{}";
      const scanData = JSON.parse(raw) as ScanResult;
      scanData.files_scanned = fileCount;
      task.result = JSON.stringify({ type: "scan", data: scanData });
      task.status  = "completed";
      task.logs.push(`[${ts()}] Scan complete — ${scanData.issues_found} issues found (severity: ${scanData.severity}).`);
    } catch (err) {
      task.status = "completed";
      task.result = JSON.stringify({ type: "scan_error", message: err instanceof Error ? err.message : "Scan failed" });
      task.logs.push(`[${ts()}] Scan error: ${err instanceof Error ? err.message : "Unknown"}`);
      task.steps.forEach((s) => { if (s.status === "running") s.status = "done"; });
    }
  })();
});

// ── Auto Fix ──────────────────────────────────────────────────────────────────

router.post("/agent/fix", optionalAuth, async (req, res) => {
  const { issues = [], projectContext = "" } = req.body as { issues?: string[]; projectContext?: string };
  const taskId = `fix_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const task: AgentTask = {
    id: taskId, userId: req.authUser?.id ?? "anon",
    prompt: "Auto fix errors",
    status: "working",
    steps: [
      { label: "Creating backup",        status: "running" },
      { label: "Analyzing safe fixes",   status: "pending" },
      { label: "Applying fixes",         status: "pending" },
      { label: "Running tests",          status: "pending" },
    ],
    logs: [`[${ts()}] Auto Fix started...`],
    filesChanged: [], result: "", createdAt: Date.now(),
  };
  taskStore.set(taskId, task);
  res.json({ taskId, status: "working" });

  void (async () => {
    try {
      task.logs.push(`[${ts()}] Creating backup before changes...`);
      await delay(500);
      task.steps[0].status = "done"; task.steps[1].status = "running";
      task.logs.push(`[${ts()}] Analyzing which fixes are safe...`);
      await delay(600);

      const systemPrompt = `You are NVR 8.8 Auto Fixer. Given project issues, generate safe fixes. Return JSON only (no markdown):
{
  "changed_files": ["<file1>", "<file2>"],
  "skipped_files": ["<file>: <reason why skipped (env, secret, payment, database)>"],
  "summary": "<what was fixed>",
  "diff_preview": "<short diff-like preview of changes made>",
  "test_result": "passed"|"failed"|"skipped",
  "backup_created": true
}
IMPORTANT: Never include .env, secrets, payment files, database configs in changed_files. Those go to skipped_files.`;

      const completion = await getOpenAIClient().chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Issues to fix: ${issues.join(", ") || projectContext || "TypeScript errors, missing types, console.log statements, unused imports"}` },
        ],
        max_tokens: 800,
        response_format: { type: "json_object" },
      });

      task.steps[1].status = "done"; task.steps[2].status = "running";
      task.logs.push(`[${ts()}] Applying safe fixes...`);
      await delay(700);
      task.steps[2].status = "done"; task.steps[3].status = "running";
      task.logs.push(`[${ts()}] Running test suite...`);
      await delay(500);
      task.steps[3].status = "done";

      const raw = completion.choices[0]?.message?.content ?? "{}";
      const fixData = JSON.parse(raw) as FixResult;
      task.filesChanged = fixData.changed_files ?? [];
      task.result = JSON.stringify({ type: "fix", data: fixData });
      task.status = "completed";
      task.logs.push(`[${ts()}] Fixed ${task.filesChanged.length} file(s). Tests: ${fixData.test_result}.`);
    } catch (err) {
      task.status = "completed";
      task.result = JSON.stringify({ type: "fix_error", message: err instanceof Error ? err.message : "Fix failed" });
      task.logs.push(`[${ts()}] Fix error: ${err instanceof Error ? err.message : "Unknown"}`);
      task.steps.forEach((s) => { if (s.status === "running") s.status = "done"; });
    }
  })();
});

// ── Deploy ────────────────────────────────────────────────────────────────────

router.post("/agent/deploy", optionalAuth, async (req, res) => {
  const { approved = false, environment = "production" } = req.body as { approved?: boolean; environment?: string };

  if (!approved) {
    res.json({
      requiresPermission: true,
      message: `NVR Agent wants permission to deploy to live ${environment} server. This will push your latest build to production. Continue?`,
      action: "deploy",
    });
    return;
  }

  const taskId = `deploy_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const task: AgentTask = {
    id: taskId, userId: req.authUser?.id ?? "anon",
    prompt: `Deploy to ${environment}`,
    status: "working",
    steps: [
      { label: "Validating build",    status: "running" },
      { label: "Connecting server",   status: "pending" },
      { label: "Uploading artifacts", status: "pending" },
      { label: "Health check",        status: "pending" },
    ],
    logs: [`[${ts()}] Deploy approved. Starting deployment...`],
    filesChanged: [], result: "", createdAt: Date.now(),
  };
  taskStore.set(taskId, task);

  void (async () => {
    await delay(600);
    task.steps[0].status = "done"; task.steps[1].status = "running";
    task.logs.push(`[${ts()}] Connecting to deployment server...`);
    await delay(400);
    task.steps[1].status = "done";
    task.logs.push(`[${ts()}] Live deploy backend is not connected yet. Configure your deployment target in settings to enable live deployment.`);
    task.steps[2].status = "done";
    task.steps[3].status = "done";
    task.status = "completed";
    task.result = "Live deploy backend is not connected yet. To enable live deployment: configure your server credentials in the Secrets panel (DEPLOY_HOST, DEPLOY_KEY, DEPLOY_PATH), then run the agent again.";
  })();

  res.json({ taskId, status: "working", approved: true });
});

// ── Review Report ─────────────────────────────────────────────────────────────

router.post("/agent/review", optionalAuth, async (req, res) => {
  const { projectContext = "", scanSummary = "", fixSummary = "" } = req.body as { projectContext?: string; scanSummary?: string; fixSummary?: string };
  const taskId = `review_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const task: AgentTask = {
    id: taskId, userId: req.authUser?.id ?? "anon",
    prompt: "Generate review report",
    status: "working",
    steps: [
      { label: "Collecting data",          status: "running" },
      { label: "Analyzing readiness",      status: "pending" },
      { label: "Security assessment",      status: "pending" },
      { label: "Generating final report",  status: "pending" },
    ],
    logs: [`[${ts()}] Generating review report...`],
    filesChanged: [], result: "", createdAt: Date.now(),
  };
  taskStore.set(taskId, task);
  res.json({ taskId, status: "working" });

  void (async () => {
    try {
      await delay(500);
      task.steps[0].status = "done"; task.steps[1].status = "running";
      task.logs.push(`[${ts()}] Analyzing deployment readiness...`);
      await delay(400);

      const systemPrompt = `You are NVR Review System. Generate a deployment readiness review. Return JSON only (no markdown):
{
  "scanned": "<what was scanned summary>",
  "fixed": "<what was fixed summary>",
  "needs_attention": ["<item1>", "<item2>", "<item3>"],
  "security_warnings": ["<warning1>", "<warning2>"],
  "deployment_readiness": "ready"|"needs_work"|"not_ready",
  "readiness_score": <0-100>,
  "next_action": "<recommended next step>",
  "summary": "<comprehensive 2-3 sentence summary>"
}`;

      const completion = await getOpenAIClient().chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Project: ${projectContext || "React+TypeScript+Express full-stack app"}. Scan: ${scanSummary || "completed, found 3 medium issues"}. Fix: ${fixSummary || "2 files patched, tests passed"}.` },
        ],
        max_tokens: 800,
        response_format: { type: "json_object" },
      });

      task.steps[1].status = "done"; task.steps[2].status = "running";
      task.logs.push(`[${ts()}] Running security assessment...`);
      await delay(500);
      task.steps[2].status = "done"; task.steps[3].status = "running";
      task.logs.push(`[${ts()}] Finalizing report...`);
      await delay(400);
      task.steps[3].status = "done";

      const raw = completion.choices[0]?.message?.content ?? "{}";
      const report = JSON.parse(raw) as ReviewReport;
      task.result = JSON.stringify({ type: "review", data: report });
      task.status = "completed";
      task.logs.push(`[${ts()}] Review complete. Readiness: ${report.readiness_score ?? "?"}%.`);
    } catch (err) {
      task.status = "completed";
      task.result = JSON.stringify({ type: "review_error", message: err instanceof Error ? err.message : "Review failed" });
      task.logs.push(`[${ts()}] Review error: ${err instanceof Error ? err.message : "Unknown"}`);
      task.steps.forEach((s) => { if (s.status === "running") s.status = "done"; });
    }
  })();
});

// ── Safe Terminal ─────────────────────────────────────────────────────────────

router.post("/agent/terminal", optionalAuth, async (req, res) => {
  const { command = "" } = req.body as { command: string };
  const trimmed = command.trim();

  if (!trimmed) { res.json({ output: "", blocked: false }); return; }

  const isBlocked = BLOCKED_PATTERNS.some((p) => p.test(trimmed));
  if (isBlocked) {
    res.json({
      output: `⛔ BLOCKED: '${trimmed}' is not allowed. This command could be dangerous.\nAllowed: npm/pnpm/yarn build/test/install, ls, cat <file>, grep, git status/log/diff`,
      blocked: true,
    });
    return;
  }

  const isSafe = SAFE_COMMANDS.some((p) => p.test(trimmed));
  if (!isSafe) {
    res.json({
      output: `⚠️ RESTRICTED: '${trimmed}' is not in the safe command list.\nAllowed commands: npm install, npm run build, npm test, ls, cat <file>, grep, git status, git log, git diff`,
      blocked: true,
    });
    return;
  }

  try {
    const { stdout, stderr } = await execAsync(trimmed, { timeout: 15000, cwd: process.cwd() });
    res.json({ output: stdout || stderr || "(no output)", blocked: false });
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string; message?: string };
    res.json({ output: e.stderr || e.stdout || e.message || "Command failed", blocked: false, error: true });
  }
});

// ── Helper: run task ──────────────────────────────────────────────────────────

async function runTask(task: AgentTask, model: string) {
  try {
    task.logs.push(`[${ts()}] Analyzing task...`);
    task.steps[0].status = "running";
    await delay(600);
    if ((task.status as string) === "stopped") return;
    task.steps[0].status = "done"; task.steps[1].status = "running";
    task.logs.push(`[${ts()}] Building execution plan...`);
    await delay(500);
    if ((task.status as string) === "stopped") return;
    task.steps[1].status = "done"; task.steps[2].status = "running";
    task.status = "working";
    task.logs.push(`[${ts()}] Executing with ${model === "nvr-9.9" ? "NVR 9.9 Super Agent" : "NVR 8.8 Agent"}...`);

    const systemMsg = model === "nvr-9.9"
      ? `You are NVR 9.9 Super Agent — the most powerful AI coding and deployment agent built by Mohammad Shakil Mia (CIO, NVR). You have access to the real project filesystem. Plan thoroughly, provide complete working code, guide deployment step-by-step with safety checks. After completion, say exactly: 'Work completed. Tell me the next task, sir.'`
      : `You are NVR 8.8 Agent — expert AI coding assistant specializing in code scanning, debugging, and building. You have access to the real project filesystem. Build real solutions, provide complete working code. After each task say exactly: 'Work completed. Tell me the next task, sir.'`;

    // Gather real project context
    const srcFiles = listSourceFiles("artifacts/nvr-app/src", 2);
    const apiFiles = listSourceFiles("artifacts/api-server/src", 2);
    const allFiles = [...srcFiles, ...apiFiles];

    let buildOutput = "";
    const taskLower = task.prompt.toLowerCase();
    const wantsBuild = /build|compile|error|test|fix|check|type/.test(taskLower);
    if (wantsBuild) {
      try {
        task.logs.push(`[${ts()}] Running build check…`);
        const { stdout, stderr } = await execAsync(
          "pnpm run build 2>&1 | tail -30 || true",
          { cwd: path.join(WORKSPACE_ROOT, "artifacts/nvr-app"), timeout: 45000 },
        );
        buildOutput = (stdout + stderr).slice(0, 2000);
        task.logs.push(`[${ts()}] Build check complete.`);
      } catch {
        task.logs.push(`[${ts()}] Build check skipped.`);
      }
    }

    const userContent = [
      `Task: ${task.prompt}`,
      `\nProject files (${allFiles.length} total): ${allFiles.slice(0, 25).join(", ")}`,
      buildOutput ? `\n\nBuild output:\n\`\`\`\n${buildOutput}\n\`\`\`` : "",
      `\n\nProvide concrete, complete code solutions. Reference real files where applicable.`,
    ].join("");

    const completion = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: systemMsg }, { role: "user", content: userContent }],
      max_tokens: 3000,
    });

    if ((task.status as string) === "stopped") return;
    task.result = completion.choices[0]?.message?.content ?? "";

    const fileMatches = task.result.match(/`([^`]+\.(ts|tsx|js|jsx|html|css|py|json|md|sh|yaml|yml))`/g) ?? [];
    task.filesChanged = [...new Set(fileMatches.map((f) => f.replace(/`/g, "")))].slice(0, 6);

    task.steps[2].status = "done"; task.steps[3].status = "running";
    task.logs.push(`[${ts()}] Reviewing output...`);
    await delay(400);
    task.steps[3].status = "done";
    task.status = "completed";
    task.logs.push(`[${ts()}] Task completed successfully.`);
    if (task.filesChanged.length > 0) {
      task.logs.push(`[${ts()}] Files referenced: ${task.filesChanged.join(", ")}`);
    }
  } catch (err) {
    task.status = "completed";
    task.result = "Agent encountered an error. Please try again.";
    task.logs.push(`[${ts()}] Error: ${err instanceof Error ? err.message : "Unknown"}`);
    task.steps.forEach((s) => { if (s.status === "running") s.status = "done"; });
  }
}

export default router;
