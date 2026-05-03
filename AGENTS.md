# AGENTS.md

This document provides an overview of the project architecture, conventions, and non-obvious decisions for developers and AI agents working on this codebase.

## Project Overview

NVR 7.7 is a marketing website for an AI-powered intelligence platform. It is a TanStack Start application deployed to Netlify, consisting of a homepage, pricing page, FAQ, and three legal pages.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | TanStack Start |
| Frontend | React 19, TanStack Router v1 |
| Build | Vite 7 |
| Styling | Tailwind CSS 4 + CSS custom properties |
| Fonts | Syne (display), DM Sans (body), DM Mono (code/numbers) |
| Language | TypeScript 5.7 (strict mode) |
| Deployment | Netlify |

## Directory Structure

```
src/
├── components/
│   ├── Nav.tsx         # Sticky header: logo, nav links, Login + Get Started buttons
│   └── Footer.tsx      # Footer with product/legal/account links
├── routes/
│   ├── __root.tsx      # Root layout: renders Nav, noise overlay, imports global styles
│   ├── index.tsx       # Homepage: hero with animated dashboard, features grid, CTA
│   ├── pricing.tsx     # Pricing: $25/month flat plan, feature checklist, mini FAQ
│   ├── faq.tsx         # FAQ: accordion grouped by category
│   ├── terms.tsx       # Terms of Service
│   ├── privacy.tsx     # Privacy Policy
│   └── refund.tsx      # Refund Policy
├── styles.css          # Global CSS: Tailwind import, CSS variables, shared utility classes
└── router.tsx          # TanStack Router setup with scroll restoration
```

## Routing

TanStack Router uses file-based routing. Each file in `src/routes/` maps directly to a URL:

| File | Route |
|------|-------|
| `index.tsx` | `/` |
| `pricing.tsx` | `/pricing` |
| `faq.tsx` | `/faq` |
| `terms.tsx` | `/terms` |
| `privacy.tsx` | `/privacy` |
| `refund.tsx` | `/refund` |

To add a new page, create a new file in `src/routes/` and export a `Route` using `createFileRoute('/your-path')`.

## Design System

The entire visual theme is defined through CSS custom properties in `src/styles.css`. Always use `var(--token-name)` — never hardcode colors.

### Key Tokens

| Token | Value | Purpose |
|-------|-------|---------|
| `--bg-base` | `#060a12` | Page background |
| `--bg-surface` | `#0c1220` | Card/panel backgrounds |
| `--bg-elevated` | `#111827` | Higher-elevation surfaces |
| `--border` | `#1a2740` | Default border |
| `--border-bright` | `#243552` | Hover/active borders |
| `--accent` | `#00c8f0` | Primary brand color (electric cyan) |
| `--text-primary` | `#e4ecf7` | Main text |
| `--text-secondary` | `#8ba3c4` | Supporting text |
| `--text-muted` | `#4a6080` | Labels, metadata |

### Typography

- Headings: Syne (loaded via Google Fonts `@import` in `styles.css`)
- Body: DM Sans
- Code/numbers: DM Mono
- All `h1–h6` get `letter-spacing: -0.02em` and tight `line-height: 1.1` globally

### Shared CSS Classes

| Class | Purpose |
|-------|---------|
| `.btn-primary` | Filled cyan CTA button |
| `.btn-ghost` | Outlined ghost button |
| `.card` | Dark glass card with hover border transition |
| `.tag` | Cyan pill badge (e.g., "Version 7.7") |
| `.legal-content` | Prose styling for legal pages |
| `.grid-pattern` | Subtle grid background overlay |
| `.noise-overlay` | Fixed noise texture (pointer-events: none) |
| `.animate-fade-up` | CSS entrance animation (keyframe in styles.css) |
| `.animate-pulse-glow` | Pulsing box-shadow glow |
| `.animate-float` | Gentle vertical float |
| `.delay-100` through `.delay-500` | `animation-delay` utilities |

## Component Conventions

- Layout and theme values use inline `style` objects (not Tailwind class props) because CSS custom properties (`var(--accent)`) work naturally in inline styles and Tailwind v4 does not generate all utilities without explicit config.
- Shared utility classes defined in `styles.css` (e.g., `card`, `btn-primary`, `tag`) are applied via `className`.
- Responsive breakpoints are handled with `<style>` blocks embedded in components (e.g., `@media (max-width: 768px)`).

## Legal Pages Pattern

`terms.tsx`, `privacy.tsx`, and `refund.tsx` follow the same structure:

1. `LegalHero` — tag + title + "Last updated" date
2. `LegalBody` — wrapper with `className="legal-content"`
3. `<h2>` section headers + `<p>`/`<ul>` body

Each file defines its own local `LegalHero` and `LegalBody` helpers (not shared) to keep files standalone. This is intentional — do not extract to a shared component unless behavior diverges.

## Navigation

`Nav.tsx` renders in the root layout and is present on all pages. It includes:
- Logo → links to `/`
- Desktop nav: Home, Pricing, FAQ
- "Log in" button → `href="/login"` (placeholder — route not implemented)
- "Get Started" CTA → `/pricing`
- Mobile hamburger menu (hidden via CSS media query)

The `/login` route does not exist yet. Add `src/routes/login.tsx` when implementing authentication.

## Non-Obvious Decisions

- **Inline styles over Tailwind for layout**: CSS custom properties don't compose cleanly in Tailwind class strings. Inline styles are used for spacing, colors, and layout throughout.
- **Google Fonts via @import**: Fonts are loaded in `styles.css` via `@import url(...)`. For production, move to `<link rel="preconnect">` + `<link>` in `__root.tsx` for better performance.
- **Legal helpers duplicated per file**: `LegalHero` and `LegalBody` are defined locally in each legal page. This avoids a shared import that would need to be updated whenever any legal page needs a structural change.
- **No Radix UI or Lucide**: The original scaffold included these; they were not used in the redesign. Inline SVGs are used for all icons.
