import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

export const Route = createFileRoute('/agent')({
  component: AgentSystem,
})

const MODEL_NAME = 'NVR 9.9 Ultra Super Agent'
const SYSTEM_VERSION = 'NVR/OS 7.7.2'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ModuleKey = 'scanner' | 'fixer' | 'terminal' | 'runner'

type LogKind = 'info' | 'tool' | 'shell' | 'result' | 'error' | 'plan' | 'agent' | 'system'

type TaskStatus = 'pending' | 'running' | 'completed' | 'failed'

type AgentTask = {
  id: string
  title: string
  detail: string
  critical: boolean
  status: TaskStatus
}

type LogLine = { id: string; ts: number; kind: LogKind; text: string; module?: ModuleKey }

type RunState = 'idle' | 'planning' | 'running' | 'completed' | 'cancelled' | 'failed'

type ServerEvent =
  | { type: 'meta'; model: string; label: string; icon: string }
  | { type: 'plan'; tasks: { id: string; title: string; detail: string; critical: boolean }[] }
  | { type: 'task_start'; id: string; index: number }
  | { type: 'task_done'; id: string; durationMs: number }
  | { type: 'log'; kind: LogKind; text: string }
  | { type: 'agent'; text: string }
  | { type: 'done'; durationMs: number }
  | { type: 'cancelled' }
  | { type: 'error'; message: string }

type ScanFinding = {
  id: string
  severity: 'critical' | 'warning' | 'info'
  file: string
  line: number | null
  title: string
  description: string
  suggestion: string
}

type ScanResult = {
  summary: string
  stats: { files: number; issues: number; critical: number; warnings: number; info: number }
  findings: ScanFinding[]
}

type FixResult = {
  diagnosis: string
  language: string
  fixed_code: string
  changes: string[]
  verification: string
}

type SuggestResult = {
  intent: string
  commands: {
    command: string
    shell: string
    explanation: string
    danger: 'safe' | 'caution' | 'destructive'
    notes?: string | null
  }[]
  alternatives?: string[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

function fmtClock(ts: number) {
  const d = new Date(ts)
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((n) => n.toString().padStart(2, '0'))
    .join(':')
}

function fmtElapsed(ms: number) {
  const s = Math.floor(ms / 1000)
  const mm = Math.floor(s / 60).toString().padStart(2, '0')
  const ss = (s % 60).toString().padStart(2, '0')
  return `${mm}:${ss}`
}

function isTextFile(name: string) {
  return /\.(tsx?|jsx?|mjs|cjs|json|md|html|css|scss|sass|less|py|rb|go|rs|java|kt|swift|c|cc|cpp|h|hpp|cs|php|sh|bash|zsh|yml|yaml|toml|ini|env|sql|graphql|gql|astro|vue|svelte|txt)$/i.test(
    name,
  )
}

const MODULES: { key: ModuleKey; name: string; tag: string; icon: ReactNode }[] = [
  {
    key: 'scanner',
    name: 'Project Scanner',
    tag: 'audit',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="6" />
        <path d="M21 21l-4.3-4.3" />
        <path d="M11 8v6M8 11h6" />
      </svg>
    ),
  },
  {
    key: 'fixer',
    name: 'Code Fix Agent',
    tag: 'repair',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a4 4 0 0 1 5 5L9 22l-7 1 1-7L13.7 5.3a1 1 0 0 1 1 0z" />
        <path d="M13 7l4 4" />
      </svg>
    ),
  },
  {
    key: 'terminal',
    name: 'Terminal Advisor',
    tag: 'shell',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M7 9l3 3-3 3M13 15h4" />
      </svg>
    ),
  },
  {
    key: 'runner',
    name: 'Task Runner',
    tag: 'execute',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 3l14 9-14 9V3z" />
      </svg>
    ),
  },
]

// ---------------------------------------------------------------------------
// Root component
// ---------------------------------------------------------------------------

