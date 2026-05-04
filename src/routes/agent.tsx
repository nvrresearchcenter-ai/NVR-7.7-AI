import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'

export const Route = createFileRoute('/agent')({
  component: AgentMode,
})

type AgentLevel = 'standard' | 'vvip' | 'super'

type RunState = 'idle' | 'running' | 'completed' | 'stopped'

type ActionStatus = 'pending' | 'running' | 'completed' | 'stopped'

type ActionKind = 'read' | 'analyze' | 'edit' | 'build' | 'deploy' | 'publish'

type Action = {
  id: string
  kind: ActionKind
  title: string
  detail: string
  durationMs: number
  status: ActionStatus
  startedAt?: number
  completedAt?: number
}

type ChatMessage = {
  id: string
  role: 'user' | 'agent'
  text: string
  ts: number
}

const LEVELS: { id: AgentLevel; label: string; tagline: string; accent: string }[] = [
  { id: 'standard', label: 'Standard', tagline: 'Project + content agent', accent: '#7fbfff' },
  { id: 'vvip', label: 'VVIP', tagline: 'Deeper analysis · priority compute', accent: '#c89bff' },
  { id: 'super', label: 'Super Agent', tagline: 'Live deploy · autonomous', accent: '#5cf0ff' },
]

const PLAN_BY_LEVEL: Record<AgentLevel, () => Omit<Action, 'id' | 'status' | 'startedAt' | 'completedAt'>[]> = {
  standard: () => [
    { kind: 'read', title: 'Reading project context', detail: 'Loading workspace files and recent prompts.', durationMs: 1500 },
    { kind: 'analyze', title: 'Drafting plan', detail: 'Outlining the steps to handle the request.', durationMs: 1700 },
    { kind: 'edit', title: 'Composing response', detail: 'Writing the assistant reply with sources.', durationMs: 1900 },
  ],
  vvip: () => [
    { kind: 'read', title: 'Reading project context', detail: 'Indexing files, history, and chat memory.', durationMs: 1400 },
    { kind: 'analyze', title: 'Deep analysis', detail: 'Running multi-pass research and reasoning.', durationMs: 2100 },
    { kind: 'edit', title: 'Drafting deliverable', detail: 'Producing structured output with examples.', durationMs: 1900 },
    { kind: 'edit', title: 'Reviewing draft', detail: 'Self-checking for accuracy and tone.', durationMs: 1500 },
  ],
  super: () => [
    { kind: 'read', title: 'Reading project files', detail: 'src/routes/index.tsx · src/styles.css · Nav.tsx', durationMs: 1500 },
    { kind: 'analyze', title: 'Planning changes', detail: 'Mapping the change set and risk areas.', durationMs: 1600 },
    { kind: 'edit', title: 'Editing components', detail: 'Updating UI and shared utilities.', durationMs: 1800 },
    { kind: 'build', title: 'Running build', detail: 'TypeScript + Vite production build.', durationMs: 2100 },
    { kind: 'deploy', title: 'Deploying preview', detail: 'Publishing to a Netlify preview channel.', durationMs: 2000 },
    { kind: 'publish', title: 'Publishing live', detail: 'Promoting preview to production.', durationMs: 1900 },
  ],
}

function newId() {
  return Math.random().toString(36).slice(2, 10)
}

