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
  /** Steps with side effects that mutate shared state. Gated by approval when Auto Mode is off. */
  critical?: boolean
}

type LogLine = {
  id: string
  ts: number
  kind: 'info' | 'tool' | 'result' | 'error' | 'plan' | 'agent' | 'decision'
  text: string
}

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
      `Got it — you want to ship a site. I'll scope the audience, draft the layout, then scaffold and preview-deploy. The deploy step touches a real environment, so I'll check with you before pushing it out.`,
    steps: [
      { title: 'Analyze requirements', detail: 'Parse goal, audience, and core sections from the prompt.', durationMs: 1600 },
      { title: 'Draft sitemap & layout', detail: 'Outline pages, hero structure, and navigation hierarchy.', durationMs: 2200 },
      { title: 'Choose design system', detail: 'Pick palette, typography pairing, and component primitives.', durationMs: 1800 },
      { title: 'Generate components', detail: 'Scaffold hero, features grid, pricing, and footer.', durationMs: 2600 },
      { title: 'Wire up routing', detail: 'Configure file-based routes and active-link styling.', durationMs: 1500 },
      { title: 'Run lint & type-check', detail: 'Validate TypeScript, ESLint, and accessibility checks.', durationMs: 2000 },
      { title: 'Deploy preview', detail: 'Push to Netlify preview and emit a shareable URL.', durationMs: 2400, critical: true },
    ],
  },
  {
    match: /(fix|debug|resolve|investigate).*(error|bug|issue|crash|500|backend|api|server)|backend\s+error/i,
    label: 'Fix backend error',
    icon: '🛠️',
    intro: () =>
      `On it. I'll reproduce the failure, walk the stack to the root cause, and patch it with the smallest safe change. Two steps — applying the fix and shipping to staging — change real code, so I'll pause for your call before either.`,
    steps: [
      { title: 'Reproduce the failure', detail: 'Replay the failing request against a local handler.', durationMs: 1900 },
      { title: 'Read recent logs', detail: 'Pull the last 200 lines around the first 5xx.', durationMs: 1500 },
      { title: 'Locate offending module', detail: 'Walk the stack trace to the source frame.', durationMs: 1700 },
      { title: 'Form a hypothesis', detail: 'Identify the most likely root cause.', durationMs: 1300 },
      { title: 'Apply targeted fix', detail: 'Patch the code with the smallest safe change.', durationMs: 2200, critical: true },
      { title: 'Add regression test', detail: 'Cover the failing path with a deterministic test.', durationMs: 1800 },
      { title: 'Verify in staging', detail: 'Run the suite and replay the original request.', durationMs: 2100, critical: true },
    ],
  },
  {
    match: /research|summari[sz]e|investigate|compare|analy[sz]e/i,
    label: 'Research & summarize',
    icon: '🔎',
    intro: () =>
      `Good question to dig into. I'll decompose it, gather sources, score them for signal, then synthesize a brief with citations. This is read-only — nothing here touches real systems, so I'll run straight through.`,
    steps: [
      { title: 'Decompose the question', detail: 'Break the prompt into searchable sub-queries.', durationMs: 1400 },
      { title: 'Gather sources', detail: 'Crawl docs, forums, and primary references.', durationMs: 2200 },
      { title: 'Score relevance', detail: 'Rank sources by recency, authority, and signal.', durationMs: 1600 },
      { title: 'Extract key facts', detail: 'Pull cite-worthy quotes and figures.', durationMs: 1900 },
      { title: 'Synthesize findings', detail: 'Compose a structured brief with citations.', durationMs: 2100 },
    ],
  },
  {
    match: /deploy|ship|release|publish/i,
    label: 'Deploy a release',
    icon: '🚀',
    intro: () =>
      `Release run. I'll review the diff, run the suite, and build artifacts before anything goes out. The canary push and the promote-to-100% steps are real, user-facing changes — I'll need an explicit go from you on each.`,
    steps: [
      { title: 'Review pending changes', detail: 'Diff main against the release branch.', durationMs: 1500 },
      { title: 'Run full test suite', detail: 'Execute unit + integration + smoke tests.', durationMs: 2400 },
      { title: 'Build artifacts', detail: 'Produce optimized production bundle.', durationMs: 2000 },
      { title: 'Tag the release', detail: 'Cut a semver tag and update the changelog.', durationMs: 1300 },
      { title: 'Push to production', detail: 'Roll out behind a 10% canary first.', durationMs: 2200, critical: true },
      { title: 'Watch error rate', detail: 'Hold for 5m, then promote to 100%.', durationMs: 1800, critical: true },
    ],
  },
  {
    match: /migrat|schema|database|sql|alembic|prisma/i,
    label: 'Run a data migration',
    icon: '🗄️',
    intro: () =>
      `Migrations are easy to undo wrong, so I'll plan carefully: dry-run first, snapshot the table, then execute. Snapshot and execute both touch the live database — both are gated unless Auto Mode is on.`,
    steps: [
      { title: 'Inspect current schema', detail: 'Read the live schema and target diff.', durationMs: 1600 },
      { title: 'Dry-run the migration', detail: 'Simulate against a clone, capture row counts.', durationMs: 2200 },
      { title: 'Snapshot affected tables', detail: 'Take a point-in-time backup before mutation.', durationMs: 1800, critical: true },
      { title: 'Execute migration', detail: 'Apply the change against production.', durationMs: 2400, critical: true },
      { title: 'Verify integrity', detail: 'Re-run row counts and constraint checks.', durationMs: 1500 },
    ],
  },
]

