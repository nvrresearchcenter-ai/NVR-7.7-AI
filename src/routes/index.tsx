import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useRef, useState } from 'react'
import { Footer } from '../components/Footer'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Hero — chat-first */}
      <section
        style={{
          position: 'relative',
          padding: '64px 24px 56px',
          minHeight: 'calc(100vh - 64px)',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
        }}
        className="home-hero"
      >
        {/* Background grid */}
        <div
          className="grid-pattern"
          style={{ position: 'absolute', inset: 0, zIndex: 0 }}
        />
        {/* Radial glow */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '900px',
            height: '600px',
            background:
              'radial-gradient(ellipse, rgba(0,200,240,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            maxWidth: '760px',
            margin: '0 auto',
            width: '100%',
            textAlign: 'center',
          }}
        >
          {/* Brand */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '14px',
            }}
          >
            <span
              style={{
                width: '28px',
                height: '28px',
                background: 'var(--accent)',
                borderRadius: '7px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                <rect x="2" y="2" width="6" height="6" rx="1.5" fill="#060a12" />
                <rect x="10" y="2" width="6" height="6" rx="1.5" fill="#060a12" opacity="0.6" />
                <rect x="2" y="10" width="6" height="6" rx="1.5" fill="#060a12" opacity="0.6" />
                <rect x="10" y="10" width="6" height="6" rx="1.5" fill="#060a12" opacity="0.3" />
              </svg>
            </span>
            <span
              style={{
                fontFamily: 'Syne, sans-serif',
                fontWeight: 800,
                fontSize: '1.25rem',
                color: 'var(--text-primary)',
                letterSpacing: '-0.03em',
              }}
            >
              NVR<span style={{ color: 'var(--accent)' }}> 7.7</span>
            </span>
          </div>

          {/* Tagline */}
          <p
            style={{
              fontFamily: 'DM Mono, monospace',
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)',
              letterSpacing: '0.04em',
              marginBottom: '28px',
            }}
          >
            AI assistant for analysis, coding, design, and network intelligence.
          </p>

          {/* Chat input */}
          <ChatLauncher />

          {/* Buttons */}
          <div
            style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginTop: '20px',
            }}
          >
            <Link
              to="/pricing"
              className="btn-primary"
              style={{ fontSize: '0.875rem', padding: '11px 24px' }}
            >
              View Plans
            </Link>
            <Link
              to="/features"
              className="btn-ghost"
              style={{ fontSize: '0.875rem', padding: '11px 24px' }}
            >
              Learn More
            </Link>
          </div>

          {/* Quick prompts */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginTop: '32px',
            }}
            className="quick-prompts"
          >
            {[
              'Draft a project brief',
              'Analyze this network log',
              'Generate a logo prompt',
              'Write a refund policy',
            ].map((q) => (
              <QuickPrompt key={q} text={q} />
            ))}
          </div>
        </div>

        <style>{`
          @media (max-width: 640px) {
            .home-hero { padding: 40px 16px 48px; min-height: auto; }
            .quick-prompts { display: none !important; }
          }
        `}</style>
      </section>

      <Footer />
    </div>
  )
}

function ChatLauncher() {
  const navigate = useNavigate()
  const [value, setValue] = useState('')
  const [listening, setListening] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)

  function handoff(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    try {
      window.sessionStorage.setItem('nvr-chat-seed', trimmed)
    } catch {}
    navigate({ to: '/chatbot' })
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    handoff(value)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      handoff(value)
    }
  }

  function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setValue((prev) => {
      const note = `[Attached: ${file.name}] `
      return prev ? `${prev}\n${note}` : note
    })
    e.target.value = ''
  }

  function toggleVoice() {
    if (typeof window === 'undefined') return
    const SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop()
      return
    }
    const rec = new SR()
    rec.continuous = false
    rec.interimResults = true
    rec.lang = 'en-US'
    rec.onstart = () => setListening(true)
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    rec.onresult = (event: any) => {
      let transcript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      setValue((prev) => (prev ? prev + ' ' + transcript : transcript))
    }
    recognitionRef.current = rec
    try {
      rec.start()
    } catch {}
  }

  const canSend = value.trim().length > 0

  return (
    <form onSubmit={onSubmit} style={{ width: '100%' }}>
      <div
        style={{
          background: 'rgba(12, 18, 32, 0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: `1px solid ${listening ? 'rgba(0,200,240,0.55)' : 'var(--border-bright)'}`,
          borderRadius: '20px',
          padding: '14px 14px 10px',
          textAlign: 'left',
          boxShadow: listening
            ? '0 0 0 4px rgba(0,200,240,0.12), 0 24px 60px -28px rgba(0,200,240,0.4)'
            : '0 24px 60px -32px rgba(0,200,240,0.35)',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
      >
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          rows={2}
          placeholder={listening ? 'Listening…' : 'Ask NVR 7.7 anything…'}
          aria-label="Ask NVR 7.7 anything"
          style={{
            width: '100%',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: 'var(--text-primary)',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '1rem',
            lineHeight: 1.5,
            resize: 'none',
            padding: '4px 4px 0',
            minHeight: '52px',
            maxHeight: '180px',
          }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            marginTop: '6px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input
              ref={fileInputRef}
              type="file"
              onChange={onUpload}
              style={{ display: 'none' }}
              aria-hidden
            />
            <IconButton
              label="Attach file or image"
              onClick={() => fileInputRef.current?.click()}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </IconButton>
            <IconButton
              label={listening ? 'Stop voice input' : 'Start voice input'}
              onClick={toggleVoice}
              active={listening}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="2" width="6" height="12" rx="3" />
                <path d="M19 10a7 7 0 0 1-14 0" />
                <path d="M12 19v3" />
              </svg>
            </IconButton>
          </div>

          <button
            type="submit"
            disabled={!canSend}
            aria-label="Send message"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              border: 'none',
              cursor: canSend ? 'pointer' : 'not-allowed',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: canSend ? 'var(--accent)' : 'rgba(255,255,255,0.06)',
              color: canSend ? '#060a12' : 'var(--text-muted)',
              boxShadow: canSend ? '0 6px 20px -8px rgba(0,200,240,0.6)' : 'none',
              transition: 'background 0.15s, box-shadow 0.15s, transform 0.15s',
            }}
            onMouseEnter={(e) => {
              if (canSend) e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5" />
              <path d="m5 12 7-7 7 7" />
            </svg>
          </button>
        </div>
      </div>
    </form>
  )
}

function IconButton({
  children,
  label,
  onClick,
  active,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
  active?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{
        width: '34px',
        height: '34px',
        borderRadius: '9px',
        border: '1px solid transparent',
        background: active ? 'rgba(0,200,240,0.12)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--text-secondary)',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.15s, color 0.15s, border-color 0.15s',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
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

function QuickPrompt({ text }: { text: string }) {
  const navigate = useNavigate()
  function go() {
    try {
      window.sessionStorage.setItem('nvr-chat-seed', text)
    } catch {}
    navigate({ to: '/chatbot' })
  }
  return (
    <button
      type="button"
      onClick={go}
      style={{
        padding: '7px 14px',
        borderRadius: '999px',
        border: '1px solid var(--border)',
        background: 'rgba(255,255,255,0.02)',
        color: 'var(--text-secondary)',
        fontSize: '0.8125rem',
        fontFamily: 'DM Sans, sans-serif',
        cursor: 'pointer',
        transition: 'border-color 0.15s, color 0.15s, background 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-bright)'
        e.currentTarget.style.color = 'var(--text-primary)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.color = 'var(--text-secondary)'
      }}
    >
      {text}
    </button>
  )
}
