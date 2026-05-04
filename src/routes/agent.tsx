import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'

export const Route = createFileRoute('/agent')({
  component: AgentMode,
})

type RunState = 'idle' | 'planning' | 'running' | 'awaiting' | 'completed' | 'failed' | 'cancelled'

type ActionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'awaiting'

type ActionKind =
  | 'read'
  | 'edit'
  | 'update'
  | 'build'
  | 'deploy_preview'
  | 'publish_live'
  | 'rollback'
  | 'delete'
  | 'payment'
  | 'dns'
  | 'env'
  | 'db_reset'
  | 'analyze'
  | 'plan'

type Action = {
  id: string
  kind: ActionKind
  title: string
  detail: string
  durationMs: number
  status: ActionStatus
  startedAt?: number
  completedAt?: number
  /** Critical actions require explicit user approval before running. */
  critical?: boolean
  /** When this action is a deploy, the simulated URL it produced. */
  deployUrl?: string
  /** When this action failed, the message describing why. */
  errorMessage?: string
}

type FollowUp = {
  id: string
  text: string
  ts: number
  status: 'queued' | 'acknowledged'
}

type Template = {
  match: RegExp
  label: string
  buildActions: () => Omit<Action, 'id' | 'status' | 'startedAt' | 'completedAt'>[]
}

const MODEL_NAME = 'NVR 9.9 Ultra Super Agent'

const DEPLOY_PREVIEW_URL = 'https://preview-9f3a2.nvr77ai.netlify.app'
const DEPLOY_LIVE_URL = 'https://nvr77ai.netlify.app'

const TEMPLATES: Template[] = [
  {
    match: /(redesign|rebuild|update|edit|change|move|add).*(home|hero|landing|page|pricing|section|nav|footer)|homepage|hero|landing/i,
    label: 'Update homepage layout',
    buildActions: () => [
      { kind: 'read', title: 'Reading project files', detail: 'src/routes/index.tsx · src/routes/pricing.tsx · src/styles.css', durationMs: 1600 },
      { kind: 'analyze', title: 'Analyzing current layout', detail: 'Mapping hero, pricing, and feature sections.', durationMs: 1400 },
      { kind: 'edit', title: 'Updated homepage hero', detail: 'Reworked headline, supporting copy, and CTAs.', durationMs: 2000 },
      { kind: 'edit', title: 'Moved pricing section', detail: 'Promoted the pricing teaser above the feature grid.', durationMs: 1700 },
      { kind: 'update', title: 'Updated Nav components', detail: 'Refreshed active state styling and mobile menu.', durationMs: 1500 },
      { kind: 'edit', title: 'Added chat input', detail: 'Inserted the assistant composer into the hero block.', durationMs: 1900 },
      { kind: 'build', title: 'Running build', detail: 'TypeScript + Vite production build.', durationMs: 2400 },
      { kind: 'deploy_preview', title: 'Created live preview', detail: 'Pushed bundle to Netlify deploy preview.', durationMs: 2200 },
      { kind: 'publish_live', title: 'Ready to publish', detail: 'Promote the preview to the production URL.', durationMs: 2000, critical: true },
    ],
  },
  {
    match: /deploy|publish|ship|release|go live/i,
    label: 'Deploy a release',
    buildActions: () => [
      { kind: 'read', title: 'Reading project files', detail: 'Loading the current build manifest.', durationMs: 1300 },
      { kind: 'analyze', title: 'Reviewing pending changes', detail: 'Diffing main against the release branch.', durationMs: 1600 },
      { kind: 'build', title: 'Running build', detail: 'Compiling production bundle.', durationMs: 2400 },
      { kind: 'deploy_preview', title: 'Deploying preview', detail: 'Smoke-testing on a Netlify preview channel.', durationMs: 2200 },
      { kind: 'publish_live', title: 'Publishing to production', detail: 'Promoting preview to live.', durationMs: 2000, critical: true },
    ],
  },
  {
    match: /delete|drop|reset|wipe|remove.*(database|table|account|user)/i,
    label: 'Destructive data operation',
    buildActions: () => [
      { kind: 'read', title: 'Reading affected resources', detail: 'Inspecting target rows and dependencies.', durationMs: 1700 },
      { kind: 'analyze', title: 'Estimating blast radius', detail: 'Counting downstream references.', durationMs: 1500 },
      { kind: 'db_reset', title: 'Reset database', detail: 'Drop and recreate the target schema.', durationMs: 2400, critical: true },
    ],
  },
  {
    match: /(env|environment|secret|key).*(set|update|rotate|change)|set environment variable/i,
    label: 'Update environment variables',
    buildActions: () => [
      { kind: 'read', title: 'Reading current environment', detail: 'Listing variables on the production context.', durationMs: 1400 },
      { kind: 'env', title: 'Update environment variables', detail: 'Apply the new variable set to production.', durationMs: 2000, critical: true },
      { kind: 'build', title: 'Running build', detail: 'Rebuild against the updated environment.', durationMs: 2200 },
      { kind: 'deploy_preview', title: 'Created live preview', detail: 'Verified preview boots with the new values.', durationMs: 2000 },
    ],
  },
  {
    match: /domain|dns|cname|nameserver|record/i,
    label: 'Update DNS records',
    buildActions: () => [
      { kind: 'read', title: 'Reading DNS zone', detail: 'Loading the current zone file.', durationMs: 1500 },
      { kind: 'analyze', title: 'Validating record set', detail: 'Checking propagation rules.', durationMs: 1400 },
      { kind: 'dns', title: 'Apply DNS changes', detail: 'Write CNAME / A records to the live zone.', durationMs: 2200, critical: true },
    ],
  },
  {
    match: /payment|charge|refund|stripe|invoice/i,
    label: 'Process a payment action',
    buildActions: () => [
      { kind: 'read', title: 'Reading customer record', detail: 'Pulling the related charge from Stripe.', durationMs: 1500 },
      { kind: 'analyze', title: 'Verifying amount & currency', detail: 'Cross-checking against the source invoice.', durationMs: 1500 },
      { kind: 'payment', title: 'Process payment action', detail: 'Capture / refund a real customer charge.', durationMs: 2200, critical: true },
    ],
  },
]

