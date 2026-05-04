import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'

export const Route = createFileRoute('/chatbot')({
  component: ChatBot,
})

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
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
          messages: history.map(({ role, content }) => ({ role, content })),
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
              <p>Ask anything. Press Enter to send, Shift+Enter for a new line.</p>
            </div>
          )}

          <div className="cb-messages">
            {messages.map((m) => {
              const showTyping =
                m.role === 'assistant' && m.id === pendingId && m.content.length === 0
              return (
                <div key={m.id} className={`cb-row cb-row-${m.role}`}>
                  <div className={`cb-avatar cb-avatar-${m.role}`} aria-hidden>
                    {m.role === 'user' ? 'U' : 'AI'}
                  </div>
                  <div className="cb-bubble">
                    {showTyping ? <TypingDots /> : <Streaming text={m.content} />}
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
              placeholder={listening ? 'Listening…' : 'Message NVR Chat'}
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
            NVR Chat can make mistakes. Verify important information.
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
