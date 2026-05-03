import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'

export const Route = createFileRoute('/generate')({
  component: CodeGenerator,
})

type GenerateResponse = {
  code: string
  language: string
  raw: string
  error?: string
}

type Tab = 'code' | 'preview'

const SUGGESTIONS: { label: string; prompt: string; icon: string }[] = [
  { label: 'Login page', prompt: 'Create a polished login page in React with email + password fields, a primary submit button, social sign-in row, and inline validation.', icon: '🔐' },
  { label: 'Pricing card', prompt: 'Create a 3-tier pricing card section in React using Tailwind. Include feature checklists and a highlighted "Most popular" plan.', icon: '💳' },
  { label: 'Animated hero', prompt: 'Create a complete HTML page with an animated hero section using only HTML and CSS — gradient background, big headline, two CTAs, and a subtle floating element.', icon: '✨' },
  { label: 'Todo list', prompt: 'Create a React todo list component with add, complete, and delete actions, persisting to localStorage. Use Tailwind for styling.', icon: '✅' },
]

export default function CodeGenerator() {
  const [prompt, setPrompt] = useState('')
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<Tab>('code')
  const [copied, setCopied] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const canPreview = useMemo(() => isPreviewable(language), [language])

  useEffect(() => {
    if (canPreview && code) setTab((t) => t)
    else if (code) setTab('code')
  }, [canPreview, code])

  async function generate(text: string) {
    const trimmed = text.trim()
    if (!trimmed || loading) return
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setLoading(true)
    setError(null)
    setCode('')
    setLanguage('')

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: trimmed }),
        signal: ctrl.signal,
      })
      const data = (await res.json()) as GenerateResponse
      if (!res.ok || data.error) {
        setError(data.error || `Request failed (${res.status})`)
      } else {
        setCode(data.code)
        setLanguage(data.language || 'text')
        setTab(isPreviewable(data.language) ? 'preview' : 'code')
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') return
      setError(e instanceof Error ? e.message : 'Network error')
    } finally {
      setLoading(false)
    }
  }

  async function copyCode() {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      setError('Could not copy to clipboard')
    }
  }

  return (
    <div style={{ position: 'relative', minHeight: 'calc(100vh - 64px)', background: 'var(--bg-base)' }}>
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: 'var(--gradient-hero)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', maxWidth: '1200px', margin: '0 auto', padding: '64px 24px 96px' }}>
        <Header />

        <Composer
          prompt={prompt}
          setPrompt={setPrompt}
          loading={loading}
          onGenerate={() => generate(prompt)}
          onCancel={() => abortRef.current?.abort()}
        />

        {!code && !loading && !error && (
          <Suggestions
            onPick={(p) => {
              setPrompt(p)
              generate(p)
            }}
          />
        )}

        {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

        {(loading || code) && (
          <Output
            tab={tab}
            setTab={setTab}
            language={language}
            code={code}
            loading={loading}
            canPreview={canPreview}
            copied={copied}
            onCopy={copyCode}
          />
        )}
      </div>

      <style>{styles}</style>
    </div>
  )
}

function Header() {
  return (
    <div style={{ marginBottom: '32px' }}>
      <span className="tag" style={{ marginBottom: '20px' }}>
        <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--accent)', display: 'inline-block' }} />
        Code Generator
      </span>
      <h1
        style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: 'clamp(2rem, 4vw, 3rem)',
          fontWeight: 700,
          margin: '16px 0 12px',
          color: 'var(--text-primary)',
        }}
      >
        Describe it. <span style={{ color: 'var(--accent)' }}>Get the code.</span>
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '640px', lineHeight: 1.5 }}>
        Type what you want — a login page, a pricing card, an animated hero. NVR returns a complete, copy-ready snippet
        with a live preview.
      </p>
    </div>
  )
}