const FALLBACK: Template = {
  match: /.*/,
  label: 'General task',
  buildActions: () => [
    { kind: 'read', title: 'Reading files', detail: 'Scanning the project for relevant context.', durationMs: 1500 },
    { kind: 'analyze', title: 'Planning approach', detail: 'Breaking the request into ordered steps.', durationMs: 1500 },
    { kind: 'edit', title: 'Editing UI', detail: 'Applying the requested changes.', durationMs: 2000 },
    { kind: 'update', title: 'Updating components', detail: 'Refreshing affected component code.', durationMs: 1700 },
    { kind: 'build', title: 'Running build', detail: 'TypeScript + Vite production build.', durationMs: 2200 },
    { kind: 'deploy_preview', title: 'Created live preview', detail: 'Pushed bundle to a Netlify preview channel.', durationMs: 2000 },
    { kind: 'publish_live', title: 'Ready to publish', detail: 'Promote the preview to the production URL.', durationMs: 1800, critical: true },
  ],
}

const SUGGESTIONS = [
  'Redesign the homepage hero',
  'Move the pricing section higher',
  'Deploy the latest changes live',
  'Set environment variable STRIPE_KEY',
  'Update DNS for nvr77ai.com',
]

function pickTemplate(prompt: string): Template {
  for (const t of TEMPLATES) if (t.match.test(prompt)) return t
  return FALLBACK
}

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

function fmtClock(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return m > 0 ? `${m}m ${s.toString().padStart(2, '0')}s` : `${s}s`
}

