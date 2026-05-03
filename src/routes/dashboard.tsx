import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useRef, useState, useEffect } from 'react'

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
})

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

type Chat = {
  id: string
  title: string
  model: ModelId
  messages: Message[]
  updatedAt: number
}

type ModelId = 'nvr-7-7' | 'nvr-7-8' | 'nvr-9-9'

const MODELS: { id: ModelId; label: string; tagline: string; badge?: string }[] = [
  { id: 'nvr-7-7', label: 'NVR 7.7', tagline: 'Stable · General intelligence' },
  { id: 'nvr-7-8', label: 'NVR 7.8', tagline: 'Faster reasoning · Beta', badge: 'Beta' },
  { id: 'nvr-9-9', label: 'NVR 9.9', tagline: 'Frontier · Limited preview', badge: 'New' },
]

const SEED_CHATS: Chat[] = [
  {
    id: 'c-1',
    title: 'Quarterly anomaly report',
    model: 'nvr-7-7',
    updatedAt: Date.now() - 1000 * 60 * 22,
    messages: [
      { id: 'm-1', role: 'user', content: 'Summarize the Q1 anomaly spikes from the ingest pipeline.', timestamp: Date.now() - 1000 * 60 * 30 },
      { id: 'm-2', role: 'assistant', content: 'Three anomaly clusters appeared in Q1. The largest correlated with the Feb 14 region-2 outage and accounted for 64% of total signal noise.', timestamp: Date.now() - 1000 * 60 * 29 },
    ],
  },
  {
    id: 'c-2',
    title: 'Edge function cold-start tuning',
    model: 'nvr-7-8',
    updatedAt: Date.now() - 1000 * 60 * 60 * 6,
    messages: [
      { id: 'm-3', role: 'user', content: 'How do I cut p95 cold start on edge handlers?', timestamp: Date.now() - 1000 * 60 * 60 * 6 },
      { id: 'm-4', role: 'assistant', content: 'Trim deps, defer non-critical imports, and pin a warm route. Typical p95 drops 40–60%.', timestamp: Date.now() - 1000 * 60 * 60 * 6 },
    ],
  },
  {
    id: 'c-3',
    title: 'Onboarding email rewrite',
    model: 'nvr-7-7',
    updatedAt: Date.now() - 1000 * 60 * 60 * 26,
    messages: [
      { id: 'm-5', role: 'user', content: 'Rewrite the day-1 onboarding email in a warmer tone.', timestamp: Date.now() - 1000 * 60 * 60 * 26 },
      { id: 'm-6', role: 'assistant', content: 'Drafted three variants. Variant B leads with a single specific win the user can hit in 2 minutes.', timestamp: Date.now() - 1000 * 60 * 60 * 26 },
    ],
  },
  {
    id: 'c-4',
    title: 'Vector index tradeoffs',
    model: 'nvr-9-9',
    updatedAt: Date.now() - 1000 * 60 * 60 * 50,
    messages: [
      { id: 'm-7', role: 'user', content: 'HNSW vs IVF for 80M embeddings, mostly read?', timestamp: Date.now() - 1000 * 60 * 60 * 50 },
      { id: 'm-8', role: 'assistant', content: 'HNSW wins on recall/latency at this scale; IVF only beats it if you need cheap reindexing.', timestamp: Date.now() - 1000 * 60 * 60 * 50 },
    ],
  },
  {
    id: 'c-5',
    title: 'Pricing page copy review',
    model: 'nvr-7-7',
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
    messages: [
      { id: 'm-9', role: 'user', content: 'Tighten the pricing headline.', timestamp: Date.now() - 1000 * 60 * 60 * 24 * 5 },
      { id: 'm-10', role: 'assistant', content: '"One plan. Full power." carries the most weight — keep it.', timestamp: Date.now() - 1000 * 60 * 60 * 24 * 5 },
    ],
  },
]

