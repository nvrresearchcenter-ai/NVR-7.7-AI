import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const navigate = useNavigate()
  const [value, setValue] = useState('')

  function send() {
    const v = value.trim()
    if (!v) return
    try {
      sessionStorage.setItem('nvr.pendingPrompt', v)
    } catch {}
    navigate({ to: '/agent' })
  }

  return (
    <div
      style={{
        position: 'relative',
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        overflow: 'hidden',
      }}
    >
      <div
        className="grid-pattern"
        style={{ position: 'absolute', inset: 0, zIndex: 0 }}
      />
      <div
        style={{
          position: 'absolute',
          top: '-10%',
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
          width: '100%',
          textAlign: 'center',
        }}
      >
        <h1
          className="animate-fade-up opacity-0"
          style={{
            fontSize: 'clamp(2.5rem, 6vw, 4.25rem)',
            fontWeight: 800,
            color: 'var(--text-primary)',
            marginBottom: '20px',
          }}
        >
          AI intelligence for{' '}
          <span style={{ color: 'var(--accent)' }}>every layer</span>
        </h1>
        <p
          className="animate-fade-up opacity-0 delay-100"
          style={{
            fontSize: '1.125rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            marginBottom: '40px',
            maxWidth: '560px',
            marginInline: 'auto',
          }}
        >
          Build, analyze, and deploy with one powerful AI system.
        </p>

        <div
          className="animate-fade-up opacity-0 delay-200"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-bright)',
            borderRadius: '20px',
            padding: '12px 12px 12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 16px 48px rgba(0, 200, 240, 0.08)',
            textAlign: 'left',
          }}
        >
          <button
            type="button"
            aria-label="Attach file"
            className="composer-icon-btn"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </button>

          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                send()
              }
            }}
            placeholder="Ask anything…"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
              fontSize: '1rem',
              padding: '12px 4px',
              minWidth: 0,
            }}
          />

          <button
            type="button"
            aria-label="Voice input"
            className="composer-icon-btn"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="2" width="6" height="12" rx="3" />
              <path d="M5 11a7 7 0 0 0 14 0" />
              <line x1="12" y1="18" x2="12" y2="22" />
              <line x1="9" y1="22" x2="15" y2="22" />
            </svg>
          </button>

          <button
            type="button"
            aria-label="Send"
            onClick={send}
            disabled={!value.trim()}
            className="composer-send-btn"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="13 6 19 12 13 18" />
            </svg>
          </button>
        </div>

        <p
          className="animate-fade-up opacity-0 delay-300"
          style={{
            marginTop: '14px',
            color: 'var(--text-muted)',
            fontFamily: 'DM Mono, monospace',
            fontSize: '0.75rem',
            letterSpacing: '0.04em',
          }}
        >
          Press Enter to dispatch to the agent
        </p>
      </div>

      <style>{`
        .composer-icon-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          flex-shrink: 0;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 12px;
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
          width: 44px;
          height: 44px;
          flex-shrink: 0;
          background: var(--accent);
          color: var(--bg-base);
          border: none;
          border-radius: 14px;
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