function fmtTimestamp(ts: number) {
  const d = new Date(ts)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes()
    .toString()
    .padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`
}

function isCriticalKind(k: ActionKind) {
  return (
    k === 'publish_live' ||
    k === 'delete' ||
    k === 'payment' ||
    k === 'dns' ||
    k === 'env' ||
    k === 'db_reset'
  )
}

function approvalCopy(kind: ActionKind, title: string): { question: string; warning: string } {
  switch (kind) {
    case 'publish_live':
      return {
        question: 'Approve live deploy?',
        warning: 'This promotes the current preview to production and replaces the live site for every visitor.',
      }
    case 'delete':
      return {
        question: 'Approve deletion?',
        warning: 'Deletion cannot be undone from this UI. The agent will remove the targeted records permanently.',
      }
    case 'payment':
      return {
        question: 'Approve payment action?',
        warning: 'This moves real money via the connected Stripe account. Refunds and captures are not reversible from here.',
      }
    case 'dns':
      return {
        question: 'Approve DNS change?',
        warning: 'DNS updates can break the live domain. Propagation may take up to 24 hours and is hard to roll back instantly.',
      }
    case 'env':
      return {
        question: 'Approve environment variable update?',
        warning: 'Production builds will rebuild against the new values. Misconfigured secrets can take the site offline.',
      }
    case 'db_reset':
      return {
        question: 'Approve database reset?',
        warning: 'This drops and recreates the target schema. All rows in the affected tables will be lost.',
      }
    default:
      return {
        question: `Approve: ${title}?`,
        warning: 'This action changes real production state.',
      }
  }
}

function AgentMode() {
  const [prompt, setPrompt] = useState('')
  const [activePrompt, setActivePrompt] = useState('')
  const [actions, setActions] = useState<Action[]>([])
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [runState, setRunState] = useState<RunState>('idle')
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [endedAt, setEndedAt] = useState<number | null>(null)
  const [now, setNow] = useState<number>(Date.now())
  const [pendingApproval, setPendingApproval] = useState<number | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [liveUrl, setLiveUrl] = useState<string | null>(null)

  const cancelRef = useRef(false)
  const approvalResolverRef = useRef<((d: 'approve' | 'cancel') => void) | null>(null)
  const monitorRef = useRef<HTMLDivElement | null>(null)

  // Live clock for timer / running status
  useEffect(() => {
    if (runState !== 'running' && runState !== 'planning' && runState !== 'awaiting') return
    const id = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [runState])

  // Auto-scroll the action monitor as new actions arrive
  useEffect(() => {
    monitorRef.current?.scrollTo({ top: monitorRef.current.scrollHeight, behavior: 'smooth' })
  }, [actions.length])

  const completedCount = useMemo(
    () => actions.filter((a) => a.status === 'completed' || a.status === 'skipped').length,
    [actions],
  )
  const elapsedMs = startedAt ? (endedAt ?? now) - startedAt : 0
  const isBusy = runState === 'running' || runState === 'planning' || runState === 'awaiting'
  const isDone = runState === 'completed' || runState === 'failed' || runState === 'cancelled'

  function pendingAction(): Action | null {
    return pendingApproval !== null ? actions[pendingApproval] ?? null : null
  }

  function reset() {
    cancelRef.current = true
    if (approvalResolverRef.current) {
      approvalResolverRef.current('cancel')
      approvalResolverRef.current = null
    }
    setActions([])
    setFollowUps([])
    setActivePrompt('')
    setRunState('idle')
    setStartedAt(null)
    setEndedAt(null)
    setPendingApproval(null)
    setPreviewUrl(null)
    setLiveUrl(null)
  }

  async function startRun(rawPrompt: string) {
    const trimmed = rawPrompt.trim()
    if (!trimmed) return
    cancelRef.current = false
    setActivePrompt(trimmed)
    setPrompt('')
    setRunState('planning')
    setStartedAt(Date.now())
    setEndedAt(null)
    setActions([])
    setFollowUps([])
    setPendingApproval(null)
    setPreviewUrl(null)
    setLiveUrl(null)

    await wait(700)
    if (cancelRef.current) return

    const tpl = pickTemplate(trimmed)
    const planned: Action[] = tpl.buildActions().map((a) => ({
      ...a,
      id: uid(),
      status: 'pending',
      critical: a.critical ?? isCriticalKind(a.kind),
    }))
    setActions(planned)

    await wait(400)
    if (cancelRef.current) return

    setRunState('running')

    for (let i = 0; i < planned.length; i++) {
      if (cancelRef.current) {
        setRunState('cancelled')
        setEndedAt(Date.now())
        return
      }
      const action = planned[i]

      if (action.critical) {
        setActions((prev) => prev.map((a, idx) => (idx === i ? { ...a, status: 'awaiting' } : a)))
        setPendingApproval(i)
        setRunState('awaiting')

        const decision = await new Promise<'approve' | 'cancel'>((resolve) => {
          approvalResolverRef.current = resolve
        })
        approvalResolverRef.current = null
        setPendingApproval(null)

        if (decision === 'cancel' || cancelRef.current) {
          setActions((prev) => prev.map((a, idx) => (idx === i ? { ...a, status: 'skipped' } : a)))
          setRunState('cancelled')
          setEndedAt(Date.now())
          return
        }

        setRunState('running')
      }

      setActions((prev) =>
        prev.map((a, idx) => (idx === i ? { ...a, status: 'running', startedAt: Date.now() } : a)),
      )

      await waitInterruptible(action.durationMs, cancelRef)
      if (cancelRef.current) {
        setActions((prev) => prev.map((a, idx) => (idx === i ? { ...a, status: 'failed' } : a)))
        setRunState('cancelled')
        setEndedAt(Date.now())
        return
      }

      // Simulated 8% chance for a deploy step to fail and trigger a rollback
      if (action.kind === 'deploy_preview' && Math.random() < 0.08) {
        setActions((prev) =>
          prev.map((a, idx) =>
            idx === i
              ? {
                  ...a,
                  status: 'failed',
                  completedAt: Date.now(),
                  errorMessage: 'Build artifact rejected by the preview channel.',
                }
              : a,
          ),
        )
        // Push a rollback action immediately after
        const rollback: Action = {
          id: uid(),
          kind: 'rollback',
          title: 'Rollback initiated',
          detail: 'Preview channel reverted to the last known-good build.',
          durationMs: 1400,
          status: 'running',
          startedAt: Date.now(),
        }
        setActions((prev) => [...prev.slice(0, i + 1), rollback, ...prev.slice(i + 1)])
        await waitInterruptible(rollback.durationMs, cancelRef)
        setActions((prev) =>
          prev.map((a) =>
            a.id === rollback.id ? { ...a, status: 'completed', completedAt: Date.now() } : a,
          ),
        )
        setRunState('failed')
        setEndedAt(Date.now())
        return
      }

      const completedPatch: Partial<Action> = { status: 'completed', completedAt: Date.now() }
      if (action.kind === 'deploy_preview') {
        completedPatch.deployUrl = DEPLOY_PREVIEW_URL
        setPreviewUrl(DEPLOY_PREVIEW_URL)
      }
      if (action.kind === 'publish_live') {
        completedPatch.deployUrl = DEPLOY_LIVE_URL
        setLiveUrl(DEPLOY_LIVE_URL)
      }
      setActions((prev) => prev.map((a, idx) => (idx === i ? { ...a, ...completedPatch } : a)))
    }

    setRunState('completed')
    setEndedAt(Date.now())
  }

  function cancelRun() {
    if (runState === 'idle' || runState === 'completed') return
    cancelRef.current = true
    if (approvalResolverRef.current) approvalResolverRef.current('cancel')
  }

  function approveCurrent() {
    if (approvalResolverRef.current) approvalResolverRef.current('approve')
  }

  function rejectCurrent() {
    if (approvalResolverRef.current) approvalResolverRef.current('cancel')
  }

  function submitFollowUp(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    if (!isBusy) {
      startRun(trimmed)
      return
    }
    const fu: FollowUp = { id: uid(), text: trimmed, ts: Date.now(), status: 'queued' }
    setFollowUps((prev) => [...prev, fu])
    setPrompt('')
    // Acknowledge after a short pause so the user sees the queue mechanic
    window.setTimeout(() => {
      setFollowUps((prev) => prev.map((f) => (f.id === fu.id ? { ...f, status: 'acknowledged' } : f)))
    }, 900)
  }

  return (
    <div
      style={{
        position: 'relative',
        minHeight: 'calc(100vh - 64px)',
        background:
          'radial-gradient(ellipse 80% 40% at 50% -10%, rgba(0, 200, 240, 0.10) 0%, transparent 60%), var(--bg-base)',
        paddingBottom: '160px',
      }}
    >
      <div
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          padding: '40px 24px 0',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <span className="tag" style={{ marginBottom: 12 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--accent)',
                animation: 'pulseDot 1.6s ease-in-out infinite',
              }}
            />
            Auto Agent Mode
          </span>
          <h1
            style={{
              fontSize: 'clamp(1.75rem, 3.6vw, 2.5rem)',
              margin: '12px 0 6px',
              color: 'var(--text-primary)',
            }}
          >
            Describe a task. Watch the agent work.
          </h1>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '1rem',
              maxWidth: '720px',
              margin: 0,
            }}
          >
            {MODEL_NAME} plans the work, narrates each action live, and stops to ask before any change that
            touches production.
          </p>
        </div>

        {/* Status card */}
        <StatusCard
          runState={runState}
          activePrompt={activePrompt}
          elapsedMs={elapsedMs}
          completedCount={completedCount}
          totalCount={actions.length}
          previewUrl={previewUrl}
          liveUrl={liveUrl}
          failedAction={actions.find((a) => a.status === 'failed') ?? null}
        />

        {/* Idle suggestions */}
        {runState === 'idle' && actions.length === 0 && (
          <div
            style={{
              marginTop: 18,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => startRun(s)}
                className="suggestion-chip"
                type="button"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Two column working area */}
        {(runState !== 'idle' || actions.length > 0) && (
          <div
            className="agent-grid"
            style={{
              marginTop: 24,
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 320px) minmax(0, 1fr)',
              gap: 20,
              alignItems: 'start',
            }}
          >
            <ActionMonitor actions={actions} now={now} monitorRef={monitorRef} />
            <RunFeed
              actions={actions}
              now={now}
              previewUrl={previewUrl}
              liveUrl={liveUrl}
              followUps={followUps}
              activePrompt={activePrompt}
            />
          </div>
        )}

        {/* Done — reset CTA */}
        {isDone && (
          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={reset} className="btn-ghost" style={{ padding: '8px 18px', fontSize: '0.8125rem' }}>
              Start a new task
            </button>
          </div>
        )}
      </div>

      {/* Approval modal */}
      {pendingApproval !== null && pendingAction() && (
        <ApprovalModal
          action={pendingAction()!}
          onApprove={approveCurrent}
          onCancel={rejectCurrent}
        />
      )}

      {/* Bottom input bar */}
      <BottomBar
        prompt={prompt}
        setPrompt={setPrompt}
        onSubmit={() => submitFollowUp(prompt)}
        onCancel={cancelRun}
        runState={runState}
        followUpQueueCount={followUps.filter((f) => f.status === 'queued').length}
      />

      <style>{`
        .suggestion-chip {
          display: inline-flex;
          align-items: center;
          padding: 8px 14px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 999px;
          color: var(--text-secondary);
          font-size: 0.8125rem;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.15s ease;
        }
        .suggestion-chip:hover {
          border-color: var(--accent);
          color: var(--text-primary);
          background: rgba(0, 200, 240, 0.06);
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(0, 200, 240, 0.5); }
          50% { opacity: 0.6; box-shadow: 0 0 0 6px rgba(0, 200, 240, 0); }
        }
        @keyframes monitorSpin { to { transform: rotate(360deg); } }
        @keyframes monitorFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .progress-shimmer {
          background: linear-gradient(90deg, var(--accent) 0%, #5cdcf2 50%, var(--accent) 100%);
          background-size: 200% 100%;
          animation: shimmer 2.4s linear infinite;
        }
        @media (max-width: 960px) {
          .agent-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .bottom-bar-inner { flex-direction: column; align-items: stretch !important; gap: 10px !important; }
          .bottom-bar-controls { width: 100%; justify-content: space-between; }
          .model-pill-text { display: none; }
        }
      `}</style>
    </div>
  )
}

/* ----------------------------------------------------------------------- */
/*                            Status Card                                  */
/* ----------------------------------------------------------------------- */

function StatusCard({
  runState,
  activePrompt,
  elapsedMs,
  completedCount,
  totalCount,
  previewUrl,
  liveUrl,
  failedAction,
}: {
  runState: RunState
  activePrompt: string
  elapsedMs: number
  completedCount: number
  totalCount: number
  previewUrl: string | null
  liveUrl: string | null
  failedAction: Action | null
}) {
  const isBusy = runState === 'running' || runState === 'planning' || runState === 'awaiting'
  const headline =
    runState === 'idle'
      ? `${MODEL_NAME} is ready`
      : runState === 'planning'
        ? `${MODEL_NAME} is planning`
        : runState === 'awaiting'
          ? `${MODEL_NAME} is waiting for approval`
          : runState === 'running'
            ? `${MODEL_NAME} is working`
            : runState === 'completed'
              ? `${MODEL_NAME} finished the task`
              : runState === 'failed'
                ? `${MODEL_NAME} hit an error`
                : `${MODEL_NAME} stopped`

  const progressPct = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100)

  return (
    <div
      style={{
        position: 'relative',
        background: 'var(--bg-surface)',
        border: `1px solid ${runState === 'awaiting' ? 'rgba(255, 184, 0, 0.45)' : 'var(--border)'}`,
        borderRadius: 18,
        padding: 20,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          <ModelOrb runState={runState} />
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                color: 'var(--text-primary)',
                fontFamily: 'Syne, sans-serif',
                fontSize: '1.0625rem',
                fontWeight: 600,
              }}
            >
              {headline}
            </div>
            <div
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
                marginTop: 2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: 520,
              }}
              title={activePrompt}
            >
              {activePrompt || 'Waiting for a task description.'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Metric label="Timer" value={fmtClock(elapsedMs)} mono />
          <Metric
            label="Actions"
            value={`${completedCount} / ${totalCount || '–'}`}
            mono
          />
          <StatusBadge runState={runState} />
        </div>
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div
          style={{
            marginTop: 16,
            height: 6,
            borderRadius: 3,
            background: 'var(--bg-elevated)',
            overflow: 'hidden',
          }}
        >
          <div
            className={isBusy ? 'progress-shimmer' : ''}
            style={{
              width: `${progressPct}%`,
              height: '100%',
              background:
                runState === 'failed' || runState === 'cancelled'
                  ? '#f44763'
                  : runState === 'awaiting'
                    ? '#ffb800'
                    : runState === 'completed'
                      ? 'var(--accent-live, #22c55e)'
                      : undefined,
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      )}

      {/* Deploy summary */}
      {(previewUrl || liveUrl || runState === 'failed') && (
        <div
          style={{
            marginTop: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {previewUrl && (
            <DeployRow
              label="Preview"
              url={previewUrl}
              status={liveUrl ? 'replaced' : 'ready'}
            />
          )}
          {liveUrl && <DeployRow label="Live" url={liveUrl} status="live" />}
          {runState === 'failed' && failedAction && (
            <DeployRow
              label="Failed"
              url={failedAction.errorMessage || 'Deploy failed — automatic rollback completed.'}
              status="failed"
            />
          )}
        </div>
      )}
    </div>
  )
}

function ModelOrb({ runState }: { runState: RunState }) {
  const isBusy = runState === 'running' || runState === 'planning' || runState === 'awaiting'
  return (
    <div
      style={{
        position: 'relative',
        width: 44,
        height: 44,
        flexShrink: 0,
        borderRadius: 12,
        background: 'linear-gradient(135deg, rgba(0, 200, 240, 0.25), rgba(34, 197, 94, 0.18))',
        border: '1px solid rgba(0, 200, 240, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: isBusy ? '0 0 24px rgba(0, 200, 240, 0.35)' : 'none',
        transition: 'box-shadow 0.4s ease',
      }}
    >
      {isBusy ? (
        <svg width="22" height="22" viewBox="0 0 22 22" style={{ animation: 'monitorSpin 1.6s linear infinite' }}>
          <circle cx="11" cy="11" r="8" stroke="var(--accent)" strokeWidth="2" fill="none" strokeDasharray="38" strokeDashoffset="20" strokeLinecap="round" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="3" width="6" height="6" rx="1.5" fill="var(--accent)" />
          <rect x="11" y="3" width="6" height="6" rx="1.5" fill="var(--accent)" opacity="0.55" />
          <rect x="3" y="11" width="6" height="6" rx="1.5" fill="var(--accent)" opacity="0.55" />
          <rect x="11" y="11" width="6" height="6" rx="1.5" fill="var(--accent)" opacity="0.3" />
        </svg>
      )}
    </div>
  )
}

function Metric({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div
      style={{
        padding: '8px 12px',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        minWidth: 80,
      }}
    >
      <div
        style={{
          fontFamily: 'DM Mono, monospace',
          fontSize: '0.625rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}
      >
        {label}
      </div>
      <div
        style={{
          color: 'var(--text-primary)',
          fontFamily: mono ? 'DM Mono, monospace' : 'inherit',
          fontSize: '0.9375rem',
          fontWeight: 500,
          marginTop: 2,
        }}
      >
        {value}
      </div>
    </div>
  )
}

function StatusBadge({ runState }: { runState: RunState }) {
  const map: Record<RunState, { label: string; bg: string; color: string; border: string; pulse: boolean }> = {
    idle: { label: 'Idle', bg: 'rgba(74, 96, 128, 0.12)', color: 'var(--text-muted)', border: 'var(--border)', pulse: false },
    planning: { label: 'In Progress', bg: 'rgba(0, 200, 240, 0.12)', color: 'var(--accent)', border: 'rgba(0, 200, 240, 0.4)', pulse: true },
    running: { label: 'In Progress', bg: 'rgba(0, 200, 240, 0.12)', color: 'var(--accent)', border: 'rgba(0, 200, 240, 0.4)', pulse: true },
    awaiting: { label: 'Awaiting Approval', bg: 'rgba(255, 184, 0, 0.12)', color: '#ffb800', border: 'rgba(255, 184, 0, 0.4)', pulse: true },
    completed: { label: 'Completed', bg: 'rgba(34, 197, 94, 0.14)', color: '#22c55e', border: 'rgba(34, 197, 94, 0.4)', pulse: false },
    failed: { label: 'Failed', bg: 'rgba(244, 71, 99, 0.14)', color: '#f44763', border: 'rgba(244, 71, 99, 0.4)', pulse: false },
    cancelled: { label: 'Stopped', bg: 'rgba(244, 71, 99, 0.14)', color: '#f44763', border: 'rgba(244, 71, 99, 0.4)', pulse: false },
  }
  const v = map[runState]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 12px',
        background: v.bg,
        border: `1px solid ${v.border}`,
        borderRadius: 999,
        color: v.color,
        fontFamily: 'DM Mono, monospace',
        fontSize: '0.6875rem',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: v.color,
          animation: v.pulse ? 'pulseDot 1.4s ease-in-out infinite' : undefined,
        }}
      />
      {v.label}
    </span>
  )
}

function DeployRow({
  label,
  url,
  status,
}: {
  label: string
  url: string
  status: 'ready' | 'live' | 'failed' | 'replaced'
}) {
  const tone =
    status === 'live'
      ? { color: '#22c55e', border: 'rgba(34, 197, 94, 0.35)', bg: 'rgba(34, 197, 94, 0.08)' }
      : status === 'failed'
        ? { color: '#f44763', border: 'rgba(244, 71, 99, 0.35)', bg: 'rgba(244, 71, 99, 0.08)' }
        : status === 'replaced'
          ? { color: 'var(--text-muted)', border: 'var(--border)', bg: 'var(--bg-elevated)' }
          : { color: 'var(--accent)', border: 'rgba(0, 200, 240, 0.35)', bg: 'rgba(0, 200, 240, 0.06)' }

  const isUrl = url.startsWith('http')
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        background: tone.bg,
        border: `1px solid ${tone.border}`,
        borderRadius: 10,
      }}
    >
      <span
        style={{
          fontFamily: 'DM Mono, monospace',
          fontSize: '0.6875rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: tone.color,
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      {isUrl ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          style={{
            color: 'var(--text-primary)',
            fontFamily: 'DM Mono, monospace',
            fontSize: '0.8125rem',
            textDecoration: 'none',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {url}
        </a>
      ) : (
        <span
          style={{
            color: 'var(--text-primary)',
            fontSize: '0.8125rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {url}
        </span>
      )}
    </div>
  )
}

/* ----------------------------------------------------------------------- */
/*                       Action Monitor (left panel)                       */
/* ----------------------------------------------------------------------- */

function ActionMonitor({
  actions,
  now,
  monitorRef,
}: {
  actions: Action[]
  now: number
  monitorRef: React.RefObject<HTMLDivElement | null>
}) {
  return (
    <aside
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 18,
        position: 'sticky',
        top: 84,
        maxHeight: 'calc(100vh - 220px)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14,
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
          Action monitor
        </div>
        <span
          style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
          }}
        >
          {actions.length} {actions.length === 1 ? 'action' : 'actions'}
        </span>
      </div>

      <div
        ref={monitorRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingRight: 4,
        }}
      >
        {actions.length === 0 ? (
          <div
            style={{
              fontFamily: 'DM Mono, monospace',
              fontSize: '0.8125rem',
              color: 'var(--text-muted)',
              padding: '8px 0',
            }}
          >
            Waiting for the first action…
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {actions.map((action, idx) => (
              <TimelineItem
                key={action.id}
                action={action}
                isLast={idx === actions.length - 1}
                now={now}
              />
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}

function TimelineItem({ action, isLast, now }: { action: Action; isLast: boolean; now: number }) {
  const elapsed =
    action.status === 'running' && action.startedAt
      ? now - action.startedAt
      : action.completedAt && action.startedAt
        ? action.completedAt - action.startedAt
        : 0

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        gap: 12,
        paddingBottom: isLast ? 0 : 12,
        animation: 'monitorFadeIn 0.25s ease',
      }}
    >
      {!isLast && (
        <span
          style={{
            position: 'absolute',
            left: 13,
            top: 28,
            bottom: 0,
            width: 2,
            background:
              action.status === 'completed'
                ? 'linear-gradient(180deg, rgba(0, 200, 240, 0.6), var(--border))'
                : 'var(--border)',
          }}
        />
      )}
      <ActionDot action={action} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            color:
              action.status === 'pending'
                ? 'var(--text-muted)'
                : action.status === 'failed'
                  ? '#f44763'
                  : 'var(--text-primary)',
            fontSize: '0.875rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
              minWidth: 0,
            }}
          >
            {action.title}
          </span>
          {(action.status === 'running' || action.status === 'completed') && elapsed > 0 && (
            <span
              style={{
                fontFamily: 'DM Mono, monospace',
                fontSize: '0.6875rem',
                color: 'var(--text-muted)',
                flexShrink: 0,
              }}
            >
              {(elapsed / 1000).toFixed(1)}s
            </span>
          )}
        </div>
        <div
          style={{
            color: 'var(--text-secondary)',
            fontSize: '0.75rem',
            marginTop: 2,
            lineHeight: 1.45,
            wordBreak: 'break-word',
          }}
        >
          {action.detail}
        </div>
      </div>
    </div>
  )
}

function ActionDot({ action }: { action: Action }) {
  const tone = actionTone(action)
  return (
    <div
      style={{
        width: 28,
        height: 28,
        flexShrink: 0,
        borderRadius: '50%',
        background: tone.bg,
        border: `1px solid ${tone.border}`,
        color: tone.color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 1,
      }}
    >
      {action.status === 'running' ? (
        <svg width="14" height="14" viewBox="0 0 14 14" style={{ animation: 'monitorSpin 1.1s linear infinite' }}>
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeDasharray="22" strokeDashoffset="11" strokeLinecap="round" />
        </svg>
      ) : action.status === 'completed' ? (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 6.5 L5 9.5 L10 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : action.status === 'failed' ? (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 2 L8 8 M8 2 L2 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ) : action.status === 'awaiting' ? (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M6 1 L11 10 H1 Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" fill="none" />
          <circle cx="6" cy="8.6" r="0.6" fill="currentColor" />
          <path d="M6 4.5 V7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      ) : action.status === 'skipped' ? (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M3 6 H9 M9 6 L7 4 M9 6 L7 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <ActionKindIcon kind={action.kind} />
      )}
    </div>
  )
}

function ActionKindIcon({ kind }: { kind: ActionKind }) {
  switch (kind) {
    case 'read':
      return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <rect x="2" y="1.5" width="6" height="9" rx="1" stroke="currentColor" strokeWidth="1.2" />
          <path d="M4 4.5 H6 M4 6.5 H6 M4 8.5 H5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      )
    case 'edit':
    case 'update':
      return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M1.5 10 L1.5 8 L8 1.5 L10 3.5 L3.5 10 Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
      )
    case 'build':
      return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <rect x="1.5" y="1.5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M4 6 L5.5 7.5 L8 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'deploy_preview':
    case 'publish_live':
      return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M6 1.5 L9.5 5 L7.5 5 L7.5 9.5 L4.5 9.5 L4.5 5 L2.5 5 Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
      )
    case 'rollback':
      return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M1.5 6 A4.5 4.5 0 1 1 4 9.7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          <path d="M1.5 6 L1.5 3 M1.5 6 L4.5 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      )
    default:
      return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      )
  }
}

function actionTone(action: Action) {
  if (action.status === 'running')
    return { bg: 'rgba(0, 200, 240, 0.12)', border: 'rgba(0, 200, 240, 0.45)', color: 'var(--accent)' }
  if (action.status === 'completed')
    return { bg: 'rgba(34, 197, 94, 0.10)', border: 'rgba(34, 197, 94, 0.35)', color: '#22c55e' }
  if (action.status === 'failed')
    return { bg: 'rgba(244, 71, 99, 0.10)', border: 'rgba(244, 71, 99, 0.4)', color: '#f44763' }
  if (action.status === 'awaiting')
    return { bg: 'rgba(255, 184, 0, 0.12)', border: 'rgba(255, 184, 0, 0.4)', color: '#ffb800' }
  if (action.status === 'skipped')
    return { bg: 'var(--bg-elevated)', border: 'var(--border)', color: 'var(--text-muted)' }
  return { bg: 'var(--bg-elevated)', border: 'var(--border)', color: 'var(--text-muted)' }
}

/* ----------------------------------------------------------------------- */
/*                       Run Feed (right panel)                            */
/* ----------------------------------------------------------------------- */

function RunFeed({
  actions,
  now,
  previewUrl,
  liveUrl,
  followUps,
  activePrompt,
}: {
  actions: Action[]
  now: number
  previewUrl: string | null
  liveUrl: string | null
  followUps: FollowUp[]
  activePrompt: string
}) {
  const visibleActions = actions.filter(
    (a) => a.status === 'running' || a.status === 'completed' || a.status === 'failed' || a.status === 'awaiting',
  )

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 20,
        minHeight: 420,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 14,
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
          Run feed
        </div>
        {activePrompt && (
          <div
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontFamily: 'DM Mono, monospace',
              maxWidth: 420,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={activePrompt}
          >
            “{activePrompt}”
          </div>
        )}
      </div>

      {visibleActions.length === 0 && (
        <div
          style={{
            color: 'var(--text-muted)',
            fontSize: '0.875rem',
            padding: '20px 0',
            fontFamily: 'DM Mono, monospace',
          }}
        >
          The agent will narrate each step here as it runs.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {visibleActions.map((action) => (
          <FeedRow key={action.id} action={action} now={now} />
        ))}
      </div>

      {(previewUrl || liveUrl) && (
        <div
          style={{
            marginTop: 18,
            paddingTop: 14,
            borderTop: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              fontFamily: 'DM Mono, monospace',
              fontSize: '0.6875rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: 8,
            }}
          >
            Deploy outcome
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {previewUrl && <DeployRow label="Preview" url={previewUrl} status={liveUrl ? 'replaced' : 'ready'} />}
            {liveUrl && <DeployRow label="Live" url={liveUrl} status="live" />}
          </div>
        </div>
      )}

      {followUps.length > 0 && (
        <div
          style={{
            marginTop: 18,
            paddingTop: 14,
            borderTop: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              fontFamily: 'DM Mono, monospace',
              fontSize: '0.6875rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: 8,
            }}
          >
            Follow-ups while running
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {followUps.map((fu) => (
              <div
                key={fu.id}
                style={{
                  padding: '10px 12px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  alignItems: 'center',
                }}
              >
                <span style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>{fu.text}</span>
                <span
                  style={{
                    fontFamily: 'DM Mono, monospace',
                    fontSize: '0.6875rem',
                    color: fu.status === 'queued' ? '#ffb800' : 'var(--accent)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    flexShrink: 0,
                  }}
                >
                  {fu.status === 'queued' ? 'Queued' : 'Acknowledged'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function FeedRow({ action, now }: { action: Action; now: number }) {
  const tone = actionTone(action)
  const elapsed =
    action.status === 'running' && action.startedAt
      ? now - action.startedAt
      : action.completedAt && action.startedAt
        ? action.completedAt - action.startedAt
        : 0
  const completedAt =
    action.completedAt ?? (action.status === 'running' && action.startedAt ? action.startedAt : undefined)

  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        padding: '12px 14px',
        background: 'var(--bg-elevated)',
        border: `1px solid ${tone.border}`,
        borderRadius: 12,
        animation: 'monitorFadeIn 0.25s ease',
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: tone.bg,
          color: tone.color,
          border: `1px solid ${tone.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <ActionKindIcon kind={action.kind} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span
            style={{
              color: action.status === 'failed' ? '#f44763' : 'var(--text-primary)',
              fontWeight: 500,
              fontSize: '0.9375rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {action.title}
          </span>
          <span
            style={{
              fontFamily: 'DM Mono, monospace',
              fontSize: '0.6875rem',
              color: 'var(--text-muted)',
              flexShrink: 0,
            }}
          >
            {action.status === 'running' && elapsed > 0 ? `${(elapsed / 1000).toFixed(1)}s` : completedAt ? fmtTimestamp(completedAt) : ''}
          </span>
        </div>
        <div
          style={{
            color: 'var(--text-secondary)',
            fontSize: '0.8125rem',
            marginTop: 2,
            lineHeight: 1.5,
          }}
        >
          {action.errorMessage ?? action.detail}
        </div>
        {action.deployUrl && (
          <a
            href={action.deployUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-block',
              marginTop: 6,
              fontFamily: 'DM Mono, monospace',
              fontSize: '0.75rem',
              color: 'var(--accent)',
              textDecoration: 'none',
            }}
          >
            {action.deployUrl} ↗
          </a>
        )}
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------------- */
/*                         Approval modal                                  */
/* ----------------------------------------------------------------------- */

function ApprovalModal({
  action,
  onApprove,
  onCancel,
}: {
  action: Action
  onApprove: () => void
  onCancel: () => void
}) {
  const copy = approvalCopy(action.kind, action.title)
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(6, 10, 18, 0.7)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        animation: 'monitorFadeIn 0.2s ease',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          background: 'var(--bg-surface)',
          border: '1px solid rgba(255, 184, 0, 0.4)',
          borderRadius: 18,
          padding: 24,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 12px',
            background: 'rgba(255, 184, 0, 0.12)',
            border: '1px solid rgba(255, 184, 0, 0.35)',
            borderRadius: 999,
            color: '#ffb800',
            fontFamily: 'DM Mono, monospace',
            fontSize: '0.6875rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: 14,
          }}
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M5.5 1 L10 9.5 H1 Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
            <circle cx="5.5" cy="7.5" r="0.6" fill="currentColor" />
            <path d="M5.5 4 V6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          Permission required
        </div>
        <h2
          style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: '1.5rem',
            color: 'var(--text-primary)',
            margin: '0 0 8px',
          }}
        >
          {copy.question}
        </h2>
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '0.9375rem',
            lineHeight: 1.6,
            margin: '0 0 18px',
          }}
        >
          {copy.warning}
        </p>
        <div
          style={{
            padding: '10px 12px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            marginBottom: 18,
          }}
        >
          <div
            style={{
              fontFamily: 'DM Mono, monospace',
              fontSize: '0.6875rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: 4,
            }}
          >
            Action
          </div>
          <div style={{ color: 'var(--text-primary)', fontSize: '0.9375rem', fontWeight: 500 }}>
            {action.title}
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginTop: 2 }}>
            {action.detail}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button
            onClick={onCancel}
            className="btn-ghost"
            style={{ padding: '10px 22px', fontSize: '0.875rem' }}
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={onApprove}
            className="btn-primary"
            style={{ padding: '10px 22px', fontSize: '0.875rem' }}
            type="button"
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------------- */
/*                         Bottom Bar                                      */
/* ----------------------------------------------------------------------- */

