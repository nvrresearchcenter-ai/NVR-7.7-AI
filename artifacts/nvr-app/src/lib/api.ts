const BASE = () => (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function getSessionId(): string {
  let id = localStorage.getItem("nvr-session-id");
  if (!id) {
    id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem("nvr-session-id", id);
  }
  return id;
}

function getToken(): string | null {
  return localStorage.getItem("nvr-auth-token");
}

function buildHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-NVR-Session": getSessionId(),
  };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return { ...headers, ...extra };
}

async function post(path: string, body: object) {
  const res = await fetch(`${BASE()}/api${path}`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    const e = new Error((data as { error?: string }).error || "Request failed") as Error & Record<string, unknown>;
    Object.assign(e, data);
    throw e;
  }
  return data;
}

async function get(path: string) {
  const res = await fetch(`${BASE()}/api${path}`, { headers: buildHeaders() });
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}

// ─── Chat ────────────────────────────────────────────────────────────────────

export interface SendChatResult {
  reply: string;
  webSearchUsed: boolean;
}

export async function sendChat(
  messages: ChatMessage[],
  mode: "chat" | "agent" = "chat",
  assistantMode = "normal",
): Promise<SendChatResult> {
  const data = await post("/chat", { messages, mode, assistantMode }) as { reply: string; webSearchUsed?: boolean };
  return { reply: data.reply, webSearchUsed: data.webSearchUsed ?? false };
}

export async function generateImage(prompt: string): Promise<string> {
  const data = await post("/image", { prompt }) as { url: string };
  return data.url;
}

// ─── Health / config status ───────────────────────────────────────────────────

export interface HealthStatus {
  status: string;
  openai_configured: boolean;
  xapi_configured: boolean;
  ai_chat_enabled: boolean;
  external_tools_enabled: boolean;
  xapi_tools: { name: string; enabled: boolean; description: string }[];
}

export async function fetchHealth(): Promise<HealthStatus> {
  const res = await fetch(`${BASE()}/api/health`, { headers: buildHeaders() });
  if (!res.ok) throw new Error("Health check failed");
  return res.json() as Promise<HealthStatus>;
}

// ─── Usage ───────────────────────────────────────────────────────────────────

export interface UsageSummary {
  plan: "free" | "spark" | "pro" | "agent" | "super";
  chatCount: number;
  imageCount: number;
  chatLimit: number;
  imageLimit: number;
  cooldownUntil: number;
  isCoolingDown: boolean;
  resetIn: number;
}

export async function fetchUsage(): Promise<UsageSummary> {
  return get("/usage") as Promise<UsageSummary>;
}

export async function setPlan(plan: string): Promise<void> {
  await post("/usage/plan", { plan });
}

// ─── Agent ───────────────────────────────────────────────────────────────────

export interface AgentTaskResult {
  taskId: string;
  status: string;
  requiresPermission?: string;
}

export async function startAgentTask(prompt: string, model: string): Promise<AgentTaskResult> {
  return post("/agent/task", { prompt, model }) as Promise<AgentTaskResult>;
}

export interface AgentStatus {
  taskId: string;
  status: string;
  steps: { label: string; status: string; detail?: string }[];
  logs: string[];
  filesChanged: string[];
  result: string;
  requiresPermission?: string;
}

export async function pollAgentStatus(taskId: string): Promise<AgentStatus> {
  return get(`/agent/status/${taskId}`) as Promise<AgentStatus>;
}

export async function approveAgentTask(taskId: string, approved: boolean): Promise<void> {
  await post("/agent/approve", { taskId, approved });
}

export async function stopAgentTask(taskId: string): Promise<void> {
  await post(`/agent/stop/${taskId}`, {});
}

// ─── Secrets ─────────────────────────────────────────────────────────────────

export async function addSecret(key: string, value: string): Promise<void> {
  await post("/secrets/add", { key, value });
}

export async function getSecretKeys(): Promise<string[]> {
  const data = await get("/secrets/keys") as { keys: string[] };
  return data.keys;
}

// ─── Agent Actions ────────────────────────────────────────────────────────────

export interface ScanIssue {
  file: string;
  type: string;
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  line?: number;
}

export interface ScanResult {
  files_scanned: number;
  issues_found: number;
  severity: "low" | "medium" | "high" | "critical";
  issues: ScanIssue[];
  suggested_fixes: string[];
  next_steps: string[];
  security_warnings: string[];
  summary: string;
}

export interface FixResult {
  changed_files: string[];
  skipped_files: string[];
  summary: string;
  diff_preview: string;
  test_result: string;
  backup_created: boolean;
}