function Composer({
  prompt,
  setPrompt,
  loading,
  onGenerate,
  onCancel,
}: {
  prompt: string
  setPrompt: (s: string) => void
  loading: boolean
  onGenerate: () => void
  onCancel: () => void
}) {
  return (
    <div
      className="card"
      style={{
        padding: '20px',
        borderRadius: '16px',
        background: 'var(--bg-surface)',
      }}
    >
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault()
            onGenerate()
          }
        }}
        placeholder='e.g. "Create a login page in React" or "An HTML hero with a gradient background"'
        rows={3}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          resize: 'vertical',
          color: 'var(--text-primary)',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '1rem',
          lineHeight: 1.5,
          padding: '4px',
          minHeight: '72px',
        }}
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginTop: '8px',
          paddingTop: '12px',
          borderTop: '1px solid var(--border)',
        }}
      >
        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'DM Mono, monospace' }}>
          ⌘ + ↵ to generate
        </span>
        {loading ? (
          <button onClick={onCancel} className="btn-ghost" style={{ padding: '10px 20px', fontSize: '0.875rem' }}>
            <Spinner /> Cancel
          </button>
        ) : (
          <button
            onClick={onGenerate}
            disabled={!prompt.trim()}
            className="btn-primary"
            style={{
              padding: '10px 22px',
              fontSize: '0.875rem',
              opacity: prompt.trim() ? 1 : 0.5,
              cursor: prompt.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            Generate code
            <span aria-hidden style={{ marginLeft: '6px' }}>→</span>
          </button>
        )}
      </div>
    </div>
  )
}

function Suggestions({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div style={{ marginTop: '24px' }}>
      <div
        style={{
          color: 'var(--text-muted)',
          fontSize: '0.75rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: '12px',
          fontFamily: 'DM Mono, monospace',
        }}
      >
        Try one of these
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        {SUGGESTIONS.map((s) => (
          <button
            key={s.label}
            onClick={() => onPick(s.prompt)}
            className="suggestion-chip"
            style={{
              textAlign: 'left',
              padding: '14px 16px',
              borderRadius: '12px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              transition: 'border-color 0.15s, transform 0.15s',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            <div style={{ fontSize: '1.25rem', marginBottom: '6px' }}>{s.icon}</div>
            <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '4px' }}>{s.label}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', lineHeight: 1.4 }}>
              {s.prompt.length > 80 ? s.prompt.slice(0, 80) + '…' : s.prompt}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div
      role="alert"
      style={{
        marginTop: '20px',
        padding: '14px 16px',
        borderRadius: '12px',
        border: '1px solid #5b1f24',
        background: 'rgba(91, 31, 36, 0.25)',
        color: '#ffb4b4',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        fontSize: '0.875rem',
      }}
    >
      <span>
        <strong style={{ marginRight: '6px' }}>Error:</strong>
        {message}
      </span>
      <button
        onClick={onDismiss}
        style={{
          background: 'transparent',
          border: '1px solid #5b1f24',
          color: '#ffb4b4',
          borderRadius: '6px',
          padding: '4px 10px',
          fontSize: '0.75rem',
          cursor: 'pointer',
        }}
      >
        Dismiss
      </button>
    </div>
  )
}

function Output({
  tab,
  setTab,
  language,
  code,
  loading,
  canPreview,
  copied,
  onCopy,
}: {
  tab: Tab
  setTab: (t: Tab) => void
  language: string
  code: string
  loading: boolean
  canPreview: boolean
  copied: boolean
  onCopy: () => void
}) {
  return (
    <div
      className="card"
      style={{
        marginTop: '24px',
        padding: 0,
        borderRadius: '16px',
        overflow: 'hidden',
        background: 'var(--bg-surface)',
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 12px 10px 16px',
          borderBottom: '1px solid var(--border)',
          background: 'rgba(0,0,0,0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            <TabButton active={tab === 'code'} onClick={() => setTab('code')}>
              Code
            </TabButton>
            <TabButton active={tab === 'preview'} onClick={() => setTab('preview')} disabled={!canPreview && !loading}>
              Preview
              {!canPreview && !loading && code && (
                <span style={{ marginLeft: 6, color: 'var(--text-muted)', fontSize: '0.7rem' }}>n/a</span>
              )}
            </TabButton>
          </div>
          {language && (
            <span
              className="mono"
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                padding: '3px 8px',
                borderRadius: '999px',
                border: '1px solid var(--border)',
                textTransform: 'lowercase',
              }}
            >
              {language}
            </span>
          )}
        </div>
        <button
          onClick={onCopy}
          disabled={!code || loading}
          className="copy-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 12px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            background: copied ? 'rgba(0, 200, 240, 0.12)' : 'transparent',
            color: copied ? 'var(--accent)' : 'var(--text-secondary)',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '0.8125rem',
            cursor: code && !loading ? 'pointer' : 'not-allowed',
            opacity: code && !loading ? 1 : 0.5,
            transition: 'background 0.15s, color 0.15s, border-color 0.15s',
          }}
          aria-live="polite"
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {/* Body */}
      <div style={{ minHeight: '420px', position: 'relative' }}>
        {loading && <LoadingShimmer />}
        {!loading && tab === 'code' && <CodeView code={code} language={language} />}
        {!loading && tab === 'preview' && canPreview && <PreviewView code={code} language={language} />}
        {!loading && tab === 'preview' && !canPreview && code && (
          <div style={{ padding: '40px 24px', color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.9375rem' }}>
            Live preview is available for HTML, CSS, and React (JSX/TSX) snippets.
            <br />
            <span style={{ color: 'var(--text-secondary)' }}>This snippet ({language || 'text'}) is shown in the Code tab.</span>
          </div>
        )}
      </div>
    </div>
  )
}

function TabButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '6px 14px',
        borderRadius: '6px',
        border: 'none',
        background: active ? 'rgba(0, 200, 240, 0.1)' : 'transparent',
        color: active ? 'var(--accent)' : disabled ? 'var(--text-muted)' : 'var(--text-secondary)',
        fontFamily: 'DM Sans, sans-serif',
        fontSize: '0.8125rem',
        fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 0.15s, color 0.15s',
      }}
    >
      {children}
    </button>
  )
}

