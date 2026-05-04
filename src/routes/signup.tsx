import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useMemo, useState } from 'react'

export const Route = createFileRoute('/signup')({
  component: Signup,
})

function Signup() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [accept, setAccept] = useState(false)
  const [errors, setErrors] = useState<{
    name?: string
    email?: string
    password?: string
    accept?: string
    form?: string
  }>({})
  const [submitting, setSubmitting] = useState(false)

  const strength = useMemo(() => scorePassword(password), [password])

  function validate() {
    const next: typeof errors = {}
    if (!name.trim()) next.name = 'Tell us what to call you.'
    if (!email) next.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter a valid email address.'
    if (!password) next.password = 'Password is required.'
    else if (password.length < 8) next.password = 'Use at least 8 characters.'
    else if (strength.score < 2)
      next.password = 'Add a number, symbol, or mix of cases for a stronger password.'
    if (!accept) next.accept = 'Please accept the Terms and Privacy Policy.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate() || submitting) return
    setSubmitting(true)
    setErrors({})
    try {
      await new Promise((r) => setTimeout(r, 900))
      navigate({ to: '/dashboard' })
    } catch {
      setErrors({ form: "We couldn't create your account. Please try again." })
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
            'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(0,200,240,0.12) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 50% 100%, rgba(109,40,217,0.10) 0%, transparent 70%)',
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
        className="signup-shell animate-fade-up"
        style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '460px' }}
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
            Start free &middot; 14 days
          </div>
          <h1
            style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: '0 0 10px',
            }}
          >
            Create your NVR account
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9375rem' }}>
            Already have one?{' '}
            <Link
              to="/login"
              style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}
            >
              Log in
            </Link>
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
          <form onSubmit={handleSubmit} noValidate style={{ display: 'grid', gap: '14px' }}>
            <Field label="Full name" htmlFor="signup-name" error={errors.name}>
              <input
                id="signup-name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (errors.name) setErrors((p) => ({ ...p, name: undefined }))
                }}
                placeholder="Ada Lovelace"
                className={`signup-input ${errors.name ? 'has-error' : ''}`}
                disabled={submitting}
              />
            </Field>

            <Field label="Work email" htmlFor="signup-email" error={errors.email}>
              <input
                id="signup-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (errors.email) setErrors((p) => ({ ...p, email: undefined }))
                }}
                placeholder="you@company.com"
                className={`signup-input ${errors.email ? 'has-error' : ''}`}
                disabled={submitting}
              />
            </Field>

            <Field label="Password" htmlFor="signup-password" error={errors.password}>
              <div style={{ position: 'relative' }}>
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errors.password) setErrors((p) => ({ ...p, password: undefined }))
                  }}
                  placeholder="At least 8 characters"
                  className={`signup-input ${errors.password ? 'has-error' : ''}`}
                  style={{ paddingRight: '44px' }}
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '32px',
                    height: '32px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '6px',
                  }}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {password && (
                <div
                  style={{
                    marginTop: '4px',
                    display: 'flex',
                    gap: '6px',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        style={{
                          height: '4px',
                          flex: 1,
                          borderRadius: '2px',
                          background:
                            i < strength.score ? strength.color : 'rgba(255,255,255,0.06)',
                          transition: 'background 0.15s ease',
                        }}
                      />
                    ))}
                  </div>
                  <span
                    style={{
                      fontFamily: 'DM Mono, monospace',
                      fontSize: '0.6875rem',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: strength.color,
                      minWidth: '48px',
                      textAlign: 'right',
                    }}
                  >
                    {strength.label}
                  </span>
                </div>
              )}
            </Field>

            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                fontSize: '0.8125rem',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                userSelect: 'none',
                marginTop: '2px',
                lineHeight: 1.5,
              }}
            >
              <span
                className={`check ${accept ? 'checked' : ''} ${errors.accept ? 'check-error' : ''}`}
                aria-hidden
                onClick={(e) => {
                  e.preventDefault()
                  setAccept((v) => !v)
                  if (errors.accept) setErrors((p) => ({ ...p, accept: undefined }))
                }}
                style={{ marginTop: '2px' }}
              >
                {accept && (
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2.5 6l2.5 2.5L9.5 3.5"
                      stroke="var(--bg-base)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              <input
                type="checkbox"
                checked={accept}
                onChange={(e) => {
                  setAccept(e.target.checked)
                  if (errors.accept) setErrors((p) => ({ ...p, accept: undefined }))
                }}
                style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
              />
              <span>
                I agree to the{' '}
                <Link
                  to="/terms"
                  style={{ color: 'var(--text-primary)', textDecoration: 'underline' }}
                >
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link
                  to="/privacy"
                  style={{ color: 'var(--text-primary)', textDecoration: 'underline' }}
                >
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
            {errors.accept && (
              <p
                role="alert"
                style={{ margin: 0, color: '#fda4af', fontSize: '0.75rem', fontWeight: 500 }}
              >
                {errors.accept}
              </p>
            )}

            {errors.form && (
              <div
                role="alert"
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#fda4af',
                  fontSize: '0.8125rem',
                }}
              >
                {errors.form}
              </div>
            )}

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
                  <Spinner /> Creating account&hellip;
                </>
              ) : (
                <>
                  Create account
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M3 8h10M9 4l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>

        <p
          style={{
            textAlign: 'center',
            marginTop: '20px',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
          }}
        >
          Need help getting set up?{' '}
          <Link
            to="/faq"
            style={{ color: 'var(--text-secondary)', textDecoration: 'underline' }}
          >
            Read our FAQ
          </Link>
          .
        </p>
      </div>

      <style>{`
        .signup-input {
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
        .signup-input::placeholder { color: var(--text-muted); }
        .signup-input:hover:not(:disabled) { border-color: var(--border-bright); }
        .signup-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(0, 200, 240, 0.15);
          background: rgba(6, 10, 18, 0.85);
        }
        .signup-input.has-error {
          border-color: rgba(239, 68, 68, 0.55);
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12);
        }
        .signup-input:disabled { opacity: 0.6; cursor: not-allowed; }
        .signup-input:-webkit-autofill {
          -webkit-text-fill-color: var(--text-primary);
          -webkit-box-shadow: 0 0 0 1000px rgba(12, 18, 32, 1) inset;
          caret-color: var(--text-primary);
        }
        .check {
          width: 18px;
          height: 18px;
          border-radius: 5px;
          border: 1px solid var(--border-bright);
          background: rgba(6, 10, 18, 0.6);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: background 0.15s ease, border-color 0.15s ease;
        }
        .check.checked {
          background: var(--accent);
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(0, 200, 240, 0.18);
        }
        .check.check-error {
          border-color: rgba(239, 68, 68, 0.55);
        }
        @media (max-width: 480px) {
          .signup-shell { max-width: 100% !important; }
        }
      `}</style>
    </main>
  )
}

function scorePassword(pw: string): { score: 0 | 1 | 2 | 3 | 4; label: string; color: string } {
  if (!pw) return { score: 0, label: 'Empty', color: 'var(--text-muted)' }
  let s = 0
  if (pw.length >= 8) s++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++
  if (/\d/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  if (pw.length >= 14) s = Math.min(4, s + 1)
  const labels = ['Too short', 'Weak', 'Fair', 'Strong', 'Excellent'] as const
  const colors = ['#f87171', '#f59e0b', '#facc15', '#4ade80', '#00c8f0']
  const score = Math.min(4, s) as 0 | 1 | 2 | 3 | 4
  return { score, label: labels[score], color: colors[score] }
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

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 3l18 18M10.6 6.2A10.5 10.5 0 0 1 12 6c6.5 0 10 6 10 6a17.6 17.6 0 0 1-3.3 4M6.3 7.6A17.7 17.7 0 0 0 2 12s3.5 6 10 6c1.7 0 3.2-.4 4.5-1.1M9.9 10a3 3 0 0 0 4.2 4.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
