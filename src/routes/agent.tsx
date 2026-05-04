import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'

export const Route = createFileRoute('/agent')({
  component: AgentMode,
})

const MODEL_NAME = 'NVR 9.9 Ultra Super Agent'

type LogKind = 'info' | 'tool' | 'shell' | 'result' | 'error' | 'plan' | 'agent'

type TaskStatus = 'pending' | 'running' | 'completed' | 'failed'

type AgentTask = {
  id: string
  title: string
  detail: string
  critical: boolean
  status: TaskStatus
  startedAt?: number
  completedAt?: number
}

type LogLine = {
  id: string
  ts: number
  kind: LogKind
  text: string
}

type ChatMessage = { id: string; role: 'user' | 'agent'; text: string }

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

const SUGGESTIONS = [
  'Scan project files and find errors',
  'Fix backend error on /api/checkout',
  'Run terminal command npm test',
  'Deploy v2.4 to production',
  'Build a landing page for a coffee shop',
]

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
  const mm = Math.floor(s / 60)
    .toString()
    .padStart(2, '0')
  const ss = (s % 60).toString().padStart(2, '0')
  return `${mm}:${ss}`
}

function AgentMode() {
  const [prompt, setPrompt] = useState('')
  const [activePrompt, setActivePrompt] = useState('')
  const [tasks, setTasks] = useState<AgentTask[]>([])
  const [logs, setLogs] = useState<LogLine[]>([])
  const [chat, setChat] = useState<ChatMessage[]>([])
  const [runState, setRunState] = useState<RunState>('idle')
  const [planLabel, setPlanLabel] = useState<string>('')
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [endedAt, setEndedAt] = useState<number | null>(null)
  const [now, setNow] = useState<number>(Date.now())

  const abortRef = useRef<AbortController | null>(null)
  const logEndRef = useRef<HTMLDivElement | null>(null)
  const chatEndRef = useRef<HTMLDivElement | null>(null)
  const startRunRef = useRef<((p: string) => void) | null>(null)

  // Timer
  useEffect(() => {
    if (runState !== 'running' && runState !== 'planning') return
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
    () => tasks.filter((t) => t.status === 'completed').length,
    [tasks],
  )
  const totalCount = tasks.length
  const progressPct = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100)
  const elapsed = startedAt ? (endedAt ?? now) - startedAt : 0

  const liveAction = useMemo(() => {
    const running = tasks.find((t) => t.status === 'running')
    if (running) return running.title
    if (runState === 'planning') return 'Planning the run…'
    if (runState === 'completed') return 'Run complete'
    if (runState === 'cancelled') return 'Stopped'
    if (runState === 'failed') return 'Failed'
    return 'Idle'
  }, [tasks, runState])

  function pushLog(kind: LogKind, text: string) {
    setLogs((prev) => [...prev, { id: uid(), ts: Date.now(), kind, text }])
  }

  function reset() {
    abortRef.current?.abort()
    abortRef.current = null
    setTasks([])
    setLogs([])
    setChat([])
    setActivePrompt('')
    setPlanLabel('')
    setRunState('idle')
    setStartedAt(null)
    setEndedAt(null)
    setPrompt('')
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
            t.id === evt.id ? { ...t, status: 'running', startedAt: Date.now() } : t,
          ),
        )
        return
      case 'task_done':
        setTasks((prev) =>
          prev.map((t) =>
            t.id === evt.id ? { ...t, status: 'completed', completedAt: Date.now() } : t,
          ),
        )
        return
      case 'log':
        pushLog(evt.kind, evt.text)
        return
      case 'agent':
        setChat((prev) => [...prev, { id: uid(), role: 'agent', text: evt.text }])
        return
      case 'done':
        setRunState('completed')
        setEndedAt(Date.now())
        pushLog('result', `Run complete in ${fmtElapsed(evt.durationMs)}`)
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
    setChat((prev) => [...prev, { id: uid(), role: 'user', text: trimmed }])
    pushLog('info', `Received task: "${trimmed}"`)
    pushLog('agent', 'Reading the request and breaking it down…')

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const resp = await fetch('/api/agent', {
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
      if (buf.trim()) {
        try {
          handleEvent(JSON.parse(buf.trim()) as ServerEvent)
        } catch {}
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
        const msg = (err as Error)?.message || 'unknown error'
        pushLog('error', `Network error: ${msg}`)
        setRunState('failed')
        setEndedAt(Date.now())
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null
    }
  }

  startRunRef.current = startRun

  function stopRun() {
    if (!abortRef.current) return
    abortRef.current.abort()
  }

  const isBusy = runState === 'running' || runState === 'planning'
  const hasRun = runState !== 'idle' || tasks.length > 0

  return (
    <div className="agent-shell">
      <TopStatusBar
        runState={runState}
        elapsedMs={elapsed}
        modelName={MODEL_NAME}
        planLabel={planLabel}
        activePrompt={activePrompt}
        onStop={stopRun}
        onReset={reset}
        canStop={isBusy}
        canReset={hasRun && !isBusy}
      />

      <div className="agent-grid">
        <MonitorPanel
          tasks={tasks}
          runState={runState}
          progressPct={progressPct}
          completedCount={completedCount}
          totalCount={totalCount}
          logs={logs}
          liveAction={liveAction}
          logEndRef={logEndRef}
        />

        <ChatPanel
          chat={chat}
          chatEndRef={chatEndRef}
          prompt={prompt}
          setPrompt={setPrompt}
          onSend={() => {
            startRun(prompt)
            setPrompt('')
          }}
          isBusy={isBusy}
          onStop={stopRun}
          onSuggestion={(s) => {
            setPrompt(s)
            startRun(s)
          }}
          showSuggestions={chat.length === 0}
        />
      </div>

      <AgentStyles />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Top status bar
// ---------------------------------------------------------------------------

function TopStatusBar({
  runState,
  elapsedMs,
  modelName,
  planLabel,
  activePrompt,
  onStop,
  onReset,
  canStop,
  canReset,
}: {
  runState: RunState
  elapsedMs: number
  modelName: string
  planLabel: string
  activePrompt: string
  onStop: () => void
  onReset: () => void
  canStop: boolean
  canReset: boolean
}) {
  const status = useMemo<{ label: string; color: string; pulse: boolean }>(() => {
    switch (runState) {
      case 'idle':
        return { label: 'Idle', color: 'var(--text-muted)', pulse: false }
      case 'planning':
        return { label: 'Planning', color: 'var(--accent)', pulse: true }
      case 'running':
        return { label: 'In Progress', color: 'var(--accent)', pulse: true }
      case 'completed':
        return { label: 'Completed', color: '#34d399', pulse: false }
      case 'cancelled':
        return { label: 'Cancelled', color: '#f44763', pulse: false }
      case 'failed':
        return { label: 'Failed', color: '#f44763', pulse: false }
    }
  }, [runState])

  return (
    <div className="status-bar">
      <div className="status-left">
        <span className="status-pill" style={{ color: status.color, borderColor: status.color }}>
          <span
            className={status.pulse ? 'status-dot pulse' : 'status-dot'}
            style={{ background: status.color }}
          />
          {status.label}
        </span>
        <span className="status-timer">{fmtElapsed(elapsedMs)}</span>
        {planLabel && <span className="status-meta">· {planLabel}</span>}
      </div>

      <div className="status-center" title={activePrompt}>
        {activePrompt && <span className="status-prompt">“{activePrompt}”</span>}
      </div>

      <div className="status-right">
        <span className="status-model">
          <ModelGlyph />
          {modelName}
        </span>
        {canStop && (
          <button className="stop-btn" onClick={onStop} aria-label="Stop the agent">
            <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor">
              <rect x="2.5" y="2.5" width="7" height="7" rx="1" />
            </svg>
            Stop
          </button>
        )}
        {canReset && (
          <button className="ghost-btn" onClick={onReset}>
            New task
          </button>
        )}
      </div>
    </div>
  )
}

function ModelGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1.5l1.6 4.4 4.4 1.6-4.4 1.6L8 13.5l-1.6-4.4L2 7.5l4.4-1.6L8 1.5z" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Left: Live monitor panel (tasks + activity log combined)
// ---------------------------------------------------------------------------

function MonitorPanel({
  tasks,
  runState,
  progressPct,
  completedCount,
  totalCount,
  logs,
  liveAction,
  logEndRef,
}: {
  tasks: AgentTask[]
  runState: RunState
  progressPct: number
  completedCount: number
  totalCount: number
  logs: LogLine[]
  liveAction: string
  logEndRef: React.RefObject<HTMLDivElement | null>
}) {
  return (
    <section className="panel monitor-panel">
      <header className="panel-head">
        <span className="panel-eyebrow">Live monitor</span>
        <span className="panel-count">
          {completedCount}/{totalCount || '–'} tasks
        </span>
      </header>

      <div className="live-action" title={liveAction}>
        <span
          className={runState === 'running' || runState === 'planning' ? 'pulse-dot' : 'pulse-dot static'}
        />
        <span className="live-action-text">{liveAction}</span>
      </div>

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

      <div className="monitor-section">
        <div className="monitor-section-label">Tasks</div>
        <div className="task-list">
          {tasks.length === 0 && runState === 'idle' && (
            <div className="empty-block">No run in progress. Send a task to start.</div>
          )}
          {tasks.length === 0 && runState === 'planning' && <PlanSkeleton />}
          {tasks.map((t, i) => (
            <TaskRow key={t.id} task={t} index={i} />
          ))}
        </div>
      </div>

      <div className="monitor-section monitor-section-stream">
        <div className="monitor-section-label">
          Activity
          <span className="panel-count">
            {logs.length} {logs.length === 1 ? 'event' : 'events'}
          </span>
        </div>
        <div className="log-stream">
          {logs.length === 0 && <div className="log-empty">Waiting for events…</div>}
          {logs.map((line) => (
            <LogRow key={line.id} line={line} />
          ))}
          <div ref={logEndRef} />
        </div>
      </div>
    </section>
  )
}

function TaskRow({ task, index }: { task: AgentTask; index: number }) {
  return (
    <div className={`task-row task-${task.status}`}>
      <div className="task-icon">
        {task.status === 'pending' && <span>{index + 1}</span>}
        {task.status === 'running' && (
          <svg width="14" height="14" viewBox="0 0 16 16" className="spin">
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

function PlanSkeleton() {
  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="task-row task-pending skeleton" style={{ animationDelay: `${i * 80}ms` }}>
          <div className="task-icon" />
          <div className="task-body">
            <div className="skel-line w40" />
            <div className="skel-line w70" />
          </div>
        </div>
      ))}
    </>
  )
}

// ---------------------------------------------------------------------------
// Activity log row
// ---------------------------------------------------------------------------

function LogRow({ line }: { line: LogLine }) {
  const colorMap: Record<LogKind, string> = {
    info: 'var(--text-secondary)',
    plan: '#a78bfa',
    tool: 'var(--accent)',
    shell: '#5cdcf2',
    result: '#34d399',
    error: '#f44763',
    agent: '#ffb800',
  }
  const labelMap: Record<LogKind, string> = {
    info: 'info',
    plan: 'plan',
    tool: 'step',
    shell: 'sh  ',
    result: 'done',
    error: 'err ',
    agent: 'say ',
  }
  return (
    <div className="log-row">
      <span className="log-time">{fmtClock(line.ts)}</span>
      <span className="log-kind" style={{ color: colorMap[line.kind] }}>
        {labelMap[line.kind]}
      </span>
      <span className="log-text">{line.text}</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Right: Chat
// ---------------------------------------------------------------------------

function ChatPanel({
  chat,
  chatEndRef,
  prompt,
  setPrompt,
  onSend,
  isBusy,
  onStop,
  onSuggestion,
  showSuggestions,
}: {
  chat: ChatMessage[]
  chatEndRef: React.RefObject<HTMLDivElement | null>
  prompt: string
  setPrompt: (s: string) => void
  onSend: () => void
  isBusy: boolean
  onStop: () => void
  onSuggestion: (s: string) => void
  showSuggestions: boolean
}) {
  const fileRef = useRef<HTMLInputElement | null>(null)
  const recogRef = useRef<any>(null)
  const [listening, setListening] = useState(false)

  function toggleMic() {
    if (typeof window === 'undefined') return
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      alert('Voice input is not supported in this browser.')
      return
    }
    if (listening) {
      recogRef.current?.stop()
      return
    }
    const r = new SR()
    r.lang = 'en-US'
    r.interimResults = true
    r.continuous = false
    r.onresult = (e: any) => {
      const transcript = Array.from(e.results)
        .map((res: any) => res[0].transcript)
        .join('')
      setPrompt(transcript)
    }
    r.onend = () => setListening(false)
    r.onerror = () => setListening(false)
    r.start()
    recogRef.current = r
    setListening(true)
  }

  function handleAttach(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setPrompt((prompt ? prompt + ' ' : '') + `[attached: ${f.name}]`)
    e.target.value = ''
  }

  return (
    <section className="panel chat-panel">
      <header className="panel-head">
        <span className="panel-eyebrow">Chat</span>
        <span className="agent-mode-pill">
          <span className="agent-mode-dot" />
          Agent Mode: ON
        </span>
      </header>

      <div className="chat-stream">
        {chat.length === 0 && showSuggestions && (
          <div className="chat-empty">
            <p className="chat-empty-line">
              Send a task to <strong>NVR 9.9 Ultra Super Agent</strong>. It will plan, narrate, and execute end-to-end.
            </p>
            <div className="suggestion-row">
              {SUGGESTIONS.map((s) => (
                <button key={s} className="suggestion-chip" onClick={() => onSuggestion(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {chat.map((m) => (
          <ChatBubble key={m.id} msg={m} />
        ))}
        <div ref={chatEndRef} />
      </div>

      <div className="composer">
        <input
          ref={fileRef}
          type="file"
          style={{ display: 'none' }}
          onChange={handleAttach}
        />
        <button
          type="button"
          aria-label="Attach file"
          className="composer-icon"
          onClick={() => fileRef.current?.click()}
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
          placeholder={isBusy ? 'Agent is working… use Stop to interrupt.' : 'Send a task to the agent'}
          className="composer-input"
        />

        <button
          type="button"
          aria-label="Voice input"
          className={listening ? 'composer-icon listening' : 'composer-icon'}
          onClick={toggleMic}
          disabled={isBusy}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="9" y1="22" x2="15" y2="22" />
          </svg>
        </button>

        {isBusy ? (
          <button
            type="button"
            aria-label="Stop the agent"
            onClick={onStop}
            className="composer-stop"
          >
            <svg width="14" height="14" viewBox="0 0 12 12" fill="currentColor">
              <rect x="2.5" y="2.5" width="7" height="7" rx="1" />
            </svg>
          </button>
        ) : (
          <button
            type="button"
            aria-label="Send"
            onClick={onSend}
            disabled={!prompt.trim()}
            className="composer-send"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="13 6 19 12 13 18" />
            </svg>
          </button>
        )}
      </div>
    </section>
  )
}

function ChatBubble({ msg }: { msg: ChatMessage }) {
  if (msg.role === 'user') {
    return (
      <div className="bubble-row user">
        <div className="bubble user">{msg.text}</div>
      </div>
    )
  }
  return (
    <div className="bubble-row agent">
      <div className="bubble-avatar">A</div>
      <div className="bubble agent">{msg.text}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

function AgentStyles() {
  return (
    <style>{`
      .agent-shell {
        position: relative;
        min-height: calc(100vh - 64px);
        background:
          radial-gradient(ellipse 80% 40% at 50% -10%, rgba(0, 200, 240, 0.10) 0%, transparent 60%),
          var(--bg-base);
        padding: 16px 16px 32px;
      }
      .status-bar {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1.5fr) minmax(0, 1fr);
        align-items: center;
        gap: 12px;
        padding: 10px 16px;
        margin-bottom: 16px;
        background: linear-gradient(180deg, var(--bg-surface) 0%, rgba(12, 18, 32, 0.6) 100%);
        border: 1px solid var(--border);
        border-radius: 14px;
        backdrop-filter: blur(8px);
      }
      .status-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
      .status-center { display: flex; justify-content: center; min-width: 0; padding: 0 8px; }
      .status-right { display: flex; align-items: center; gap: 10px; justify-content: flex-end; flex-wrap: wrap; }
      .status-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 5px 12px;
        border: 1px solid var(--border);
        border-radius: 999px;
        font-family: 'DM Mono', monospace;
        font-size: 0.7rem;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        background: rgba(0, 0, 0, 0.25);
      }
      .status-dot { width: 7px; height: 7px; border-radius: 50%; display: inline-block; }
      .status-dot.pulse { animation: pulse-ring 1.6s infinite; }
      .status-timer {
        font-family: 'DM Mono', monospace;
        font-size: 0.95rem;
        color: var(--text-primary);
        letter-spacing: 0.04em;
        font-variant-numeric: tabular-nums;
      }
      .status-meta {
        font-family: 'DM Mono', monospace;
        font-size: 0.75rem;
        color: var(--text-muted);
      }
      .status-prompt {
        color: var(--text-secondary);
        font-size: 0.875rem;
        font-style: italic;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
      }
      .status-model {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        background: rgba(0, 200, 240, 0.06);
        border: 1px solid rgba(0, 200, 240, 0.3);
        border-radius: 10px;
        color: var(--accent);
        font-family: 'Syne', sans-serif;
        font-weight: 600;
        font-size: 0.8125rem;
        letter-spacing: 0.01em;
      }

      .agent-grid {
        display: grid;
        grid-template-columns: minmax(320px, 1.05fr) minmax(0, 1fr);
        gap: 16px;
        align-items: stretch;
      }
      @media (max-width: 960px) {
        .agent-grid { grid-template-columns: 1fr; }
        .monitor-panel, .chat-panel { grid-column: 1; }
        .panel { min-height: 420px; max-height: none; }
        .status-bar { grid-template-columns: 1fr; gap: 6px; padding: 12px; }
        .status-center { justify-content: flex-start; padding: 0; }
        .status-right { justify-content: flex-start; }
      }

      .monitor-section {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 14px;
        min-height: 0;
      }
      .monitor-section-stream { flex: 1; min-height: 180px; }
      .monitor-section-label {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-family: 'DM Mono', monospace;
        font-size: 0.6875rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--text-muted);
      }

      .panel {
        background: var(--bg-surface);
        border: 1px solid var(--border);
        border-radius: 16px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        min-height: 540px;
        max-height: calc(100vh - 160px);
      }
      .panel-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }
      .panel-eyebrow {
        font-family: 'DM Mono', monospace;
        font-size: 0.6875rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--text-muted);
      }
      .panel-count {
        font-family: 'DM Mono', monospace;
        font-size: 0.7rem;
        color: var(--text-muted);
      }

      .progress-track {
        height: 5px;
        border-radius: 3px;
        background: var(--bg-elevated);
        overflow: hidden;
        margin-bottom: 14px;
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

      .task-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        overflow-y: auto;
        padding-right: 4px;
        max-height: 220px;
      }
      .empty-block {
        color: var(--text-muted);
        font-size: 0.875rem;
        padding: 24px 12px;
        text-align: center;
        border: 1px dashed var(--border);
        border-radius: 10px;
      }
      .task-row {
        display: flex;
        gap: 10px;
        padding: 10px 12px;
        border: 1px solid var(--border);
        border-radius: 10px;
        background: var(--bg-elevated);
        transition: all 0.2s ease;
        animation: fadeIn 0.25s ease;
      }
      .task-row.task-running {
        background: linear-gradient(180deg, rgba(0, 200, 240, 0.08) 0%, rgba(0, 200, 240, 0.02) 100%);
        border-color: rgba(0, 200, 240, 0.35);
      }
      .task-row.task-completed .task-icon {
        background: rgba(52, 211, 153, 0.12);
        color: #34d399;
        border-color: rgba(52, 211, 153, 0.4);
      }
      .task-row.task-failed .task-icon {
        background: rgba(244, 71, 99, 0.12);
        color: #f44763;
        border-color: rgba(244, 71, 99, 0.4);
      }
      .task-icon {
        width: 26px;
        height: 26px;
        border-radius: 50%;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--bg-surface);
        border: 1px solid var(--border);
        color: var(--text-muted);
        font-size: 0.7rem;
        font-family: 'DM Mono', monospace;
      }
      .task-body { flex: 1; min-width: 0; }
      .task-title-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 2px;
      }
      .task-title {
        font-size: 0.875rem;
        color: var(--text-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .task-detail {
        color: var(--text-secondary);
        font-size: 0.75rem;
        line-height: 1.5;
      }
      .critical-badge {
        display: inline-flex;
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

      .live-action {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        margin-bottom: 12px;
        background: var(--bg-elevated);
        border: 1px solid var(--border);
        border-radius: 10px;
      }
      .pulse-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--accent);
        animation: pulse-ring 1.6s infinite;
      }
      .pulse-dot.static { background: var(--text-muted); animation: none; }
      .live-action-text {
        color: var(--text-primary);
        font-family: 'Syne', sans-serif;
        font-weight: 600;
        font-size: 0.95rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .log-stream {
        flex: 1;
        background: var(--bg-base);
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 10px 12px;
        font-family: 'DM Mono', monospace;
        font-size: 0.75rem;
        line-height: 1.6;
        overflow-y: auto;
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

      .chat-panel { min-height: 540px; }
      .agent-mode-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        background: rgba(0, 200, 240, 0.08);
        border: 1px solid rgba(0, 200, 240, 0.35);
        color: var(--accent);
        border-radius: 999px;
        font-family: 'DM Mono', monospace;
        font-size: 0.6875rem;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }
      .agent-mode-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--accent);
        box-shadow: 0 0 8px var(--accent);
        animation: pulse-ring 1.6s infinite;
      }
      .chat-stream {
        flex: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 4px 2px;
        margin-bottom: 12px;
        min-height: 240px;
      }
      .chat-empty {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 8px 4px;
      }
      .chat-empty-line { color: var(--text-secondary); font-size: 0.9375rem; line-height: 1.6; margin: 0; }
      .suggestion-row { display: flex; flex-direction: column; gap: 6px; }
      .suggestion-chip {
        text-align: left;
        padding: 8px 12px;
        background: var(--bg-elevated);
        border: 1px solid var(--border);
        border-radius: 10px;
        color: var(--text-secondary);
        font-size: 0.8125rem;
        font-family: inherit;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .suggestion-chip:hover {
        border-color: var(--accent);
        color: var(--text-primary);
        background: rgba(0, 200, 240, 0.06);
      }
      .bubble-row { display: flex; gap: 10px; }
      .bubble-row.user { justify-content: flex-end; }
      .bubble-avatar {
        width: 28px; height: 28px; border-radius: 50%;
        background: rgba(0, 200, 240, 0.12);
        border: 1px solid rgba(0, 200, 240, 0.35);
        color: var(--accent);
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
        font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.75rem;
      }
      .bubble {
        max-width: 88%;
        padding: 10px 14px;
        font-size: 0.9375rem;
        line-height: 1.55;
        animation: fadeIn 0.25s ease;
      }
      .bubble.user {
        background: rgba(0, 200, 240, 0.12);
        border: 1px solid rgba(0, 200, 240, 0.3);
        color: var(--text-primary);
        border-radius: 14px 14px 4px 14px;
      }
      .bubble.agent {
        background: var(--bg-elevated);
        border: 1px solid var(--border);
        color: var(--text-primary);
        border-radius: 4px 14px 14px 14px;
      }

      .composer {
        background: var(--bg-elevated);
        border: 1px solid var(--border);
        border-radius: 14px;
        padding: 6px;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .composer:focus-within { border-color: rgba(0, 200, 240, 0.5); }
      .composer-input {
        flex: 1;
        background: transparent;
        border: none;
        outline: none;
        color: var(--text-primary);
        font-family: inherit;
        font-size: 0.9375rem;
        padding: 10px 8px;
        min-width: 0;
      }
      .composer-icon {
        width: 38px; height: 38px;
        flex-shrink: 0;
        display: inline-flex; align-items: center; justify-content: center;
        background: transparent;
        border: 1px solid transparent;
        border-radius: 10px;
        color: var(--text-secondary);
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .composer-icon:hover:not(:disabled) {
        color: var(--accent);
        background: rgba(0, 200, 240, 0.08);
        border-color: rgba(0, 200, 240, 0.2);
      }
      .composer-icon:disabled { opacity: 0.4; cursor: not-allowed; }
      .composer-icon.listening {
        color: #f44763;
        background: rgba(244, 71, 99, 0.08);
        border-color: rgba(244, 71, 99, 0.4);
        animation: warn-pulse 1.4s infinite;
      }
      .composer-send {
        width: 40px; height: 40px;
        flex-shrink: 0;
        display: inline-flex; align-items: center; justify-content: center;
        background: var(--accent);
        color: var(--bg-base);
        border: none;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .composer-send:hover:not(:disabled) {
        background: #33d4f5;
        box-shadow: 0 6px 18px rgba(0, 200, 240, 0.4);
      }
      .composer-send:disabled { opacity: 0.35; cursor: not-allowed; }
      .composer-stop {
        width: 40px; height: 40px;
        flex-shrink: 0;
        display: inline-flex; align-items: center; justify-content: center;
        background: rgba(244, 71, 99, 0.18);
        color: #ff6e85;
        border: 1px solid rgba(244, 71, 99, 0.5);
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.15s ease;
        animation: warn-pulse 1.6s infinite;
      }
      .composer-stop:hover {
        background: rgba(244, 71, 99, 0.28);
        color: #ff8b9e;
      }

      .stop-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 7px 14px;
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
      .stop-btn:hover {
        background: rgba(244, 71, 99, 0.2);
        border-color: rgba(244, 71, 99, 0.7);
      }
      .ghost-btn {
        padding: 7px 14px;
        background: transparent;
        border: 1px solid var(--border);
        border-radius: 10px;
        color: var(--text-secondary);
        font-family: 'Syne', sans-serif;
        font-weight: 600;
        font-size: 0.8125rem;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .ghost-btn:hover { border-color: var(--accent); color: var(--text-primary); }

      .skeleton { opacity: 0.5; }
      .skel-line {
        height: 9px;
        background: var(--bg-elevated);
        border-radius: 4px;
        margin-bottom: 6px;
      }
      .skel-line.w40 { width: 40%; }
      .skel-line.w70 { width: 70%; }

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
      .spin { animation: spin 1s linear infinite; }
    `}</style>
  )
}