function CodeView({ code, language }: { code: string; language: string }) {
  return (
    <pre
      className="mono"
      style={{
        margin: 0,
        padding: '20px 24px',
        fontSize: '0.8125rem',
        lineHeight: 1.6,
        color: 'var(--text-primary)',
        overflow: 'auto',
        maxHeight: '70vh',
        background: 'transparent',
      }}
    >
      <code data-lang={language}>{code || '// Empty result'}</code>
    </pre>
  )
}

function PreviewView({ code, language }: { code: string; language: string }) {
  const srcDoc = useMemo(() => buildPreviewDocument(code, language), [code, language])
  return (
    <iframe
      title="Generated preview"
      sandbox="allow-scripts"
      srcDoc={srcDoc}
      style={{
        width: '100%',
        height: '70vh',
        minHeight: '420px',
        border: 'none',
        background: '#fff',
      }}
    />
  )
}

function LoadingShimmer() {
  return (
    <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
        <Spinner />
        <span className="mono">Generating…</span>
      </div>
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="shimmer-line"
          style={{
            height: '12px',
            borderRadius: '4px',
            width: `${40 + Math.random() * 55}%`,
            marginLeft: i % 5 === 0 ? 0 : i % 3 === 0 ? '20px' : '40px',
          }}
        />
      ))}
    </div>
  )
}

function Spinner() {
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-block',
        width: '12px',
        height: '12px',
        borderRadius: '999px',
        border: '2px solid currentColor',
        borderTopColor: 'transparent',
        marginRight: '6px',
        animation: 'codegen-spin 0.8s linear infinite',
      }}
    />
  )
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function isPreviewable(language: string): boolean {
  const lang = (language || '').toLowerCase()
  return ['html', 'css', 'jsx', 'tsx', 'js', 'javascript', 'typescript'].includes(lang)
}