function AgentMode() {
  const [level, setLevel] = useState<AgentLevel>('super')
  const [runState, setRunState] = useState<RunState>('idle')
  const [actions, setActions] = useState<Action[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: newId(),
      role: 'agent',
      text: 'Pick an agent level on the left, type a request, and press Run. The monitor will stream every step in real time.',
      ts: Date.now(),
    },
  ])
  const [input, setInput] = useState('')
  const [now, setNow] = useState(Date.now())
  const startRef = useRef<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const cancelRef = useRef(false)

  useEffect(() => {
    if (runState !== 'running') {
      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = null
      return
    }
    timerRef.current = setInterval(() => setNow(Date.now()), 200)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [runState])

  const elapsedMs = useMemo(() => {
    if (!startRef.current) return 0
    const end = runState === 'running' ? now : (actions.find((a) => a.status === 'stopped')?.completedAt ?? actions[actions.length - 1]?.completedAt ?? now)
    return Math.max(0, end - startRef.current)
  }, [now, runState, actions])

  const completedCount = actions.filter((a) => a.status === 'completed').length
  const totalCount = actions.length
  const progressPct = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100)

  function pushMessage(role: ChatMessage['role'], text: string) {
    setMessages((prev) => [...prev, { id: newId(), role, text, ts: Date.now() }])
  }

  async function runAgent(prompt: string) {
    const trimmed = prompt.trim()
    if (!trimmed || runState === 'running') return
    cancelRef.current = false
    pushMessage('user', trimmed)

    const blueprint = PLAN_BY_LEVEL[level]()
    const planned: Action[] = blueprint.map((b) => ({ ...b, id: newId(), status: 'pending' }))
    setActions(planned)
    setRunState('running')
    startRef.current = Date.now()

    pushMessage('agent', `Running as ${labelFor(level)}. Starting ${planned.length} steps…`)

    for (let i = 0; i < planned.length; i++) {
      if (cancelRef.current) break
      const id = planned[i].id
      const startedAt = Date.now()
      setActions((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'running', startedAt } : a)))
      const wait = planned[i].durationMs
      const step = 80
      let waited = 0
      while (waited < wait) {
        if (cancelRef.current) break
        await new Promise((r) => setTimeout(r, step))
        waited += step
      }
      if (cancelRef.current) {
        setActions((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'stopped', completedAt: Date.now() } : a)))
        break
      }
      const completedAt = Date.now()
      setActions((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'completed', completedAt } : a)))
      pushMessage('agent', `Done: ${planned[i].title}`)
    }

    if (cancelRef.current) {
      setRunState('stopped')
      pushMessage('agent', 'Agent stopped. You can start a new run any time.')
    } else {
      setRunState('completed')
      pushMessage('agent', `All ${planned.length} steps complete.`)
    }
  }

  function stopAgent() {
    if (runState !== 'running') return
    cancelRef.current = true
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (runState === 'running') return
    runAgent(input)
    setInput('')
  }

  return (
    <div style={{ position: 'relative', minHeight: 'calc(100vh - 64px)' }}>
      <div className="grid-pattern" style={{ position: 'absolute', inset: 0, opacity: 0.3, pointerEvents: 'none' }} />

      <div className="agent-shell">
        <header style={{ marginBottom: '20px' }}>
          <div className="tag" style={{ marginBottom: '14px' }}>Agent Workspace</div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', margin: 0, color: 'var(--text-primary)' }}>
            Live Agent Console
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0', fontSize: '0.95rem' }}>
            Watch the agent work in real time. Pick a level, send a task, and stop it any time.
          </p>
        </header>

        <div className="agent-grid">
          <Monitor
            level={level}
            onLevel={setLevel}
            actions={actions}
            runState={runState}
            elapsedMs={elapsedMs}
            progressPct={progressPct}
            completedCount={completedCount}
            totalCount={totalCount}
          />

          <ChatPanel
            level={level}
            runState={runState}
            messages={messages}
            input={input}
            onInput={setInput}
            onSubmit={onSubmit}
            onStop={stopAgent}
          />
        </div>
      </div>

      <style>{`
        .agent-shell {
          position: relative;
          z-index: 1;
          max-width: 1280px;
          margin: 0 auto;
          padding: 32px 24px 64px;
        }
        .agent-grid {
          display: grid;
          grid-template-columns: 380px 1fr;
          gap: 18px;
          align-items: stretch;
        }
        @media (max-width: 960px) {
          .agent-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}

function labelFor(level: AgentLevel) {
  return LEVELS.find((l) => l.id === level)?.label ?? 'Agent'
}

function Monitor({
  level,
  onLevel,
  actions,
  runState,
  elapsedMs,
  progressPct,
  completedCount,
  totalCount,
}: {
  level: AgentLevel
  onLevel: (l: AgentLevel) => void
  actions: Action[]
  runState: RunState
  elapsedMs: number
  progressPct: number
  completedCount: number
  totalCount: number
}) {
  return (
    <aside
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-bright)',
        borderRadius: '20px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        minHeight: '640px',
      }}
    >
      <section>
        <SectionLabel>Agent level</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {LEVELS.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => onLevel(l.id)}
              disabled={runState === 'running'}
              style={{
                textAlign: 'left',
                padding: '12px 14px',
                borderRadius: '12px',
                background: l.id === level ? 'rgba(0,200,240,0.08)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${l.id === level ? 'rgba(0,200,240,0.5)' : 'var(--border)'}`,
                color: 'var(--text-primary)',
                cursor: runState === 'running' ? 'not-allowed' : 'pointer',
                opacity: runState === 'running' && l.id !== level ? 0.5 : 1,
                transition: 'border-color 0.15s, background 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.95rem' }}>
                  {l.label}
                </span>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: l.id === level ? l.accent : 'transparent',
                    border: `1px solid ${l.accent}`,
                    boxShadow: l.id === level ? `0 0 10px ${l.accent}` : 'none',
                  }}
                />
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {l.tagline}
              </div>
            </button>
          ))}
        </div>
      </section>

      <section>
        <SectionLabel>Status</SectionLabel>
        <div
          style={{
            padding: '14px',
            borderRadius: '12px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <StatusBadge runState={runState} />
            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              {formatDuration(elapsedMs)}
            </span>
          </div>
          <div
            style={{
              position: 'relative',
              height: '6px',
              borderRadius: '999px',
              background: 'rgba(255,255,255,0.05)',
              overflow: 'hidden',
              marginBottom: '8px',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                width: `${progressPct}%`,
                background: 'linear-gradient(90deg, #00c8f0, #22e6a0)',
                borderRadius: '999px',
                transition: 'width 0.3s',
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'DM Mono, monospace', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <span>{completedCount} / {totalCount} actions</span>
            <span>{progressPct}%</span>
          </div>
        </div>
      </section>

      <section style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <SectionLabel>Live actions</SectionLabel>
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
          {actions.length === 0 ? (
            <div
              style={{
                padding: '20px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px dashed var(--border)',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
                textAlign: 'center',
              }}
            >
              No actions yet. Send a task to start.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {actions.map((a, i) => (
                <ActionItem key={a.id} action={a} index={i} isLast={i === actions.length - 1} />
              ))}
            </div>
          )}
        </div>
      </section>
    </aside>
  )
}

function ActionItem({ action, index, isLast }: { action: Action; index: number; isLast: boolean }) {
  const color = colorForStatus(action.status)
  return (
    <div style={{ display: 'flex', gap: '12px', position: 'relative' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: action.status === 'running' ? 'rgba(0,200,240,0.15)' : 'rgba(255,255,255,0.04)',
            border: `1.5px solid ${color}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color,
            fontSize: '0.7rem',
            fontFamily: 'DM Mono, monospace',
            boxShadow: action.status === 'running' ? `0 0 12px ${color}` : 'none',
            animation: action.status === 'running' ? 'agentPulse 1.4s ease-in-out infinite' : 'none',
          }}
        >
          {action.status === 'completed' ? (
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 6l3 3 5-6" />
            </svg>
          ) : action.status === 'stopped' ? (
            <svg width="9" height="9" viewBox="0 0 12 12" fill="currentColor">
              <rect x="2" y="2" width="8" height="8" rx="1" />
            </svg>
          ) : (
            index + 1
          )}
        </div>
        {!isLast && (
          <div
            style={{
              flex: 1,
              width: '1.5px',
              minHeight: '20px',
              background: action.status === 'completed' ? 'rgba(0,200,240,0.4)' : 'var(--border)',
              marginTop: '4px',
            }}
          />
        )}
      </div>
      <div style={{ flex: 1, paddingBottom: isLast ? 0 : '12px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: '8px',
            marginBottom: '2px',
          }}
        >
          <span
            style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 600,
              fontSize: '0.875rem',
              color: action.status === 'pending' ? 'var(--text-muted)' : 'var(--text-primary)',
            }}
          >
            {action.title}
          </span>
          <KindBadge kind={action.kind} />
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
          {action.detail}
        </div>
      </div>
      <style>{`
        @keyframes agentPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.55; transform: scale(0.94); }
        }
      `}</style>
    </div>
  )
}

function ChatPanel({
  level,
  runState,
  messages,
  input,
  onInput,
  onSubmit,
  onStop,
}: {
  level: AgentLevel
  runState: RunState
  messages: ChatMessage[]
  input: string
  onInput: (s: string) => void
  onSubmit: (e: React.FormEvent) => void
  onStop: () => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    onInput(input ? `${input}\n[Attached: ${file.name}] ` : `[Attached: ${file.name}] `)
    e.target.value = ''
  }

  return (
    <section
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-bright)',
        borderRadius: '20px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '640px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          paddingBottom: '14px',
          borderBottom: '1px solid var(--border)',
          marginBottom: '14px',
        }}
      >
        <div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>
            {labelFor(level)}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {LEVELS.find((l) => l.id === level)?.tagline}
          </div>
        </div>
        <StatusBadge runState={runState} />
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
      </div>

      <form
        onSubmit={onSubmit}
        style={{
          marginTop: '14px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-bright)',
          borderRadius: '14px',
          padding: '10px 10px 8px',
        }}
      >
        <textarea
          value={input}
          onChange={(e) => onInput(e.target.value)}
          rows={2}
          placeholder={runState === 'running' ? 'Agent is working… you can queue a follow-up.' : 'Send a task to the agent…'}
          aria-label="Agent task"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault()
              if (runState !== 'running') onSubmit(e as unknown as React.FormEvent)
            }
          }}
          style={{
            width: '100%',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: 'var(--text-primary)',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '0.95rem',
            lineHeight: 1.5,
            resize: 'none',
            padding: '4px 4px 0',
            minHeight: '48px',
            maxHeight: '160px',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginTop: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input ref={fileInputRef} type="file" onChange={onUpload} style={{ display: 'none' }} aria-hidden />
            <CtrlIconButton label="Attach file" onClick={() => fileInputRef.current?.click()}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </CtrlIconButton>
            <CtrlIconButton label="Voice input" onClick={() => {}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="2" width="6" height="12" rx="3" />
                <path d="M19 10a7 7 0 0 1-14 0" />
                <path d="M12 19v3" />
              </svg>
            </CtrlIconButton>
          </div>

          {runState === 'running' ? (
            <button
              type="button"
              onClick={onStop}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '10px',
                border: '1px solid rgba(239,68,68,0.55)',
                background: 'rgba(239,68,68,0.12)',
                color: '#fca5a5',
                fontFamily: 'Syne, sans-serif',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239,68,68,0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239,68,68,0.12)'
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <rect x="2" y="2" width="8" height="8" rx="1" />
              </svg>
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '10px',
                border: 'none',
                background: input.trim() ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
                color: input.trim() ? '#060a12' : 'var(--text-muted)',
                fontFamily: 'Syne, sans-serif',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: input.trim() ? 'pointer' : 'not-allowed',
                boxShadow: input.trim() ? '0 6px 20px -8px rgba(0,200,240,0.6)' : 'none',
              }}
            >
              Run
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          )}
        </div>
      </form>
    </section>
  )
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  return (
    <div
      style={{
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        maxWidth: '78%',
        padding: '10px 14px',
        borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
        background: isUser ? 'rgba(0,200,240,0.12)' : 'var(--bg-elevated)',
        border: `1px solid ${isUser ? 'rgba(0,200,240,0.35)' : 'var(--border)'}`,
        color: 'var(--text-primary)',
        fontSize: '0.9rem',
        lineHeight: 1.5,
        whiteSpace: 'pre-wrap',
      }}
    >
      <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
        {isUser ? 'You' : 'Agent'}
      </div>
      {message.text}
    </div>
  )
}

function StatusBadge({ runState }: { runState: RunState }) {
  const map: Record<RunState, { label: string; color: string; bg: string; pulse: boolean }> = {
    idle: { label: 'Idle', color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.05)', pulse: false },
    running: { label: 'Running', color: '#5cf0ff', bg: 'rgba(0,200,240,0.12)', pulse: true },
    completed: { label: 'Completed', color: '#22e6a0', bg: 'rgba(34,230,160,0.12)', pulse: false },
    stopped: { label: 'Stopped', color: '#fca5a5', bg: 'rgba(239,68,68,0.12)', pulse: false },
  }
  const s = map[runState]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: '999px',
        background: s.bg,
        color: s.color,
        fontFamily: 'DM Mono, monospace',
        fontSize: '0.7rem',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        border: `1px solid ${s.color}55`,
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: s.color,
          boxShadow: `0 0 8px ${s.color}`,
          animation: s.pulse ? 'agentPulse 1.4s ease-in-out infinite' : 'none',
        }}
      />
      {s.label}
    </span>
  )
}

function KindBadge({ kind }: { kind: ActionKind }) {
  const map: Record<ActionKind, string> = {
    read: 'Read',
    analyze: 'Analyze',
    edit: 'Edit',
    build: 'Build',
    deploy: 'Deploy',
    publish: 'Publish',
  }
  return (
    <span
      style={{
        fontFamily: 'DM Mono, monospace',
        fontSize: '0.62rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid var(--border)',
        padding: '2px 6px',
        borderRadius: '6px',
        flexShrink: 0,
      }}
    >
      {map[kind]}
    </span>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: 'DM Mono, monospace',
        fontSize: '0.7rem',
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        marginBottom: '10px',
      }}
    >
      {children}
    </div>
  )
}

function CtrlIconButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{
        width: '32px',
        height: '32px',
        borderRadius: '8px',
        border: '1px solid transparent',
        background: 'transparent',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.15s, color 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
        e.currentTarget.style.color = 'var(--text-primary)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.color = 'var(--text-secondary)'
      }}
    >
      {children}
    </button>
  )
}

function colorForStatus(status: ActionStatus): string {
  switch (status) {
    case 'completed':
      return '#22e6a0'
    case 'running':
      return '#5cf0ff'
    case 'stopped':
      return '#fca5a5'
    default:
      return '#3a4a66'
  }
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  if (totalSeconds < 60) return `${totalSeconds}s`
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}m ${s.toString().padStart(2, '0')}s`
}
