import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/login')({
  component: Login,
})

type Provider = 'google' | 'apple' | 'microsoft' | 'phone'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({})
  const [submitting, setSubmitting] = useState(false)
  const [pendingProvider, setPendingProvider] = useState<Provider | null>(null)

  function validate() {
    const next: { email?: string; password?: string } = {}
    if (!email) next.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter a valid email address.'
    if (!password) next.password = 'Password is required.'
    else if (password.length < 8) next.password = 'Password must be at least 8 characters.'
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
      setErrors({ form: "We couldn't sign you in. Check your credentials and try again." })
      setSubmitting(false)
    }
  }

  async function handleProvider(provider: Provider) {
    if (pendingProvider || submitting) return
    setPendingProvider(provider)
    setErrors({})
    try {
      await new Promise((r) => setTimeout(r, 700))
      navigate({ to: '/dashboard' })
    } catch {
      setErrors({ form: 'Single sign-on is unavailable right now. Try again in a moment.' })
      setPendingProvider(null)
    }
  }

  return (
    <main
      style={{
        position: 'relative',
        minHeight: 'calc(100vh - 56px)',
        display: 'flex',
        overflow: 'hidden',
        background: 'var(--bg-base)',
      }}
    >
      {/* Ambient backdrops */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 70% 55% at 18% 0%, rgba(0,200,240,0.14) 0%, transparent 65%), radial-gradient(ellipse 55% 45% at 88% 100%, rgba(109,40,217,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden
        className="grid-pattern"
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.18,
          maskImage:
            'radial-gradient(ellipse 80% 70% at 50% 50%, black 0%, transparent 85%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 80% 70% at 50% 50%, black 0%, transparent 85%)',
          pointerEvents: 'none',
        }}
      />

      <div
        className="login-layout"
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'grid',
          gridTemplateColumns: '1.05fr 1fr',
          gap: '0',
          width: '100%',
          maxWidth: '1240px',
          margin: '0 auto',
          padding: '64px 24px',
          alignItems: 'center',
        }}
      >
        {/* Left: branding / value props */}
        <aside className="login-aside animate-fade-up" style={{ paddingRight: '48px' }}>
          <div className="tag" style={{ marginBottom: '18px' }}>
            <span
              style={{
                width: '6px',
                height: '6px',
                background: 'var(--accent)',
                borderRadius: '50%',
                boxShadow: '0 0 8px var(--accent)',
              }}
            />
            NVR 7.7 Control Center
          </div>
          <h1
            style={{
              fontSize: 'clamp(2rem, 4.4vw, 3rem)',
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: '0 0 16px',
              maxWidth: '520px',
            }}
          >
            Sign in to your intelligence layer.
          </h1>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '1.0625rem',
              lineHeight: 1.6,
              margin: '0 0 36px',
              maxWidth: '480px',
            }}
          >
            Real-time analysis, automated workflows, and the agents you&rsquo;ve trained &mdash; one secure session away.
          </p>

          <div style={{ display: 'grid', gap: '14px', maxWidth: '460px' }}>
            <Bullet>End-to-end encrypted sessions with hardware-backed keys.</Bullet>
            <Bullet>SSO across Google, Apple, Microsoft, and SMS one-time codes.</Bullet>
            <Bullet>SOC 2 Type II controls, audit logs, role-based access.</Bullet>
          </div>

          <div
            style={{
              marginTop: '40px',
              padding: '18px 20px',
              background: 'rgba(12, 18, 32, 0.55)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              maxWidth: '460px',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            <p
              style={{
                margin: 0,
                color: 'var(--text-primary)',
                fontSize: '0.9375rem',
                lineHeight: 1.55,
                fontStyle: 'italic',
              }}
            >
              &ldquo;NVR cut our investigation time from days to minutes. The agents understand our infrastructure better than half our engineers.&rdquo;
            </p>
            <div
              style={{
                marginTop: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: 'var(--text-muted)',
                fontSize: '0.8125rem',
              }}
            >
              <div
                aria-hidden
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background:
                    'linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%)',
                  flexShrink: 0,
                }}
              />
              <span>
                <strong style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Mara Velasquez
                </strong>{' '}
                &middot; VP Platform, Northwind
              </span>
            </div>
          </div>
        </aside>

        {/* Right: login card */}
        <section
          className="login-shell animate-fade-up delay-100"
          style={{
            width: '100%',
            maxWidth: '460px',
            justifySelf: 'end',
          }}
        >
          <div style={{ marginBottom: '20px', textAlign: 'left' }}>
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: '0 0 6px',
              }}
            >
              Welcome back
            </h2>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9375rem' }}>
              New to NVR?{' '}
              <Link
                to="/signup"
                style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}
              >
                Create an account
              </Link>
            </p>
          </div>

          <div
            className="card"
            style={{
              padding: 'clamp(20px, 3.4vw, 30px)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            <div style={{ display: 'grid', gap: '10px' }}>
              <ProviderButton
                provider="google"
                label="Continue with Google"
                pending={pendingProvider === 'google'}
                disabled={!!pendingProvider || submitting}
                onClick={() => handleProvider('google')}
              />
              <div className="provider-row">
                <ProviderButton
                  provider="apple"
                  label="Apple"
                  compact
                  pending={pendingProvider === 'apple'}
                  disabled={!!pendingProvider || submitting}
                  onClick={() => handleProvider('apple')}
                />
                <ProviderButton
                  provider="microsoft"
                  label="Microsoft"
                  compact
                  pending={pendingProvider === 'microsoft'}
                  disabled={!!pendingProvider || submitting}
                  onClick={() => handleProvider('microsoft')}
                />
                <ProviderButton
                  provider="phone"
                  label="Phone"
                  compact
                  pending={pendingProvider === 'phone'}
                  disabled={!!pendingProvider || submitting}
                  onClick={() => handleProvider('phone')}
                />
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                margin: '22px 0',
              }}
            >
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              <span
                style={{
                  fontFamily: 'DM Mono, monospace',
                  fontSize: '0.7rem',
                  letterSpacing: '0.12em',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                }}
              >
                Or with email
              </span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            </div>

            <form onSubmit={handleSubmit} noValidate style={{ display: 'grid', gap: '14px' }}>
              <Field label="Email" htmlFor="login-email" error={errors.email}>
                <input
                  id="login-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'login-email-error' : undefined}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (errors.email) setErrors((p) => ({ ...p, email: undefined }))
                  }}
                  placeholder="you@company.com"
                  className={`login-input ${errors.email ? 'has-error' : ''}`}
                  disabled={submitting || !!pendingProvider}
                />
              </Field>

              <Field
                label="Password"
                htmlFor="login-password"
                error={errors.password}
                right={
                  <Link
                    to="/forgot-password"
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--accent)',
                      textDecoration: 'none',
                      fontWeight: 500,
                    }}
                  >
                    Forgot password?
                  </Link>
                }
              >
                <div style={{ position: 'relative' }}>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    minLength={8}
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? 'login-password-error' : undefined}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (errors.password) setErrors((p) => ({ ...p, password: undefined }))
                    }}
                    placeholder="Enter your password"
                    className={`login-input ${errors.password ? 'has-error' : ''}`}
                    style={{ paddingRight: '44px' }}
                    disabled={submitting || !!pendingProvider}
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
              </Field>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '0.8125rem',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  userSelect: 'none',
                  marginTop: '2px',
                }}
              >
                <span
                  className={`check ${remember ? 'checked' : ''}`}
                  aria-hidden
                  onClick={(e) => {
                    e.preventDefault()
                    setRemember((v) => !v)
                  }}
                >
                  {remember && (
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
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                />
                Keep me signed in on this device
              </label>

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
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginTop: '1px', flexShrink: 0 }}>
                    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M8 4.5v4M8 11v0.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                  <span>{errors.form}</span>
                </div>
              )}

              <button
                type="submit"
                className="btn-primary"
                disabled={submitting || !!pendingProvider}
                style={{
                  marginTop: '4px',
                  justifyContent: 'center',
                  padding: '13px 16px',
                  opacity: submitting || pendingProvider ? 0.7 : 1,
                  cursor: submitting || pendingProvider ? 'progress' : 'pointer',
                }}
              >
                {submitting ? (
                  <>
                    <Spinner /> Signing in&hellip;
                  </>
                ) : (
                  <>
                    Log in
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
            By continuing, you agree to NVR&rsquo;s{' '}
            <Link to="/terms" style={{ color: 'var(--text-secondary)', textDecoration: 'underline' }}>
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              to="/privacy"
              style={{ color: 'var(--text-secondary)', textDecoration: 'underline' }}
            >
              Privacy Policy
            </Link>
            .
          </p>
        </section>
      </div>

      <style>{`
        .login-input {
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
        .login-input::placeholder { color: var(--text-muted); }
        .login-input:hover:not(:disabled) { border-color: var(--border-bright); }
        .login-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(0, 200, 240, 0.15);
          background: rgba(6, 10, 18, 0.85);
        }
        .login-input.has-error {
          border-color: rgba(239, 68, 68, 0.55);
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12);
        }
        .login-input:disabled { opacity: 0.6; cursor: not-allowed; }
        .login-input:-webkit-autofill {
          -webkit-text-fill-color: var(--text-primary);
          -webkit-box-shadow: 0 0 0 1000px rgba(12, 18, 32, 1) inset;
          caret-color: var(--text-primary);
        }
        .provider-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 11px 14px;
          background: rgba(17, 24, 39, 0.55);
          border: 1px solid var(--border);
          border-radius: 10px;
          color: var(--text-primary);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: border-color 0.15s ease, background 0.15s ease, transform 0.15s ease;
          text-align: left;
        }
        .provider-btn:hover:not(:disabled) {
          border-color: var(--border-bright);
          background: rgba(17, 24, 39, 0.85);
        }
        .provider-btn:active:not(:disabled) { transform: translateY(1px); }
        .provider-btn:disabled { opacity: 0.55; cursor: not-allowed; }
        .provider-btn .icon-wrap {
          width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .provider-row {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
        }
        .provider-row .provider-btn {
          padding: 11px 8px;
          font-size: 0.85rem;
          gap: 8px;
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

        @media (max-width: 960px) {
          .login-layout {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
            padding: 40px 20px !important;
          }
          .login-aside { padding-right: 0 !important; }
          .login-shell { justify-self: stretch !important; max-width: 100% !important; }
        }
        @media (max-width: 560px) {
          .provider-row {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  )
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
      <span
        aria-hidden
        style={{
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          background: 'rgba(0, 200, 240, 0.12)',
          border: '1px solid rgba(0, 200, 240, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: '1px',
        }}
      >
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
          <path
            d="M2.5 6l2.5 2.5L9.5 3.5"
            stroke="var(--accent)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.55 }}>
        {children}
      </span>
    </div>
  )
}

function Field({
  label,
  htmlFor,
  right,
  error,
  children,
}: {
  label: string
  htmlFor: string
  right?: React.ReactNode
  error?: string
  children: React.ReactNode
}) {
  return (
    <div style={{ display: 'grid', gap: '6px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
        }}
      >
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
        {right}
      </div>
      {children}
      {error && (
        <p
          id={`${htmlFor}-error`}
          role="alert"
          style={{
            margin: 0,
            color: '#fda4af',
            fontSize: '0.75rem',
            fontWeight: 500,
          }}
        >
          {error}
        </p>
      )}
    </div>
  )
}

function ProviderButton({
  provider,
  label,
  compact,
  pending,
  disabled,
  onClick,
}: {
  provider: Provider
  label: string
  compact?: boolean
  pending?: boolean
  disabled?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      className="provider-btn"
      onClick={onClick}
      disabled={disabled}
      aria-busy={pending}
    >
      <span className="icon-wrap">{pending ? <Spinner /> : providerIcon(provider)}</span>
      <span>{compact ? label : label}</span>
    </button>
  )
}

function providerIcon(provider: Provider) {
  if (provider === 'google') {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
        <path
          fill="#EA4335"
          d="M9 3.48c1.69 0 2.83.73 3.48 1.34l2.54-2.48C13.46 1 11.43 0 9 0 5.48 0 2.44 2.02.96 4.96l2.91 2.26C4.6 5.05 6.62 3.48 9 3.48z"
        />
        <path
          fill="#4285F4"
          d="M17.64 9.2c0-.74-.06-1.28-.19-1.84H9v3.34h4.96c-.1.83-.64 2.08-1.84 2.92l2.84 2.2c1.7-1.57 2.68-3.88 2.68-6.62z"
        />
        <path
          fill="#FBBC05"
          d="M3.88 10.78A5.54 5.54 0 0 1 3.58 9c0-.62.11-1.22.29-1.78L.96 4.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l2.92-2.26z"
        />
        <path
          fill="#34A853"
          d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.84-2.2c-.76.53-1.78.9-3.12.9-2.38 0-4.4-1.57-5.12-3.74L.97 13.04C2.45 15.98 5.48 18 9 18z"
        />
      </svg>
    )
  }
  if (provider === 'apple') {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="#e4ecf7" aria-hidden>
        <path d="M14.62 9.6c-.02-2.06 1.68-3.05 1.76-3.1-.96-1.4-2.46-1.6-2.99-1.62-1.27-.13-2.48.75-3.13.75-.65 0-1.65-.74-2.71-.72-1.4.02-2.69.81-3.4 2.06-1.45 2.51-.37 6.22 1.05 8.26.69.99 1.51 2.1 2.58 2.06 1.04-.04 1.43-.67 2.69-.67 1.25 0 1.6.67 2.7.65 1.11-.02 1.82-1.01 2.5-2 .79-1.15 1.11-2.27 1.13-2.33-.02-.01-2.18-.84-2.2-3.34zM12.55 3.43c.57-.7.95-1.66.85-2.62-.82.04-1.83.55-2.42 1.23-.53.61-.99 1.6-.87 2.54.91.07 1.85-.46 2.44-1.15z" />
      </svg>
    )
  }
  if (provider === 'microsoft') {
    return (
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
        <rect x="0" y="0" width="8.4" height="8.4" fill="#F25022" />
        <rect x="9.6" y="0" width="8.4" height="8.4" fill="#7FBA00" />
        <rect x="0" y="9.6" width="8.4" height="8.4" fill="#00A4EF" />
        <rect x="9.6" y="9.6" width="8.4" height="8.4" fill="#FFB900" />
      </svg>
    )
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 4.5C5 3.67 5.67 3 6.5 3h3.27c.7 0 1.3.48 1.46 1.16l.62 2.5a1.5 1.5 0 0 1-.4 1.43l-1.4 1.4a12.04 12.04 0 0 0 5.46 5.46l1.4-1.4a1.5 1.5 0 0 1 1.43-.4l2.5.62A1.5 1.5 0 0 1 21 14.73V18a3 3 0 0 1-3 3h-1C9.82 21 3 14.18 3 5.5v-1z"
        stroke="var(--accent)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
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
