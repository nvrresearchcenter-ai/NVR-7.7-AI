import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'

export const Route = createFileRoute('/agent')({
  component: AgentMode,
})

type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'awaiting'

type Step = {
  id: string
  title: string
  detail: string
  status: StepStatus
  durationMs: number
  startedAt?: number
  completedAt?: number
  critical?: boolean
}

type LogLine = {
  id: string
  ts: number
  kind: 'info' | 'tool' | 'result' | 'error' | 'plan' | 'agent' | 'decision'
  text: string
}

type ChatMessage =
  | { id: string; role: 'user'; text: string }
  | { id: string; role: 'agent'; text: string; kind?: 'intro' | 'closing' | 'note' }

type RunState =
  | 'idle'
  | 'planning'
  | 'running'
  | 'awaiting'
  | 'completed'
  | 'failed'
  | 'cancelled'

type Template = {
  match: RegExp
  label: string
  icon: string
  intro: () => string
  steps: Omit<Step, 'id' | 'status' | 'startedAt' | 'completedAt'>[]
}

const TEMPLATES: Template[] = [
  {
    match: /(build|create|make|design).*(website|landing|site|page)|website|landing/i,
    label: 'Build a website',
    icon: '🌐',
    intro: () =>
      `Got it — I'll scope the audience, draft the layout, scaffold components, and ship a preview. Deploy is a real-world action, so I'll check in before pushing.`,
    steps: [
      { title: 'Analyze requirements', detail: 'Parse goal, audience, and core sections.', durationMs: 1600 },
      { title: 'Draft sitemap & layout', detail: 'Outline pages, hero structure, and nav.', durationMs: 2200 },
      { title: 'Choose design system', detail: 'Palette, typography, and primitives.', durationMs: 1800 },
      { title: 'Generate components', detail: 'Hero, features grid, pricing, footer.', durationMs: 2600 },
      { title: 'Wire up routing', detail: 'File-based routes and active styles.', durationMs: 1500 },
      { title: 'Run lint & type-check', detail: 'TypeScript, ESLint, a11y checks.', durationMs: 2000 },
      { title: 'Deploy preview', detail: 'Push to Netlify preview, emit URL.', durationMs: 2400, critical: true },
    ],
  },
  {
    match: /(fix|debug|resolve|investigate).*(error|bug|issue|crash|500|backend|api|server)|backend\s+error/i,
    label: 'Fix backend error',
    icon: '🛠️',
    intro: () =>
      `On it. I'll reproduce the failure, walk the stack to root cause, and patch with the smallest safe change. I'll pause before applying or shipping.`,
    steps: [
      { title: 'Reproduce the failure', detail: 'Replay the failing request locally.', durationMs: 1900 },
      { title: 'Read recent logs', detail: 'Pull the last 200 lines around the 5xx.', durationMs: 1500 },
      { title: 'Locate offending module', detail: 'Walk the stack to the source frame.', durationMs: 1700 },
      { title: 'Form a hypothesis', detail: 'Identify the most likely root cause.', durationMs: 1300 },
      { title: 'Apply targeted fix', detail: 'Smallest safe change to the code.', durationMs: 2200, critical: true },
      { title: 'Add regression test', detail: 'Cover the failing path deterministically.', durationMs: 1800 },
      { title: 'Verify in staging', detail: 'Run the suite; replay the request.', durationMs: 2100, critical: true },
    ],
  },
  {
    match: /research|summari[sz]e|investigate|compare|analy[sz]e/i,
    label: 'Research & summarize',
    icon: '🔎',
    intro: () =>
      `Good question to dig into. I'll decompose it, gather sources, score them, and synthesize a brief with citations. Read-only — running straight through.`,
    steps: [
      { title: 'Decompose the question', detail: 'Break into searchable sub-queries.', durationMs: 1400 },
      { title: 'Gather sources', detail: 'Crawl docs, forums, primary refs.', durationMs: 2200 },
      { title: 'Score relevance', detail: 'Rank by recency, authority, signal.', durationMs: 1600 },
      { title: 'Extract key facts', detail: 'Pull cite-worthy quotes and figures.', durationMs: 1900 },
      { title: 'Synthesize findings', detail: 'Compose a structured brief.', durationMs: 2100 },
    ],
  },
  {
    match: /deploy|ship|release|publish/i,
    label: 'Deploy a release',
    icon: '🚀',
    intro: () =>
      `Release run. I'll review the diff, run tests, and build artifacts before anything goes out. Canary and promote are gated.`,
    steps: [
      { title: 'Review pending changes', detail: 'Diff main against the release branch.', durationMs: 1500 },
      { title: 'Run full test suite', detail: 'Unit + integration + smoke.', durationMs: 2400 },
      { title: 'Build artifacts', detail: 'Optimized production bundle.', durationMs: 2000 },
      { title: 'Tag the release', detail: 'Cut a semver tag, update changelog.', durationMs: 1300 },
      { title: 'Push to production', detail: 'Roll out behind a 10% canary.', durationMs: 2200, critical: true },
      { title: 'Watch error rate', detail: 'Hold for 5m, then promote to 100%.', durationMs: 1800, critical: true },
    ],
  },
  {
    match: /migrat|schema|database|sql|alembic|prisma/i,
    label: 'Run a data migration',
    icon: '🗄️',
    intro: () =>
      `Migrations are easy to undo wrong, so I'll dry-run, snapshot, and execute. Snapshot and execute both touch the live database — both gated.`,
    steps: [
      { title: 'Inspect current schema', detail: 'Read live schema; target diff.', durationMs: 1600 },
      { title: 'Dry-run the migration', detail: 'Simulate against a clone.', durationMs: 2200 },
      { title: 'Snapshot affected tables', detail: 'Point-in-time backup.', durationMs: 1800, critical: true },
      { title: 'Execute migration', detail: 'Apply the change in production.', durationMs: 2400, critical: true },
      { title: 'Verify integrity', detail: 'Re-run row counts and constraints.', durationMs: 1500 },
    ],
  },
]

