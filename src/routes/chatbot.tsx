import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'

export const Route = createFileRoute('/chatbot')({
  component: ChatBot,
})

type Mode = 'chat' | 'agent'

type AgentStep = {
  id: string
  title: string
  detail: string
  critical: boolean
  status: 'pending' | 'running' | 'completed' | 'failed'
}

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  mode: Mode
  steps?: AgentStep[]
  agentLabel?: string
  agentStatus?: 'planning' | 'running' | 'done' | 'error' | 'cancelled'
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [listening, setListening] = useState(false)
  const [mode, setMode] = useState<Mode>('chat')

  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isStreaming])

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px'
  }, [input])

  function updateMessage(id: string, patch: Partial<Message> | ((m: Message) => Partial<Message>)) {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m
        const next = typeof patch === 'function' ? patch(m) : patch
        return { ...m, ...next }
      }),
    )
  }

  async function send() {
    const text = input.trim()
    if (!text || isStreaming) return

    setError(null)
    const userMsg: Message = { id: uid(), role: 'user', content: text, mode }
    const assistantId = uid()
    const assistantMsg: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      mode,
      ...(mode === 'agent'
        ? { steps: [], agentStatus: 'planning' as const, agentLabel: 'Planning…' }
        : {}),
    }
    const history = [...messages, userMsg]
    setMessages([...history, assistantMsg])
    setPendingId(assistantId)
    setInput('')
    setIsStreaming(true)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      if (mode === 'chat') {
        await runChat(history, assistantId, controller.signal)
      } else {
        await runAgent(text, assistantId, controller.signal)
      }
    } catch (err) {
      if ((err as any)?.name === 'AbortError') {
        // user cancelled — keep partial
      } else {
        const msg = err instanceof Error ? err.message : 'Something went wrong'
        setError(msg)
        if (mode === 'chat') {
          setMessages((prev) => prev.filter((m) => m.id !== assistantId))
        } else {
          updateMessage(assistantId, { agentStatus: 'error' })
        }
      }
    } finally {
      setIsStreaming(false)
      setPendingId(null)
      abortRef.current = null
    }
  }

  async function runChat(history: Message[], assistantId: string, signal: AbortSignal) {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: history.map(({ role, content }) => ({ role, content })),
      }),
      signal,
    })
    if (!res.ok) {
      let detail = `Request failed (${res.status})`
      try {
        const j = await res.json()
        if (j?.error) detail = j.error
      } catch {}
      throw new Error(detail)
    }
    if (!res.body) throw new Error('No response stream')

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let acc = ''
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      acc += decoder.decode(value, { stream: true })
      updateMessage(assistantId, { content: acc })
    }
  }

  async function runAgent(prompt: string, assistantId: string, signal: AbortSignal) {
    const res = await fetch('/api/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
      signal,
    })
    if (!res.ok) {
      let detail = `Request failed (${res.status})`
      try {
        const j = await res.json()
        if (j?.error) detail = j.error
      } catch {}
      throw new Error(detail)
    }
    if (!res.body) throw new Error('No response stream')

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buf = ''
    const handle = (line: string) => {
      if (!line.trim()) return
      let evt: any
      try {
        evt = JSON.parse(line)
      } catch {
        return
      }
      switch (evt.type) {
        case 'meta':
          if (evt.label) updateMessage(assistantId, { agentLabel: evt.label })
          return
        case 'plan':
          updateMessage(assistantId, {
            steps: evt.tasks.map((t: any) => ({
              id: t.id,
              title: t.title,
              detail: t.detail,
              critical: !!t.critical,
              status: 'pending' as const,
            })),
            agentStatus: 'running',
          })
          return
        case 'task_start':
          updateMessage(assistantId, (m) => ({
            steps: (m.steps || []).map((s) =>
              s.id === evt.id ? { ...s, status: 'running' } : s,
            ),
          }))
          return
        case 'task_done':
          updateMessage(assistantId, (m) => ({
            steps: (m.steps || []).map((s) =>
              s.id === evt.id ? { ...s, status: 'completed' } : s,
            ),
          }))
          return
        case 'agent':
          updateMessage(assistantId, (m) => ({
            content: m.content ? `${m.content}\n\n${evt.text}` : evt.text,
          }))
          return
        case 'done':
          updateMessage(assistantId, { agentStatus: 'done' })
          return
        case 'cancelled':
          updateMessage(assistantId, (m) => ({
            agentStatus: 'cancelled',
            steps: (m.steps || []).map((s) =>
              s.status === 'running' ? { ...s, status: 'failed' } : s,
            ),
          }))
          return
        case 'error':
          updateMessage(assistantId, { agentStatus: 'error' })
          setError(evt.message || 'Agent failed')
          return
      }
    }

    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })
      let nl = buf.indexOf('\n')
      while (nl !== -1) {
        handle(buf.slice(0, nl))
        buf = buf.slice(nl + 1)
        nl = buf.indexOf('\n')
      }
    }
    if (buf.trim()) handle(buf)
  }

  function stop() {
    abortRef.current?.abort()
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      send()
    }
  }

  function toggleVoice() {
    if (typeof window === 'undefined') return
    const SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      setError('Voice input is not supported in this browser')
      return
    }

    if (listening && recognitionRef.current) {
      recognitionRef.current.stop()
      return
    }

    const rec = new SR()
    rec.continuous = false
    rec.interimResults = true
    rec.lang = 'en-US'
    rec.onstart = () => setListening(true)
    rec.onerror = (e: any) => {
      setError(e?.error ? `Voice: ${e.error}` : 'Voice input failed')
      setListening(false)
    }
    rec.onend = () => setListening(false)
    rec.onresult = (event: any) => {
      let transcript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      setInput((prev) => (prev ? prev + ' ' + transcript : transcript))
    }
    recognitionRef.current = rec
    try {
      rec.start()
    } catch {
      // ignore double-start
    }
  }

  const hasMessages = messages.length > 0

  return (
    <div className="cb-root">
      <style>{styles}</style>

      <header className="cb-header">
        <div className="cb-header-inner">
          <div className="cb-brand">
            <span className="cb-dot" />
            <span>NVR Chat</span>
          </div>

          <div className="cb-mode-toggle" role="tablist" aria-label="Conversation mode">
            <button
              role="tab"
              aria-selected={mode === 'chat'}
              className={mode === 'chat' ? 'cb-mode is-active' : 'cb-mode'}
              onClick={() => !isStreaming && setMode('chat')}
              disabled={isStreaming}
              title="Quick conversational replies"
            >
              Chat Mode
            </button>
            <button
              role="tab"
              aria-selected={mode === 'agent'}
              className={mode === 'agent' ? 'cb-mode is-active' : 'cb-mode'}
              onClick={() => !isStreaming && setMode('agent')}
              disabled={isStreaming}
              title="Plan and execute multi-step tasks"
            >
              Agent Mode
            </button>
          </div>

          {hasMessages && (
            <button
              className="cb-clear"
              onClick={() => {
                if (isStreaming) stop()
                setMessages([])
                setError(null)
              }}
              aria-label="Clear conversation"
            >
              New chat
            </button>
          )}
        </div>
      </header>

      <main className="cb-main">
        <div className="cb-scroll" ref={scrollRef}>
          {!hasMessages && (
            <div className="cb-welcome">
              <h1>How can I help you today?</h1>
              <p>
                {mode === 'chat'
                  ? 'Ask anything. Press Enter to send, Shift+Enter for a new line.'
                  : 'Describe a task. The agent will plan steps and work through them.'}
              </p>
            </div>
          )}

          <div className="cb-messages">
            {messages.map((m) => {
              const isPending = m.id === pendingId
              return (
                <div key={m.id} className={`cb-row cb-row-${m.role}`}>
                  <div className={`cb-avatar cb-avatar-${m.role}`} aria-hidden>
                    {m.role === 'user' ? 'U' : 'AI'}
                  </div>
                  <div className="cb-bubble">
                    {m.role === 'assistant' && m.mode === 'agent' ? (
                      <AgentBubble msg={m} pending={isPending} />
                    ) : isPending && m.content.length === 0 ? (
                      <TypingDots />
                    ) : (
                      <Streaming text={m.content} />
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {error && (
            <div className="cb-error" role="alert">
              <span>⚠ {error}</span>
              <button onClick={() => setError(null)} aria-label="Dismiss error">
                ×
              </button>
            </div>
          )}
        </div>

        <form
          className="cb-composer"
          onSubmit={(e) => {
            e.preventDefault()
            send()
          }}
        >
          <div className={`cb-input-wrap ${listening ? 'is-listening' : ''}`}>
            <textarea
              ref={textareaRef}
              className="cb-input"
              placeholder={
                listening
                  ? 'Listening…'
                  : mode === 'chat'
                    ? 'Message NVR Chat'
                    : 'Describe a task for the agent'
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              disabled={isStreaming}
              aria-label="Message"
            />

            <div className="cb-actions">
              <button
                type="button"
                className={`cb-icon-btn ${listening ? 'is-active' : ''}`}
                onClick={toggleVoice}
                aria-label={listening ? 'Stop voice input' : 'Start voice input'}
                title={listening ? 'Stop voice input' : 'Voice input'}
              >
                <MicIcon />
              </button>

              {isStreaming ? (
                <button
                  type="button"
                  className="cb-icon-btn cb-send is-stop"
                  onClick={stop}
                  aria-label="Stop generating"
                  title="Stop"
                >
                  <StopIcon />
                </button>
              ) : (
                <button
                  type="submit"
                  className="cb-icon-btn cb-send"
                  aria-label="Send message"
                  title="Send"
                  disabled={!input.trim()}
                >
                  <ArrowUpIcon />
                </button>
              )}
            </div>
          </div>
          <p className="cb-hint">
            {mode === 'chat'
              ? 'NVR Chat can make mistakes. Verify important information.'
              : 'Agent Mode plans and narrates steps using gpt-4o-mini.'}
          </p>
        </form>
      </main>
    </div>
  )
}

function TypingDots() {
  return (
    <span className="cb-typing" aria-label="Assistant is typing">
      <span className="cb-typing-dot" />
      <span className="cb-typing-dot" />
      <span className="cb-typing-dot" />
    </span>
  )
}

function Streaming({ text }: { text: string }) {
  return <div className="cb-text">{text}</div>
}

function AgentBubble({ msg, pending }: { msg: Message; pending: boolean }) {
  const status = msg.agentStatus || 'planning'
  const statusLabel =
    status === 'planning'
      ? 'Agent is working…'
      : status === 'running'
        ? 'Agent is working…'
        : status === 'done'
          ? 'Run complete'
          : status === 'cancelled'
            ? 'Stopped'
            : 'Failed'

  const showWorking = pending && (status === 'planning' || status === 'running')

  return (
    <div className="cb-agent">
      <div className="cb-agent-header">
        <span className={`cb-agent-status status-${status}`}>
          {showWorking && <span className="cb-agent-spinner" aria-hidden />}
          {statusLabel}
        </span>
        {msg.agentLabel && status !== 'planning' && (
          <span className="cb-agent-label">· {msg.agentLabel}</span>
        )}
      </div>

      {msg.steps && msg.steps.length > 0 && (
        <ol className="cb-agent-steps">
          {msg.steps.map((s, i) => (
            <li key={s.id} className={`cb-step cb-step-${s.status}`}>
              <span className="cb-step-icon">
                {s.status === 'completed' && '✓'}
                {s.status === 'running' && <span className="cb-step-spinner" aria-hidden />}
                {s.status === 'pending' && i + 1}
                {s.status === 'failed' && '×'}
              </span>
              <div className="cb-step-body">
                <div className="cb-step-title">
                  {s.title}
                  {s.critical && <span className="cb-step-critical">critical</span>}
                </div>
                {s.detail && <div className="cb-step-detail">{s.detail}</div>}
              </div>
            </li>
          ))}
        </ol>
      )}

      {msg.steps && msg.steps.length === 0 && pending && (
        <div className="cb-agent-skeleton">
          {[0, 1, 2].map((i) => (
            <div key={i} className="cb-agent-skel-row" style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
      )}

      {msg.content && <div className="cb-agent-narration">{msg.content}</div>}
    </div>
  )
}

function ArrowUpIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 19V5" />
      <path d="m5 12 7-7 7 7" />
    </svg>
  )
}

function StopIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="5" y="5" width="14" height="14" rx="2" />
    </svg>
  )
}

function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="9" y="3" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
    </svg>
  )
}

const styles = `
.cb-root {
  --cb-bg: #ffffff;
  --cb-surface: #f7f7f8;
  --cb-surface-2: #ffffff;
  --cb-border: #e5e5e7;
  --cb-text: #1a1a1a;
  --cb-text-muted: #6b6b76;
  --cb-bubble-user: #1a1a1a;
  --cb-bubble-user-text: #ffffff;
  --cb-bubble-assistant: transparent;
  --cb-accent: #10a37f;
  --cb-accent-text: #ffffff;
  --cb-error: #b91c1c;
  --cb-error-bg: #fef2f2;
  --cb-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06);

  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: var(--cb-bg);
  color: var(--cb-text);
  font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  z-index: 50;
}

@media (prefers-color-scheme: dark) {
  .cb-root {
    --cb-bg: #0d0d0d;
    --cb-surface: #1a1a1a;
    --cb-surface-2: #212121;
    --cb-border: #2a2a2a;
    --cb-text: #ececec;
    --cb-text-muted: #9a9aa3;
    --cb-bubble-user: #2f2f2f;
    --cb-bubble-user-text: #ffffff;
    --cb-bubble-assistant: transparent;
    --cb-accent: #19c37d;
    --cb-accent-text: #0d0d0d;
    --cb-error: #fca5a5;
    --cb-error-bg: #2a1010;
    --cb-shadow: 0 1px 2px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.5);
  }
}

.cb-header {
  border-bottom: 1px solid var(--cb-border);
  background: var(--cb-bg);
}
.cb-header-inner {
  max-width: 860px;
  margin: 0 auto;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.cb-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  font-size: 15px;
  letter-spacing: -0.01em;
}
.cb-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--cb-accent);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--cb-accent) 20%, transparent);
}
.cb-mode-toggle {
  display: inline-flex;
  background: var(--cb-surface);
  border: 1px solid var(--cb-border);
  padding: 3px;
  border-radius: 999px;
  gap: 2px;
}
.cb-mode {
  border: none;
  background: transparent;
  color: var(--cb-text-muted);
  padding: 6px 14px;
  border-radius: 999px;
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.cb-mode:hover:not(:disabled) { color: var(--cb-text); }
.cb-mode.is-active {
  background: var(--cb-surface-2);
  color: var(--cb-text);
  box-shadow: 0 1px 2px rgba(0,0,0,0.06);
}
.cb-mode:disabled { cursor: not-allowed; opacity: 0.6; }

.cb-clear {
  background: transparent;
  border: 1px solid var(--cb-border);
  color: var(--cb-text);
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s;
}
.cb-clear:hover { background: var(--cb-surface); }

.cb-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.cb-scroll {
  flex: 1;
  overflow-y: auto;
  scroll-behavior: smooth;
}

.cb-welcome {
  max-width: 640px;
  margin: 0 auto;
  padding: 18vh 24px 0;
  text-align: center;
}
.cb-welcome h1 {
  font-family: 'Syne', sans-serif;
  font-size: 32px;
  font-weight: 600;
  letter-spacing: -0.02em;
  margin: 0 0 12px;
  color: var(--cb-text);
}
.cb-welcome p {
  margin: 0;
  color: var(--cb-text-muted);
  font-size: 15px;
}

.cb-messages {
  max-width: 760px;
  margin: 0 auto;
  padding: 28px 20px 32px;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.cb-row {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  animation: cb-fade-in 0.25s ease-out;
}
.cb-row-user { flex-direction: row-reverse; }

@keyframes cb-fade-in {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.cb-avatar {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
}
.cb-avatar-user {
  background: var(--cb-bubble-user);
  color: var(--cb-bubble-user-text);
}
.cb-avatar-assistant {
  background: var(--cb-accent);
  color: var(--cb-accent-text);
}

.cb-bubble {
  max-width: calc(100% - 60px);
  padding: 2px 0;
  font-size: 15.5px;
  line-height: 1.65;
  color: var(--cb-text);
  word-wrap: break-word;
}
.cb-row-user .cb-bubble {
  background: var(--cb-bubble-user);
  color: var(--cb-bubble-user-text);
  padding: 10px 16px;
  border-radius: 18px 18px 4px 18px;
}

.cb-text {
  white-space: pre-wrap;
}

.cb-typing {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  height: 24px;
}
.cb-typing-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--cb-text-muted);
  animation: cb-bounce 1.2s infinite ease-in-out;
}
.cb-typing-dot:nth-child(2) { animation-delay: 0.15s; }
.cb-typing-dot:nth-child(3) { animation-delay: 0.3s; }
@keyframes cb-bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-5px); opacity: 1; }
}

.cb-agent {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}
.cb-agent-header {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  font-size: 13px;
}
.cb-agent-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 999px;
  font-weight: 500;
  font-size: 12.5px;
  background: color-mix(in srgb, var(--cb-accent) 12%, transparent);
  color: var(--cb-accent);
  border: 1px solid color-mix(in srgb, var(--cb-accent) 35%, transparent);
}
.cb-agent-status.status-done {
  background: color-mix(in srgb, #34d399 14%, transparent);
  color: #16a474;
  border-color: color-mix(in srgb, #34d399 40%, transparent);
}
.cb-agent-status.status-error,
.cb-agent-status.status-cancelled {
  background: color-mix(in srgb, var(--cb-error) 14%, transparent);
  color: var(--cb-error);
  border-color: color-mix(in srgb, var(--cb-error) 40%, transparent);
}
.cb-agent-label {
  color: var(--cb-text-muted);
  font-size: 12.5px;
}
.cb-agent-spinner {
  width: 10px;
  height: 10px;
  border: 1.5px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  display: inline-block;
  animation: cb-spin 0.8s linear infinite;
}
@keyframes cb-spin {
  to { transform: rotate(360deg); }
}

.cb-agent-steps {
  list-style: none;
  margin: 0;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: var(--cb-surface);
  border: 1px solid var(--cb-border);
  border-radius: 12px;
}
.cb-step {
  display: flex;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  background: var(--cb-surface-2);
  border: 1px solid transparent;
  transition: background 0.15s, border-color 0.15s;
  animation: cb-fade-in 0.2s ease-out;
}
.cb-step-running {
  border-color: color-mix(in srgb, var(--cb-accent) 35%, transparent);
  background: color-mix(in srgb, var(--cb-accent) 6%, var(--cb-surface-2));
}
.cb-step-completed { opacity: 0.85; }
.cb-step-failed { opacity: 0.7; }

.cb-step-icon {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  background: var(--cb-surface);
  color: var(--cb-text-muted);
  border: 1px solid var(--cb-border);
}
.cb-step-running .cb-step-icon {
  border-color: var(--cb-accent);
  color: var(--cb-accent);
}
.cb-step-completed .cb-step-icon {
  background: color-mix(in srgb, #34d399 18%, transparent);
  color: #16a474;
  border-color: color-mix(in srgb, #34d399 40%, transparent);
}
.cb-step-failed .cb-step-icon {
  background: color-mix(in srgb, var(--cb-error) 18%, transparent);
  color: var(--cb-error);
  border-color: color-mix(in srgb, var(--cb-error) 40%, transparent);
}
.cb-step-spinner {
  width: 10px;
  height: 10px;
  border: 1.5px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: cb-spin 0.8s linear infinite;
}
.cb-step-body { flex: 1; min-width: 0; }
.cb-step-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--cb-text);
  display: flex;
  align-items: center;
  gap: 8px;
}
.cb-step-detail {
  font-size: 12.5px;
  color: var(--cb-text-muted);
  margin-top: 2px;
  line-height: 1.5;
}
.cb-step-critical {
  display: inline-block;
  padding: 1px 7px;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  background: color-mix(in srgb, #f59e0b 18%, transparent);
  color: #b45309;
  border: 1px solid color-mix(in srgb, #f59e0b 40%, transparent);
}

.cb-agent-skeleton {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  background: var(--cb-surface);
  border: 1px solid var(--cb-border);
  border-radius: 12px;
}
.cb-agent-skel-row {
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(90deg, var(--cb-surface-2) 0%, var(--cb-surface) 50%, var(--cb-surface-2) 100%);
  background-size: 200% 100%;
  animation: cb-shimmer 1.4s linear infinite;
}
@keyframes cb-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.cb-agent-narration {
  white-space: pre-wrap;
  color: var(--cb-text);
  font-size: 14.5px;
  line-height: 1.6;
}

.cb-error {
  max-width: 760px;
  margin: 0 auto 12px;
  padding: 10px 14px;
  background: var(--cb-error-bg);
  color: var(--cb-error);
  border: 1px solid color-mix(in srgb, var(--cb-error) 30%, transparent);
  border-radius: 10px;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.cb-error button {
  background: transparent;
  border: none;
  color: inherit;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  padding: 0 4px;
}

.cb-composer {
  background: linear-gradient(to top, var(--cb-bg) 60%, transparent);
  padding: 14px 20px 18px;
  flex-shrink: 0;
}
.cb-input-wrap {
  max-width: 760px;
  margin: 0 auto;
  background: var(--cb-surface-2);
  border: 1px solid var(--cb-border);
  border-radius: 24px;
  padding: 8px 8px 8px 18px;
  display: flex;
  align-items: flex-end;
  gap: 8px;
  box-shadow: var(--cb-shadow);
  transition: border-color 0.15s, box-shadow 0.15s;
}
.cb-input-wrap:focus-within {
  border-color: color-mix(in srgb, var(--cb-text) 30%, var(--cb-border));
}
.cb-input-wrap.is-listening {
  border-color: var(--cb-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--cb-accent) 20%, transparent), var(--cb-shadow);
}

.cb-input {
  flex: 1;
  resize: none;
  border: none;
  outline: none;
  background: transparent;
  color: var(--cb-text);
  font: inherit;
  font-size: 15.5px;
  line-height: 1.5;
  padding: 9px 0;
  max-height: 200px;
  overflow-y: auto;
  font-family: inherit;
}
.cb-input::placeholder { color: var(--cb-text-muted); }
.cb-input:disabled { opacity: 0.6; }

.cb-actions {
  display: flex;
  gap: 4px;
  align-items: center;
  padding-bottom: 2px;
}

.cb-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--cb-text-muted);
  cursor: pointer;
  transition: background 0.15s, color 0.15s, transform 0.1s;
}
.cb-icon-btn:hover:not(:disabled) {
  background: var(--cb-surface);
  color: var(--cb-text);
}
.cb-icon-btn:active:not(:disabled) { transform: scale(0.94); }
.cb-icon-btn.is-active {
  background: var(--cb-accent);
  color: var(--cb-accent-text);
  animation: cb-pulse 1.4s infinite;
}
@keyframes cb-pulse {
  0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--cb-accent) 50%, transparent); }
  50% { box-shadow: 0 0 0 8px color-mix(in srgb, var(--cb-accent) 0%, transparent); }
}

.cb-send {
  background: var(--cb-text);
  color: var(--cb-bg);
}
.cb-send:hover:not(:disabled) {
  background: var(--cb-text);
  color: var(--cb-bg);
  opacity: 0.88;
}
.cb-send:disabled {
  background: var(--cb-surface);
  color: var(--cb-text-muted);
  cursor: not-allowed;
}
.cb-send.is-stop {
  background: var(--cb-text);
  color: var(--cb-bg);
}

.cb-hint {
  max-width: 760px;
  margin: 8px auto 0;
  text-align: center;
  font-size: 12px;
  color: var(--cb-text-muted);
}

@media (max-width: 640px) {
  .cb-welcome h1 { font-size: 24px; }
  .cb-welcome { padding-top: 14vh; }
  .cb-messages { padding: 18px 14px 24px; }
  .cb-composer { padding: 10px 12px 14px; }
}
`