export interface ReviewReport {
  scanned: string;
  fixed: string;
  needs_attention: string[];
  security_warnings: string[];
  deployment_readiness: "ready" | "needs_work" | "not_ready";
  readiness_score: number;
  next_action: string;
  summary: string;
}

export async function runAgentScan(projectContext?: string): Promise<{ taskId: string; status: string }> {
  return post("/agent/scan", { projectContext: projectContext ?? "" }) as Promise<{ taskId: string; status: string }>;
}

export async function runAgentFix(issues?: string[], projectContext?: string): Promise<{ taskId: string; status: string }> {
  return post("/agent/fix", { issues: issues ?? [], projectContext: projectContext ?? "" }) as Promise<{ taskId: string; status: string }>;
}

export async function runAgentDeploy(approved: boolean, environment?: string): Promise<{ taskId?: string; status?: string; requiresPermission?: boolean; message?: string; action?: string }> {
  return post("/agent/deploy", { approved, environment: environment ?? "production" }) as Promise<{ taskId?: string; status?: string; requiresPermission?: boolean; message?: string; action?: string }>;
}

export async function runAgentReview(projectContext?: string, scanSummary?: string, fixSummary?: string): Promise<{ taskId: string; status: string }> {
  return post("/agent/review", { projectContext: projectContext ?? "", scanSummary: scanSummary ?? "", fixSummary: fixSummary ?? "" }) as Promise<{ taskId: string; status: string }>;
}

export async function runTerminalCommand(command: string): Promise<{ output: string; blocked: boolean; error?: boolean }> {
  return post("/agent/terminal", { command }) as Promise<{ output: string; blocked: boolean; error?: boolean }>;
}

// ─── XAPI Tool Functions ──────────────────────────────────────────────────────

export interface LiveDataResult {
  type: "news" | "weather" | "general";
  data: { title: string; url: string; description: string; source?: string }[];
  query: string;
}

export async function fetchLiveData(query: string, type: "news" | "weather" | "general" = "general"): Promise<LiveDataResult> {
  return post("/tools/live-data", { query, type }) as Promise<LiveDataResult>;
}

export interface WebSearchResponse {
  results: { title: string; url: string; description: string; source?: string }[];
  query: string;
}

export async function runWebSearch(query: string): Promise<WebSearchResponse> {
  return post("/tools/web-search", { query }) as Promise<WebSearchResponse>;
}

export interface AgentConnectorResult {
  connected: boolean;
  service: string;
  message: string;
}

export async function connectAgentTool(service: "github" | "vercel" | "netlify" | "stripe", token: string): Promise<AgentConnectorResult> {
  return post("/tools/agent-connect", { service, token }) as Promise<AgentConnectorResult>;
}

// ─── Agent File Operations ────────────────────────────────────────────────────

export interface AgentFileNode {
  name: string;
  type: "file" | "folder";
  path: string;
  ext?: string;
  size?: number;
  children?: AgentFileNode[];
}

export interface AgentFilesResult {
  tree: AgentFileNode[];
  root: string;
}

export async function listAgentFiles(dir?: string): Promise<AgentFilesResult> {
  const qs = dir ? `?dir=${encodeURIComponent(dir)}` : "";
  const res = await fetch(`${BASE()}/api/agent/files${qs}`, { headers: buildHeaders() });
  if (!res.ok) throw new Error("File listing failed");
  return res.json() as Promise<AgentFilesResult>;
}

export async function readAgentFile(filePath: string): Promise<{ ok: boolean; content: string; truncated: boolean; size: number }> {
  return post("/agent/file-action", { action: "read", path: filePath }) as Promise<{ ok: boolean; content: string; truncated: boolean; size: number }>;
}

export async function writeAgentFile(filePath: string, content: string): Promise<{ ok: boolean; bytes: number }> {
  return post("/agent/file-action", { action: "write", path: filePath, content }) as Promise<{ ok: boolean; bytes: number }>;
}

export async function createAgentFile(filePath: string, content: string): Promise<{ ok: boolean; bytes: number }> {
  return post("/agent/file-action", { action: "create", path: filePath, content }) as Promise<{ ok: boolean; bytes: number }>;
}

export interface GitHubPushResult {
  requiresPermission?: boolean;
  action?: string;
  message?: string;
  warning?: string;
  detail?: string;
  risk?: string;
  ok?: boolean;
  status?: string;
}

export async function connectGitHub(token: string): Promise<{ connected: boolean; message: string; note: string }> {
  return post("/agent/github/connect", { token }) as Promise<{ connected: boolean; message: string; note: string }>;
}

export async function requestGitHubPush(message: string): Promise<GitHubPushResult> {
  return post("/agent/github/push", { message, approved: false }) as Promise<GitHubPushResult>;
}