function Dashboard() {
  const [chats, setChats] = useState<Chat[]>(SEED_CHATS)
  const [activeId, setActiveId] = useState<string>(SEED_CHATS[0].id)
  const [input, setInput] = useState('')
  const [modelMenuOpen, setModelMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const modelMenuRef = useRef<HTMLDivElement | null>(null)
  const profileMenuRef = useRef<HTMLDivElement | null>(null)

  const active = chats.find((c) => c.id === activeId) ?? chats[0]
  const activeModel = MODELS.find((m) => m.id === active.model) ?? MODELS[0]

  const grouped = useMemo(() => groupChats(chats), [chats])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [activeId, active.messages.length])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (modelMenuRef.current && !modelMenuRef.current.contains(e.target as Node)) setModelMenuOpen(false)
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) setProfileMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  function newChat() {
    const id = `c-${Date.now()}`
    const chat: Chat = {
      id,
      title: 'New chat',
      model: active.model,
      messages: [],
      updatedAt: Date.now(),
    }
    setChats((prev) => [chat, ...prev])
    setActiveId(id)
    setSidebarOpen(false)
  }

  function selectChat(id: string) {
    setActiveId(id)
    setSidebarOpen(false)
  }

  function changeModel(id: ModelId) {
    setChats((prev) => prev.map((c) => (c.id === activeId ? { ...c, model: id } : c)))
    setModelMenuOpen(false)
  }

  function sendMessage() {
    const text = input.trim()
    if (!text) return
    const userMsg: Message = { id: `m-${Date.now()}`, role: 'user', content: text, timestamp: Date.now() }
    const assistantMsg: Message = {
      id: `m-${Date.now() + 1}`,
      role: 'assistant',
      content: simulatedReply(text, activeModel.label),
      timestamp: Date.now() + 1,
    }
    setChats((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? {
              ...c,
              title: c.messages.length === 0 ? truncate(text, 38) : c.title,
              messages: [...c.messages, userMsg, assistantMsg],
              updatedAt: Date.now(),
            }
          : c,
      ),
    )
    setInput('')
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '280px 1fr',
        height: 'calc(100vh - 64px)',
        background: 'var(--bg-base)',
        position: 'relative',
      }}
      className="dashboard-grid"
    >
      {/* Sidebar */}
      <aside
        className={`dashboard-sidebar ${sidebarOpen ? 'open' : ''}`}
        style={{
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        {/* New chat */}
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
          <button
            onClick={newChat}
            className="btn-primary"
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '11px 16px',
              fontSize: '0.8125rem',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M8 3v10M3 8h10" />
            </svg>
            New chat
          </button>
        </div>

        {/* History */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
          <div
            style={{
              padding: '6px 12px 10px',
              fontSize: '0.6875rem',
              fontFamily: 'DM Mono, monospace',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
            }}
          >
            History
          </div>
          {grouped.map(({ label, items }) => (
            <div key={label} style={{ marginBottom: '14px' }}>
              <div
                style={{
                  padding: '4px 12px',
                  fontSize: '0.6875rem',
                  color: 'var(--text-muted)',
                  fontWeight: 500,
                }}
              >
                {label}
              </div>
              {items.map((c) => (
                <ChatRow
                  key={c.id}
                  chat={c}
                  active={c.id === activeId}
                  onClick={() => selectChat(c.id)}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Profile */}
        <div
          ref={profileMenuRef}
          style={{
            borderTop: '1px solid var(--border)',
            padding: '12px',
            position: 'relative',
          }}
        >
          {profileMenuOpen && (
            <div
              style={{
                position: 'absolute',
                bottom: 'calc(100% - 4px)',
                left: '12px',
                right: '12px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-bright)',
                borderRadius: '12px',
                padding: '6px',
                boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
                zIndex: 20,
              }}
            >
              <ProfileMenuItem icon="settings" label="Settings" />
              <ProfileMenuItem icon="key" label="API keys" />
              <ProfileMenuItem icon="card" label="Billing" />
              <div style={{ height: '1px', background: 'var(--border)', margin: '6px 4px' }} />
              <ProfileMenuItem icon="logout" label="Sign out" danger />
            </div>
          )}
          <button
            onClick={() => setProfileMenuOpen((v) => !v)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 10px',
              borderRadius: '10px',
              background: profileMenuOpen ? 'rgba(255,255,255,0.04)' : 'transparent',
              border: '1px solid transparent',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = profileMenuOpen ? 'rgba(255,255,255,0.04)' : 'transparent')}
          >
            <Avatar />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                Avery Chen
              </div>
              <div
                style={{
                  fontSize: '0.6875rem',
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontFamily: 'DM Mono, monospace',
                }}
              >
                avery@nvr.ai · Pro
              </div>
            </div>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-muted)' }}>
              <path d="M4 6l4 4 4-4" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
        {/* Top bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 24px',
            borderBottom: '1px solid var(--border)',
            background: 'rgba(6,10,18,0.6)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="sidebar-toggle"
              aria-label="Toggle sidebar"
              style={{
                display: 'none',
                background: 'transparent',
                border: '1px solid var(--border-bright)',
                color: 'var(--text-primary)',
                padding: '6px',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 4h12M2 8h12M2 12h12" />
              </svg>
            </button>
            <h2
              style={{
                fontSize: '0.9375rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                margin: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontFamily: 'DM Sans, sans-serif',
                letterSpacing: 0,
              }}
            >
              {active.title}
            </h2>
          </div>

          {/* Model switcher */}
          <div ref={modelMenuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setModelMenuOpen((v) => !v)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 14px',
                borderRadius: '10px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-bright)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '0.8125rem',
                fontWeight: 600,
                fontFamily: 'DM Sans, sans-serif',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  boxShadow: '0 0 8px var(--accent)',
                }}
              />
              {activeModel.label}
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-muted)' }}>
                <path d="M4 6l4 4 4-4" />
              </svg>
            </button>
            {modelMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: '280px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-bright)',
                  borderRadius: '12px',
                  padding: '6px',
                  boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
                  zIndex: 20,
                }}
              >
                {MODELS.map((m) => {
                  const selected = m.id === active.model
                  return (
                    <button
                      key={m.id}
                      onClick={() => changeModel(m.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: selected ? 'rgba(0,200,240,0.08)' : 'transparent',
                        border: '1px solid transparent',
                        color: 'var(--text-primary)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        if (!selected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                      }}
                      onMouseLeave={(e) => {
                        if (!selected) e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <span
                        style={{
                          marginTop: '5px',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: selected ? 'var(--accent)' : 'var(--text-muted)',
                          boxShadow: selected ? '0 0 8px var(--accent)' : 'none',
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{m.label}</span>
                          {m.badge && (
                            <span
                              style={{
                                fontSize: '0.625rem',
                                fontFamily: 'DM Mono, monospace',
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase',
                                color: 'var(--accent)',
                                background: 'rgba(0,200,240,0.1)',
                                border: '1px solid rgba(0,200,240,0.25)',
                                padding: '1px 6px',
                                borderRadius: '4px',
                              }}
                            >
                              {m.badge}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {m.tagline}
                        </div>
                      </div>
                      {selected && (
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--accent)" strokeWidth="2.5" style={{ marginTop: '4px' }}>
                          <path d="M3 8l3 3 7-7" />
                        </svg>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '32px 24px',
            position: 'relative',
          }}
        >
          <div style={{ maxWidth: '760px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {active.messages.length === 0 ? (
              <EmptyState modelLabel={activeModel.label} />
            ) : (
              active.messages.map((m) => <MessageBubble key={m.id} message={m} />)
            )}
          </div>
        </div>

        {/* Composer */}
        <div style={{ padding: '16px 24px 24px', borderTop: '1px solid var(--border)', background: 'var(--bg-base)' }}>
          <div style={{ maxWidth: '760px', margin: '0 auto' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: '8px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-bright)',
                borderRadius: '14px',
                padding: '10px 10px 10px 16px',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border-bright)')}
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                placeholder={`Message ${activeModel.label}…`}
                rows={1}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '0.9375rem',
                  fontFamily: 'DM Sans, sans-serif',
                  lineHeight: 1.5,
                  padding: '8px 0',
                  maxHeight: '200px',
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim()}
                aria-label="Send"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  border: 'none',
                  background: input.trim() ? 'var(--accent)' : 'var(--bg-elevated)',
                  color: input.trim() ? 'var(--bg-base)' : 'var(--text-muted)',
                  cursor: input.trim() ? 'pointer' : 'not-allowed',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'background 0.15s',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M8 13V3M3 8l5-5 5 5" />
                </svg>
              </button>
            </div>
            <div
              style={{
                marginTop: '8px',
                fontSize: '0.6875rem',
                color: 'var(--text-muted)',
                textAlign: 'center',
                fontFamily: 'DM Mono, monospace',
                letterSpacing: '0.04em',
              }}
            >
              {activeModel.label} can make mistakes. Verify outputs before action.
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @media (max-width: 880px) {
          .dashboard-grid { grid-template-columns: 1fr !important; }
          .dashboard-sidebar {
            position: fixed !important;
            top: 64px;
            bottom: 0;
            left: 0;
            width: 280px;
            transform: translateX(-100%);
            transition: transform 0.2s ease;
            z-index: 30;
          }
          .dashboard-sidebar.open { transform: translateX(0); }
          .sidebar-toggle { display: inline-flex !important; }
        }
      `}</style>
    </div>
  )
}

function ChatRow({ chat, active, onClick }: { chat: Chat; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        width: '100%',
        padding: '8px 12px',
        borderRadius: '8px',
        background: active ? 'rgba(0,200,240,0.08)' : 'transparent',
        border: '1px solid ' + (active ? 'rgba(0,200,240,0.25)' : 'transparent'),
        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'background 0.15s, color 0.15s',
        fontSize: '0.8125rem',
        fontFamily: 'DM Sans, sans-serif',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
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
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" style={{ flexShrink: 0, opacity: 0.7 }}>
        <path d="M3 4h10v7H6l-3 2V4z" />
      </svg>
      <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {chat.title}
      </span>
    </button>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  return (
    <div style={{ display: 'flex', gap: '12px', flexDirection: isUser ? 'row-reverse' : 'row' }}>
      <div
        style={{
          width: '32px',
          height: '32px',
          flexShrink: 0,
          borderRadius: '8px',
          background: isUser ? 'var(--bg-elevated)' : 'var(--accent)',
          border: '1px solid ' + (isUser ? 'var(--border-bright)' : 'transparent'),
          color: isUser ? 'var(--text-secondary)' : 'var(--bg-base)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Syne, sans-serif',
          fontWeight: 700,
          fontSize: '0.75rem',
          letterSpacing: '-0.02em',
        }}
      >
        {isUser ? 'AC' : (
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
            <rect x="2" y="2" width="6" height="6" rx="1.5" fill="#060a12" />
            <rect x="10" y="2" width="6" height="6" rx="1.5" fill="#060a12" opacity="0.6" />
            <rect x="2" y="10" width="6" height="6" rx="1.5" fill="#060a12" opacity="0.6" />
            <rect x="10" y="10" width="6" height="6" rx="1.5" fill="#060a12" opacity="0.3" />
          </svg>
        )}
      </div>
      <div
        style={{
          maxWidth: '78%',
          padding: '12px 16px',
          borderRadius: '14px',
          background: isUser ? 'var(--bg-elevated)' : 'var(--bg-surface)',
          border: '1px solid ' + (isUser ? 'var(--border-bright)' : 'var(--border)'),
          color: 'var(--text-primary)',
          fontSize: '0.9375rem',
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {message.content}
      </div>
    </div>
  )
}

function EmptyState({ modelLabel }: { modelLabel: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--text-secondary)' }}>
      <div
        style={{
          width: '56px',
          height: '56px',
          margin: '0 auto 20px',
          borderRadius: '14px',
          background: 'var(--accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 40px rgba(0,200,240,0.3)',
        }}
      >
        <svg width="28" height="28" viewBox="0 0 18 18" fill="none">
          <rect x="2" y="2" width="6" height="6" rx="1.5" fill="#060a12" />
          <rect x="10" y="2" width="6" height="6" rx="1.5" fill="#060a12" opacity="0.6" />
          <rect x="2" y="10" width="6" height="6" rx="1.5" fill="#060a12" opacity="0.6" />
          <rect x="10" y="10" width="6" height="6" rx="1.5" fill="#060a12" opacity="0.3" />
        </svg>
      </div>
      <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: '0 0 8px' }}>
        How can {modelLabel} help today?
      </h3>
      <p style={{ fontSize: '0.9375rem', margin: 0 }}>
        Ask anything — analysis, drafting, code, or research.
      </p>
    </div>
  )
}

function Avatar() {
  return (
    <div
      style={{
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        flexShrink: 0,
        background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--bg-base)',
        fontFamily: 'Syne, sans-serif',
        fontWeight: 700,
        fontSize: '0.75rem',
        letterSpacing: '-0.02em',
      }}
    >
      AC
    </div>
  )
}

function ProfileMenuItem({ icon, label, danger }: { icon: 'settings' | 'key' | 'card' | 'logout'; label: string; danger?: boolean }) {
  const color = danger ? '#ef6b6b' : 'var(--text-primary)'
  return (
    <button
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        width: '100%',
        padding: '8px 10px',
        borderRadius: '8px',
        background: 'transparent',
        border: 'none',
        color,
        cursor: 'pointer',
        fontSize: '0.8125rem',
        fontFamily: 'DM Sans, sans-serif',
        fontWeight: 500,
        textAlign: 'left',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <span style={{ width: '14px', height: '14px', display: 'inline-flex', color: danger ? '#ef6b6b' : 'var(--text-muted)' }}>
        <ProfileIcon name={icon} />
      </span>
      {label}
    </button>
  )
}

function ProfileIcon({ name }: { name: 'settings' | 'key' | 'card' | 'logout' }) {
  const common = { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75 } as const
  switch (name) {
    case 'settings':
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="2" />
          <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.5 1.5M11.5 11.5L13 13M3 13l1.5-1.5M11.5 4.5L13 3" />
        </svg>
      )
    case 'key':
      return (
        <svg {...common}>
          <circle cx="5" cy="11" r="2.5" />
          <path d="M7 9l6-6M11 5l2 2" />
        </svg>
      )
    case 'card':
      return (
        <svg {...common}>
          <rect x="2" y="4" width="12" height="9" rx="1.5" />
          <path d="M2 7h12" />
        </svg>
      )
    case 'logout':
      return (
        <svg {...common}>
          <path d="M9 3H4a1 1 0 00-1 1v8a1 1 0 001 1h5M11 5l3 3-3 3M7 8h7" />
        </svg>
      )
  }
}

function groupChats(chats: Chat[]) {
  const now = Date.now()
  const dayMs = 1000 * 60 * 60 * 24
  const buckets: Record<string, Chat[]> = { Today: [], Yesterday: [], 'Previous 7 Days': [], Older: [] }
  const sorted = [...chats].sort((a, b) => b.updatedAt - a.updatedAt)
  for (const c of sorted) {
    const age = now - c.updatedAt
    if (age < dayMs) buckets.Today.push(c)
    else if (age < dayMs * 2) buckets.Yesterday.push(c)
    else if (age < dayMs * 7) buckets['Previous 7 Days'].push(c)
    else buckets.Older.push(c)
  }
  return Object.entries(buckets)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }))
}

function truncate(s: string, n: number) {
  return s.length <= n ? s : s.slice(0, n - 1).trimEnd() + '…'
}

function simulatedReply(prompt: string, modelLabel: string) {
  const seeds = [
    `Routing through ${modelLabel}. Quick take: "${truncate(prompt, 60)}" — happy to dig deeper, share constraints or examples and I'll tighten the answer.`,
    `${modelLabel} here. I can break this into steps, run a comparison, or draft something — which would be most useful?`,
    `Got it. Based on what you've shared, the strongest first move is to clarify scope. What outcome are you optimizing for?`,
  ]
  return seeds[Math.floor(Math.random() * seeds.length)]
}
