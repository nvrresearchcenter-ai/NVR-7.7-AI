import { Router } from "express";
import { config, getGitHubToken } from "../lib/config.js";
import { optionalAuth } from "../middlewares/authMiddleware.js";

const router = Router();

const GH_BASE = "https://api.github.com";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GhUser {
  login: string;
  id: number;
  name: string | null;
  email: string | null;
  avatar_url: string;
  html_url: string;
  public_repos: number;
  private_repos?: number;
}

interface GhRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  description: string | null;
  html_url: string;
  clone_url: string;
  ssh_url: string;
  default_branch: string;
  language: string | null;
  updated_at: string;
  pushed_at: string;
  size: number;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
}

interface GhRef {
  ref: string;
  object: { sha: string; type: string; url: string };
}

interface GhCommit {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: { name: string; email: string; date: string };
  };
}

interface GhContent {
  name: string;
  path: string;
  sha: string;
  type: "file" | "dir" | "symlink" | "submodule";
  download_url: string | null;
}

// ─── Helper: authenticated GitHub fetch ───────────────────────────────────────

async function ghFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getGitHubToken();
  if (!token) throw new Error("GITHUB_TOKEN_MISSING");

  const url = path.startsWith("http") ? path : `${GH_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> | undefined),
    },
  });

  const text = await res.text();
  let body: unknown;
  try { body = JSON.parse(text); } catch { body = { message: text }; }

  if (!res.ok) {
    const msg = (body as { message?: string }).message ?? `GitHub API error ${res.status}`;
    throw new Error(msg);
  }
  return body as T;
}

// ─── Health / connection check ─────────────────────────────────────────────────

router.get("/github/health", optionalAuth, async (_req, res) => {
  if (!config.githubConfigured) {
    res.json({
      ok: false,
      github_configured: false,
      message: "GITHUB_TOKEN is not set — add it to Replit Secrets",
    });
    return;
  }

  try {
    const user = await ghFetch<GhUser>("/user");
    res.json({
      ok: true,
      github_configured: true,
      authenticated_user: user.login,
      user_name: user.name,
      user_email: user.email,
      avatar_url: user.avatar_url,
      profile_url: user.html_url,
      public_repos: user.public_repos,
      message: `Connected as @${user.login}`,
    });
  } catch (err) {
    res.status(502).json({
      ok: false,
      github_configured: true,
      token_detected: true,
      message: err instanceof Error ? err.message : "GitHub API connection failed",
    });
  }
});

// ─── List repositories ─────────────────────────────────────────────────────────

router.get("/github/repos", optionalAuth, async (req, res) => {
  if (!config.githubConfigured) {
    res.status(503).json({ ok: false, message: "GitHub not configured" });
    return;
  }
  try {
    const page    = Number(req.query["page"]    ?? 1);
    const perPage = Number(req.query["per_page"] ?? 30);
    const sort    = (req.query["sort"] as string) ?? "updated";
    const repos   = await ghFetch<GhRepo[]>(
      `/user/repos?sort=${sort}&per_page=${perPage}&page=${page}&affiliation=owner,collaborator`
    );
    res.json({
      ok: true,
      repos: repos.map((r) => ({
        id:             r.id,
        name:           r.name,
        full_name:      r.full_name,
        private:        r.private,
        description:    r.description,
        html_url:       r.html_url,
        clone_url:      r.clone_url,
        ssh_url:        r.ssh_url,
        default_branch: r.default_branch,
        language:       r.language,
        updated_at:     r.updated_at,
        pushed_at:      r.pushed_at,
      })),
      count: repos.length,
      page,
    });
  } catch (err) {
    res.status(502).json({ ok: false, message: err instanceof Error ? err.message : "Failed to list repos" });
  }
});

// ─── Create repository ─────────────────────────────────────────────────────────

router.post("/github/repos/create", optionalAuth, async (req, res) => {
  if (!config.githubConfigured) {
    res.status(503).json({ ok: false, message: "GitHub not configured" });
    return;
  }

  const { name, description = "", private: isPrivate = false, confirmed = false } = req.body as {
    name?: string; description?: string; private?: boolean; confirmed?: boolean;
  };

  if (!name) {
    res.status(400).json({ ok: false, message: "name is required" });
    return;
  }

  if (!confirmed) {
    res.json({
      requiresConfirmation: true,
      action: "create_repository",
      preview: { name, description, private: isPrivate },
      message: `This will create a new GitHub repository "${name}" under your account.`,
      risk: "medium",
    });
    return;
  }

  try {
    const repo = await ghFetch<GhRepo>("/user/repos", {
      method: "POST",
      body: JSON.stringify({
        name,
        description,
        private: isPrivate,
        auto_init: true,
      }),
    });
    res.json({
      ok: true,
      repo: {
        id:             repo.id,
        name:           repo.name,
        full_name:      repo.full_name,
        private:        repo.private,
        html_url:       repo.html_url,
        clone_url:      repo.clone_url,
        default_branch: repo.default_branch,
      },
      message: `Repository "${repo.full_name}" created successfully`,
    });
  } catch (err) {
    res.status(502).json({ ok: false, message: err instanceof Error ? err.message : "Failed to create repo" });
  }
});

// ─── Get repository status ─────────────────────────────────────────────────────

router.get("/github/repos/:owner/:repo", optionalAuth, async (req, res) => {
  if (!config.githubConfigured) {
    res.status(503).json({ ok: false, message: "GitHub not configured" });
    return;
  }
  const { owner, repo } = req.params as { owner: string; repo: string };
  try {
    const [repoData, refs] = await Promise.all([
      ghFetch<GhRepo>(`/repos/${owner}/${repo}`),
      ghFetch<GhRef[]>(`/repos/${owner}/${repo}/git/refs/heads`).catch(() => [] as GhRef[]),
    ]);
    const branches = refs.map((r) => r.ref.replace("refs/heads/", ""));
    res.json({
      ok: true,
      repo: {
        id:              repoData.id,
        name:            repoData.name,
        full_name:       repoData.full_name,
        private:         repoData.private,
        description:     repoData.description,
        html_url:        repoData.html_url,
        clone_url:       repoData.clone_url,
        ssh_url:         repoData.ssh_url,
        default_branch:  repoData.default_branch,
        language:        repoData.language,
        updated_at:      repoData.updated_at,
        pushed_at:       repoData.pushed_at,
        size:            repoData.size,
        stars:           repoData.stargazers_count,
        forks:           repoData.forks_count,
        open_issues:     repoData.open_issues_count,
        branches,
      },
    });
  } catch (err) {
    res.status(502).json({ ok: false, message: err instanceof Error ? err.message : "Failed to get repo status" });
  }
});

// ─── Get recent commits ────────────────────────────────────────────────────────

router.get("/github/repos/:owner/:repo/commits", optionalAuth, async (req, res) => {
  if (!config.githubConfigured) {
    res.status(503).json({ ok: false, message: "GitHub not configured" });
    return;
  }
  const { owner, repo } = req.params as { owner: string; repo: string };
  const perPage = Number(req.query["per_page"] ?? 10);
  try {
    const commits = await ghFetch<GhCommit[]>(
      `/repos/${owner}/${repo}/commits?per_page=${perPage}`
    );
    res.json({
      ok: true,
      commits: commits.map((c) => ({
        sha:     c.sha.slice(0, 8),
        message: c.commit.message.split("\n")[0],
        author:  c.commit.author.name,
        date:    c.commit.author.date,
        url:     c.html_url,
      })),
      count: commits.length,
    });
  } catch (err) {
    res.status(502).json({ ok: false, message: err instanceof Error ? err.message : "Failed to get commits" });
  }
});

// ─── Connect existing repository ───────────────────────────────────────────────

router.post("/github/repos/connect", optionalAuth, async (req, res) => {
  if (!config.githubConfigured) {
    res.status(503).json({ ok: false, message: "GitHub not configured" });
    return;
  }
  const { full_name } = req.body as { full_name?: string };
  if (!full_name || !full_name.includes("/")) {
    res.status(400).json({ ok: false, message: "full_name required (format: owner/repo)" });
    return;
  }
  try {
    const [owner, repoName] = full_name.split("/");
    const repoData = await ghFetch<GhRepo>(`/repos/${owner}/${repoName}`);
    res.json({
      ok: true,
      connected: true,
      repo: {
        id:              repoData.id,
        full_name:       repoData.full_name,
        html_url:        repoData.html_url,
        clone_url:       repoData.clone_url,
        ssh_url:         repoData.ssh_url,
        default_branch:  repoData.default_branch,
        private:         repoData.private,
      },
      message: `Connected to ${repoData.full_name}`,
    });
  } catch (err) {
    res.status(502).json({ ok: false, message: err instanceof Error ? err.message : "Failed to connect repo" });
  }
});

// ─── Commit file(s) to a repository ───────────────────────────────────────────
// Uses the Contents API to create/update a single file per call.
// For multi-file commits, use /github/repos/:owner/:repo/push (tree API).

router.post("/github/repos/:owner/:repo/commit", optionalAuth, async (req, res) => {
  if (!config.githubConfigured) {
    res.status(503).json({ ok: false, message: "GitHub not configured" });
    return;
  }

  const { owner, repo } = req.params as { owner: string; repo: string };
  const {
    path: filePath,
    content,
    message: commitMessage = "Update via NVR 7.7 AI",
    branch,
    confirmed = false,
  } = req.body as {
    path?: string; content?: string; message?: string;
    branch?: string; confirmed?: boolean;
  };

  if (!filePath || content === undefined) {
    res.status(400).json({ ok: false, message: "path and content are required" });
    return;
  }

  if (!confirmed) {
    res.json({
      requiresConfirmation: true,
      action: "commit_file",
      preview: { repository: `${owner}/${repo}`, path: filePath, commit_message: commitMessage },
      message: `This will commit "${filePath}" to ${owner}/${repo}.`,
      risk: "medium",
    });
    return;
  }

  try {
    const branchName = branch ?? (await ghFetch<GhRepo>(`/repos/${owner}/${repo}`)).default_branch;
    const encodedPath = encodeURIComponent(filePath).replace(/%2F/g, "/");

    // Check if file exists to get its SHA (required for update)
    let existingSha: string | undefined;
    try {
      const existing = await ghFetch<GhContent>(`/repos/${owner}/${repo}/contents/${encodedPath}?ref=${branchName}`);
      existingSha = existing.sha;
    } catch { /* file doesn't exist yet — create it */ }

    const encoded = Buffer.from(content, "utf-8").toString("base64");
    const result = await ghFetch<{ content: GhContent; commit: GhCommit }>(
      `/repos/${owner}/${repo}/contents/${encodedPath}`,
      {
        method: "PUT",
        body: JSON.stringify({
          message: commitMessage,
          content: encoded,
          branch: branchName,
          ...(existingSha ? { sha: existingSha } : {}),
        }),
      }
    );

    res.json({
      ok: true,
      committed: true,
      file: result.content.path,
      sha: result.commit.sha?.slice(0, 8),
      commit_url: result.commit.html_url,
      message: `Committed "${filePath}" to ${owner}/${repo}@${branchName}`,
    });
  } catch (err) {
    res.status(502).json({ ok: false, message: err instanceof Error ? err.message : "Commit failed" });
  }
});

// ─── Push multiple files (tree API) ───────────────────────────────────────────

router.post("/github/repos/:owner/:repo/push", optionalAuth, async (req, res) => {
  if (!config.githubConfigured) {
    res.status(503).json({ ok: false, message: "GitHub not configured" });
    return;
  }

  const { owner, repo } = req.params as { owner: string; repo: string };
  const {
    files,
    message: commitMessage = "Push via NVR 7.7 AI",
    branch,
    confirmed = false,
  } = req.body as {
    files?: { path: string; content: string }[];
    message?: string; branch?: string; confirmed?: boolean;
  };

  if (!files || !Array.isArray(files) || files.length === 0) {
    res.status(400).json({ ok: false, message: "files array is required" });
    return;
  }

  if (!confirmed) {
    res.json({
      requiresConfirmation: true,
      action: "push_files",
      preview: {
        repository: `${owner}/${repo}`,
        file_count: files.length,
        files: files.map((f) => f.path),
        commit_message: commitMessage,
      },
      message: `This will push ${files.length} file(s) to ${owner}/${repo}. Review before confirming.`,
      risk: "medium",
      warning: "This will create a new commit on the target branch. Ensure changes are intentional.",
    });
    return;
  }

  try {
    const repoData = await ghFetch<GhRepo>(`/repos/${owner}/${repo}`);
    const branchName = branch ?? repoData.default_branch;

    // Get HEAD commit SHA
    const refData = await ghFetch<GhRef>(`/repos/${owner}/${repo}/git/ref/heads/${branchName}`);
    const baseSha = refData.object.sha;

    // Get base tree SHA
    const baseCommit = await ghFetch<{ tree: { sha: string } }>(
      `/repos/${owner}/${repo}/git/commits/${baseSha}`
    );
    const baseTreeSha = baseCommit.tree.sha;

    // Create blobs for each file
    const treeItems = await Promise.all(
      files.map(async (f) => {
        const blob = await ghFetch<{ sha: string }>(`/repos/${owner}/${repo}/git/blobs`, {
          method: "POST",
          body: JSON.stringify({ content: f.content, encoding: "utf-8" }),
        });
        return { path: f.path, mode: "100644" as const, type: "blob" as const, sha: blob.sha };
      })
    );

    // Create new tree
    const newTree = await ghFetch<{ sha: string }>(`/repos/${owner}/${repo}/git/trees`, {
      method: "POST",
      body: JSON.stringify({ base_tree: baseTreeSha, tree: treeItems }),
    });

    // Create commit
    const newCommit = await ghFetch<{ sha: string; html_url: string }>(
      `/repos/${owner}/${repo}/git/commits`,
      {
        method: "POST",
        body: JSON.stringify({ message: commitMessage, tree: newTree.sha, parents: [baseSha] }),
      }
    );

    // Update branch ref
    await ghFetch(`/repos/${owner}/${repo}/git/refs/heads/${branchName}`, {
      method: "PATCH",
      body: JSON.stringify({ sha: newCommit.sha }),
    });

    res.json({
      ok: true,
      pushed: true,
      repository: `${owner}/${repo}`,
      branch: branchName,
      files_pushed: files.length,
      sha: newCommit.sha.slice(0, 8),
      commit_url: newCommit.html_url,
      message: `Pushed ${files.length} file(s) to ${owner}/${repo}@${branchName}`,
    });
  } catch (err) {
    res.status(502).json({ ok: false, message: err instanceof Error ? err.message : "Push failed" });
  }
});

export default router;