function BottomBar({
  prompt,
  setPrompt,
  onSubmit,
  onCancel,
  runState,
  followUpQueueCount,
}: {
  prompt: string
  setPrompt: (s: string) => void
  onSubmit: () => void
  onCancel: () => void
  runState: RunState
  followUpQueueCount: number
}) {
  const isBusy = runState === 'running' || runState === 'planning' || runState === 'awaiting'
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [recording, setRecording] = useState(false)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setPrompt(prompt ? `${prompt} (attached: ${file.name})` : `Attached file: ${file.name}`)
    e.target.value = ''
  }

  function toggleMic() {
    setRecording((r) => !r)
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 90,
        padding: '14px 20px 18px',
        background: 'linear-gradient(180deg, rgba(6, 10, 18, 0) 0%, rgba(6, 10, 18, 0.92) 30%, rgba(6, 10, 18, 0.98) 100%)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div
        style={{
          maxWidth: 1240,
          margin: '0 auto',
        }}
      >
        {followUpQueueCount > 0 && (
          <div
            style={{
              marginBottom: 8,
              fontFamily: 'DM Mono, monospace',
              fontSize: '0.6875rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#ffb800',
              textAlign: 'center',
            }}
          >
            {followUpQueueCount} follow-up{followUpQueueCount === 1 ? '' : 's'} queued for the agent
          </div>
        )}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: `1px solid ${isBusy ? 'rgba(0, 200, 240, 0.4)' : 'var(--border)'}`,
            borderRadius: 16,
            padding: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
          }}
          className="bottom-bar-inner"
        >
          {/* Model selector */}
          <button
            type="button"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              background: 'rgba(0, 200, 240, 0.08)',
              border: '1px solid rgba(0, 200, 240, 0.3)',
              borderRadius: 999,
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
              fontSize: '0.8125rem',
              fontWeight: 500,
              cursor: 'pointer',
              flexShrink: 0,
              whiteSpace: 'nowrap',
            }}
            title="Select agent model"
          >
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: 5,
                background: 'linear-gradient(135deg, var(--accent), #22c55e)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 7 L4 5 L6 7 L8 3" stroke="#060a12" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="model-pill-text">{MODEL_NAME}</span>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 4 L5 7 L8 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                onSubmit()
              }
            }}
            placeholder={isBusy ? 'Ask NVR Agent a follow-up…' : 'Describe a task for the agent…'}
            style={{
              flex: 1,
              minWidth: 0,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
              fontSize: '0.9375rem',
              padding: '10px 4px',
            }}
          />

          <div className="bottom-bar-controls" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <IconButton title="Tools" onClick={() => {}}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
                <rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
                <rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
                <rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </IconButton>
            <IconButton
              title={recording ? 'Recording…' : 'Voice input'}
              onClick={toggleMic}
              active={recording}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="6" y="2" width="4" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M3 8 V8.5 A5 5 0 0 0 13 8.5 V8 M8 13.5 V14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </IconButton>
            <IconButton title="Attach file" onClick={() => fileInputRef.current?.click()}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M11 4 L5.5 9.5 A2 2 0 0 0 8.3 12.3 L13 7.6 A3.5 3.5 0 0 0 8 2.6 L3.5 7 A5 5 0 0 0 10.5 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </IconButton>
            <input ref={fileInputRef} type="file" onChange={handleFile} style={{ display: 'none' }} />

            {isBusy ? (
              <button
                type="button"
                onClick={onCancel}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  marginLeft: 4,
                  padding: '10px 18px',
                  borderRadius: 12,
                  background: '#f44763',
                  border: '1px solid #f44763',
                  color: '#fff',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  letterSpacing: '0.02em',
                  cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(244, 71, 99, 0.35)',
                }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                  <rect x="2" y="2" width="6" height="6" rx="1" />
                </svg>
                Stop
              </button>
            ) : (
              <button
                type="button"
                onClick={onSubmit}
                disabled={!prompt.trim()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  marginLeft: 4,
                  padding: '10px 18px',
                  borderRadius: 12,
                  background: prompt.trim() ? '#3b82f6' : 'var(--bg-elevated)',
                  border: `1px solid ${prompt.trim() ? '#3b82f6' : 'var(--border)'}`,
                  color: prompt.trim() ? '#fff' : 'var(--text-muted)',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  letterSpacing: '0.02em',
                  cursor: prompt.trim() ? 'pointer' : 'not-allowed',
                  boxShadow: prompt.trim() ? '0 6px 20px rgba(59, 130, 246, 0.35)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                  <path d="M1 1 L9 5 L1 9 Z" />
                </svg>
                Run Agent
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function IconButton({
  children,
  onClick,
  title,
  active,
}: {
  children: React.ReactNode
  onClick: () => void
  title: string
  active?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      style={{
        width: 36,
        height: 36,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        background: active ? 'rgba(244, 71, 99, 0.14)' : 'transparent',
        border: `1px solid ${active ? 'rgba(244, 71, 99, 0.4)' : 'transparent'}`,
        color: active ? '#f44763' : 'var(--text-secondary)',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'var(--bg-elevated)'
          e.currentTarget.style.color = 'var(--text-primary)'
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = 'var(--text-secondary)'
        }
      }}
    >
      {children}
    </button>
  )
}

/* ----------------------------------------------------------------------- */
/*                              Helpers                                    */
/* ----------------------------------------------------------------------- */

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
