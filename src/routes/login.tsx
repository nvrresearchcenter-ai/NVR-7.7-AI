import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/login')({
  component: Login,
})

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
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
      {/* Ambient glow */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(0,200,240,0.10) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 50% 100%, rgba(109,40,217,0.08) 0%, transparent 70%)',
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
        className="login-shell animate-fade-up"
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: '440px',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
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
            Secure sign-in
          </div>
          <h1
            style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
              fontWeight: 800,
              color: 'var(--text-primary)',
              marginBottom: '10px',
              margin: '0 0 10px',
            }}
          >
            Welcome back
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9375rem' }}>
            Log in to your NVR 7.7 control center.
          </p>
        </div>

        {/* Card */}
        <div
          className="card"
          style={{
            padding: 'clamp(20px, 4vw, 32px)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          {/* SSO providers */}
          <div style={{ display: 'grid', gap: '10px' }}>
            <ProviderButton provider="google" label="Continue with Google" />
            <ProviderButton provider="apple" label="Continue with Apple" />
            <ProviderButton provider="microsoft" label="Continue with Microsoft" />
            <ProviderButton provider="phone" label="Continue with Phone number" />
          </div>

          {/* Divider */}
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

          {/* Email/password form */}
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px' }}>
            <Field label="Email" htmlFor="login-email">
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="login-input"
              />
            </Field>

            <Field
              label="Password"
              htmlFor="login-password"
              right={
                <a
                  href="#forgot"
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--accent)',
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  Forgot password?
                </a>
              }
            >
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="login-input"
                  style={{ paddingRight: '44px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
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

            <button
              type="submit"
              className="btn-primary"
              style={{ marginTop: '4px', justifyContent: 'center', padding: '13px 16px' }}
            >
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
            </button>
          </form>

          {/* Signup */}
          <p
            style={{
              textAlign: 'center',
              marginTop: '20px',
              marginBottom: 0,
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
            }}
          >
            New to NVR?{' '}
            <Link
              to="/pricing"
              style={{
                color: 'var(--accent)',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              Create an account
            </Link>
          </p>
        </div>

        {/* Legal footer */}
        <p
          style={{
            textAlign: 'center',
            marginTop: '24px',
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
        .login-input:hover { border-color: var(--border-bright); }
        .login-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(0, 200, 240, 0.15);
          background: rgba(6, 10, 18, 0.85);
        }
        .login-input:-webkit-autofill {
          -webkit-text-fill-color: var(--text-primary);
          -webkit-box-shadow: 0 0 0 1000px rgba(12, 18, 32, 1) inset;
          caret-color: var(--text-primary);
        }
        .provider-btn {
          display: flex;
          align-items: center;
          gap: 12px;
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
        .provider-btn:hover {
          border-color: var(--border-bright);
          background: rgba(17, 24, 39, 0.85);
        }
        .provider-btn:active { transform: translateY(1px); }
        .provider-btn .icon-wrap {
          width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        @media (max-width: 480px) {
          .login-shell { max-width: 100% !important; }
        }
      `}</style>
    </main>
  )
}

function Field({
  label,
  htmlFor,
  right,
  children,
}: {
  label: string
  htmlFor: string
  right?: React.ReactNode
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
    </div>
  )
}

function ProviderButton({
  provider,
  label,
}: {
  provider: 'google' | 'apple' | 'microsoft' | 'phone'
  label: string
}) {
  return (
    <button type="button" className="provider-btn">
      <span className="icon-wrap">{providerIcon(provider)}</span>
      <span>{label}</span>
    </button>
  )
}

function providerIcon(provider: 'google' | 'apple' | 'microsoft' | 'phone') {
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
