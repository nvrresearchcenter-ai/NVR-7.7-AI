# NVR 7.7

NVR 7.7 is an AI-powered intelligence and analytics platform for modern infrastructure teams. This repository contains the marketing website and landing pages.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Homepage — hero, features, stats, CTA |
| `/pricing` | Pricing page — $25/month flat plan with feature list |
| `/faq` | FAQ — accordion grouped by category |
| `/terms` | Terms of Service |
| `/privacy` | Privacy Policy |
| `/refund` | Refund Policy |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [TanStack Start](https://tanstack.com/start) |
| Frontend | React 19, TanStack Router v1 |
| Build | Vite 7 |
| Styling | Tailwind CSS 4 + CSS custom properties |
| Fonts | Syne (display), DM Sans (body), DM Mono (code/numbers) |
| Language | TypeScript 5.7 (strict) |
| Deployment | Netlify |

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev
# → http://localhost:3000 (or port 8888 via Netlify CLI)

# Production build
npm run build

# Preview production build
npm run preview
```

### Using Netlify CLI (recommended)

```bash
netlify dev
# → http://localhost:8888
```

## Design System

The site uses a dark theme defined entirely through CSS custom properties in `src/styles.css`:

- **Background**: `#060a12` base, `#0c1220` surface, `#111827` elevated
- **Accent**: `#00c8f0` (electric cyan)
- **Typography**: Syne for headings, DM Sans for body, DM Mono for numbers/code
- **Borders**: `#1a2740` default, `#243552` bright

All colors, fonts, and theme tokens are defined in `:root` and should be referenced via `var(--token-name)` rather than hardcoded values.

## Environment Variables

No environment variables are required to run the site. For deployment, Netlify handles the build automatically via `netlify.toml`.