export interface AgentPlan {
  title: string;
  summary: string;
  estimated_time: string;
  safe_steps: number;
  risky_steps: number;
  steps: { id: number; label: string; type: "safe" | "risky"; action: string; detail: string }[];
}

// ─── Cloudflare API ───────────────────────────────────────────────────────────

export interface CfHealthResult {
  ok: boolean;
  cloudflare_configured: boolean;
  token_status?: string;
  dns_automation: boolean;
  message: string;
}

export interface CfZone {
  id: string;
  name: string;
  status: string;
  plan: string;
  name_servers: string[];
}

export interface CfDnsRecord {
  id: string;
  type: string;
  name: string;
  content: string;
  ttl: number;
  proxied: boolean;
  comment: string | null;
  modified_on: string;
}

export interface CfConfirmationRequired {
  requiresConfirmation: true;
  action: string;
  preview?: Record<string, unknown>;
  message: string;
  risk: "low" | "medium" | "high";
  warning?: string;
}

export async function getCloudflareHealth(): Promise<CfHealthResult> {
  return get("/cloudflare/health") as Promise<CfHealthResult>;
}

export async function listCloudflareZones(): Promise<{ ok: boolean; zones: CfZone[]; count: number }> {
  return get("/cloudflare/zones") as Promise<{ ok: boolean; zones: CfZone[]; count: number }>;
}

export async function getCloudflareZone(domain: string): Promise<{ ok: boolean; zone: CfZone }> {
  return get(`/cloudflare/zones/${encodeURIComponent(domain)}`) as Promise<{ ok: boolean; zone: CfZone }>;
}

export async function listDnsRecords(zoneId: string): Promise<{ ok: boolean; records: CfDnsRecord[]; count: number }> {
  return get(`/cloudflare/zones/${zoneId}/dns`) as Promise<{ ok: boolean; records: CfDnsRecord[]; count: number }>;
}

export async function createDnsRecord(
  zoneId: string,
  record: { type: string; name: string; content: string; ttl?: number; proxied?: boolean; comment?: string },
  confirmed = false
): Promise<{ ok: boolean; record?: CfDnsRecord } | CfConfirmationRequired> {
  return post(`/cloudflare/zones/${zoneId}/dns`, { ...record, confirmed }) as Promise<{ ok: boolean; record?: CfDnsRecord } | CfConfirmationRequired>;
}

export async function updateDnsRecord(
  zoneId: string, recordId: string,
  record: { type: string; name: string; content: string; ttl?: number; proxied?: boolean; comment?: string },
  confirmed = false
): Promise<{ ok: boolean; record?: CfDnsRecord } | CfConfirmationRequired> {
  const res = await fetch(`${BASE()}/api/cloudflare/zones/${zoneId}/dns/${recordId}`, {
    method: "PUT",
    headers: buildHeaders(),
    body: JSON.stringify({ ...record, confirmed }),
  });
  return res.json() as Promise<{ ok: boolean; record?: CfDnsRecord } | CfConfirmationRequired>;
}

export async function deleteDnsRecord(
  zoneId: string, recordId: string, confirmed = false
): Promise<{ ok: boolean; deleted?: string } | CfConfirmationRequired> {
  const res = await fetch(`${BASE()}/api/cloudflare/zones/${zoneId}/dns/${recordId}`, {
    method: "DELETE",
    headers: buildHeaders(),
    body: JSON.stringify({ confirmed }),
  });
  return res.json() as Promise<{ ok: boolean; deleted?: string } | CfConfirmationRequired>;
}

export async function checkSslStatus(zoneId: string): Promise<{ ok: boolean; ssl_mode: string; description: string }> {
  return get(`/cloudflare/zones/${zoneId}/ssl`) as Promise<{ ok: boolean; ssl_mode: string; description: string }>;
}

export async function verifyDomain(domain: string): Promise<{
  ok: boolean; domain: string; found: boolean; active?: boolean;
  zone_id?: string; zone_status?: string; ssl_mode?: string;
  name_servers?: string[]; plan?: string; message: string;
}> {
  return post("/cloudflare/domain/verify", { domain }) as Promise<{
    ok: boolean; domain: string; found: boolean; active?: boolean;
    zone_id?: string; zone_status?: string; ssl_mode?: string;
    name_servers?: string[]; plan?: string; message: string;
  }>;
}

export async function setDnsRecord(
  params: { domain: string; type: string; name: string; content: string; proxied?: boolean },
  confirmed = false
): Promise<{ ok: boolean; action?: string; record_id?: string; message?: string } | CfConfirmationRequired> {
  return post("/cloudflare/domain/set-dns", { ...params, confirmed }) as Promise<{ ok: boolean; action?: string; record_id?: string; message?: string } | CfConfirmationRequired>;
}

