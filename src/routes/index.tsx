import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState, type ReactNode } from 'react'

export const Route = createFileRoute('/')({
  component: Home,
})

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

const STORAGE_KEY = 'nvr.chat.history.v1'
const MODE_KEY = 'nvr.chat.agentMode.v1'

function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [agentMode, setAgentMode] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setMessages(parsed)
      }
      const mode = sessionStorage.getItem(MODE_KEY)
      if (mode === '1') setAgentMode(true)

      const pending = sessionStorage.getItem('nvr.pendingPrompt')
      if (pending) {
        sessionStorage.removeItem('nvr.pendingPrompt')
        setInput(pending)
      }
    } catch {}
  }, [])

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
    } catch {}
  }, [messages])

  useEffect(() => {
    try {
      sessionStorage.setItem(MODE_KEY, agentMode ? '1' : '0')
    } catch {}
  }, [agentMode])

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

  async function send() {
    const text = input.trim()
    if (!text || isStreaming) return

    setError(null)
    const userMsg: Message = { id: uid(), role: 'user', content: text }
    const assistantId = uid()
    const assistantMsg: Message = { id: assistantId, role: 'assistant', content: '' }
    const history = [...messages, userMsg]
    setMessages([...history, assistantMsg])
    setPendingId(assistantId)
    setInput('')
    setIsStreaming(true)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          messages: history.map(({ role, content }) => ({ role, content })),
          agentMode,
        }),
        signal: controller.signal,
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
        const chunk = decoder.decode(value, { stream: true })
        acc += chunk
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: acc } : m)),
        )
      }

      if (!acc.trim()) {
        throw new Error('Empty response from server')
      }
    } catch (err) {
      if ((err as any)?.name === 'AbortError') {
        // user cancelled — keep partial
      } else {
        const msg = err instanceof Error ? err.message : 'Something went wrong'
        setError(msg)
        setMessages((prev) => prev.filter((m) => m.id !== assistantId))
      }
    } finally {
      setIsStreaming(false)
      setPendingId(null)
      abortRef.current = null
    }
  }

  function stop() {
    abortRef.current?.abort()
  }

  function newChat() {
    if (isStreaming) stop()
    setMessages([])
    setError(null)
    setInput('')
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {}
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      send()
    }
  }

  const hasMessages = messages.length > 0

  return (
    <div className="nvr-chat-root">
      <style>{styles}</style>

      {hasMessages ? (
        <ChatHeader agentMode={agentMode} setAgentMode={setAgentMode} onNewChat={newChat} />
      ) : null}

      <div className="nvr-chat-stage">
        {!hasMessages && (
          <div className="nvr-hero">
            <h1 className="nvr-hero-title">
              AI intelligence for{' '}
              <span style={{ color: 'var(--accent)' }}>every layer</span>
            </h1>
            <p className="nvr-hero-sub">
              Build, analyze, and deploy with one powerful AI system.
            </p>
            <div className="nvr-hero-suggest">
              {[
                'Explain how WebAssembly works',
                'Draft a launch plan for a SaaS landing page',
                'Help me debug a flaky React effect',
                'Write a bash script that backs up a Postgres DB',
              ].map((s) => (
                <button
                  key={s}
                  type="button"
                  className="nvr-suggest-chip"
                  onClick={() => setInput(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {hasMessages && (
          <div className="nvr-scroll" ref={scrollRef}>
            <div className="nvr-messages">
              {messages.map((m) => {
                const isPendingAssistant =
                  m.role === 'assistant' && m.id === pendingId && m.content.length === 0
                return (
                  <div key={m.id} className={`nvr-row nvr-row-${m.role}`}>
                    <div className={`nvr-avatar nvr-avatar-${m.role}`} aria-hidden>
                      {m.role === 'user' ? 'U' : <SparkGlyph />}
                    </div>
                    <div className="nvr-bubble-wrap">
                      <div className="nvr-bubble">
                        {isPendingAssistant ? (
                          <ThinkingDots agent={agentMode} />
                        ) : (
                          <FormattedText text={m.content} />
                        )}
                        {m.role === 'assistant' &&
                          m.id === pendingId &&
                          m.content.length > 0 && <span className="nvr-cursor" />}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {error && (
              <div className="nvr-error" role="alert">
                <span>⚠ {error}</span>
                <button onClick={() => setError(null)} aria-label="Dismiss error">
                  ×
                </button>
              </div>
            )}
          </div>
        )}

        <form
          className={`nvr-composer ${hasMessages ? 'is-docked' : ''}`}
          onSubmit={(e) => {
            e.preventDefault()
            send()
          }}
        >
          <div className="nvr-composer-inner">
            <div className="nvr-input-wrap">
              <textarea
                ref={textareaRef}
                className="nvr-input"
                placeholder={
                  isStreaming
                    ? agentMode
                      ? 'Agent is planning…'
                      : 'Thinking…'
                    : 'Ask anything…'
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                disabled={isStreaming}
                aria-label="Message"
              />

              <div className="nvr-input-actions">
                <AgentToggle on={agentMode} setOn={setAgentMode} disabled={isStreaming} />

                {isStreaming ? (
                  <button
                    type="button"
                    className="nvr-send is-stop"
                    onClick={stop}
                    aria-label="Stop generating"
                    title="Stop"
                  >
                    <StopIcon />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="nvr-send"
                    aria-label="Send message"
                    title="Send"
                    disabled={!input.trim()}
                  >
                    <SendIcon />
                  </button>
                )}
              </div>
            </div>

            <p className="nvr-hint">
              {agentMode
                ? 'Agent Mode · NVR will respond with a plan and step-by-step execution.'
                : 'Press Enter to send · Shift+Enter for a new line'}
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

function ChatHeader({
  agentMode,
  setAgentMode,
  onNewChat,
}: {
  agentMode: boolean
  setAgentMode: (v: boolean) => void
  onNewChat: () => void
}) {
  return (
    <div className="nvr-chat-header">
      <div className="nvr-chat-header-left">
        <span className="nvr-chat-dot" />
        <span className="nvr-chat-title">
          {agentMode ? 'NVR · Agent Mode' : 'NVR Chat'}
        </span>
      </div>
      <div className="nvr-chat-header-right">
        <AgentToggle on={agentMode} setOn={setAgentMode} compact />
        <button type="button" className="nvr-newchat-btn" onClick={onNewChat}>
          New chat
        </button>
      </div>
    </div>
  )
}

function AgentToggle({
  on,
  setOn,
  disabled,
  compact,
}: {
  on: boolean
  setOn: (v: boolean) => void
  disabled?: boolean
  compact?: boolean
}) {
  return (
    <button
      type="button"
      className={`nvr-agent-toggle ${on ? 'is-on' : ''} ${compact ? 'is-compact' : ''}`}
      onClick={() => setOn(!on)}
      disabled={disabled}
      aria-pressed={on}
      title={on ? 'Agent Mode is ON' : 'Agent Mode is OFF'}
    >
      <span className="nvr-agent-toggle-glyph" aria-hidden>
        <SparkGlyph small />
      </span>
      <span className="nvr-agent-toggle-label">Agent Mode</span>
      <span className={`nvr-agent-toggle-pill ${on ? 'is-on' : ''}`}>
        <span className="nvr-agent-toggle-knob" />
      </span>
    </button>
  )
}

function ThinkingDots({ agent }: { agent: boolean }) {
  return (
    <span className="nvr-thinking" aria-label="Thinking">
      <span className="nvr-thinking-label">{agent ? 'Planning' : 'Thinking'}</span>
      <span className="nvr-thinking-dots">
        <span />
        <span />
        <span />
      </span>
    </span>
  )
}

function FormattedText({ text }: { text: string }) {
  // Lightweight markdown: render **bold**, *italic*, `code`, headings, bullets, numbered lists.
  const lines = text.split('\n')
  const out: ReactNode[] = []
  let listBuf: string[] = []
  let listKind: 'ul' | 'ol' | null = null

  function flushList(key: string) {
    if (!listBuf.length || !listKind) return
    const items = listBuf.map((l, i) => <li key={i}>{inline(l)}</li>)
    out.push(
      listKind === 'ul' ? (
        <ul key={key} className="nvr-md-ul">
          {items}
        </ul>
      ) : (
        <ol key={key} className="nvr-md-ol">
          {items}
        </ol>
      ),
    )
    listBuf = []
    listKind = null
  }

  lines.forEach((raw, idx) => {
    const line = raw
    const ulMatch = /^\s*[-*]\s+(.*)$/.exec(line)
    const olMatch = /^\s*\d+\.\s+(.*)$/.exec(line)
    const h2 = /^##\s+(.*)$/.exec(line)
    const h3 = /^###\s+(.*)$/.exec(line)
    const bold = /^\*\*(.+)\*\*$/.exec(line.trim())

    if (ulMatch) {
      if (listKind && listKind !== 'ul') flushList(`l-${idx}`)
      listKind = 'ul'
      listBuf.push(ulMatch[1])
      return
    }
    if (olMatch) {
      if (listKind && listKind !== 'ol') flushList(`l-${idx}`)
      listKind = 'ol'
      listBuf.push(olMatch[1])
      return
    }

    flushList(`l-${idx}`)

    if (h2) {
      out.push(
        <h3 key={`h-${idx}`} className="nvr-md-h">
          {inline(h2[1])}
        </h3>,
      )
      return
    }
    if (h3) {
      out.push(
        <h4 key={`h-${idx}`} className="nvr-md-h sm">
          {inline(h3[1])}
        </h4>,
      )
      return
    }
    if (bold) {
      out.push(
        <p key={`p-${idx}`} className="nvr-md-p">
          <strong>{inline(bold[1])}</strong>
        </p>,
      )
      return
    }
    if (line.trim() === '') {
      out.push(<div key={`b-${idx}`} className="nvr-md-break" />)
      return
    }
    out.push(
      <p key={`p-${idx}`} className="nvr-md-p">
        {inline(line)}
      </p>,
    )
  })
  flushList('l-end')

  return <div className="nvr-md">{out}</div>
}

function inline(text: string): ReactNode {
  // Tokenize: `code`, **bold**, *italic*
  const tokens: { type: 'text' | 'code' | 'bold' | 'italic'; value: string }[] = []
  const re = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g
  let lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > lastIndex) {
      tokens.push({ type: 'text', value: text.slice(lastIndex, m.index) })
    }
    const t = m[0]
    if (t.startsWith('`')) tokens.push({ type: 'code', value: t.slice(1, -1) })
    else if (t.startsWith('**')) tokens.push({ type: 'bold', value: t.slice(2, -2) })
    else tokens.push({ type: 'italic', value: t.slice(1, -1) })
    lastIndex = re.lastIndex
  }
  if (lastIndex < text.length) {
    tokens.push({ type: 'text', value: text.slice(lastIndex) })
  }
  return tokens.map((tok, i) => {
    if (tok.type === 'code')
      return (
        <code key={i} className="nvr-md-code">
          {tok.value}
        </code>
      )
    if (tok.type === 'bold') return <strong key={i}>{tok.value}</strong>
    if (tok.type === 'italic') return <em key={i}>{tok.value}</em>
    return <span key={i}>{tok.value}</span>
  })
}

function SparkGlyph({ small }: { small?: boolean } = {}) {
  const s = small ? 12 : 14
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1.5l1.6 4.4 4.4 1.6-4.4 1.6L8 13.5l-1.6-4.4L2 7.5l4.4-1.6L8 1.5z" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 19V5" />
      <path d="m5 12 7-7 7 7" />
    </svg>
  )
}

function StopIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
      <rect x="2.5" y="2.5" width="7" height="7" rx="1" />
    </svg>
  )
}

const styles = `
.nvr-chat-root {
  position: relative;
  min-height: calc(100vh - 64px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.nvr-chat-root::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 60% at 50% -10%, rgba(0,200,240,0.12) 0%, transparent 70%),
    linear-gradient(180deg, transparent 0%, transparent 100%);
  pointer-events: none;
  z-index: 0;
}

.nvr-chat-stage {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* ---------- Header ---------- */
.nvr-chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--border);
  background: rgba(12, 18, 32, 0.7);
  backdrop-filter: blur(10px);
  position: relative;
  z-index: 2;
}
.nvr-chat-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.nvr-chat-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 0 3px rgba(0,200,240,0.18);
  animation: nvr-pulse 1.8s infinite;
}
.nvr-chat-title {
  font-family: 'Syne', sans-serif;
  font-weight: 600;
  font-size: 0.95rem;
  letter-spacing: -0.01em;
  color: var(--text-primary);
}
.nvr-chat-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.nvr-newchat-btn {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-secondary);
  padding: 7px 12px;
  border-radius: 10px;
  font-family: inherit;
  font-size: 0.8125rem;
  cursor: pointer;
  transition: all 0.15s ease;
}
.nvr-newchat-btn:hover {
  border-color: var(--accent);
  color: var(--text-primary);
  background: rgba(0,200,240,0.06);
}

/* ---------- Hero (empty state) ---------- */
.nvr-hero {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 80px 24px 24px;
  max-width: 760px;
  margin: 0 auto;
  width: 100%;
}
.nvr-hero-title {
  font-size: clamp(2.25rem, 5.5vw, 3.75rem);
  font-weight: 800;
  color: var(--text-primary);
  margin: 0 0 16px;
  letter-spacing: -0.02em;
}
.nvr-hero-sub {
  color: var(--text-secondary);
  font-size: 1.0625rem;
  line-height: 1.6;
  margin: 0 0 36px;
}
.nvr-hero-suggest {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  width: 100%;
  max-width: 640px;
  margin-top: 8px;
}
.nvr-suggest-chip {
  text-align: left;
  padding: 12px 14px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  color: var(--text-secondary);
  font-family: inherit;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.15s ease;
}
.nvr-suggest-chip:hover {
  border-color: var(--accent);
  color: var(--text-primary);
  background: rgba(0,200,240,0.05);
  transform: translateY(-1px);
}
@media (max-width: 560px) {
  .nvr-hero-suggest { grid-template-columns: 1fr; }
}

/* ---------- Chat messages ---------- */
.nvr-scroll {
  flex: 1;
  overflow-y: auto;
  scroll-behavior: smooth;
}
.nvr-messages {
  max-width: 760px;
  margin: 0 auto;
  padding: 28px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 22px;
}
.nvr-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  animation: nvr-fade 0.25s ease-out;
}
.nvr-row-user { flex-direction: row-reverse; }
.nvr-avatar {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  font-family: 'Syne', sans-serif;
}
.nvr-avatar-user {
  background: var(--bg-elevated);
  color: var(--text-primary);
  border: 1px solid var(--border);
}
.nvr-avatar-assistant {
  background: rgba(0, 200, 240, 0.12);
  color: var(--accent);
  border: 1px solid rgba(0,200,240,0.4);
}
.nvr-bubble-wrap {
  max-width: calc(100% - 50px);
  display: flex;
}
.nvr-row-user .nvr-bubble-wrap { justify-content: flex-end; }
.nvr-bubble {
  font-size: 0.95rem;
  line-height: 1.65;
  color: var(--text-primary);
  word-wrap: break-word;
  min-width: 60px;
}
.nvr-row-user .nvr-bubble {
  background: rgba(0, 200, 240, 0.10);
  border: 1px solid rgba(0, 200, 240, 0.30);
  padding: 10px 14px;
  border-radius: 14px 14px 4px 14px;
  white-space: pre-wrap;
}

.nvr-cursor {
  display: inline-block;
  width: 7px;
  height: 1.05em;
  vertical-align: -0.18em;
  margin-left: 2px;
  background: var(--accent);
  animation: nvr-blink 1s steps(2) infinite;
}
@keyframes nvr-blink {
  50% { opacity: 0; }
}

/* ---------- Markdown rendering ---------- */
.nvr-md-p { margin: 0 0 8px; }
.nvr-md-p:last-child { margin-bottom: 0; }
.nvr-md-h {
  font-family: 'Syne', sans-serif;
  font-weight: 600;
  font-size: 1.0625rem;
  margin: 14px 0 6px;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}
.nvr-md-h.sm { font-size: 0.95rem; color: var(--accent); }
.nvr-md-ul, .nvr-md-ol {
  margin: 4px 0 10px;
  padding-left: 22px;
}
.nvr-md-ul li, .nvr-md-ol li { margin: 2px 0; }
.nvr-md-code {
  font-family: 'DM Mono', monospace;
  font-size: 0.85em;
  padding: 1px 6px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--accent);
}
.nvr-md-break { height: 4px; }

/* ---------- Thinking ---------- */
.nvr-thinking {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
  color: var(--text-secondary);
  font-size: 0.875rem;
}
.nvr-thinking-label {
  font-family: 'DM Mono', monospace;
  font-size: 0.75rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--accent);
}
.nvr-thinking-dots { display: inline-flex; gap: 4px; }
.nvr-thinking-dots span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--accent);
  opacity: 0.4;
  animation: nvr-bounce 1.2s infinite ease-in-out;
}
.nvr-thinking-dots span:nth-child(2) { animation-delay: 0.15s; }
.nvr-thinking-dots span:nth-child(3) { animation-delay: 0.3s; }
@keyframes nvr-bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-5px); opacity: 1; }
}

/* ---------- Errors ---------- */
.nvr-error {
  max-width: 760px;
  margin: 0 auto 12px;
  padding: 10px 14px;
  background: rgba(244, 71, 99, 0.08);
  color: #ff8b9e;
  border: 1px solid rgba(244, 71, 99, 0.4);
  border-radius: 12px;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.nvr-error button {
  background: transparent;
  border: none;
  color: inherit;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  padding: 0 4px;
}

/* ---------- Composer ---------- */
.nvr-composer {
  flex-shrink: 0;
  padding: 14px 20px 18px;
}
.nvr-composer.is-docked {
  background: linear-gradient(to top, var(--bg-base) 60%, transparent);
}
.nvr-composer-inner {
  max-width: 760px;
  margin: 0 auto;
}
.nvr-input-wrap {
  background: var(--bg-surface);
  border: 1px solid var(--border-bright);
  border-radius: 20px;
  padding: 12px 12px 8px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  box-shadow: 0 16px 48px rgba(0, 200, 240, 0.08);
  transition: border-color 0.15s, box-shadow 0.15s;
}
.nvr-input-wrap:focus-within {
  border-color: rgba(0, 200, 240, 0.5);
  box-shadow: 0 16px 48px rgba(0, 200, 240, 0.16);
}
.nvr-input {
  resize: none;
  border: none;
  outline: none;
  background: transparent;
  color: var(--text-primary);
  font-family: inherit;
  font-size: 1rem;
  line-height: 1.5;
  padding: 4px 0;
  max-height: 200px;
  overflow-y: auto;
  width: 100%;
}
.nvr-input::placeholder { color: var(--text-muted); }
.nvr-input:disabled { opacity: 0.6; cursor: not-allowed; }

.nvr-input-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-top: 4px;
}

.nvr-send {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  background: var(--accent);
  color: var(--bg-base);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.nvr-send:hover:not(:disabled) {
  background: #33d4f5;
  box-shadow: 0 6px 18px rgba(0, 200, 240, 0.4);
}
.nvr-send:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.nvr-send.is-stop {
  background: rgba(244, 71, 99, 0.18);
  color: #ff8b9e;
  border: 1px solid rgba(244, 71, 99, 0.5);
  animation: nvr-warn 1.4s infinite;
}
.nvr-send.is-stop:hover {
  background: rgba(244, 71, 99, 0.28);
  box-shadow: 0 0 0 3px rgba(244, 71, 99, 0.18);
}

.nvr-hint {
  margin: 8px 0 0;
  text-align: center;
  font-family: 'DM Mono', monospace;
  font-size: 0.7rem;
  letter-spacing: 0.04em;
  color: var(--text-muted);
}

/* ---------- Agent Toggle ---------- */
.nvr-agent-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px 6px 10px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 999px;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.8125rem;
  color: var(--text-secondary);
  transition: all 0.18s ease;
}
.nvr-agent-toggle:hover:not(:disabled) {
  border-color: var(--border-bright);
  color: var(--text-primary);
}
.nvr-agent-toggle.is-on {
  border-color: rgba(0, 200, 240, 0.55);
  background: rgba(0, 200, 240, 0.08);
  color: var(--accent);
  box-shadow: 0 0 0 3px rgba(0, 200, 240, 0.10);
}
.nvr-agent-toggle:disabled { opacity: 0.55; cursor: not-allowed; }
.nvr-agent-toggle-glyph {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  color: currentColor;
}
.nvr-agent-toggle.is-on .nvr-agent-toggle-glyph {
  filter: drop-shadow(0 0 4px rgba(0,200,240,0.6));
}
.nvr-agent-toggle-label {
  font-weight: 600;
  letter-spacing: -0.005em;
}
.nvr-agent-toggle.is-compact .nvr-agent-toggle-label {
  font-size: 0.75rem;
}
.nvr-agent-toggle-pill {
  position: relative;
  width: 28px;
  height: 16px;
  border-radius: 999px;
  background: var(--border);
  flex-shrink: 0;
  transition: background 0.2s ease;
}
.nvr-agent-toggle-pill.is-on {
  background: var(--accent);
}
.nvr-agent-toggle-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--text-primary);
  transition: transform 0.2s ease;
}
.nvr-agent-toggle-pill.is-on .nvr-agent-toggle-knob {
  transform: translateX(12px);
  background: var(--bg-base);
}

/* ---------- Animations ---------- */
@keyframes nvr-fade {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes nvr-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(0,200,240,0.5); }
  50% { box-shadow: 0 0 0 8px rgba(0,200,240,0); }
}
@keyframes nvr-warn {
  0%, 100% { box-shadow: 0 0 0 0 rgba(244,71,99,0.45); }
  50% { box-shadow: 0 0 0 8px rgba(244,71,99,0); }
}

@media (max-width: 640px) {
  .nvr-hero { padding-top: 56px; }
  .nvr-messages { padding: 18px 14px 14px; }
  .nvr-composer { padding: 10px 14px 14px; }
  .nvr-chat-header { padding: 10px 14px; }
  .nvr-agent-toggle-label { display: none; }
  .nvr-agent-toggle { padding: 6px 8px; gap: 6px; }
}
`