const FALLBACK: Template = {
  match: /.*/,
  label: 'General task',
  icon: '✨',
  intro: () =>
    `I'll restate the goal so we're aligned, plan a small set of ordered actions, and execute them while narrating what I find. If anything looks like it would change real state, I'll pause and ask first.`,
  steps: [
    { title: 'Understand the task', detail: 'Restate the goal and identify key constraints.', durationMs: 1500 },
    { title: 'Plan an approach', detail: 'Break the work into 3–6 ordered actions.', durationMs: 1800 },
    { title: 'Execute step-by-step', detail: 'Run actions in order, validating each result.', durationMs: 2400 },
    { title: 'Self-review the output', detail: 'Check for gaps, errors, and clarity.', durationMs: 1500 },
    { title: 'Deliver final result', detail: 'Package the answer and surface key takeaways.', durationMs: 1500 },
  ],
}

const SUGGESTIONS = [
  { icon: '🌐', text: 'Build a website for an indie coffee shop' },
  { icon: '🛠️', text: 'Fix backend error on /api/checkout returning 500' },
  { icon: '🔎', text: 'Research the top 5 vector databases in 2026' },
  { icon: '🚀', text: 'Deploy the v2.4 release to production' },
  { icon: '🗄️', text: 'Migrate the users table to add a phone column' },
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
  const [runState, setRunState] = useState<RunState>('idle')
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [endedAt, setEndedAt] = useState<number | null>(null)
  const [now, setNow] = useState<number>(Date.now())
  const [autoMode, setAutoMode] = useState<boolean>(false)
  const [intro, setIntro] = useState<string>('')
  const [closing, setClosing] = useState<string>('')
  const [pendingApproval, setPendingApproval] = useState<number | null>(null)

  const cancelRef = useRef(false)
  const autoModeRef = useRef(autoMode)
  const approvalResolverRef = useRef<((decision: 'approve' | 'skip' | 'stop') => void) | null>(null)
  const logEndRef = useRef<HTMLDivElement | null>(null)

  // Keep ref in sync so the running loop sees the live value
  useEffect(() => {
    autoModeRef.current = autoMode
  }, [autoMode])

  // Live clock for in-flight elapsed time
  useEffect(() => {
    if (runState !== 'running' && runState !== 'planning' && runState !== 'awaiting') return
    const id = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [runState])

  // Auto-scroll the log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [logs.length])

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

  function reset() {
    cancelRef.current = true
    if (approvalResolverRef.current) {
      approvalResolverRef.current('stop')
      approvalResolverRef.current = null
    }
    setSteps([])
    setLogs([])
    setTemplate(null)
    setActivePrompt('')
    setIntro('')
    setClosing('')
    setPendingApproval(null)
    setRunState('idle')
    setStartedAt(null)
    setEndedAt(null)
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
    setIntro('')
    setClosing('')
    setPendingApproval(null)

    pushLog('info', `Received task: "${trimmed}"`)
    pushLog('agent', 'Reading the request and deciding how to break it down…')

    await wait(900)
    if (cancelRef.current) return

    const tpl = pickTemplate(trimmed)
    setTemplate(tpl)
    setIntro(tpl.intro())
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
        `Auto Mode is off — I'll pause before each of the ${criticalCount} side-effecting step${criticalCount === 1 ? '' : 's'} and wait for your call.`,
      )
    } else if (criticalCount > 0 && autoModeRef.current) {
      pushLog('agent', `Auto Mode is on — I'll execute the ${criticalCount} critical step${criticalCount === 1 ? '' : 's'} without stopping.`)
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

      // Permission gate for critical steps when Auto Mode is off
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
    setClosing(
      skippedAny
        ? `Done — finished the plan, with one or more steps skipped on your call. Want me to revisit them or move on?`
        : `All steps cleared. Happy with the result, or should I dig deeper on any one of them?`,
    )
    pushLog('agent', skippedAny ? 'Run complete with skipped steps.' : 'Run complete. Awaiting next instruction.')
  }

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

  return (
    <div
      style={{
        position: 'relative',
        minHeight: 'calc(100vh - 64px)',
        background:
          'radial-gradient(ellipse 80% 40% at 50% -10%, rgba(0, 200, 240, 0.10) 0%, transparent 60%), var(--bg-base)',
        paddingBottom: '64px',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '48px 24px 0',
        }}
      >
        {/* Header */}
        <div
          style={{
            marginBottom: '32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '24px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <span className="tag" style={{ marginBottom: '16px' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
              Auto Agent Mode
            </span>
            <h1
              style={{
                fontSize: 'clamp(2rem, 4vw, 2.75rem)',
                margin: '12px 0 8px',
                color: 'var(--text-primary)',
              }}
            >
              Describe a task. Watch the agent work.
            </h1>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: '1.0625rem',
                maxWidth: '720px',
                margin: 0,
              }}
            >
              Give the agent a goal in plain English. It plans the work, narrates as it goes, and pauses to ask before
              anything that touches real state — unless you flip Auto Mode on.
            </p>
          </div>
          <AutoModeToggle value={autoMode} onChange={setAutoMode} />
        </div>

        {/* Composer */}
        <Composer
          prompt={prompt}
          setPrompt={setPrompt}
          onRun={() => startRun(prompt)}
          onCancel={cancelRun}
          onReset={reset}
          runState={runState}
        />

        {/* Suggestions (only when idle) */}
        {runState === 'idle' && steps.length === 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              marginTop: '16px',
            }}
          >
            {SUGGESTIONS.map((s) => (
              <button
                key={s.text}
                onClick={() => {
                  setPrompt(s.text)
                  startRun(s.text)
                }}
                className="suggestion-chip"
              >
                <span style={{ fontSize: '1rem' }}>{s.icon}</span>
                <span>{s.text}</span>
              </button>
            ))}
          </div>
        )}

        {/* Run panel */}
        {(runState !== 'idle' || steps.length > 0) && (
          <div
            className="run-grid"
            style={{
              marginTop: '32px',
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
              gap: '20px',
              alignItems: 'start',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
              {(intro || closing) && (
                <AgentMessage
                  intro={intro}
                  closing={closing}
                  template={template}
                  runState={runState}
                />
              )}
              <StepsPanel
                activePrompt={activePrompt}
                template={template}
                steps={steps}
                runState={runState}
                completedCount={completedCount}
                totalCount={totalCount}
                progressPct={progressPct}
                totalElapsed={totalElapsed}
                now={now}
                pendingApproval={pendingApproval}
                onApprove={() => decide('approve')}
                onSkip={() => decide('skip')}
                onStop={cancelRun}
              />
            </div>
            <LogPanel logs={logs} runState={runState} logEndRef={logEndRef} />
          </div>
        )}
      </div>

      <style>{`
        .suggestion-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          background: var(--bg-surface);
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
        .step-row.skipped {
          opacity: 0.65;
        }
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
        .step-connector {
          position: absolute;
          left: 19px;
          top: 40px;
          bottom: -12px;
          width: 2px;
          background: var(--border);
        }
        .step-connector.completed {
          background: linear-gradient(180deg, var(--accent), var(--border));
        }
        .approval-card {
          margin-top: 10px;
          padding: 14px 14px 12px;
          border: 1px solid rgba(255, 184, 0, 0.4);
          border-radius: 10px;
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
        @media (max-width: 880px) {
          .run-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

function AutoModeToggle({
  value,
  onChange,
}: {
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      aria-pressed={value}
      title={
        value
          ? 'Auto Mode is on — the agent will execute critical steps without stopping.'
          : 'Auto Mode is off — the agent will pause for approval on critical steps.'
      }
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 14px',
        background: value ? 'rgba(0, 200, 240, 0.08)' : 'var(--bg-surface)',
        border: `1px solid ${value ? 'rgba(0, 200, 240, 0.5)' : 'var(--border)'}`,
        borderRadius: '12px',
        color: 'var(--text-primary)',
        fontFamily: 'inherit',
        fontSize: '0.8125rem',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        flexShrink: 0,
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

function AgentMessage({
  intro,
  closing,
  template,
  runState,
}: {
  intro: string
  closing: string
  template: Template | null
  runState: RunState
}) {
  const text = closing || intro
  if (!text) return null
  return (
    <div
      style={{
        display: 'flex',
        gap: '12px',
        padding: '16px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '14px',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'rgba(0, 200, 240, 0.12)',
          border: '1px solid rgba(0, 200, 240, 0.35)',
          color: 'var(--accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontSize: '0.875rem',
          fontFamily: 'Syne, sans-serif',
          fontWeight: 700,
        }}
      >
        A
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: '0.6875rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: '6px',
          }}
        >
          Agent {template ? `· ${template.icon} ${template.label}` : ''}
          {runState === 'completed' && ' · result'}
        </div>
        <div
          style={{
            color: 'var(--text-primary)',
            fontSize: '0.9375rem',
            lineHeight: 1.6,
          }}
        >
          {text}
        </div>
      </div>
    </div>
  )
}

function Composer({
  prompt,
  setPrompt,
  onRun,
  onCancel,
  onReset,
  runState,
}: {
  prompt: string
  setPrompt: (s: string) => void
  onRun: () => void
  onCancel: () => void
  onReset: () => void
  runState: RunState
}) {
  const isBusy = runState === 'running' || runState === 'planning' || runState === 'awaiting'
  const isDone = runState === 'completed' || runState === 'failed' || runState === 'cancelled'

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '4px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !isBusy) {
            e.preventDefault()
            onRun()
          }
        }}
        disabled={isBusy}
        placeholder="e.g. Build a marketing site for a developer tool, or fix the 500 on POST /api/orders"
        rows={3}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: 'var(--text-primary)',
          fontFamily: 'inherit',
          fontSize: '1rem',
          padding: '16px',
          resize: 'none',
          lineHeight: 1.55,
        }}
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px 12px',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            color: 'var(--text-muted)',
            fontSize: '0.75rem',
            fontFamily: 'DM Mono, monospace',
            letterSpacing: '0.04em',
          }}
        >
          ⌘ + ↵ to run
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          {isDone && (
            <button
              onClick={onReset}
              className="btn-ghost"
              style={{ padding: '8px 18px', fontSize: '0.8125rem' }}
            >
              New task
            </button>
          )}
          {isBusy ? (
            <button
              onClick={onCancel}
              className="btn-ghost"
              style={{
                padding: '8px 18px',
                fontSize: '0.8125rem',
                borderColor: 'rgba(244, 71, 99, 0.5)',
                color: '#f44763',
              }}
            >
              Cancel
            </button>
          ) : (
            <button
              onClick={onRun}
              disabled={!prompt.trim()}
              className="btn-primary"
              style={{
                padding: '8px 22px',
                fontSize: '0.8125rem',
                opacity: prompt.trim() ? 1 : 0.4,
                cursor: prompt.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 1.5L12 7L2 12.5V1.5Z" fill="currentColor" />
              </svg>
              Run agent
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function StepsPanel({
  activePrompt,
  template,
  steps,
  runState,
  completedCount,
  totalCount,
  progressPct,
  totalElapsed,
  now,
  pendingApproval,
  onApprove,
  onSkip,
  onStop,
}: {
  activePrompt: string
  template: Template | null
  steps: Step[]
  runState: RunState
  completedCount: number
  totalCount: number
  progressPct: number
  totalElapsed: number
  now: number
  pendingApproval: number | null
  onApprove: () => void
  onSkip: () => void
  onStop: () => void
}) {
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '20px',
      }}
    >
      {/* Header row */}
      <div style={{ marginBottom: '16px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '12px',
            marginBottom: '12px',
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: 'DM Mono, monospace',
                fontSize: '0.6875rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                marginBottom: '4px',
              }}
            >
              <RunBadge state={runState} /> · {template ? `${template.icon} ${template.label}` : 'Plan'}
            </div>
            <div
              style={{
                color: 'var(--text-primary)',
                fontWeight: 500,
                fontSize: '0.9375rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={activePrompt}
            >
              {activePrompt || '—'}
            </div>
          </div>
          <div
            style={{
              fontFamily: 'DM Mono, monospace',
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)',
              whiteSpace: 'nowrap',
            }}
          >
            {completedCount}/{totalCount || '–'} · {fmtDuration(totalElapsed)}
          </div>
        </div>

        {/* Progress bar */}
        <div
          style={{
            height: '6px',
            borderRadius: '3px',
            background: 'var(--bg-elevated)',
            overflow: 'hidden',
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
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {steps.length === 0 && runState === 'planning' && <PlanningSkeleton />}
        {steps.map((step, idx) => (
          <div key={step.id}>
            <StepRow
              step={step}
              index={idx}
              isLast={idx === steps.length - 1}
              now={now}
            />
            {pendingApproval === idx && (
              <ApprovalCard
                step={step}
                onApprove={onApprove}
                onSkip={onSkip}
                onStop={onStop}
              />
            )}
          </div>
        ))}
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '6px',
        }}
      >
        <span className="critical-badge">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M5 1L9 8.5H1L5 1Z"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <circle cx="5" cy="6.5" r="0.6" fill="currentColor" />
          </svg>
          Critical action
        </span>
        <span
          style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
          }}
        >
          paused · awaiting your call
        </span>
      </div>
      <div style={{ color: 'var(--text-primary)', fontSize: '0.9375rem', marginBottom: '4px' }}>
        I'd like to <strong style={{ fontWeight: 600 }}>{step.title.toLowerCase()}</strong>.
      </div>
      <div
        style={{
          color: 'var(--text-secondary)',
          fontSize: '0.8125rem',
          lineHeight: 1.5,
          marginBottom: '12px',
        }}
      >
        {step.detail} This step changes real state, so I'm checking with you first. You can flip Auto Mode on if you'd
        rather not be asked again this run.
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={onApprove}
          className="btn-primary"
          style={{ padding: '8px 18px', fontSize: '0.8125rem' }}
        >
          Approve & continue
        </button>
        <button
          onClick={onSkip}
          className="btn-ghost"
          style={{ padding: '8px 18px', fontSize: '0.8125rem' }}
        >
          Skip this step
        </button>
        <button
          onClick={onStop}
          className="btn-ghost"
          style={{
            padding: '8px 18px',
            fontSize: '0.8125rem',
            borderColor: 'rgba(244, 71, 99, 0.5)',
            color: '#f44763',
          }}
        >
          Stop run
        </button>
      </div>
    </div>
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
    <span style={{ color: v.color, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span
        style={{
          display: 'inline-block',
          width: 6,
          height: 6,
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
            padding: '12px',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            opacity: 0.5,
            animation: 'fadeIn 0.4s ease',
            animationDelay: `${i * 80}ms`,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'var(--bg-elevated)',
            }}
          />
          <div style={{ flex: 1 }}>
            <div
              style={{
                width: '40%',
                height: 10,
                background: 'var(--bg-elevated)',
                borderRadius: 4,
                marginBottom: 6,
              }}
            />
            <div
              style={{
                width: '70%',
                height: 8,
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
  isLast,
  now,
}: {
  step: Step
  index: number
  isLast: boolean
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
        gap: '12px',
        padding: '12px 14px',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        background: 'var(--bg-elevated)',
        transition: 'all 0.2s ease',
      }}
    >
      {!isLast && (
        <div
          className={`step-connector ${step.status === 'completed' ? 'completed' : ''}`}
        />
      )}
      <StepIcon status={step.status} index={index} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 2,
            alignItems: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              minWidth: 0,
              flex: 1,
            }}
          >
            <span
              style={{
                fontWeight: 500,
                color:
                  step.status === 'pending' || step.status === 'skipped'
                    ? 'var(--text-secondary)'
                    : 'var(--text-primary)',
                fontSize: '0.9375rem',
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
              fontSize: '0.75rem',
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
            fontSize: '0.8125rem',
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
        width: 28,
        height: 28,
        borderRadius: '50%',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        color: 'var(--text-muted)',
        fontSize: '0.75rem',
        fontFamily: 'DM Mono, monospace',
        fontWeight: 500,
        position: 'relative',
        zIndex: 1,
      }}
    >
      {status === 'pending' && <span>{index + 1}</span>}
      {status === 'running' && (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          style={{ animation: 'step-spin 1s linear infinite' }}
        >
          <circle
            cx="8"
            cy="8"
            r="6"
            stroke="var(--accent)"
            strokeWidth="2"
            fill="none"
            strokeDasharray="28"
            strokeDashoffset="14"
            strokeLinecap="round"
          />
        </svg>
      )}
      {status === 'awaiting' && (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1L13 12H1L7 1Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M7 5.5V8.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="7" cy="10.5" r="0.8" fill="currentColor" />
        </svg>
      )}
      {status === 'completed' && (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M2.5 7.5L5.5 10.5L11.5 4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {status === 'skipped' && (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M3 7H11M11 7L8 4M11 7L8 10"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {status === 'failed' && (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )}
    </div>
  )
}

function LogPanel({
  logs,
  runState,
  logEndRef,
}: {
  logs: LogLine[]
  runState: RunState
  logEndRef: React.RefObject<HTMLDivElement | null>
}) {
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '20px',
        maxHeight: '560px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
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
          Activity log
        </div>
        <div
          style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
          }}
        >
          {logs.length} {logs.length === 1 ? 'event' : 'events'}
        </div>
      </div>
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          background: 'var(--bg-base)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '12px 14px',
          fontFamily: 'DM Mono, monospace',
          fontSize: '0.8125rem',
          lineHeight: 1.6,
          minHeight: '240px',
        }}
      >
        {logs.length === 0 && (
          <div style={{ color: 'var(--text-muted)' }}>
            {runState === 'idle' ? 'Waiting for a task…' : 'Initializing…'}
          </div>
        )}
        {logs.map((line) => (
          <LogRow key={line.id} line={line} />
        ))}
        <div ref={logEndRef} />
      </div>
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
        gridTemplateColumns: '74px 44px 1fr',
        gap: '8px',
        animation: 'fadeIn 0.25s ease',
      }}
    >
      <span style={{ color: 'var(--text-muted)' }}>{fmtClock(line.ts)}</span>
      <span style={{ color: colorMap[line.kind] }}>{labelMap[line.kind]}</span>
      <span style={{ color: 'var(--text-primary)', wordBreak: 'break-word' }}>
        {line.text}
      </span>
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
