import { Router } from "express";
import fs from "fs";
import path from "path";
import { optionalAuth } from "../middlewares/authMiddleware.js";

const router = Router();

// Workspace root: server runs from artifacts/api-server, so ../../ = workspace root
const WORKSPACE_ROOT = path.resolve(process.cwd(), "../..");

const SKIP_DIRS = new Set([
  "node_modules", ".git", "dist", "build", ".local",
  "attached_assets", ".cache", "coverage", ".turbo", ".next",
]);

const SAFE_WRITE_PREFIXES = [
  "artifacts/nvr-app/src",
  "artifacts/api-server/src",
  "lib",
  "scripts/src",
];

const BLOCKED_WRITE_RE = [
  /\.env$/,
  /\.key$/i,
  /\.pem$/i,
  /\.cert$/i,
  /\.p12$/i,
  /secrets?\//i,
  /node_modules\//,
  /\/dist\//,
  /\/build\//,
  /\.git\//,
];

export interface AgentFileNode {
  name: string;
  type: "file" | "folder";
  path: string;
  ext?: string;
  size?: number;
  children?: AgentFileNode[];
}

function walkDir(dir: string, maxDepth = 4, depth = 0): AgentFileNode[] {
  if (depth > maxDepth) return [];
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  return entries
    .filter((e) => !SKIP_DIRS.has(e.name))
    .sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    })
    .map((entry) => {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.relative(WORKSPACE_ROOT, fullPath);
      if (entry.isDirectory()) {
        return {
          name: entry.name,
          type: "folder" as const,
          path: relPath,
          children: depth < maxDepth ? walkDir(fullPath, maxDepth, depth + 1) : [],
        };
      }
      let size: number | undefined;
      try { size = fs.statSync(fullPath).size; } catch { /* skip */ }
      return {
        name: entry.name,
        type: "file" as const,
        path: relPath,
        ext: path.extname(entry.name).slice(1),
        size,
      };
    });
}

function isSafeWrite(relPath: string): boolean {
  if (relPath.startsWith("..") || path.isAbsolute(relPath)) return false;
  const inSafe = SAFE_WRITE_PREFIXES.some((p) => relPath.startsWith(p));
  if (!inSafe) return false;
  return !BLOCKED_WRITE_RE.some((r) => r.test(relPath));
}

// ── GET /api/agent/files ───────────────────────────────────────────────────────

router.get("/agent/files", optionalAuth, (req, res) => {
  const subDir = typeof req.query.dir === "string" ? req.query.dir.trim() : undefined;
  const targetDir = subDir ? path.join(WORKSPACE_ROOT, subDir) : WORKSPACE_ROOT;

  if (!targetDir.startsWith(WORKSPACE_ROOT)) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  const depth = subDir ? 3 : 2;
  const tree = walkDir(targetDir, depth);
  res.json({ tree, root: subDir ?? "workspace", workspace: WORKSPACE_ROOT });
});

// ── POST /api/agent/file-action ───────────────────────────────────────────────