const FALLBACK: Template = {
  match: /.*/,
  label: 'General task',
  icon: '✨',
  intro: () =>
    `I'll restate the goal, plan a small set of ordered actions, and narrate as I work. If a step touches real state, I'll pause first.`,
  steps: [
    { title: 'Understand the task', detail: 'Restate goal; identify constraints.', durationMs: 1500 },
    { title: 'Plan an approach', detail: 'Break into 3–6 ordered actions.', durationMs: 1800 },
    { title: 'Execute step-by-step', detail: 'Run actions in order, validating each.', durationMs: 2400 },
    { title: 'Self-review the output', detail: 'Check for gaps, errors, clarity.', durationMs: 1500 },
    { title: 'Deliver final result', detail: 'Package and surface key takeaways.', durationMs: 1500 },
  ],
}

const SUGGESTIONS = [
  { icon: '🌐', text: 'Build a website for an indie coffee shop' },
  { icon: '🛠️', text: 'Fix backend error on /api/checkout returning 500' },
  { icon: '🔎', text: 'Research the top 5 vector databases in 2026' },
  { icon: '🚀', text: 'Deploy the v2.4 release to production' },
]

function pickTemplate(prompt: string): Template {
  for (const t of TEMPLATES) if (t.match.test(prompt)) return t
  return FALLBACK
}

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

function fmtDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function fmtClock(ts: number) {
  const d = new Date(ts)
  const hh = d.getHours().toString().padStart(2, '0')
  const mm = d.getMinutes().toString().padStart(2, '0')
  const ss = d.getSeconds().toString().padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

function AgentMode() {
  const [prompt, setPrompt] = useState('')
  const [activePrompt, setActivePrompt] = useState('')
  const [template, setTemplate] = useState<Template | null>(null)
  const [steps, setSteps] = useState<Step[]>([])
  const [logs, setLogs] = useState<LogLine[]>([])
  const [chat, setChat] = useState<ChatMessage[]>([])
  const [runState, setRunState] = useState<RunState>('idle')
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [endedAt, setEndedAt] = useState<number | null>(null)
  const [now, setNow] = useState<number>(Date.now())
  const [autoMode, setAutoMode] = useState<boolean>(false)
  const [pendingApproval, setPendingApproval] = useState<number | null>(null)

  const cancelRef = useRef(false)
  const autoModeRef = useRef(autoMode)
  const approvalResolverRef = useRef<((d: 'approve' | 'skip' | 'stop') => void) | null>(null)
  const logEndRef = useRef<HTMLDivElement | null>(null)
  const chatEndRef = useRef<HTMLDivElement | null>(null)
  const startRunRef = useRef<((p: string) => void) | null>(null)

  useEffect(() => {
    autoModeRef.current = autoMode
  }, [autoMode])

  useEffect(() => {
    if (runState !== 'running' && runState !== 'planning' && runState !== 'awaiting') return
    const id = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [runState])

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [logs.length])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [chat.length])

  // Pick up pending prompt forwarded from the homepage composer
  useEffect(() => {
    try {
      const pending = sessionStorage.getItem('nvr.pendingPrompt')
      if (pending) {
        sessionStorage.removeItem('nvr.pendingPrompt')
        setPrompt(pending)
        setTimeout(() => startRunRef.current?.(pending), 150)
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const completedCount = useMemo(
    () => steps.filter((s) => s.status === 'completed' || s.status === 'skipped').length,
    [steps],
  )
  const totalCount = steps.length
  const progressPct = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100)

  const totalElapsed = useMemo(() => {
    if (!startedAt) return 0
    return (endedAt ?? now) - startedAt
  }, [startedAt, endedAt, now])

  function pushLog(kind: LogLine['kind'], text: string) {
    setLogs((prev) => [...prev, { id: uid(), ts: Date.now(), kind, text }])
  }

  function pushChat(msg: ChatMessage) {
    setChat((prev) => [...prev, msg])
  }

  function reset() {
    cancelRef.current = true
    if (approvalResolverRef.current) {
      approvalResolverRef.current('stop')
      approvalResolverRef.current = null
    }
    setSteps([])
    setLogs([])
    setChat([])
    setTemplate(null)
    setActivePrompt('')
    setPendingApproval(null)
    setRunState('idle')
    setStartedAt(null)
    setEndedAt(null)
    setPrompt('')
  }

  async function startRun(rawPrompt: string) {
    const trimmed = rawPrompt.trim()
    if (!trimmed) return
    cancelRef.current = false
    setActivePrompt(trimmed)
    setRunState('planning')
    setStartedAt(Date.now())
    setEndedAt(null)
    setLogs([])
    setSteps([])
    setPendingApproval(null)
    pushChat({ id: uid(), role: 'user', text: trimmed })

    pushLog('info', `Received task: "${trimmed}"`)
    pushLog('agent', 'Reading the request and deciding how to break it down…')

    await wait(900)
    if (cancelRef.current) return

    const tpl = pickTemplate(trimmed)
    setTemplate(tpl)
    pushChat({ id: uid(), role: 'agent', kind: 'intro', text: tpl.intro() })

    const newSteps: Step[] = tpl.steps.map((s) => ({
      ...s,
      id: uid(),
      status: 'pending',
    }))
    setSteps(newSteps)

    const criticalCount = newSteps.filter((s) => s.critical).length
    pushLog(
      'plan',
      `Plan ready · ${tpl.label} · ${newSteps.length} steps${criticalCount > 0 ? ` · ${criticalCount} need approval` : ''}`,
    )
    if (criticalCount > 0 && !autoModeRef.current) {
      pushLog(
        'agent',
        `Auto Mode is off — pausing before each of the ${criticalCount} side-effecting step${criticalCount === 1 ? '' : 's'}.`,
      )
    } else if (criticalCount > 0 && autoModeRef.current) {
      pushLog('agent', `Auto Mode is on — executing the ${criticalCount} critical step${criticalCount === 1 ? '' : 's'} without stopping.`)
    }

    await wait(400)
    if (cancelRef.current) return

    setRunState('running')
    let skippedAny = false

    for (let i = 0; i < newSteps.length; i++) {
      if (cancelRef.current) {
        setRunState('cancelled')
        setEndedAt(Date.now())
        return
      }
      const step = newSteps[i]

      if (step.critical && !autoModeRef.current) {
        setSteps((prev) =>
          prev.map((s, idx) => (idx === i ? { ...s, status: 'awaiting' } : s)),
        )
        setPendingApproval(i)
        setRunState('awaiting')
        pushLog('decision', `Need approval to proceed with: ${step.title}`)

        const decision = await new Promise<'approve' | 'skip' | 'stop'>((resolve) => {
          approvalResolverRef.current = resolve
        })
        approvalResolverRef.current = null
        setPendingApproval(null)

        if (decision === 'stop' || cancelRef.current) {
          setSteps((prev) =>
            prev.map((s, idx) => (idx === i ? { ...s, status: 'failed' } : s)),
          )
          setRunState('cancelled')
          setEndedAt(Date.now())
          pushLog('error', 'Run stopped by user.')
          pushChat({ id: uid(), role: 'agent', kind: 'note', text: 'Stopped on your call.' })
          return
        }

        if (decision === 'skip') {
          setSteps((prev) =>
            prev.map((s, idx) => (idx === i ? { ...s, status: 'skipped' } : s)),
          )
          pushLog('decision', `Skipped: ${step.title}`)
          skippedAny = true
          setRunState('running')
          continue
        }

        pushLog('decision', `Approved: ${step.title}`)
        setRunState('running')
      }

      setSteps((prev) =>
        prev.map((s, idx) =>
          idx === i ? { ...s, status: 'running', startedAt: Date.now() } : s,
        ),
      )
      pushLog('tool', `[${i + 1}/${newSteps.length}] ${step.title}`)

      await waitInterruptible(step.durationMs, cancelRef)
      if (cancelRef.current) {
        setSteps((prev) =>
          prev.map((s, idx) => (idx === i ? { ...s, status: 'failed' } : s)),
        )
        setRunState('cancelled')
        setEndedAt(Date.now())
        pushLog('error', 'Run cancelled by user.')
        pushChat({ id: uid(), role: 'agent', kind: 'note', text: 'Run cancelled mid-step.' })
        return
      }

      setSteps((prev) =>
        prev.map((s, idx) =>
          idx === i ? { ...s, status: 'completed', completedAt: Date.now() } : s,
        ),
      )
      pushLog('result', `✓ ${step.title}`)
    }

    setRunState('completed')
    setEndedAt(Date.now())
    pushChat({
      id: uid(),
      role: 'agent',
      kind: 'closing',
      text: skippedAny
        ? `Done — finished the plan, with one or more steps skipped on your call. Want me to revisit them?`
        : `All steps cleared. Happy with the result, or should I dig deeper?`,
    })
    pushLog('agent', skippedAny ? 'Run complete with skipped steps.' : 'Run complete. Awaiting next instruction.')
  }

  startRunRef.current = startRun

  function cancelRun() {
    if (runState === 'idle' || runState === 'completed') return
    cancelRef.current = true
    if (approvalResolverRef.current) {
      approvalResolverRef.current('stop')
    }
  }

  function decide(decision: 'approve' | 'skip') {
    if (approvalResolverRef.current) {
      approvalResolverRef.current(decision)
    }
  }

  const isBusy = runState === 'running' || runState === 'planning' || runState === 'awaiting'
  const hasRun = runState !== 'idle' || steps.length > 0

  return (
    <div
      style={{
        position: 'relative',
        minHeight: 'calc(100vh - 64px)',
        background:
          'radial-gradient(ellipse 80% 40% at 50% -10%, rgba(0, 200, 240, 0.10) 0%, transparent 60%), var(--bg-base)',
        paddingBottom: '48px',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '32px 24px 0',
        }}
      >
        <div
          style={{
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <span className="tag">
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
              Auto Agent Mode
            </span>
            <h1
              style={{
                fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                margin: '10px 0 0',
                color: 'var(--text-primary)',
              }}
            >
              Live agent run
            </h1>
          </div>
          <AutoModeToggle value={autoMode} onChange={setAutoMode} />
        </div>

        <div className="agent-grid">
          {/* LEFT — Live monitor */}
          <MonitorPanel
            runState={runState}
            template={template}
            activePrompt={activePrompt}
            steps={steps}
            completedCount={completedCount}
            totalCount={totalCount}
            progressPct={progressPct}
            totalElapsed={totalElapsed}
            now={now}
            logs={logs}
            logEndRef={logEndRef}
            onStop={cancelRun}
            isBusy={isBusy}
          />

          {/* RIGHT — Chat + controls */}
          <ChatPanel
            chat={chat}
            chatEndRef={chatEndRef}
            prompt={prompt}
            setPrompt={setPrompt}
            onSend={() => {
              startRun(prompt)
              setPrompt('')
            }}
            onReset={reset}
            runState={runState}
            isBusy={isBusy}
            hasRun={hasRun}
            onSuggestion={(s) => {
              setPrompt(s)
              startRun(s)
            }}
            pendingApproval={pendingApproval}
            pendingStep={pendingApproval !== null ? steps[pendingApproval] : null}
            onApprove={() => decide('approve')}
            onSkip={() => decide('skip')}
            onStop={cancelRun}
          />
        </div>
      </div>

      <style>{`
        .agent-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
          gap: 20px;
          align-items: start;
        }
        @media (max-width: 960px) {
          .agent-grid { grid-template-columns: 1fr; }
        }
        .suggestion-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: 999px;
          color: var(--text-secondary);
          font-size: 0.8125rem;
          cursor: pointer;
          transition: all 0.15s ease;
          font-family: inherit;
        }
        .suggestion-chip:hover {
          border-color: var(--accent);
          color: var(--text-primary);
          background: rgba(0, 200, 240, 0.06);
        }
        @keyframes step-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes step-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(0, 200, 240, 0.5); }
          50% { box-shadow: 0 0 0 8px rgba(0, 200, 240, 0); }
        }
        @keyframes warn-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255, 184, 0, 0.45); }
          50% { box-shadow: 0 0 0 10px rgba(255, 184, 0, 0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(2px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .progress-bar-fill {
          background: linear-gradient(90deg, var(--accent) 0%, #5cdcf2 50%, var(--accent) 100%);
          background-size: 200% 100%;
          animation: shimmer 2.4s linear infinite;
        }
        .step-row.running {
          background: linear-gradient(180deg, rgba(0, 200, 240, 0.08) 0%, rgba(0, 200, 240, 0.02) 100%);
          border-color: rgba(0, 200, 240, 0.35);
        }
        .step-row.completed .step-icon {
          background: rgba(0, 200, 240, 0.12);
          color: var(--accent);
          border-color: rgba(0, 200, 240, 0.35);
        }
        .step-row.failed .step-icon {
          background: rgba(244, 71, 99, 0.12);
          color: #f44763;
          border-color: rgba(244, 71, 99, 0.4);
        }
        .step-row.skipped { opacity: 0.65; }
        .step-row.skipped .step-icon {
          background: var(--bg-surface);
          color: var(--text-muted);
          border-color: var(--border);
        }
        .step-row.awaiting {
          background: linear-gradient(180deg, rgba(255, 184, 0, 0.10) 0%, rgba(255, 184, 0, 0.02) 100%);
          border-color: rgba(255, 184, 0, 0.45);
          animation: warn-pulse 2s infinite;
        }
        .step-row.awaiting .step-icon {
          background: rgba(255, 184, 0, 0.14);
          color: #ffb800;
          border-color: rgba(255, 184, 0, 0.45);
        }
        .approval-card {
          margin-top: 12px;
          padding: 14px;
          border: 1px solid rgba(255, 184, 0, 0.4);
          border-radius: 12px;
          background: linear-gradient(180deg, rgba(255, 184, 0, 0.10) 0%, rgba(255, 184, 0, 0.03) 100%);
          animation: fadeIn 0.2s ease;
        }
        .critical-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          border-radius: 999px;
          font-family: 'DM Mono', monospace;
          font-size: 0.6875rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          background: rgba(255, 184, 0, 0.12);
          color: #ffb800;
          border: 1px solid rgba(255, 184, 0, 0.35);
        }
        .stop-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: rgba(244, 71, 99, 0.12);
          color: #ff6e85;
          border: 1px solid rgba(244, 71, 99, 0.45);
          border-radius: 10px;
          font-family: 'Syne', sans-serif;
          font-weight: 600;
          font-size: 0.8125rem;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .stop-btn:hover:not(:disabled) {
          background: rgba(244, 71, 99, 0.2);
          border-color: rgba(244, 71, 99, 0.7);
          color: #ff8b9e;
        }
        .stop-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
        .composer-icon-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          flex-shrink: 0;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 10px;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .composer-icon-btn:hover {
          color: var(--accent);
          background: rgba(0, 200, 240, 0.08);
          border-color: rgba(0, 200, 240, 0.2);
        }
        .composer-send-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          flex-shrink: 0;
          background: var(--accent);
          color: var(--bg-base);
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .composer-send-btn:hover:not(:disabled) {
          background: #33d4f5;
          box-shadow: 0 6px 18px rgba(0, 200, 240, 0.4);
        }
        .composer-send-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}

function MonitorPanel({
  runState,
  template,
  activePrompt,
  steps,
  completedCount,
  totalCount,
  progressPct,
  totalElapsed,
  now,
  logs,
  logEndRef,
  onStop,
  isBusy,
}: {
  runState: RunState
  template: Template | null
  activePrompt: string
  steps: Step[]
  completedCount: number
  totalCount: number
  progressPct: number
  totalElapsed: number
  now: number
  logs: LogLine[]
  logEndRef: React.RefObject<HTMLDivElement | null>
  onStop: () => void
  isBusy: boolean
}) {
  const liveAction = useMemo(() => {
    const running = steps.find((s) => s.status === 'running')
    if (running) return running.title
    const awaiting = steps.find((s) => s.status === 'awaiting')
    if (awaiting) return `Awaiting approval: ${awaiting.title}`
    if (runState === 'planning') return 'Planning the run…'
    if (runState === 'completed') return 'Run complete'
    if (runState === 'cancelled') return 'Stopped'
    if (runState === 'failed') return 'Failed'
    return 'Idle'
  }, [steps, runState])

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '20px',
        position: 'sticky',
        top: '88px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '14px',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: '0.6875rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}
        >
          Live Monitor
        </div>
        <button
          className="stop-btn"
          onClick={onStop}
          disabled={!isBusy}
          aria-label="Stop the agent"
        >
          <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor">
            <rect x="2.5" y="2.5" width="7" height="7" rx="1" />
          </svg>
          Stop
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '6px',
          flexWrap: 'wrap',
        }}
      >
        <RunBadge state={runState} />
        {template && (
          <span
            style={{
              fontFamily: 'DM Mono, monospace',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
            }}
          >
            {template.icon} {template.label}
          </span>
        )}
      </div>

      <div
        style={{
          color: 'var(--text-primary)',
          fontFamily: 'Syne, sans-serif',
          fontWeight: 600,
          fontSize: '1rem',
          marginBottom: '4px',
          minHeight: '1.4em',
        }}
        title={liveAction}
      >
        {liveAction}
      </div>
      {activePrompt && (
        <div
          style={{
            color: 'var(--text-muted)',
            fontSize: '0.8125rem',
            marginBottom: '14px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={activePrompt}
        >
          “{activePrompt}”
        </div>
      )}

      <div style={{ marginBottom: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
        <span>
          {completedCount}/{totalCount || '–'} steps
        </span>
        <span>{fmtDuration(totalElapsed)} · {progressPct}%</span>
      </div>
      <div
        style={{
          height: '6px',
          borderRadius: '3px',
          background: 'var(--bg-elevated)',
          overflow: 'hidden',
          marginBottom: '20px',
        }}
      >
        <div
          className={runState === 'running' ? 'progress-bar-fill' : ''}
          style={{
            height: '100%',
            width: `${progressPct}%`,
            background:
              runState === 'failed' || runState === 'cancelled'
                ? '#f44763'
                : runState === 'awaiting'
                  ? '#ffb800'
                  : runState === 'completed'
                    ? 'var(--accent)'
                    : undefined,
            transition: 'width 0.4s ease',
          }}
        />
      </div>

      <div
        style={{
          fontFamily: 'DM Mono, monospace',
          fontSize: '0.6875rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          marginBottom: '10px',
        }}
      >
        Live actions
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
        {steps.length === 0 && runState === 'planning' && <PlanningSkeleton />}
        {steps.length === 0 && runState === 'idle' && (
          <div
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.875rem',
              padding: '24px 12px',
              textAlign: 'center',
              border: '1px dashed var(--border)',
              borderRadius: '10px',
            }}
          >
            No run in progress. Send a task to start.
          </div>
        )}
        {steps.map((step, idx) => (
          <StepRow key={step.id} step={step} index={idx} now={now} />
        ))}
      </div>

      <div
        style={{
          marginTop: '20px',
          fontFamily: 'DM Mono, monospace',
          fontSize: '0.6875rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          marginBottom: '8px',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>Activity log</span>
        <span style={{ textTransform: 'none', letterSpacing: 0 }}>
          {logs.length} {logs.length === 1 ? 'event' : 'events'}
        </span>
      </div>
      <div
        style={{
          background: 'var(--bg-base)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '10px 12px',
          fontFamily: 'DM Mono, monospace',
          fontSize: '0.75rem',
          lineHeight: 1.6,
          maxHeight: '240px',
          minHeight: '120px',
          overflowY: 'auto',
        }}
      >
        {logs.length === 0 && (
          <div style={{ color: 'var(--text-muted)' }}>Waiting for events…</div>
        )}
        {logs.map((line) => (
          <LogRow key={line.id} line={line} />
        ))}
        <div ref={logEndRef} />
      </div>
    </div>
  )
}

function ChatPanel({
  chat,
  chatEndRef,
  prompt,
  setPrompt,
  onSend,
  onReset,
  runState,
  isBusy,
  hasRun,
  onSuggestion,
  pendingApproval,
  pendingStep,
  onApprove,
  onSkip,
  onStop,
}: {
  chat: ChatMessage[]
  chatEndRef: React.RefObject<HTMLDivElement | null>
  prompt: string
  setPrompt: (s: string) => void
  onSend: () => void
  onReset: () => void
  runState: RunState
  isBusy: boolean
  hasRun: boolean
  onSuggestion: (s: string) => void
  pendingApproval: number | null
  pendingStep: Step | null
  onApprove: () => void
  onSkip: () => void
  onStop: () => void
}) {
  const isDone = runState === 'completed' || runState === 'failed' || runState === 'cancelled'

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '560px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '14px',
        }}
      >
        <div
          style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: '0.6875rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}
        >
          Chat
        </div>
        {isDone && hasRun && (
          <button
            onClick={onReset}
            className="btn-ghost"
            style={{ padding: '6px 14px', fontSize: '0.75rem' }}
          >
            New task
          </button>
        )}
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          padding: '4px 2px',
          marginBottom: '14px',
          minHeight: '300px',
        }}
      >
        {chat.length === 0 && (
          <EmptyChat onSuggestion={onSuggestion} />
        )}
        {chat.map((m) => (
          <ChatBubble key={m.id} message={m} />
        ))}
        {pendingApproval !== null && pendingStep && (
          <ApprovalCard
            step={pendingStep}
            onApprove={onApprove}
            onSkip={onSkip}
            onStop={onStop}
          />
        )}
        <div ref={chatEndRef} />
      </div>

      <div
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          padding: '6px 6px 6px 10px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <button
          type="button"
          aria-label="Attach file"
          className="composer-icon-btn"
          disabled={isBusy}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        </button>
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !isBusy) {
              e.preventDefault()
              onSend()
            }
          }}
          disabled={isBusy}
          placeholder={isBusy ? 'Agent is working…' : 'Send a task to the agent'}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontFamily: 'inherit',
            fontSize: '0.9375rem',
            padding: '10px 4px',
            minWidth: 0,
          }}
        />
        <button
          type="button"
          aria-label="Voice input"
          className="composer-icon-btn"
          disabled={isBusy}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="9" y1="22" x2="15" y2="22" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Send"
          onClick={onSend}
          disabled={isBusy || !prompt.trim()}
          className="composer-send-btn"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="13 6 19 12 13 18" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function EmptyChat({ onSuggestion }: { onSuggestion: (s: string) => void }) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '12px 4px',
      }}
    >
      <div
        style={{
          color: 'var(--text-secondary)',
          fontSize: '0.9375rem',
          lineHeight: 1.6,
        }}
      >
        Send a task. The agent plans, narrates, and pauses before any action that touches real state.
      </div>
      <div
        style={{
          fontFamily: 'DM Mono, monospace',
          fontSize: '0.6875rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          marginTop: '8px',
        }}
      >
        Try
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {SUGGESTIONS.map((s) => (
          <button
            key={s.text}
            onClick={() => onSuggestion(s.text)}
            className="suggestion-chip"
          >
            <span style={{ fontSize: '1rem' }}>{s.icon}</span>
            <span>{s.text}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function ChatBubble({ message }: { message: ChatMessage }) {
  if (message.role === 'user') {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div
          style={{
            maxWidth: '85%',
            background: 'rgba(0, 200, 240, 0.12)',
            border: '1px solid rgba(0, 200, 240, 0.3)',
            color: 'var(--text-primary)',
            padding: '10px 14px',
            borderRadius: '14px 14px 4px 14px',
            fontSize: '0.9375rem',
            lineHeight: 1.55,
          }}
        >
          {message.text}
        </div>
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', gap: '10px' }}>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: 'rgba(0, 200, 240, 0.12)',
          border: '1px solid rgba(0, 200, 240, 0.35)',
          color: 'var(--accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontFamily: 'Syne, sans-serif',
          fontWeight: 700,
          fontSize: '0.75rem',
        }}
      >
        A
      </div>
      <div
        style={{
          maxWidth: '85%',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          color: 'var(--text-primary)',
          padding: '10px 14px',
          borderRadius: '4px 14px 14px 14px',
          fontSize: '0.9375rem',
          lineHeight: 1.55,
        }}
      >
        {message.text}
      </div>
    </div>
  )
}

function ApprovalCard({
  step,
  onApprove,
  onSkip,
  onStop,
}: {
  step: Step
  onApprove: () => void
  onSkip: () => void
  onStop: () => void
}) {
  return (
    <div className="approval-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <span className="critical-badge">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M5 1L9 8.5H1L5 1Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
            <circle cx="5" cy="6.5" r="0.6" fill="currentColor" />
          </svg>
          Critical action
        </span>
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          paused · awaiting your call
        </span>
      </div>
      <div style={{ color: 'var(--text-primary)', fontSize: '0.9375rem', marginBottom: '4px' }}>
        I'd like to <strong style={{ fontWeight: 600 }}>{step.title.toLowerCase()}</strong>.
      </div>
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', lineHeight: 1.5, marginBottom: '12px' }}>
        {step.detail} This step changes real state, so checking with you first.
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button onClick={onApprove} className="btn-primary" style={{ padding: '7px 16px', fontSize: '0.8125rem' }}>
          Approve
        </button>
        <button onClick={onSkip} className="btn-ghost" style={{ padding: '7px 16px', fontSize: '0.8125rem' }}>
          Skip
        </button>
        <button onClick={onStop} className="stop-btn">
          Stop run
        </button>
      </div>
    </div>
  )
}

function AutoModeToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      aria-pressed={value}
      title={
        value
          ? 'Auto Mode is on — executes critical steps without stopping.'
          : 'Auto Mode is off — pauses for approval on critical steps.'
      }
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '12px',
        padding: '8px 12px',
        background: value ? 'rgba(0, 200, 240, 0.08)' : 'var(--bg-surface)',
        border: `1px solid ${value ? 'rgba(0, 200, 240, 0.5)' : 'var(--border)'}`,
        borderRadius: '12px',
        color: 'var(--text-primary)',
        fontFamily: 'inherit',
        fontSize: '0.8125rem',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2 }}>
        <span
          style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: '0.625rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}
        >
          Auto Mode
        </span>
        <span style={{ color: value ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: 600 }}>
          {value ? 'ON · acting freely' : 'OFF · asks first'}
        </span>
      </div>
      <span
        style={{
          width: 36,
          height: 20,
          borderRadius: 999,
          background: value ? 'var(--accent)' : 'var(--bg-elevated)',
          position: 'relative',
          transition: 'background 0.2s',
          border: `1px solid ${value ? 'var(--accent)' : 'var(--border-bright)'}`,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 1,
            left: value ? 17 : 1,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: value ? '#060a12' : 'var(--text-secondary)',
            transition: 'left 0.2s ease',
          }}
        />
      </span>
    </button>
  )
}

function RunBadge({ state }: { state: RunState }) {
  const map: Record<RunState, { label: string; color: string; dot: string }> = {
    idle: { label: 'Idle', color: 'var(--text-muted)', dot: 'var(--text-muted)' },
    planning: { label: 'Planning', color: 'var(--accent)', dot: 'var(--accent)' },
    running: { label: 'Running', color: 'var(--accent)', dot: 'var(--accent)' },
    awaiting: { label: 'Awaiting approval', color: '#ffb800', dot: '#ffb800' },
    completed: { label: 'Completed', color: 'var(--accent)', dot: 'var(--accent)' },
    failed: { label: 'Failed', color: '#f44763', dot: '#f44763' },
    cancelled: { label: 'Cancelled', color: '#f44763', dot: '#f44763' },
  }
  const v = map[state]
  return (
    <span style={{ color: v.color, display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'DM Mono, monospace', fontSize: '0.75rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
      <span
        style={{
          display: 'inline-block',
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: v.dot,
          animation:
            state === 'running' || state === 'planning' || state === 'awaiting'
              ? 'step-pulse 1.6s infinite'
              : undefined,
        }}
      />
      {v.label}
    </span>
  )
}

function PlanningSkeleton() {
  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            opacity: 0.5,
            animation: 'fadeIn 0.4s ease',
            animationDelay: `${i * 80}ms`,
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              background: 'var(--bg-elevated)',
            }}
          />
          <div style={{ flex: 1 }}>
            <div
              style={{
                width: '40%',
                height: 9,
                background: 'var(--bg-elevated)',
                borderRadius: 4,
                marginBottom: 6,
              }}
            />
            <div
              style={{
                width: '70%',
                height: 7,
                background: 'var(--bg-elevated)',
                borderRadius: 4,
              }}
            />
          </div>
        </div>
      ))}
    </>
  )
}

function StepRow({
  step,
  index,
  now,
}: {
  step: Step
  index: number
  now: number
}) {
  const elapsed =
    step.status === 'running' && step.startedAt
      ? now - step.startedAt
      : step.completedAt && step.startedAt
        ? step.completedAt - step.startedAt
        : 0

  return (
    <div
      className={`step-row ${step.status}`}
      style={{
        position: 'relative',
        display: 'flex',
        gap: '10px',
        padding: '10px 12px',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        background: 'var(--bg-elevated)',
        transition: 'all 0.2s ease',
      }}
    >
      <StepIcon status={step.status} index={index} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            alignItems: 'center',
            marginBottom: 2,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
            <span
              style={{
                fontWeight: 500,
                color:
                  step.status === 'pending' || step.status === 'skipped'
                    ? 'var(--text-secondary)'
                    : 'var(--text-primary)',
                fontSize: '0.875rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {step.title}
            </span>
            {step.critical && step.status !== 'completed' && step.status !== 'skipped' && (
              <span className="critical-badge">critical</span>
            )}
          </div>
          <div
            style={{
              fontFamily: 'DM Mono, monospace',
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              whiteSpace: 'nowrap',
            }}
          >
            {step.status === 'running' && fmtDuration(elapsed)}
            {step.status === 'completed' && fmtDuration(elapsed)}
            {step.status === 'pending' && '—'}
            {step.status === 'awaiting' && 'paused'}
            {step.status === 'skipped' && 'skipped'}
            {step.status === 'failed' && 'failed'}
          </div>
        </div>
        <div
          style={{
            color: 'var(--text-secondary)',
            fontSize: '0.75rem',
            lineHeight: 1.5,
          }}
        >
          {step.detail}
        </div>
      </div>
    </div>
  )
}

function StepIcon({ status, index }: { status: StepStatus; index: number }) {
  return (
    <div
      className="step-icon"
      style={{
        width: 26,
        height: 26,
        borderRadius: '50%',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        color: 'var(--text-muted)',
        fontSize: '0.7rem',
        fontFamily: 'DM Mono, monospace',
        fontWeight: 500,
      }}
    >
      {status === 'pending' && <span>{index + 1}</span>}
      {status === 'running' && (
        <svg width="14" height="14" viewBox="0 0 16 16" style={{ animation: 'step-spin 1s linear infinite' }}>
          <circle cx="8" cy="8" r="6" stroke="var(--accent)" strokeWidth="2" fill="none" strokeDasharray="28" strokeDashoffset="14" strokeLinecap="round" />
        </svg>
      )}
      {status === 'awaiting' && (
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
          <path d="M7 1L13 12H1L7 1Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M7 5.5V8.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="7" cy="10.5" r="0.8" fill="currentColor" />
        </svg>
      )}
      {status === 'completed' && (
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
          <path d="M2.5 7.5L5.5 10.5L11.5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {status === 'skipped' && (
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
          <path d="M3 7H11M11 7L8 4M11 7L8 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {status === 'failed' && (
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
          <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )}
    </div>
  )
}

function LogRow({ line }: { line: LogLine }) {
  const colorMap: Record<LogLine['kind'], string> = {
    info: 'var(--text-secondary)',
    plan: '#a78bfa',
    tool: 'var(--accent)',
    result: '#34d399',
    error: '#f44763',
    agent: '#5cdcf2',
    decision: '#ffb800',
  }
  const labelMap: Record<LogLine['kind'], string> = {
    info: 'info',
    plan: 'plan',
    tool: 'step',
    result: 'done',
    error: 'err ',
    agent: 'say ',
    decision: 'ask ',
  }
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '64px 38px 1fr',
        gap: '6px',
        animation: 'fadeIn 0.25s ease',
      }}
    >
      <span style={{ color: 'var(--text-muted)' }}>{fmtClock(line.ts)}</span>
      <span style={{ color: colorMap[line.kind] }}>{labelMap[line.kind]}</span>
      <span style={{ color: 'var(--text-primary)', wordBreak: 'break-word' }}>{line.text}</span>
    </div>
  )
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function waitInterruptible(ms: number, cancelRef: { current: boolean }) {
  return new Promise<void>((resolve) => {
    const start = Date.now()
    const tick = () => {
      if (cancelRef.current) return resolve()
      if (Date.now() - start >= ms) return resolve()
      setTimeout(tick, 80)
    }
    tick()
  })
}