function buildPreviewDocument(code: string, language: string): string {
  const lang = (language || '').toLowerCase()
  const safe = (s: string) => s.replace(/<\/script>/gi, '<\\/script>')

  if (lang === 'html') {
    if (/<!doctype html>/i.test(code) || /<html[\s>]/i.test(code)) return code
    return `<!doctype html><html><head><meta charset="utf-8"><script src="https://cdn.tailwindcss.com"></script></head><body>${code}</body></html>`
  }

  if (lang === 'css') {
    return `<!doctype html><html><head><meta charset="utf-8"><style>${code}</style></head><body><div class="preview-root"><h1>Preview</h1><p>This is sample content styled by your generated CSS.</p><button>Button</button></div></body></html>`
  }

  // JSX / TSX / JS — render with React + Babel standalone in the iframe
  const isReactish = ['jsx', 'tsx'].includes(lang) || /(^|\s)(import\s+React|from\s+['"]react['"]|export\s+default\s+function)/.test(code)

  if (isReactish) {
    return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<script src="https://cdn.tailwindcss.com"></script>
<script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<style>html,body,#root{margin:0;min-height:100%;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,sans-serif}.codegen-error{padding:16px;background:#fff5f5;color:#9b1c1c;font-family:ui-monospace,Menlo,monospace;white-space:pre-wrap;border-bottom:1px solid #fecaca}</style>
</head>
<body>
<div id="root"></div>
<script type="text/babel" data-presets="env,react,typescript">
try {
  ${stripImportsAndExports(safe(code))}
  const __Comp = (typeof __default !== 'undefined' && __default) || (typeof App !== 'undefined' && App) || (function(){
    // pick the last top-level function/const that returns JSX
    return null;
  })();
  if (!__Comp) {
    throw new Error('No default export or named "App" component found. Wrap your code in: export default function App() { ... }');
  }
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(React.createElement(__Comp));
} catch (e) {
  const err = document.createElement('div');
  err.className = 'codegen-error';
  err.textContent = 'Preview error: ' + (e && e.message ? e.message : String(e));
  document.body.prepend(err);
}
</script>
</body>
</html>`
  }

  // plain JS
  return `<!doctype html><html><head><meta charset="utf-8"></head><body><pre id="out" style="font-family:ui-monospace,Menlo,monospace;padding:16px;white-space:pre-wrap"></pre><script>
(function(){
  const out = document.getElementById('out');
  const log = (...a) => { out.textContent += a.map(x => typeof x === 'string' ? x : JSON.stringify(x, null, 2)).join(' ') + '\\n'; };
  const console = { log, error: log, warn: log, info: log };
  try { ${safe(code)} } catch(e){ log('Error:', e && e.message ? e.message : String(e)); }
})();
</script></body></html>`
}

function stripImportsAndExports(code: string): string {
  // Babel standalone in-browser does not resolve module imports. Strip imports and
  // turn `export default` into a `__default` binding so we can render it.
  let out = code
    .replace(/^\s*import[^;]*?from\s*['"][^'"]+['"];?\s*$/gm, '')
    .replace(/^\s*import\s*['"][^'"]+['"];?\s*$/gm, '')
  out = out.replace(/export\s+default\s+function\s+([A-Za-z0-9_]+)/g, 'function $1')
  out = out.replace(/export\s+default\s+/g, 'var __default = ')
  out = out.replace(/^\s*export\s+(const|let|var|function|class)\s+/gm, '$1 ')
  // If we replaced the function form, also expose the name as __default
  const nameMatch = code.match(/export\s+default\s+function\s+([A-Za-z0-9_]+)/)
  if (nameMatch) out += `\nvar __default = ${nameMatch[1]};`
  return out
}

const styles = `
@keyframes codegen-spin { to { transform: rotate(360deg); } }
@keyframes codegen-shimmer {
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
}
.shimmer-line {
  background: linear-gradient(90deg, var(--bg-elevated) 0%, var(--border-bright) 50%, var(--bg-elevated) 100%);
  background-size: 200px 100%;
  animation: codegen-shimmer 1.4s linear infinite;
}
.suggestion-chip:hover {
  border-color: var(--border-bright) !important;
  transform: translateY(-1px);
}
.copy-btn:hover:not(:disabled) {
  border-color: var(--border-bright) !important;
  color: var(--text-primary) !important;
}
@media (max-width: 720px) {
  .suggestion-chip { font-size: 0.875rem; }
}
`
