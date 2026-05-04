import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPassword,
})

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | undefined>()
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  function validate() {
    if (!email) {
      setError('Email is required.')
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address.')
      return false
    }
    setError(undefined)
    return true
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate() || submitting) return
    setSubmitting(true)
    try {
      await new Promise((r) => setTimeout(r, 700))
      setSent(true)
    } catch {
      setError("We couldn't send a reset link. Try again in a moment.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main
      style={{
        position: 'relative',
        minHeight: 'calc(100vh - 56px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 20px',
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(0,200,240,0.10) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden
        className="grid-pattern"
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.15,
          maskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, black 0%, transparent 80%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 60% 50% at 50% 50%, black 0%, transparent 80%)',
          pointerEvents: 'none',
        }}
      />

      <div
        className="forgot-shell animate-fade-up"
        style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '440px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div className="tag" style={{ marginBottom: '14px' }}>
            <span
              style={{
                width: '6px',
                height: '6px',
                background: 'var(--accent)',
                borderRadius: '50%',
                boxShadow: '0 0 8px var(--accent)',
              }}
            />
            Account recovery
          </div>
          <h1
            style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: '0 0 10px',
            }}
          >
            {sent ? 'Check your inbox' : 'Reset your password'}
          </h1>
          <p
            style={{
              color: 'var(--text-secondary)',
              margin: 0,
              fontSize: '0.9375rem',
              lineHeight: 1.55,
            }}
          >
            {sent
              ? `If an account exists for ${email}, a reset link is on its way. The link expires in 30 minutes.`
              : "Enter the email tied to your NVR account and we'll send you a secure reset link."}
          </p>
        </div>

        <div
          className="card"
          style={{
            padding: 'clamp(20px, 4vw, 32px)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          {sent ? (
            <div style={{ display: 'grid', gap: '16px' }}>
              <div
                aria-hidden
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  margin: '0 auto',
                  background: 'rgba(0,200,240,0.12)',
                  border: '1px solid rgba(0,200,240,0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3 7l9 6 9-6M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"
                    stroke="var(--accent)"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p
                style={{
                  textAlign: 'center',
                  margin: 0,
                  color: 'var(--text-secondary)',
                  fontSize: '0.875rem',
                  lineHeight: 1.55,
                }}
              >
                Didn&rsquo;t receive it? Check spam, or{' '}
                <button
                  type="button"
                  onClick={() => {
                    setSent(false)
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--accent)',
                    cursor: 'pointer',
                    padding: 0,
                    font: 'inherit',
                    textDecoration: 'underline',
                  }}
                >
                  try a different email
                </button>
                .
              </p>
              <Link
                to="/login"
                className="btn-ghost"
                style={{ justifyContent: 'center', padding: '12px 16px' }}
              >
                Back to log in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate style={{ display: 'grid', gap: '14px' }}>
              <Field label="Email" htmlFor="forgot-email" error={error}>
                <input
                  id="forgot-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (error) setError(undefined)
                  }}
                  placeholder="you@company.com"
                  className={`forgot-input ${error ? 'has-error' : ''}`}
                  disabled={submitting}
                />
              </Field>

              <button
                type="submit"
                className="btn-primary"
                disabled={submitting}
                style={{
                  marginTop: '4px',
                  justifyContent: 'center',
                  padding: '13px 16px',
                  opacity: submitting ? 0.7 : 1,
                  cursor: submitting ? 'progress' : 'pointer',
                }}
              >
                {submitting ? (
                  <>
                    <Spinner /> Sending link&hellip;
                  </>
                ) : (
                  <>Send reset link</>
                )}
              </button>

              <p
                style={{
                  textAlign: 'center',
                  margin: 0,
                  marginTop: '6px',
                  fontSize: '0.8125rem',
                  color: 'var(--text-secondary)',
                }}
              >
                Remembered it?{' '}
                <Link
                  to="/login"
                  style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}
                >
                  Back to log in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>

      <style>{`
        .forgot-input {
          width: 100%;
          padding: 12px 14px;
          background: rgba(6, 10, 18, 0.6);
          border: 1px solid var(--border);
          border-radius: 10px;
          color: var(--text-primary);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9375rem;
          line-height: 1.4;
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
        }
        .forgot-input::placeholder { color: var(--text-muted); }
        .forgot-input:hover:not(:disabled) { border-color: var(--border-bright); }
        .forgot-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(0, 200, 240, 0.15);
          background: rgba(6, 10, 18, 0.85);
        }
        .forgot-input.has-error {
          border-color: rgba(239, 68, 68, 0.55);
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12);
        }
        .forgot-input:disabled { opacity: 0.6; cursor: not-allowed; }
        @media (max-width: 480px) {
          .forgot-shell { max-width: 100% !important; }
        }
      `}</style>
    </main>
  )
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div style={{ display: 'grid', gap: '6px' }}>
      <label
        htmlFor={htmlFor}
        style={{
          fontSize: '0.75rem',
          fontFamily: 'DM Mono, monospace',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
        }}
      >
        {label}
      </label>
      {children}
      {error && (
        <p
          role="alert"
          style={{ margin: 0, color: '#fda4af', fontSize: '0.75rem', fontWeight: 500 }}
        >
          {error}
        </p>
      )}
    </div>
  )
}

function Spinner() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      style={{ animation: 'spin 0.8s linear infinite' }}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  )
}
