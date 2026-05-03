import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { Nav } from '../components/Nav'
import '../styles.css'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'NVR 7.7 — AI-Powered Intelligence Platform' },
      { name: 'description', content: 'NVR 7.7 delivers AI support for world analysis, coding, design prompts, network intelligence, and project work.' },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
        <div className="noise-overlay" />
        <Nav />
        {children}
        <Scripts />
      </body>
    </html>
  )
}