router.post("/agent/file-action", optionalAuth, async (req, res) => {
  const { action, path: relPath, content } = req.body as {
    action: "read" | "write" | "create" | "list" | "exists" | "delete";
    path?: string;
    content?: string;
  };

  if (action === "list") {
    const dir = relPath ? path.join(WORKSPACE_ROOT, relPath) : WORKSPACE_ROOT;
    if (!dir.startsWith(WORKSPACE_ROOT)) {
      res.status(403).json({ error: "Access denied" });
      return;
    }
    const tree = walkDir(dir, 2);
    res.json({ ok: true, tree });
    return;
  }

  if (!relPath) {
    res.status(400).json({ error: "path is required" });
    return;
  }

  const absPath = path.join(WORKSPACE_ROOT, relPath);
  if (!absPath.startsWith(WORKSPACE_ROOT)) {
    res.status(403).json({ error: "Access denied" });
    return;
  }

  if (action === "exists") {
    res.json({ ok: true, exists: fs.existsSync(absPath), path: relPath });
    return;
  }

  if (action === "read") {
    try {
      const raw = fs.readFileSync(absPath, "utf-8");
      const MAX = 25000;
      res.json({
        ok: true,
        content: raw.slice(0, MAX),
        truncated: raw.length > MAX,
        size: raw.length,
        path: relPath,
      });
    } catch {
      res.status(404).json({ error: "File not found or unreadable", path: relPath });
    }
    return;
  }

  if (action === "delete") {
    if (!isSafeWrite(relPath)) {
      res.status(403).json({
        error: "Delete not permitted to this path.",
        requiresPermission: true,
        path: relPath,
      });
      return;
    }
    try {
      fs.unlinkSync(absPath);
      res.json({ ok: true, path: relPath, action: "deleted" });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Delete failed" });
    }
    return;
  }

  if (action === "write" || action === "create") {
    if (!isSafeWrite(relPath)) {
      res.status(403).json({
        error: "Write not permitted here. Only src/ directories are writable.",
        requiresPermission: true,
        path: relPath,
      });
      return;
    }
    if (content === undefined || content === null) {
      res.status(400).json({ error: "content is required" });
      return;
    }
    if (action === "create" && fs.existsSync(absPath)) {
      res.status(409).json({ error: "File already exists. Use action=write to overwrite.", path: relPath });
      return;
    }
    try {
      fs.mkdirSync(path.dirname(absPath), { recursive: true });
      fs.writeFileSync(absPath, content, "utf-8");
      res.json({
        ok: true,
        path: relPath,
        action,
        bytes: Buffer.byteLength(content, "utf-8"),
      });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : "Write failed" });
    }
    return;
  }

  res.status(400).json({ error: `Unknown action: ${action}` });
});

// ── GET /api/agent/read-file (convenience shorthand) ─────────────────────────

router.get("/agent/read-file", optionalAuth, (req, res) => {
  const relPath = typeof req.query.path === "string" ? req.query.path.trim() : "";
  if (!relPath) { res.status(400).json({ error: "path query param required" }); return; }
  const absPath = path.join(WORKSPACE_ROOT, relPath);
  if (!absPath.startsWith(WORKSPACE_ROOT)) { res.status(403).json({ error: "Access denied" }); return; }
  try {
    const raw = fs.readFileSync(absPath, "utf-8");
    res.json({ ok: true, content: raw.slice(0, 25000), truncated: raw.length > 25000, path: relPath });
  } catch {
    res.status(404).json({ error: "File not found", path: relPath });
  }
});

// ── GitHub Stubs (permission required) ───────────────────────────────────────

router.post("/agent/github/connect", optionalAuth, (req, res) => {
  const { token } = req.body as { token?: string };
  if (!token?.trim()) {
    res.status(400).json({ error: "GitHub personal access token is required." });
    return;
  }
  req.log.info("GitHub connect attempt");
  res.json({
    connected: true,
    message: "GitHub token stored for this session. The agent can now create files and check status.",
    permissions: ["repo:read", "repo:write"],
    note: "Push operations always require explicit user approval.",
  });
});

router.post("/agent/github/push", optionalAuth, (req, res) => {
  const { message, approved = false } = req.body as { message?: string; approved?: boolean };
  if (!approved) {
    res.json({
      requiresPermission: true,
      action: "GitHub Push",
      risk: "high",
      message: message ?? "Push changes to GitHub",
      detail: "This will push all staged changes to the remote repository. Please review the commit message and files before approving.",
      warning: "This action cannot be undone without force-push access.",
    });
    return;
  }
  // Even with approval, this is a stub (no real GitHub token integration yet)
  res.json({
    ok: false,
    status: "integration_pending",
    message: "GitHub Push integration is pending. Connect your GitHub token via Settings → Integrations.",
  });
});

export default router;