function AgentSystem() {
  const [activeModule, setActiveModule] = useState<ModuleKey>('scanner')
  const [globalLogs, setGlobalLogs] = useState<LogLine[]>([])
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  function pushGlobalLog(kind: LogKind, text: string, module?: ModuleKey) {
    setGlobalLogs((prev) =>
      [...prev, { id: uid(), ts: Date.now(), kind, text, module }].slice(-200),
    )
  }

  useEffect(() => {
    pushGlobalLog('system', `${SYSTEM_VERSION} booted · ${MODEL_NAME} online`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="os-shell">
      <OSChrome now={now} />

      <div className="os-body">
        <Sidebar active={activeModule} setActive={setActiveModule} />

        <main className="os-main">
          <ModuleSurface module={activeModule} pushGlobalLog={pushGlobalLog} />
        </main>

        <ConsolePanel logs={globalLogs} onClear={() => setGlobalLogs([])} />
      </div>

      <OSStyles />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Top OS chrome
// ---------------------------------------------------------------------------

function OSChrome({ now }: { now: number }) {
  return (
    <div className="os-chrome">
      <div className="os-chrome-left">
        <div className="os-traffic">
          <span className="dot dot-red" />
          <span className="dot dot-yellow" />
          <span className="dot dot-green" />
        </div>
        <span className="os-id">{SYSTEM_VERSION}</span>
        <span className="os-divider" />
        <span className="os-model">
          <ModelGlyph />
          {MODEL_NAME}
        </span>
      </div>
      <div className="os-chrome-mid">
        <span className="os-net">
          <span className="net-dot" />
          secure tunnel · /api/*
        </span>
      </div>
      <div className="os-chrome-right">
        <span className="os-cpu">
          <span className="bar"><span style={{ width: '62%' }} /></span>
          CPU 62%
        </span>
        <span className="os-mem">
          <span className="bar"><span style={{ width: '41%' }} /></span>
          MEM 41%
        </span>
        <span className="os-clock">{fmtClock(now)}</span>
      </div>
    </div>
  )
}

function ModelGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1.5l1.6 4.4 4.4 1.6-4.4 1.6L8 13.5l-1.6-4.4L2 7.5l4.4-1.6L8 1.5z" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

function Sidebar({
  active,
  setActive,
}: {
  active: ModuleKey
  setActive: (m: ModuleKey) => void
}) {
  return (
    <aside className="os-sidebar">
      <div className="sidebar-eyebrow">Modules</div>
      {MODULES.map((m) => (
        <button
          key={m.key}
          className={active === m.key ? 'mod-btn active' : 'mod-btn'}
          onClick={() => setActive(m.key)}
        >
          <span className="mod-icon">{m.icon}</span>
          <span className="mod-text">
            <span className="mod-name">{m.name}</span>
            <span className="mod-tag">{m.tag}</span>
          </span>
          {active === m.key && <span className="mod-active-bar" />}
        </button>
      ))}

      <div className="sidebar-eyebrow" style={{ marginTop: '20px' }}>Status</div>
      <div className="sidebar-status">
        <StatusRow label="Filesystem" value="mounted" tone="ok" />
        <StatusRow label="Sandbox" value="ready" tone="ok" />
        <StatusRow label="Model" value="online" tone="ok" />
        <StatusRow label="Telemetry" value="streaming" tone="info" />
      </div>
    </aside>
  )
}

function StatusRow({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'ok' | 'info' | 'warn'
}) {
  const color = tone === 'ok' ? '#34d399' : tone === 'warn' ? '#ffb800' : 'var(--accent)'
  return (
    <div className="status-row">
      <span className="status-label">{label}</span>
      <span className="status-value" style={{ color }}>
        <span className="status-dot-sm" style={{ background: color }} />
        {value}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Module surface — switches between modules
// ---------------------------------------------------------------------------

function ModuleSurface({
  module,
  pushGlobalLog,
}: {
  module: ModuleKey
  pushGlobalLog: (k: LogKind, text: string, m?: ModuleKey) => void
}) {
  return (
    <div className="module-surface">
      {module === 'scanner' && <ScannerModule pushGlobalLog={pushGlobalLog} />}
      {module === 'fixer' && <FixerModule pushGlobalLog={pushGlobalLog} />}
      {module === 'terminal' && <TerminalModule pushGlobalLog={pushGlobalLog} />}
      {module === 'runner' && <RunnerModule pushGlobalLog={pushGlobalLog} />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Module: Project Scanner
// ---------------------------------------------------------------------------

function ScannerModule({
  pushGlobalLog,
}: {
  pushGlobalLog: (k: LogKind, text: string, m?: ModuleKey) => void
}) {
  const [files, setFiles] = useState<{ path: string; content: string; size: number }[]>([])
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  async function ingestFiles(list: FileList | File[]) {
    const incoming = Array.from(list)
      .filter((f) => isTextFile(f.name) && f.size <= 200_000)
      .slice(0, 30)
    if (incoming.length === 0) {
      setError('No supported text/code files found (max 200kb each).')
      return
    }
    setError(null)
    const read = await Promise.all(
      incoming.map(async (f) => ({
        path: (f as any).webkitRelativePath || f.name,
        content: await f.text(),
        size: f.size,
      })),
    )
    setFiles((prev) => {
      const map = new Map<string, (typeof read)[number]>()
      for (const f of [...prev, ...read]) map.set(f.path, f)
      return Array.from(map.values()).slice(0, 30)
    })
    pushGlobalLog('info', `Scanner ingested ${read.length} file(s)`, 'scanner')
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) ingestFiles(e.target.files)
    e.target.value = ''
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files) ingestFiles(e.dataTransfer.files)
  }

  function removeFile(path: string) {
    setFiles((prev) => prev.filter((f) => f.path !== path))
  }

  async function runScan() {
    if (!files.length || scanning) return
    setScanning(true)
    setError(null)
    setResult(null)
    pushGlobalLog('tool', `Scanning ${files.length} files…`, 'scanner')
    try {
      const res = await fetch('/api/agent-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'scan',
          payload: { files: files.map((f) => ({ path: f.path, content: f.content })) },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Scan failed')
      setResult(data.result as ScanResult)
      const r = data.result as ScanResult
      pushGlobalLog('result', `Scan complete · ${r.stats.issues} issues (${r.stats.critical} critical)`, 'scanner')
    } catch (e) {
      const msg = (e as Error)?.message || 'Scan failed'
      setError(msg)
      pushGlobalLog('error', `Scan failed: ${msg}`, 'scanner')
    } finally {
      setScanning(false)
    }
  }

  return (
    <ModuleFrame
      title="Project Scanner"
      subtitle="Drop files or upload a folder. The agent audits structure, types, and security."
      badge="audit"
      runLabel={scanning ? 'Scanning…' : 'Run Scan'}
      runIcon={<RunIcon />}
      runDisabled={!files.length || scanning}
      runBusy={scanning}
      onRun={runScan}
      runHint={
        files.length
          ? `${files.length} file${files.length === 1 ? '' : 's'} ready · ${(files.reduce((a, f) => a + f.size, 0) / 1024).toFixed(1)} kb total`
          : 'Add at least one file to enable scan'
      }
    >
      <div
        className={dragOver ? 'drop-zone over' : 'drop-zone'}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={onPick}
          style={{ display: 'none' }}
        />
        <div className="drop-icon">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        <div className="drop-title">Upload project files</div>
        <div className="drop-hint">
          Drag and drop a folder or click to browse · max 30 files · supports .ts, .tsx, .js, .py, .go, .rs, .json, .md
        </div>
      </div>

      {files.length > 0 && (
        <div className="file-list">
          <div className="file-list-head">
            <span>Queued · {files.length}</span>
            <button className="link-btn" onClick={() => setFiles([])}>Clear all</button>
          </div>
          {files.map((f) => (
            <div key={f.path} className="file-row">
              <FileIcon name={f.path} />
              <span className="file-path">{f.path}</span>
              <span className="file-size">{(f.size / 1024).toFixed(1)} kb</span>
              <button className="file-remove" onClick={() => removeFile(f.path)} aria-label="Remove">
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <ErrorBanner text={error} onClose={() => setError(null)} />}

      {result && <ScanReport result={result} />}
    </ModuleFrame>
  )
}

function FileIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase() || 'txt'
  const palette: Record<string, string> = {
    ts: '#3aa6ff',
    tsx: '#3aa6ff',
    js: '#ffb800',
    jsx: '#ffb800',
    py: '#5cdcf2',
    go: '#5cdcf2',
    rs: '#ff8b62',
    md: '#a78bfa',
    json: '#34d399',
    css: '#a78bfa',
    html: '#ff8b62',
  }
  const color = palette[ext] || 'var(--text-muted)'
  return (
    <span className="file-ext" style={{ color, borderColor: color }}>
      {ext.slice(0, 4)}
    </span>
  )
}

function ScanReport({ result }: { result: ScanResult }) {
  const sevColor: Record<ScanFinding['severity'], string> = {
    critical: '#f44763',
    warning: '#ffb800',
    info: 'var(--accent)',
  }
  return (
    <div className="report">
      <div className="report-summary">
        <span className="report-eyebrow">Scan complete</span>
        <p className="report-line">{result.summary}</p>
        <div className="stat-row">
          <Stat label="files" value={result.stats.files} />
          <Stat label="issues" value={result.stats.issues} />
          <Stat label="critical" value={result.stats.critical} tone="bad" />
          <Stat label="warnings" value={result.stats.warnings} tone="warn" />
          <Stat label="info" value={result.stats.info} tone="info" />
        </div>
      </div>

      <div className="finding-list">
        {result.findings.map((f) => (
          <div key={f.id} className={`finding sev-${f.severity}`}>
            <div className="finding-head">
              <span className="finding-sev" style={{ color: sevColor[f.severity], borderColor: sevColor[f.severity] }}>
                {f.severity}
              </span>
              <span className="finding-title">{f.title}</span>
              <span className="finding-loc">
                {f.file}
                {f.line ? `:${f.line}` : ''}
              </span>
            </div>
            <p className="finding-desc">{f.description}</p>
            <div className="finding-fix">
              <span className="finding-fix-label">Suggested fix</span>
              <span>{f.suggestion}</span>
            </div>
          </div>
        ))}
        {result.findings.length === 0 && (
          <div className="empty-block">No issues found. Project looks healthy.</div>
        )}
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone?: 'bad' | 'warn' | 'info'
}) {
  const color =
    tone === 'bad'
      ? '#f44763'
      : tone === 'warn'
        ? '#ffb800'
        : tone === 'info'
          ? 'var(--accent)'
          : 'var(--text-primary)'
  return (
    <div className="stat">
      <span className="stat-value" style={{ color }}>{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Module: Code Fix Agent
// ---------------------------------------------------------------------------

function FixerModule({
  pushGlobalLog,
}: {
  pushGlobalLog: (k: LogKind, text: string, m?: ModuleKey) => void
}) {
  const [code, setCode] = useState('')
  const [errMsg, setErrMsg] = useState('')
  const [language, setLanguage] = useState('auto')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<FixResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function runFix() {
    if (!code.trim() || busy) return
    setBusy(true)
    setError(null)
    setResult(null)
    setCopied(false)
    pushGlobalLog('tool', `Diagnosing ${code.length} chars of ${language}…`, 'fixer')
    try {
      const res = await fetch('/api/agent-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: 'fix', payload: { code, error: errMsg, language } }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Fix failed')
      setResult(data.result as FixResult)
      pushGlobalLog('result', `Patch ready · ${(data.result as FixResult).changes.length} change(s)`, 'fixer')
    } catch (e) {
      const m = (e as Error)?.message || 'Fix failed'
      setError(m)
      pushGlobalLog('error', `Fix failed: ${m}`, 'fixer')
    } finally {
      setBusy(false)
    }
  }

  async function copyFixed() {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result.fixed_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch {}
  }

  return (
    <ModuleFrame
      title="Code Fix Agent"
      subtitle="Paste the broken snippet and an optional error message. The agent diagnoses, patches, and explains."
      badge="repair"
      runLabel={busy ? 'Patching…' : 'Run Fix'}
      runIcon={<RunIcon />}
      runDisabled={!code.trim() || busy}
      runBusy={busy}
      onRun={runFix}
      runHint={
        code.trim()
          ? `${code.length} chars · language: ${language}`
          : 'Paste a broken code snippet to enable Run Fix'
      }
    >
      <div className="fix-grid">
        <div className="fix-col">
          <label className="field-label">
            Broken code
            <select
              className="lang-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="auto">auto-detect</option>
              <option>typescript</option>
              <option>javascript</option>
              <option>python</option>
              <option>go</option>
              <option>rust</option>
              <option>java</option>
              <option>php</option>
              <option>shell</option>
            </select>
          </label>
          <textarea
            className="code-input"
            spellCheck={false}
            placeholder={'// paste your broken code here\nfunction add(a, b) {\n  return a + b\n}'}
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />

          <label className="field-label">Error message (optional)</label>
          <textarea
            className="error-input"
            spellCheck={false}
            placeholder="TypeError: Cannot read property 'id' of undefined"
            value={errMsg}
            onChange={(e) => setErrMsg(e.target.value)}
          />
        </div>

        <div className="fix-col">
          <div className="field-label">
            Patched output
            {result && (
              <button className="link-btn" onClick={copyFixed}>
                {copied ? 'Copied ✓' : 'Copy'}
              </button>
            )}
          </div>

          {!result && !busy && !error && (
            <div className="empty-block tall">
              The fixed code, diagnosis, and verification steps will appear here after Run Fix.
            </div>
          )}

          {busy && (
            <div className="empty-block tall">
              <span className="thinking">
                <span /><span /><span />
              </span>
              <span style={{ marginLeft: 12 }}>Diagnosing…</span>
            </div>
          )}

          {error && <ErrorBanner text={error} onClose={() => setError(null)} />}

          {result && (
            <>
              <div className="diagnosis">
                <span className="diagnosis-label">Root cause</span>
                <p>{result.diagnosis}</p>
              </div>
              <pre className="code-output"><code>{result.fixed_code}</code></pre>
              <div className="changes">
                <div className="changes-head">Changes</div>
                <ul>
                  {result.changes.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
              <div className="verify">
                <span className="verify-label">Verify</span>
                <span>{result.verification}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </ModuleFrame>
  )
}

// ---------------------------------------------------------------------------
// Module: Terminal Command Suggestion
// ---------------------------------------------------------------------------

function TerminalModule({
  pushGlobalLog,
}: {
  pushGlobalLog: (k: LogKind, text: string, m?: ModuleKey) => void
}) {
  const [goal, setGoal] = useState('')
  const [ctx, setCtx] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<SuggestResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function runSuggest() {
    if (!goal.trim() || busy) return
    setBusy(true)
    setError(null)
    setResult(null)
    pushGlobalLog('tool', `Resolving terminal commands for "${goal.slice(0, 80)}"…`, 'terminal')
    try {
      const res = await fetch('/api/agent-tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: 'suggest', payload: { goal, context: ctx } }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Suggest failed')
      setResult(data.result as SuggestResult)
      pushGlobalLog(
        'result',
        `Suggested ${(data.result as SuggestResult).commands.length} command(s)`,
        'terminal',
      )
    } catch (e) {
      const m = (e as Error)?.message || 'Suggest failed'
      setError(m)
      pushGlobalLog('error', `Suggest failed: ${m}`, 'terminal')
    } finally {
      setBusy(false)
    }
  }

  return (
    <ModuleFrame
      title="Terminal Advisor"
      subtitle="Describe what you want to do. The agent suggests the safest, most idiomatic shell command."
      badge="shell"
      runLabel={busy ? 'Resolving…' : 'Run Suggestion'}
      runIcon={<RunIcon />}
      runDisabled={!goal.trim() || busy}
      runBusy={busy}
      onRun={runSuggest}
      runHint={goal.trim() ? 'Press Run to call the advisor.' : 'Describe a goal to enable Run.'}
    >
      <div className="terminal-grid">
        <div>
          <label className="field-label">What do you want to do?</label>
          <textarea
            className="goal-input"
            placeholder="e.g. compress everything in ./logs that's older than 7 days into one tarball"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          />
          <label className="field-label">Context (optional)</label>
          <textarea
            className="ctx-input"
            placeholder="OS, shell, paths, constraints…"
            value={ctx}
            onChange={(e) => setCtx(e.target.value)}
          />
        </div>

        <div className="terminal-result">
          <div className="terminal-window">
            <div className="terminal-bar">
              <span className="dot dot-red" />
              <span className="dot dot-yellow" />
              <span className="dot dot-green" />
              <span className="terminal-title">advisor — bash</span>
            </div>
            <div className="terminal-body">
              {!result && !busy && !error && (
                <div className="terminal-prompt-line">
                  <span className="prompt-glyph">▮</span>
                  <span style={{ color: 'var(--text-muted)' }}>describe a goal, then press Run Suggestion</span>
                </div>
              )}
              {busy && (
                <div className="terminal-prompt-line">
                  <span className="prompt-glyph">$</span>
                  <span className="thinking"><span /><span /><span /></span>
                </div>
              )}
              {error && <div className="terminal-error">{error}</div>}
              {result && (
                <>
                  <div className="terminal-intent"># {result.intent}</div>
                  {result.commands.map((c, i) => (
                    <CommandRow key={i} cmd={c} />
                  ))}
                  {result.alternatives && result.alternatives.length > 0 && (
                    <>
                      <div className="terminal-section"># alternatives</div>
                      {result.alternatives.map((a, i) => (
                        <div key={i} className="terminal-alt">$ {a}</div>
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </ModuleFrame>
  )
}

function CommandRow({ cmd }: { cmd: SuggestResult['commands'][number] }) {
  const [copied, setCopied] = useState(false)
  const dangerColor =
    cmd.danger === 'destructive'
      ? '#f44763'
      : cmd.danger === 'caution'
        ? '#ffb800'
        : '#34d399'
  async function copy() {
    try {
      await navigator.clipboard.writeText(cmd.command)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch {}
  }
  return (
    <div className="cmd-card">
      <div className="cmd-row">
        <span className="cmd-prompt">$</span>
        <code className="cmd-code">{cmd.command}</code>
        <button className="cmd-copy" onClick={copy}>
          {copied ? '✓' : 'Copy'}
        </button>
      </div>
      <div className="cmd-meta">
        <span className="cmd-danger" style={{ color: dangerColor, borderColor: dangerColor }}>
          {cmd.danger}
        </span>
        <span className="cmd-shell">{cmd.shell}</span>
        <span className="cmd-explain">{cmd.explanation}</span>
      </div>
      {cmd.notes && <div className="cmd-note">⚠ {cmd.notes}</div>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Module: Task Runner (live agent execution stream)
// ---------------------------------------------------------------------------

const RUNNER_SUGGESTIONS = [
  'Scan project files and find errors',
  'Fix backend error on /api/checkout',
  'Run terminal command npm test',
  'Deploy v2.4 to production',
]

function RunnerModule({
  pushGlobalLog,
}: {
  pushGlobalLog: (k: LogKind, text: string, m?: ModuleKey) => void
}) {
  const [prompt, setPrompt] = useState('')
  const [activePrompt, setActivePrompt] = useState('')
  const [tasks, setTasks] = useState<AgentTask[]>([])
  const [logs, setLogs] = useState<LogLine[]>([])
  const [runState, setRunState] = useState<RunState>('idle')
  const [planLabel, setPlanLabel] = useState('')
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [endedAt, setEndedAt] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())
  const abortRef = useRef<AbortController | null>(null)
  const logEndRef = useRef<HTMLDivElement | null>(null)

  // Pick up forwarded prompt
  useEffect(() => {
    try {
      const pending = sessionStorage.getItem('nvr.pendingPrompt')
      if (pending) {
        sessionStorage.removeItem('nvr.pendingPrompt')
        setPrompt(pending)
        setTimeout(() => startRun(pending), 150)
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (runState !== 'running' && runState !== 'planning') return
    const id = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [runState])

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [logs.length])

  const completedCount = useMemo(
    () => tasks.filter((t) => t.status === 'completed').length,
    [tasks],
  )
  const totalCount = tasks.length
  const progressPct = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100)
  const elapsed = startedAt ? (endedAt ?? now) - startedAt : 0
  const isBusy = runState === 'running' || runState === 'planning'

  function pushLog(kind: LogKind, text: string) {
    setLogs((prev) => [...prev, { id: uid(), ts: Date.now(), kind, text }])
  }

  function handleEvent(evt: ServerEvent) {
    switch (evt.type) {
      case 'meta':
        setPlanLabel(evt.label)
        return
      case 'plan':
        setTasks(
          evt.tasks.map((t) => ({
            id: t.id,
            title: t.title,
            detail: t.detail,
            critical: t.critical,
            status: 'pending',
          })),
        )
        setRunState('running')
        pushLog('plan', `Plan ready · ${evt.tasks.length} tasks queued`)
        return
      case 'task_start':
        setTasks((prev) =>
          prev.map((t) =>
            t.id === evt.id ? { ...t, status: 'running' } : t,
          ),
        )
        return
      case 'task_done':
        setTasks((prev) =>
          prev.map((t) =>
            t.id === evt.id ? { ...t, status: 'completed' } : t,
          ),
        )
        return
      case 'log':
        pushLog(evt.kind, evt.text)
        return
      case 'agent':
        pushLog('agent', evt.text)
        return
      case 'done':
        setRunState('completed')
        setEndedAt(Date.now())
        pushLog('result', `Run complete in ${fmtElapsed(evt.durationMs)}`)
        pushGlobalLog('result', `Task runner finished in ${fmtElapsed(evt.durationMs)}`, 'runner')
        return
      case 'cancelled':
        setRunState('cancelled')
        setEndedAt(Date.now())
        setTasks((prev) =>
          prev.map((t) => (t.status === 'running' ? { ...t, status: 'failed' } : t)),
        )
        return
      case 'error':
        setRunState('failed')
        setEndedAt(Date.now())
        pushLog('error', evt.message)
        return
    }
  }

  async function startRun(rawPrompt: string) {
    const trimmed = rawPrompt.trim()
    if (!trimmed) return
    if (abortRef.current) abortRef.current.abort()

    setActivePrompt(trimmed)
    setRunState('planning')
    setStartedAt(Date.now())
    setEndedAt(null)
    setLogs([])
    setTasks([])
    setPlanLabel('')
    pushLog('info', `Received task: "${trimmed}"`)
    pushLog('agent', 'Reading the request and breaking it down…')
    pushGlobalLog('plan', `Runner started: ${trimmed.slice(0, 80)}`, 'runner')

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const resp = await fetch('/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: trimmed }),
        signal: controller.signal,
      })

      if (!resp.ok || !resp.body) {
        const text = await resp.text().catch(() => '')
        pushLog('error', `Server error (${resp.status}): ${text || 'no body'}`)
        setRunState('failed')
        setEndedAt(Date.now())
        return
      }

      const reader = resp.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        let nl = buf.indexOf('\n')
        while (nl !== -1) {
          const line = buf.slice(0, nl).trim()
          buf = buf.slice(nl + 1)
          if (line) {
            try {
              handleEvent(JSON.parse(line) as ServerEvent)
            } catch {
              pushLog('error', `Bad event from server: ${line.slice(0, 120)}`)
            }
          }
          nl = buf.indexOf('\n')
        }
      }
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') {
        setRunState((s) => (s === 'completed' || s === 'failed' ? s : 'cancelled'))
        setEndedAt(Date.now())
        setTasks((prev) =>
          prev.map((t) => (t.status === 'running' ? { ...t, status: 'failed' } : t)),
        )
        pushLog('error', 'Run stopped by user.')
      } else {
        pushLog('error', `Network error: ${(err as Error)?.message || 'unknown'}`)
        setRunState('failed')
        setEndedAt(Date.now())
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null
    }
  }

  function stopRun() {
    abortRef.current?.abort()
  }

  return (
    <ModuleFrame
      title="Task Runner"
      subtitle="Send the agent a goal in natural language. It plans, narrates, and executes step-by-step."
      badge="execute"
      runLabel={isBusy ? 'Running…' : 'Run Task'}
      runIcon={<RunIcon />}
      runDisabled={!prompt.trim() || isBusy}
      runBusy={isBusy}
      onRun={() => {
        startRun(prompt)
      }}
      runHint={
        isBusy
          ? `${planLabel || 'planning'} · ${fmtElapsed(elapsed)}`
          : prompt.trim()
            ? 'Press Run Task to dispatch.'
            : 'Type a goal to enable Run Task.'
      }
      extraAction={
        isBusy ? (
          <button className="stop-btn" onClick={stopRun}>
            <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor">
              <rect x="2.5" y="2.5" width="7" height="7" rx="1" />
            </svg>
            Stop
          </button>
        ) : null
      }
    >
      <div className="runner-grid">
        <div>
          <label className="field-label">Task prompt</label>
          <textarea
            className="goal-input"
            placeholder="Tell the agent what to do…"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />

          {!isBusy && tasks.length === 0 && (
            <div className="suggestion-row">
              {RUNNER_SUGGESTIONS.map((s) => (
                <button key={s} className="suggestion-chip" onClick={() => setPrompt(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {activePrompt && (
            <div className="active-prompt">
              <span className="active-prompt-label">Running</span>
              <span>“{activePrompt}”</span>
            </div>
          )}

          {(tasks.length > 0 || isBusy) && (
            <>
              <div className="progress-track">
                <div
                  className={runState === 'running' ? 'progress-fill animated' : 'progress-fill'}
                  style={{
                    width: `${progressPct}%`,
                    background:
                      runState === 'failed' || runState === 'cancelled'
                        ? '#f44763'
                        : runState === 'completed'
                          ? '#34d399'
                          : undefined,
                  }}
                />
              </div>
              <div className="task-list">
                {tasks.map((t, i) => (
                  <TaskRow key={t.id} task={t} index={i} />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="runner-stream">
          <div className="runner-stream-head">
            <span>Activity</span>
            <span className="panel-count">{logs.length} events</span>
          </div>
          <div className="log-stream">
            {logs.length === 0 && <div className="log-empty">Waiting for events…</div>}
            {logs.map((line) => (
              <LogRow key={line.id} line={line} />
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>
    </ModuleFrame>
  )
}

function TaskRow({ task, index }: { task: AgentTask; index: number }) {
  return (
    <div className={`task-row task-${task.status}`}>
      <div className="task-icon">
        {task.status === 'pending' && <span>{index + 1}</span>}
        {task.status === 'running' && (
          <svg width="14" height="14" viewBox="0 0 16 16" className="spin">
            <circle cx="8" cy="8" r="6" stroke="var(--accent)" strokeWidth="2" fill="none" strokeDasharray="28" strokeDashoffset="14" strokeLinecap="round" />
          </svg>
        )}
        {task.status === 'completed' && (
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M2.5 7.5L5.5 10.5L11.5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        {task.status === 'failed' && (
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </div>
      <div className="task-body">
        <div className="task-title-row">
          <span className="task-title">{task.title}</span>
          {task.critical && <span className="critical-badge">critical</span>}
        </div>
        <div className="task-detail">{task.detail}</div>
      </div>
    </div>
  )
}

function LogRow({ line }: { line: LogLine }) {
  const colorMap: Record<LogKind, string> = {
    info: 'var(--text-secondary)',
    plan: '#a78bfa',
    tool: 'var(--accent)',
    shell: '#5cdcf2',
    result: '#34d399',
    error: '#f44763',
    agent: '#ffb800',
    system: 'var(--text-muted)',
  }
  const labelMap: Record<LogKind, string> = {
    info: 'info',
    plan: 'plan',
    tool: 'step',
    shell: 'sh  ',
    result: 'done',
    error: 'err ',
    agent: 'say ',
    system: 'sys ',
  }
  return (
    <div className="log-row">
      <span className="log-time">{fmtClock(line.ts)}</span>
      <span className="log-kind" style={{ color: colorMap[line.kind] }}>{labelMap[line.kind]}</span>
      <span className="log-text">{line.text}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Shared module frame
// ---------------------------------------------------------------------------

function ModuleFrame({
  title,
  subtitle,
  badge,
  children,
  runLabel,
  runIcon,
  runDisabled,
  runBusy,
  onRun,
  runHint,
  extraAction,
}: {
  title: string
  subtitle: string
  badge: string
  children: React.ReactNode
  runLabel: string
  runIcon: React.ReactNode
  runDisabled: boolean
  runBusy: boolean
  onRun: () => void
  runHint?: string
  extraAction?: React.ReactNode
}) {
  return (
    <div className="module-frame">
      <header className="module-header">
        <div className="module-titleblock">
          <span className="module-badge">{badge}</span>
          <h2 className="module-title">{title}</h2>
          <p className="module-subtitle">{subtitle}</p>
        </div>
        <div className="module-actions">
          {extraAction}
          <button
            className={runBusy ? 'run-btn busy' : 'run-btn'}
            disabled={runDisabled}
            onClick={onRun}
          >
            {runIcon}
            {runLabel}
          </button>
        </div>
      </header>
      <div className="module-runline">
        <span className="runline-dot" />
        <span>{runHint}</span>
      </div>
      <div className="module-content">{children}</div>
    </div>
  )
}

function RunIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M5 3l14 9-14 9V3z" />
    </svg>
  )
}

function ErrorBanner({ text, onClose }: { text: string; onClose: () => void }) {
  return (
    <div className="error-banner">
      <span>⚠ {text}</span>
      <button onClick={onClose} aria-label="dismiss">×</button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Bottom console panel — global activity bus
// ---------------------------------------------------------------------------

function ConsolePanel({
  logs,
  onClear,
}: {
  logs: LogLine[]
  onClear: () => void
}) {
  const [open, setOpen] = useState(true)
  const endRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [logs.length])

  return (
    <aside className={open ? 'os-console open' : 'os-console'}>
      <header className="console-head">
        <button className="console-toggle" onClick={() => setOpen((v) => !v)} aria-label="toggle console">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {open ? <path d="M6 9l6 6 6-6" /> : <path d="M18 15l-6-6-6 6" />}
          </svg>
        </button>
        <span className="console-title">System console</span>
        <span className="console-count">{logs.length} entries</span>
        <button className="link-btn" onClick={onClear}>Clear</button>
      </header>
      {open && (
        <div className="console-body">
          {logs.length === 0 && <div className="log-empty">No activity yet.</div>}
          {logs.map((l) => (
            <div key={l.id} className="console-row">
              <span className="log-time">{fmtClock(l.ts)}</span>
              {l.module && <span className="console-mod">{l.module}</span>}
              <span className={`console-kind kind-${l.kind}`}>{l.kind}</span>
              <span className="console-text">{l.text}</span>
            </div>
          ))}
          <div ref={endRef} />
        </div>
      )}
    </aside>
  )
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

function OSStyles() {
  return (
    <style>{`
      .os-shell {
        position: relative;
        min-height: calc(100vh - 56px);
        background:
          radial-gradient(ellipse 70% 40% at 20% -10%, rgba(0, 200, 240, 0.10) 0%, transparent 60%),
          radial-gradient(ellipse 50% 30% at 90% 0%, rgba(167, 139, 250, 0.08) 0%, transparent 60%),
          var(--bg-base);
        padding: 12px 12px 0;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      /* Top OS chrome */
      .os-chrome {
        display: grid;
        grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr) minmax(0, 1.1fr);
        gap: 12px;
        padding: 8px 14px;
        background: linear-gradient(180deg, var(--bg-surface) 0%, rgba(12, 18, 32, 0.7) 100%);
        border: 1px solid var(--border);
        border-radius: 14px;
        backdrop-filter: blur(10px);
        align-items: center;
      }
      .os-chrome-left, .os-chrome-mid, .os-chrome-right {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
      }
      .os-chrome-mid { justify-content: center; }
      .os-chrome-right { justify-content: flex-end; }
      .os-traffic { display: flex; gap: 6px; }
      .dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
      .dot-red { background: #ff5f56; }
      .dot-yellow { background: #ffbd2e; }
      .dot-green { background: #27c93f; }
      .os-id {
        font-family: 'DM Mono', monospace;
        font-size: 0.72rem;
        color: var(--text-secondary);
        letter-spacing: 0.06em;
      }
      .os-divider { width: 1px; height: 16px; background: var(--border); }
      .os-model {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        background: rgba(0, 200, 240, 0.06);
        border: 1px solid rgba(0, 200, 240, 0.3);
        border-radius: 8px;
        color: var(--accent);
        font-family: 'Syne', sans-serif;
        font-weight: 600;
        font-size: 0.74rem;
        letter-spacing: 0.01em;
      }
      .os-net {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 4px 12px;
        border: 1px solid var(--border);
        border-radius: 999px;
        background: rgba(0, 0, 0, 0.25);
        font-family: 'DM Mono', monospace;
        font-size: 0.7rem;
        color: var(--text-secondary);
      }
      .net-dot {
        width: 7px; height: 7px; border-radius: 50%;
        background: #34d399;
        box-shadow: 0 0 6px #34d399;
        animation: pulse-ring 1.6s infinite;
      }
      .os-cpu, .os-mem {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-family: 'DM Mono', monospace;
        font-size: 0.7rem;
        color: var(--text-secondary);
      }
      .bar {
        width: 50px;
        height: 5px;
        border-radius: 3px;
        background: var(--bg-elevated);
        overflow: hidden;
        display: inline-block;
      }
      .bar > span {
        display: block;
        height: 100%;
        background: linear-gradient(90deg, var(--accent), #5cdcf2);
      }
      .os-clock {
        font-family: 'DM Mono', monospace;
        font-size: 0.85rem;
        color: var(--text-primary);
        letter-spacing: 0.06em;
        font-variant-numeric: tabular-nums;
      }

      /* Body grid */
      .os-body {
        display: grid;
        grid-template-columns: 232px minmax(0, 1fr);
        grid-template-rows: minmax(0, 1fr) auto;
        grid-template-areas:
          "side main"
          "side console";
        gap: 12px;
        flex: 1;
      }
      .os-sidebar { grid-area: side; }
      .os-main { grid-area: main; min-width: 0; }
      .os-console { grid-area: console; }

      .os-sidebar {
        background: var(--bg-surface);
        border: 1px solid var(--border);
        border-radius: 14px;
        padding: 14px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .sidebar-eyebrow {
        font-family: 'DM Mono', monospace;
        font-size: 0.6875rem;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--text-muted);
        margin-bottom: 4px;
        padding: 0 4px;
      }
      .mod-btn {
        position: relative;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 9px 10px;
        background: transparent;
        border: 1px solid transparent;
        border-radius: 10px;
        color: var(--text-secondary);
        cursor: pointer;
        text-align: left;
        font: inherit;
        transition: all 0.15s ease;
      }
      .mod-btn:hover {
        background: var(--bg-elevated);
        color: var(--text-primary);
      }
      .mod-btn.active {
        background: linear-gradient(180deg, rgba(0, 200, 240, 0.10) 0%, rgba(0, 200, 240, 0.04) 100%);
        border-color: rgba(0, 200, 240, 0.35);
        color: var(--text-primary);
      }
      .mod-icon {
        width: 30px; height: 30px;
        border-radius: 8px;
        background: var(--bg-elevated);
        border: 1px solid var(--border);
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
        color: var(--accent);
      }
      .mod-btn.active .mod-icon {
        background: rgba(0, 200, 240, 0.10);
        border-color: rgba(0, 200, 240, 0.4);
      }
      .mod-icon svg { width: 16px; height: 16px; }
      .mod-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
      .mod-name {
        font-family: 'Syne', sans-serif;
        font-weight: 600;
        font-size: 0.85rem;
        letter-spacing: 0.01em;
      }
      .mod-tag {
        font-family: 'DM Mono', monospace;
        font-size: 0.62rem;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--text-muted);
      }
      .mod-active-bar {
        position: absolute;
        left: -1px; top: 14px; bottom: 14px;
        width: 3px;
        background: var(--accent);
        border-radius: 0 3px 3px 0;
        box-shadow: 0 0 8px var(--accent);
      }

      .sidebar-status {
        display: flex; flex-direction: column; gap: 6px;
        padding: 0 4px;
      }
      .status-row {
        display: flex; justify-content: space-between; align-items: center;
        font-family: 'DM Mono', monospace;
        font-size: 0.7rem;
      }
      .status-label { color: var(--text-muted); }
      .status-value { display: inline-flex; align-items: center; gap: 5px; }
      .status-dot-sm { width: 6px; height: 6px; border-radius: 50%; }

      /* Module frame */
      .module-surface { height: 100%; min-height: 0; }
      .module-frame {
        background: var(--bg-surface);
        border: 1px solid var(--border);
        border-radius: 14px;
        padding: 18px 20px 20px;
        display: flex;
        flex-direction: column;
        gap: 14px;
        height: 100%;
        min-height: 0;
      }
      .module-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 14px;
        flex-wrap: wrap;
      }
      .module-titleblock { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
      .module-badge {
        align-self: flex-start;
        padding: 2px 9px;
        border-radius: 999px;
        background: rgba(0, 200, 240, 0.08);
        border: 1px solid rgba(0, 200, 240, 0.35);
        color: var(--accent);
        font-family: 'DM Mono', monospace;
        font-size: 0.62rem;
        letter-spacing: 0.1em;
        text-transform: uppercase;
      }
      .module-title {
        margin: 0;
        font-family: 'Syne', sans-serif;
        font-weight: 700;
        font-size: 1.5rem;
        letter-spacing: -0.01em;
        color: var(--text-primary);
      }
      .module-subtitle {
        margin: 0;
        color: var(--text-secondary);
        font-size: 0.875rem;
        line-height: 1.5;
      }
      .module-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
      }
      .run-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 18px;
        background: var(--accent);
        color: var(--bg-base);
        border: none;
        border-radius: 10px;
        font-family: 'Syne', sans-serif;
        font-weight: 700;
        font-size: 0.875rem;
        letter-spacing: 0.02em;
        cursor: pointer;
        transition: all 0.15s ease;
        box-shadow: 0 4px 18px rgba(0, 200, 240, 0.25);
      }
      .run-btn:hover:not(:disabled) {
        background: #33d4f5;
        box-shadow: 0 6px 22px rgba(0, 200, 240, 0.45);
        transform: translateY(-1px);
      }
      .run-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
        box-shadow: none;
      }
      .run-btn.busy {
        background: linear-gradient(90deg, var(--accent), #5cdcf2, var(--accent));
        background-size: 200% 100%;
        animation: shimmer 2s linear infinite;
      }
      .module-runline {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
        background: var(--bg-base);
        border: 1px solid var(--border);
        border-radius: 10px;
        font-family: 'DM Mono', monospace;
        font-size: 0.75rem;
        color: var(--text-secondary);
      }
      .runline-dot {
        width: 7px; height: 7px; border-radius: 50%;
        background: var(--accent);
        box-shadow: 0 0 6px var(--accent);
        animation: pulse-ring 1.8s infinite;
      }
      .module-content {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      /* Drop zone */
      .drop-zone {
        border: 2px dashed var(--border);
        background: var(--bg-elevated);
        border-radius: 14px;
        padding: 30px 22px;
        text-align: center;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .drop-zone:hover, .drop-zone.over {
        border-color: var(--accent);
        background: rgba(0, 200, 240, 0.04);
      }
      .drop-icon {
        display: inline-flex;
        width: 56px; height: 56px;
        border-radius: 50%;
        background: rgba(0, 200, 240, 0.08);
        border: 1px solid rgba(0, 200, 240, 0.3);
        color: var(--accent);
        align-items: center; justify-content: center;
        margin-bottom: 10px;
      }
      .drop-title {
        font-family: 'Syne', sans-serif;
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 4px;
      }
      .drop-hint {
        color: var(--text-muted);
        font-size: 0.78rem;
        max-width: 420px;
        margin: 0 auto;
        line-height: 1.5;
      }

      .file-list {
        background: var(--bg-elevated);
        border: 1px solid var(--border);
        border-radius: 12px;
        overflow: hidden;
      }
      .file-list-head {
        display: flex; justify-content: space-between; align-items: center;
        padding: 9px 12px;
        background: var(--bg-base);
        border-bottom: 1px solid var(--border);
        font-family: 'DM Mono', monospace;
        font-size: 0.7rem;
        color: var(--text-muted);
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }
      .link-btn {
        background: transparent;
        border: none;
        color: var(--accent);
        cursor: pointer;
        font: inherit;
        font-size: 0.72rem;
        padding: 0;
      }
      .link-btn:hover { text-decoration: underline; }
      .file-row {
        display: flex; align-items: center; gap: 10px;
        padding: 8px 12px;
        border-top: 1px solid var(--border);
        font-size: 0.82rem;
      }
      .file-row:first-of-type { border-top: none; }
      .file-ext {
        font-family: 'DM Mono', monospace;
        font-size: 0.62rem;
        text-transform: uppercase;
        padding: 2px 6px;
        border: 1px solid;
        border-radius: 4px;
        flex-shrink: 0;
      }
      .file-path {
        flex: 1;
        color: var(--text-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-family: 'DM Mono', monospace;
        font-size: 0.78rem;
      }
      .file-size {
        font-family: 'DM Mono', monospace;
        font-size: 0.7rem;
        color: var(--text-muted);
      }
      .file-remove {
        background: transparent;
        border: 1px solid var(--border);
        color: var(--text-muted);
        cursor: pointer;
        width: 22px; height: 22px;
        border-radius: 6px;
        font-size: 1rem;
        line-height: 1;
        display: flex; align-items: center; justify-content: center;
      }
      .file-remove:hover { color: #f44763; border-color: #f44763; }

      /* Scan report */
      .report { display: flex; flex-direction: column; gap: 14px; }
      .report-summary {
        background: var(--bg-elevated);
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 14px 16px;
      }
      .report-eyebrow {
        font-family: 'DM Mono', monospace;
        font-size: 0.66rem;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--accent);
      }
      .report-line {
        margin: 6px 0 10px;
        color: var(--text-primary);
        font-size: 0.95rem;
        line-height: 1.5;
      }
      .stat-row { display: flex; gap: 18px; flex-wrap: wrap; }
      .stat { display: flex; flex-direction: column; }
      .stat-value {
        font-family: 'Syne', sans-serif;
        font-weight: 700;
        font-size: 1.4rem;
        line-height: 1;
        font-variant-numeric: tabular-nums;
      }
      .stat-label {
        font-family: 'DM Mono', monospace;
        font-size: 0.66rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--text-muted);
        margin-top: 4px;
      }

      .finding-list { display: flex; flex-direction: column; gap: 10px; }
      .finding {
        background: var(--bg-elevated);
        border: 1px solid var(--border);
        border-left-width: 3px;
        border-radius: 10px;
        padding: 12px 14px;
      }
      .finding.sev-critical { border-left-color: #f44763; }
      .finding.sev-warning { border-left-color: #ffb800; }
      .finding.sev-info { border-left-color: var(--accent); }
      .finding-head {
        display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
        margin-bottom: 4px;
      }
      .finding-sev {
        padding: 2px 7px;
        border: 1px solid;
        border-radius: 4px;
        font-family: 'DM Mono', monospace;
        font-size: 0.62rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .finding-title {
        font-family: 'Syne', sans-serif;
        font-weight: 600;
        color: var(--text-primary);
        font-size: 0.95rem;
      }
      .finding-loc {
        font-family: 'DM Mono', monospace;
        font-size: 0.72rem;
        color: var(--text-muted);
        margin-left: auto;
      }
      .finding-desc {
        margin: 4px 0 8px;
        color: var(--text-secondary);
        font-size: 0.86rem;
        line-height: 1.5;
      }
      .finding-fix {
        display: flex; gap: 8px;
        padding: 8px 10px;
        background: var(--bg-base);
        border-radius: 6px;
        font-size: 0.82rem;
        color: var(--text-primary);
      }
      .finding-fix-label {
        font-family: 'DM Mono', monospace;
        font-size: 0.66rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--accent);
        flex-shrink: 0;
      }

      /* Fix module */
      .fix-grid, .terminal-grid, .runner-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        gap: 14px;
        align-items: start;
      }
      .fix-col { display: flex; flex-direction: column; gap: 8px; }
      .field-label {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-family: 'DM Mono', monospace;
        font-size: 0.7rem;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--text-muted);
      }
      .lang-select {
        background: var(--bg-elevated);
        border: 1px solid var(--border);
        color: var(--text-secondary);
        border-radius: 6px;
        padding: 4px 8px;
        font: inherit;
        font-size: 0.72rem;
      }
      .code-input, .error-input, .goal-input, .ctx-input {
        width: 100%;
        background: var(--bg-base);
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 10px 12px;
        color: var(--text-primary);
        font-family: 'DM Mono', monospace;
        font-size: 0.82rem;
        resize: vertical;
        outline: none;
        transition: border-color 0.15s ease;
      }
      .code-input { min-height: 200px; }
      .error-input { min-height: 80px; }
      .goal-input { min-height: 90px; font-family: inherit; font-size: 0.92rem; }
      .ctx-input { min-height: 64px; font-family: inherit; font-size: 0.86rem; }
      .code-input:focus, .error-input:focus, .goal-input:focus, .ctx-input:focus {
        border-color: rgba(0, 200, 240, 0.5);
      }

      .empty-block {
        color: var(--text-muted);
        font-size: 0.86rem;
        padding: 22px 14px;
        text-align: center;
        border: 1px dashed var(--border);
        border-radius: 10px;
        background: var(--bg-elevated);
      }
      .empty-block.tall {
        min-height: 160px;
        display: flex; align-items: center; justify-content: center;
      }

      .diagnosis {
        background: rgba(167, 139, 250, 0.06);
        border: 1px solid rgba(167, 139, 250, 0.3);
        border-radius: 10px;
        padding: 10px 12px;
      }
      .diagnosis-label {
        font-family: 'DM Mono', monospace;
        font-size: 0.66rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #a78bfa;
        margin-bottom: 6px;
        display: block;
      }
      .diagnosis p { margin: 0; color: var(--text-primary); font-size: 0.86rem; line-height: 1.55; }

      .code-output {
        margin: 0;
        background: var(--bg-base);
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 12px 14px;
        font-family: 'DM Mono', monospace;
        font-size: 0.8rem;
        color: var(--text-primary);
        overflow-x: auto;
        white-space: pre-wrap;
        word-break: break-word;
        max-height: 280px;
        overflow-y: auto;
      }
      .code-output code { font-family: inherit; }

      .changes {
        background: var(--bg-elevated);
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 10px 14px;
      }
      .changes-head {
        font-family: 'DM Mono', monospace;
        font-size: 0.66rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--accent);
        margin-bottom: 6px;
      }
      .changes ul { margin: 0; padding-left: 16px; color: var(--text-primary); font-size: 0.85rem; line-height: 1.6; }
      .verify {
        display: flex; gap: 8px;
        padding: 8px 10px;
        background: rgba(52, 211, 153, 0.06);
        border: 1px solid rgba(52, 211, 153, 0.3);
        border-radius: 8px;
        color: var(--text-primary);
        font-size: 0.84rem;
      }
      .verify-label {
        font-family: 'DM Mono', monospace;
        font-size: 0.66rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #34d399;
        flex-shrink: 0;
      }

      /* Terminal module */
      .terminal-window {
        background: #06080d;
        border: 1px solid var(--border);
        border-radius: 10px;
        overflow: hidden;
      }
      .terminal-bar {
        display: flex; align-items: center; gap: 6px;
        padding: 7px 12px;
        background: linear-gradient(180deg, #1a2236 0%, #11182a 100%);
        border-bottom: 1px solid var(--border);
      }
      .terminal-title {
        margin-left: 8px;
        font-family: 'DM Mono', monospace;
        font-size: 0.7rem;
        color: var(--text-muted);
      }
      .terminal-body {
        padding: 14px;
        font-family: 'DM Mono', monospace;
        font-size: 0.82rem;
        color: var(--text-primary);
        line-height: 1.6;
        min-height: 240px;
        max-height: 400px;
        overflow-y: auto;
      }
      .terminal-prompt-line { display: flex; gap: 8px; align-items: center; }
      .prompt-glyph { color: var(--accent); }
      .terminal-intent {
        color: #a78bfa;
        font-family: 'DM Mono', monospace;
        font-size: 0.78rem;
        margin-bottom: 10px;
      }
      .terminal-section {
        color: var(--text-muted);
        margin: 12px 0 6px;
        font-size: 0.74rem;
      }
      .terminal-alt {
        color: var(--text-secondary);
        font-size: 0.78rem;
        padding: 3px 0;
      }
      .terminal-error {
        color: #f44763;
      }
      .cmd-card {
        margin-bottom: 10px;
        padding: 10px 12px;
        background: rgba(0, 200, 240, 0.04);
        border: 1px solid rgba(0, 200, 240, 0.2);
        border-radius: 8px;
      }
      .cmd-row {
        display: flex; align-items: center; gap: 8px;
      }
      .cmd-prompt { color: var(--accent); flex-shrink: 0; }
      .cmd-code {
        flex: 1;
        font-family: 'DM Mono', monospace;
        color: var(--text-primary);
        word-break: break-all;
      }
      .cmd-copy {
        background: var(--bg-elevated);
        border: 1px solid var(--border);
        color: var(--text-secondary);
        border-radius: 6px;
        padding: 3px 9px;
        font: inherit;
        font-size: 0.7rem;
        cursor: pointer;
      }
      .cmd-copy:hover { color: var(--accent); border-color: var(--accent); }
      .cmd-meta {
        display: flex; align-items: center; gap: 10px;
        margin-top: 6px;
        font-size: 0.74rem;
      }
      .cmd-danger {
        padding: 1px 7px;
        border: 1px solid;
        border-radius: 999px;
        font-size: 0.62rem;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }
      .cmd-shell { color: var(--text-muted); font-size: 0.7rem; }
      .cmd-explain { color: var(--text-secondary); flex: 1; }
      .cmd-note {
        margin-top: 6px;
        padding: 4px 8px;
        background: rgba(255, 184, 0, 0.06);
        border: 1px solid rgba(255, 184, 0, 0.3);
        border-radius: 6px;
        color: #ffb800;
        font-size: 0.74rem;
      }

      /* Runner */
      .suggestion-row { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
      .suggestion-chip {
        padding: 6px 10px;
        background: var(--bg-elevated);
        border: 1px solid var(--border);
        border-radius: 999px;
        color: var(--text-secondary);
        font-size: 0.78rem;
        font-family: inherit;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .suggestion-chip:hover {
        border-color: var(--accent);
        color: var(--text-primary);
        background: rgba(0, 200, 240, 0.06);
      }
      .active-prompt {
        margin-top: 12px;
        padding: 8px 12px;
        background: rgba(0, 200, 240, 0.06);
        border: 1px solid rgba(0, 200, 240, 0.3);
        border-radius: 8px;
        color: var(--text-primary);
        font-size: 0.82rem;
        display: flex; gap: 8px; align-items: center;
      }
      .active-prompt-label {
        font-family: 'DM Mono', monospace;
        font-size: 0.66rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--accent);
      }
      .progress-track {
        height: 5px;
        border-radius: 3px;
        background: var(--bg-elevated);
        overflow: hidden;
        margin: 14px 0;
      }
      .progress-fill {
        height: 100%;
        background: var(--accent);
        transition: width 0.4s ease;
      }
      .progress-fill.animated {
        background: linear-gradient(90deg, var(--accent) 0%, #5cdcf2 50%, var(--accent) 100%);
        background-size: 200% 100%;
        animation: shimmer 2.4s linear infinite;
      }

      .task-list { display: flex; flex-direction: column; gap: 8px; }
      .task-row {
        display: flex; gap: 10px;
        padding: 10px 12px;
        border: 1px solid var(--border);
        border-radius: 10px;
        background: var(--bg-elevated);
        animation: fadeIn 0.25s ease;
      }
      .task-row.task-running {
        background: linear-gradient(180deg, rgba(0, 200, 240, 0.08) 0%, rgba(0, 200, 240, 0.02) 100%);
        border-color: rgba(0, 200, 240, 0.35);
      }
      .task-row.task-completed .task-icon {
        background: rgba(52, 211, 153, 0.12); color: #34d399; border-color: rgba(52, 211, 153, 0.4);
      }
      .task-row.task-failed .task-icon {
        background: rgba(244, 71, 99, 0.12); color: #f44763; border-color: rgba(244, 71, 99, 0.4);
      }
      .task-icon {
        width: 26px; height: 26px;
        border-radius: 50%;
        flex-shrink: 0;
        display: flex; align-items: center; justify-content: center;
        background: var(--bg-surface);
        border: 1px solid var(--border);
        color: var(--text-muted);
        font-size: 0.7rem;
        font-family: 'DM Mono', monospace;
      }
      .task-body { flex: 1; min-width: 0; }
      .task-title-row { display: flex; align-items: center; gap: 8px; margin-bottom: 2px; }
      .task-title {
        font-size: 0.86rem;
        color: var(--text-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .task-detail { color: var(--text-secondary); font-size: 0.74rem; line-height: 1.5; }
      .critical-badge {
        padding: 1px 7px;
        border-radius: 999px;
        font-family: 'DM Mono', monospace;
        font-size: 0.6rem;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        background: rgba(255, 184, 0, 0.12);
        color: #ffb800;
        border: 1px solid rgba(255, 184, 0, 0.35);
      }

      .runner-stream {
        display: flex; flex-direction: column;
        background: var(--bg-elevated);
        border: 1px solid var(--border);
        border-radius: 12px;
        overflow: hidden;
        max-height: 520px;
      }
      .runner-stream-head {
        display: flex; justify-content: space-between; align-items: center;
        padding: 9px 12px;
        background: var(--bg-base);
        border-bottom: 1px solid var(--border);
        font-family: 'DM Mono', monospace;
        font-size: 0.7rem;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--text-muted);
      }
      .panel-count { color: var(--text-muted); font-size: 0.7rem; }
      .log-stream {
        flex: 1;
        padding: 10px 12px;
        font-family: 'DM Mono', monospace;
        font-size: 0.74rem;
        line-height: 1.6;
        overflow-y: auto;
        min-height: 200px;
      }
      .log-empty { color: var(--text-muted); }
      .log-row {
        display: grid;
        grid-template-columns: 64px 38px 1fr;
        gap: 8px;
        animation: fadeIn 0.25s ease;
      }
      .log-time { color: var(--text-muted); }
      .log-kind { font-weight: 500; }
      .log-text { color: var(--text-primary); word-break: break-word; }

      /* Buttons & banners */
      .stop-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 14px;
        background: rgba(244, 71, 99, 0.12);
        color: #ff6e85;
        border: 1px solid rgba(244, 71, 99, 0.45);
        border-radius: 10px;
        font-family: 'Syne', sans-serif;
        font-weight: 600;
        font-size: 0.8125rem;
        cursor: pointer;
        animation: warn-pulse 1.6s infinite;
      }
      .error-banner {
        display: flex; justify-content: space-between; align-items: center;
        padding: 10px 14px;
        background: rgba(244, 71, 99, 0.08);
        border: 1px solid rgba(244, 71, 99, 0.4);
        border-radius: 10px;
        color: #ff8b9e;
        font-size: 0.86rem;
      }
      .error-banner button {
        background: transparent; border: none; color: inherit; cursor: pointer;
        font-size: 1.1rem; line-height: 1;
      }

      /* Console */
      .os-console {
        background: var(--bg-surface);
        border: 1px solid var(--border);
        border-radius: 14px;
        overflow: hidden;
        max-height: 60px;
        transition: max-height 0.3s ease;
      }
      .os-console.open { max-height: 220px; }
      .console-head {
        display: flex; align-items: center; gap: 10px;
        padding: 9px 14px;
        background: var(--bg-base);
        border-bottom: 1px solid var(--border);
      }
      .console-toggle {
        background: transparent; border: 1px solid var(--border);
        color: var(--text-secondary);
        border-radius: 6px;
        width: 24px; height: 24px;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer;
      }
      .console-title {
        font-family: 'DM Mono', monospace;
        font-size: 0.72rem;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--text-secondary);
      }
      .console-count {
        margin-left: 8px;
        font-family: 'DM Mono', monospace;
        font-size: 0.7rem;
        color: var(--text-muted);
      }
      .console-head .link-btn { margin-left: auto; }
      .console-body {
        padding: 8px 14px;
        max-height: 160px;
        overflow-y: auto;
        font-family: 'DM Mono', monospace;
        font-size: 0.74rem;
        line-height: 1.6;
      }
      .console-row {
        display: grid;
        grid-template-columns: 64px 80px 56px 1fr;
        gap: 8px;
        animation: fadeIn 0.25s ease;
      }
      .console-mod {
        color: var(--accent);
        text-transform: uppercase;
        letter-spacing: 0.06em;
        font-size: 0.66rem;
        align-self: center;
      }
      .console-kind {
        text-transform: uppercase;
        letter-spacing: 0.06em;
        font-size: 0.66rem;
        align-self: center;
      }
      .kind-info { color: var(--text-secondary); }
      .kind-tool { color: var(--accent); }
      .kind-shell { color: #5cdcf2; }
      .kind-result { color: #34d399; }
      .kind-error { color: #f44763; }
      .kind-plan { color: #a78bfa; }
      .kind-agent { color: #ffb800; }
      .kind-system { color: var(--text-muted); }
      .console-text { color: var(--text-primary); word-break: break-word; }

      /* Thinking dots */
      .thinking { display: inline-flex; gap: 4px; align-items: center; }
      .thinking span {
        width: 6px; height: 6px; border-radius: 50%;
        background: var(--accent);
        animation: bounce 1s infinite;
      }
      .thinking span:nth-child(2) { animation-delay: 0.15s; }
      .thinking span:nth-child(3) { animation-delay: 0.3s; }

      /* Animations */
      @keyframes pulse-ring {
        0%, 100% { box-shadow: 0 0 0 0 rgba(0, 200, 240, 0.5); }
        50% { box-shadow: 0 0 0 8px rgba(0, 200, 240, 0); }
      }
      @keyframes warn-pulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(244, 71, 99, 0.45); }
        50% { box-shadow: 0 0 0 8px rgba(244, 71, 99, 0); }
      }
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(2px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes bounce {
        0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
        40% { transform: translateY(-4px); opacity: 1; }
      }
      .spin { animation: spin 1s linear infinite; }

      /* Responsive */
      @media (max-width: 1100px) {
        .fix-grid, .terminal-grid, .runner-grid {
          grid-template-columns: 1fr;
        }
      }
      @media (max-width: 860px) {
        .os-body {
          grid-template-columns: 1fr;
          grid-template-areas: "side" "main" "console";
        }
        .os-sidebar {
          flex-direction: row;
          flex-wrap: wrap;
          align-items: center;
        }
        .sidebar-eyebrow { width: 100%; margin: 4px 0 0; }
        .mod-btn { flex: 1 1 calc(50% - 6px); min-width: 0; }
        .sidebar-status { flex-direction: row; flex-wrap: wrap; width: 100%; gap: 12px; }
        .os-chrome { grid-template-columns: 1fr; gap: 6px; }
        .os-chrome-mid, .os-chrome-right { justify-content: flex-start; }
      }
      @media (max-width: 560px) {
        .module-frame { padding: 14px; }
        .module-title { font-size: 1.2rem; }
        .module-actions { width: 100%; }
        .run-btn { flex: 1; justify-content: center; }
      }
    `}</style>
  )
}