// ─── GitHub API ───────────────────────────────────────────────────────────────

export interface GhRepo {
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
}

export interface GhCommit {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

export interface GhHealthResult {
  ok: boolean;
  github_configured: boolean;
  authenticated_user?: string;
  user_name?: string | null;
  user_email?: string | null;
  avatar_url?: string;
  profile_url?: string;
  public_repos?: number;
  message: string;
}

export interface GhConfirmationRequired {
  requiresConfirmation: true;
  action: string;
  preview?: Record<string, unknown>;
  message: string;
  risk: "low" | "medium" | "high";
  warning?: string;
}

export async function getGitHubHealth(): Promise<GhHealthResult> {
  return get("/github/health") as Promise<GhHealthResult>;
}

export async function listGitHubRepos(page = 1, perPage = 30): Promise<{
  ok: boolean; repos: GhRepo[]; count: number; page: number;
}> {
  return get(`/github/repos?page=${page}&per_page=${perPage}`) as Promise<{
    ok: boolean; repos: GhRepo[]; count: number; page: number;
  }>;
}

export async function createGitHubRepo(
  params: { name: string; description?: string; private?: boolean },
  confirmed = false
): Promise<{ ok: boolean; repo?: GhRepo; message?: string } | GhConfirmationRequired> {
  return post("/github/repos/create", { ...params, confirmed }) as Promise<
    { ok: boolean; repo?: GhRepo; message?: string } | GhConfirmationRequired
  >;
}

export async function connectGitHubRepo(fullName: string): Promise<{
  ok: boolean; connected: boolean; repo?: GhRepo; message: string;
}> {
  return post("/github/repos/connect", { full_name: fullName }) as Promise<{
    ok: boolean; connected: boolean; repo?: GhRepo; message: string;
  }>;
}

export async function getGitHubRepoStatus(owner: string, repo: string): Promise<{
  ok: boolean; repo: GhRepo & { branches: string[]; stars: number; forks: number; open_issues: number; size: number };
}> {
  return get(`/github/repos/${owner}/${repo}`) as Promise<{
    ok: boolean; repo: GhRepo & { branches: string[]; stars: number; forks: number; open_issues: number; size: number };
  }>;
}

export async function getGitHubCommits(owner: string, repo: string, perPage = 10): Promise<{
  ok: boolean; commits: GhCommit[]; count: number;
}> {
  return get(`/github/repos/${owner}/${repo}/commits?per_page=${perPage}`) as Promise<{
    ok: boolean; commits: GhCommit[]; count: number;
  }>;
}

export async function commitFileToGitHub(
  owner: string, repo: string,
  params: { path: string; content: string; message?: string; branch?: string },
  confirmed = false
): Promise<{ ok: boolean; committed?: boolean; file?: string; sha?: string; commit_url?: string; message?: string } | GhConfirmationRequired> {
  return post(`/github/repos/${owner}/${repo}/commit`, { ...params, confirmed }) as Promise<
    { ok: boolean; committed?: boolean; file?: string; sha?: string; commit_url?: string; message?: string } | GhConfirmationRequired
  >;
}

export async function pushFilesToGitHub(
  owner: string, repo: string,
  params: { files: { path: string; content: string }[]; message?: string; branch?: string },
  confirmed = false
): Promise<{
  ok: boolean; pushed?: boolean; repository?: string; branch?: string;
  files_pushed?: number; sha?: string; commit_url?: string; message?: string;
} | GhConfirmationRequired> {
  return post(`/github/repos/${owner}/${repo}/push`, { ...params, confirmed }) as Promise<{
    ok: boolean; pushed?: boolean; repository?: string; branch?: string;
    files_pushed?: number; sha?: string; commit_url?: string; message?: string;
  } | GhConfirmationRequired>;
}

export async function planAgentTask(prompt: string): Promise<{ ok: boolean; plan: AgentPlan }> {
  return post("/agent/plan", { prompt }) as Promise<{ ok: boolean; plan: AgentPlan }>;
}

export async function getLiveMonitor(taskId: string): Promise<{
  id: string; status: string; steps: { label: string; status: string }[];
  logs: string[]; filesChanged: string[]; currentStep: string | null;
  completedSteps: number; totalSteps: number; elapsed: number; result: string | null;
}> {
  return get(`/agent/live-monitor/${taskId}`) as Promise<{
    id: string; status: string; steps: { label: string; status: string }[];
    logs: string[]; filesChanged: string[]; currentStep: string | null;
    completedSteps: number; totalSteps: number; elapsed: number; result: string | null;
  }>;
}
