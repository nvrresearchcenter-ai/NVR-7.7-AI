import type { Context } from '@netlify/functions'

const MODEL_NAME = 'NVR 9.9 Ultra Super Agent'

type AgentTask = {
  id: string
  title: string
  detail: string
  durationMs: number
  critical?: boolean
  logs: { delayMs: number; kind: LogKind; text: string }[]
}

type LogKind = 'info' | 'tool' | 'shell' | 'result' | 'error' | 'plan' | 'agent'

type Plan = {
  label: string
  icon: string
  intent: string
  closing: string
  tasks: AgentTask[]
}

const PLANS: { match: RegExp; build: (prompt: string) => Plan }[] = [
  {
    match: /(scan|audit|inspect|review|check).*(project|repo|file|code|error)|find errors|lint/i,
    build: (prompt) => ({
      label: 'Scan project',
      icon: 'scan',
      intent: `Scanning the project. I'll index sources, parse ASTs, run lint and type-check, then surface findings.`,
      closing: `Scan complete — 0 critical, 3 minor warnings logged. Want me to auto-fix the warnings?`,
      tasks: [
        task('Connect filesystem', 'Establish secure read access to /workspace.', 1100, false, [
          [120, 'shell', '$ pwd'],
          [240, 'result', '/workspace/repo'],
          [520, 'shell', '$ ls -la'],
          [820, 'result', 'mounted 14 entries · read-only'],
        ]),
        task('Index source files', 'Walk the project tree and collect candidates.', 1900, false, [
          [180, 'tool', 'walking src/...'],
          [560, 'tool', 'walking netlify/functions/...'],
          [980, 'tool', 'walking backend/...'],
          [1400, 'result', '127 files indexed · 18.4k LOC'],
        ]),
        task('Parse AST for each module', 'Build syntax trees to look for structural issues.', 2300, false, [
          [220, 'tool', 'tsx parser online'],
          [620, 'tool', 'parsed 32/127'],
          [1080, 'tool', 'parsed 81/127'],
          [1640, 'tool', 'parsed 127/127'],
          [1940, 'result', '✓ 0 syntax errors detected'],
        ]),
        task('Run lint & type-check', 'tsc --noEmit + eslint .', 2500, false, [
          [180, 'shell', '$ tsc --noEmit'],
          [1180, 'result', 'tsc · 0 errors'],
          [1340, 'shell', '$ eslint .'],
          [2200, 'result', 'eslint · 3 warnings, 0 errors'],
        ]),
        task('Compose findings report', 'Aggregate signals and rank by severity.', 1100, false, [
          [220, 'agent', 'Three minor warnings, all in legacy components.'],
          [780, 'result', 'report.md written'],
        ]),
      ],
    }),
  },
  {
    match: /(fix|patch|repair|debug|resolve).*(bug|error|issue|crash|500|backend|api|server|test)/i,
    build: (prompt) => ({
      label: 'Fix errors',
      icon: 'wrench',
      intent: `On it — I'll reproduce the failure, walk the stack to root cause, apply the smallest safe patch, and verify.`,
      closing: `Patch landed and verified in staging. Tests green. Promote when you're ready.`,
      tasks: [
        task('Reproduce the failure', 'Replay the failing path locally.', 1700, false, [
          [200, 'shell', '$ curl -s localhost:8000/api/checkout -d @sample.json'],
          [1100, 'error', 'HTTP 500 · TypeError: cannot read property "id" of undefined'],
          [1500, 'result', '✓ reproduced'],
        ]),
        task('Read recent logs', 'Pull the last 200 lines around the 5xx.', 1200, false, [
          [180, 'shell', '$ tail -n 200 /var/log/api.log'],
          [820, 'tool', 'matched 17 lines on TypeError'],
          [1080, 'result', 'log slice ready'],
        ]),
        task('Walk the stack to source', 'Identify the originating frame.', 1400, false, [
          [220, 'tool', 'stackframe → routes/checkout.ts:84'],
          [820, 'tool', 'caller → models/order.ts:32'],
          [1180, 'agent', 'Root cause: order lookup before session resolves.'],
        ]),
        task('Apply targeted fix', 'Smallest safe code change.', 2000, true, [
          [260, 'tool', 'editing routes/checkout.ts'],
          [820, 'tool', '+ await ctx.session.ready()'],
          [1300, 'tool', '+ if (!order) return res.status(404).json({...})'],
          [1700, 'result', '✓ patch applied · 1 file, +4 −0'],
        ]),
        task('Add regression test', 'Cover the failing path deterministically.', 1700, false, [
          [220, 'tool', 'creating tests/checkout.regression.test.ts'],
          [1080, 'shell', '$ vitest run tests/checkout.regression.test.ts'],
          [1500, 'result', '✓ 1/1 passed'],
        ]),
        task('Verify in staging', 'Replay the failing request against staging.', 1900, true, [
          [240, 'shell', '$ curl -s staging.api/checkout -d @sample.json'],
          [1320, 'result', 'HTTP 200 · order_018f3 created'],
          [1740, 'agent', 'Looks healthy. Holding for promote-to-prod approval.'],
        ]),
      ],
    }),
  },
  {
    match: /(deploy|ship|release|publish|push to (prod|production))/i,
    build: () => ({
      label: 'Deploy release',
      icon: 'rocket',
      intent: `Release run. I'll review the diff, run tests, build artifacts, then push behind a 10% canary.`,
      closing: `Canary green for 5m at 10%. Promoted to 100%. Watching error rate for the next hour.`,
      tasks: [
        task('Review pending changes', 'Diff main against the release branch.', 1300, false, [
          [200, 'shell', '$ git diff main...release/v2.4 --stat'],
          [1000, 'result', '14 files changed · +312 −178'],
        ]),
        task('Run full test suite', 'Unit + integration + smoke.', 2400, false, [
          [240, 'shell', '$ npm test'],
          [1300, 'tool', 'unit: 184/184 · integration: 41/41'],
          [2000, 'result', '✓ all green in 71.4s'],
        ]),
        task('Build production artifacts', 'Optimized bundle, source maps stripped.', 1900, false, [
          [240, 'shell', '$ vite build'],
          [1280, 'tool', 'dist/ · 412kb gzipped'],
          [1700, 'result', '✓ artifact built'],
        ]),
        task('Tag the release', 'Cut a semver tag and update changelog.', 1100, false, [
          [220, 'shell', '$ git tag v2.4.0'],
          [620, 'shell', '$ git push origin v2.4.0'],
          [880, 'result', 'v2.4.0 tagged'],
        ]),
        task('Push to canary (10%)', 'Roll out behind a 10% traffic split.', 2100, true, [
          [260, 'tool', 'deploying to canary pool'],
          [1240, 'tool', '10% traffic shifted'],
          [1820, 'result', '✓ canary live'],
        ]),
        task('Watch error rate', 'Hold 5m, then promote to 100%.', 2200, true, [
          [400, 'tool', 'p50 latency · 142ms'],
          [1000, 'tool', 'error rate · 0.04% (baseline 0.05%)'],
          [1820, 'tool', 'promoting to 100%'],
          [2080, 'result', '✓ promoted'],
        ]),
      ],
    }),
  },
  {
    match: /(build|create|make|design|generate).*(website|landing|site|page|app|component|ui)/i,
    build: () => ({
      label: 'Build a website',
      icon: 'globe',
      intent: `Got it — scoping the audience, drafting the layout, scaffolding components, shipping a preview.`,
      closing: `Preview deployed. Open the URL above and tell me what to adjust.`,
      tasks: [
        task('Analyze requirements', 'Parse goal, audience, core sections.', 1400, false, [
          [200, 'agent', 'Targeting: clean marketing site, single CTA, mobile-first.'],
          [900, 'result', 'spec compiled'],
        ]),
        task('Draft sitemap & layout', 'Outline pages, hero, nav, footer.', 1600, false, [
          [220, 'tool', 'sitemap · /, /pricing, /faq'],
          [1100, 'result', 'wireframe ready'],
        ]),
        task('Generate components', 'Hero, features, pricing, footer.', 2400, false, [
          [220, 'tool', 'creating components/Hero.tsx'],
          [800, 'tool', 'creating components/Features.tsx'],
          [1320, 'tool', 'creating components/Pricing.tsx'],
          [2000, 'result', '✓ 8 components scaffolded'],
        ]),
        task('Wire up routing', 'File-based routes and active styles.', 1500, false, [
          [240, 'tool', 'router config updated'],
          [1100, 'result', '✓ routes ready'],
        ]),
        task('Run lint & type-check', 'tsc + eslint + a11y.', 1800, false, [
          [220, 'shell', '$ tsc --noEmit && eslint .'],
          [1500, 'result', '✓ clean'],
        ]),
        task('Deploy preview', 'Push to Netlify preview, emit URL.', 2200, true, [
          [240, 'shell', '$ netlify deploy --build'],
          [1240, 'tool', 'uploading 412 files...'],
          [1880, 'result', '✓ https://preview-3a4f.netlify.app'],
        ]),
      ],
    }),
  },
  {
    match: /(run|execute).*(command|terminal|shell|bash|script)|terminal command/i,
    build: () => ({
      label: 'Run terminal command',
      icon: 'terminal',
      intent: `Running the command in a sandboxed shell. I'll capture stdout/stderr and surface the exit code.`,
      closing: `Command finished. Output captured above.`,
      tasks: [
        task('Resolve command', 'Parse target binary and arguments.', 700, false, [
          [180, 'tool', 'resolving binary'],
          [520, 'result', '✓ command resolved'],
        ]),
        task('Acquire sandbox', 'Spin up an isolated shell.', 900, false, [
          [240, 'tool', 'sandbox · ephemeral'],
          [680, 'result', '✓ shell ready'],
        ]),
        task('Execute', 'Run with a 30s timeout.', 2000, true, [
          [200, 'shell', '$ <user command>'],
          [880, 'tool', 'streaming stdout...'],
          [1640, 'result', '✓ exit 0'],
        ]),
        task('Capture & report', 'Write transcript and summarize.', 800, false, [
          [220, 'tool', 'transcript saved'],
          [600, 'result', '✓ ready'],
        ]),
      ],
    }),
  },
]

const FALLBACK = (prompt: string): Plan => ({
  label: 'General task',
  icon: 'sparkle',
  intent: `I'll restate the goal, plan an ordered set of actions, and narrate as I work.`,
  closing: `Done. Want me to dig deeper anywhere?`,
  tasks: [
    task('Understand the task', 'Restate goal; identify constraints.', 1300, false, [
      [200, 'agent', `Restating: "${prompt.slice(0, 96)}${prompt.length > 96 ? '…' : ''}"`],
      [900, 'result', 'goal locked'],
    ]),
    task('Plan an approach', 'Break into 4–6 ordered actions.', 1500, false, [
      [200, 'tool', 'drafting plan'],
      [1100, 'result', '✓ 5 actions queued'],
    ]),
    task('Execute step-by-step', 'Run actions in order, validating each.', 2300, true, [
      [220, 'tool', 'action 1/5'],
      [800, 'tool', 'action 3/5'],
      [1600, 'tool', 'action 5/5'],
      [2040, 'result', '✓ executed'],
    ]),
    task('Self-review the output', 'Check for gaps, errors, clarity.', 1300, false, [
      [220, 'tool', 'reviewing'],
      [900, 'result', '✓ pass'],
    ]),
    task('Deliver final result', 'Package and surface key takeaways.', 1100, false, [
      [220, 'agent', 'Result is ready.'],
      [820, 'result', '✓ delivered'],
    ]),
  ],
})

function task(
  title: string,
  detail: string,
  durationMs: number,
  critical: boolean,
  logs: [number, LogKind, string][],
): AgentTask {
  return {
    id: rid(),
    title,
    detail,
    durationMs,
    critical,
    logs: logs.map(([delayMs, kind, text]) => ({ delayMs, kind, text })),
  }
}

function rid() {
  return Math.random().toString(36).slice(2, 10)
}

function pickPlan(prompt: string): Plan {
  for (const p of PLANS) if (p.match.test(prompt)) return p.build(prompt)
  return FALLBACK(prompt)
}

function emit(controller: ReadableStreamDefaultController, encoder: TextEncoder, evt: object) {
  controller.enqueue(encoder.encode(JSON.stringify(evt) + '\n'))
}

async function sleep(ms: number, signal: AbortSignal) {
  if (ms <= 0) return
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException('aborted', 'AbortError'))
    const t = setTimeout(() => {
      signal.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    const onAbort = () => {
      clearTimeout(t)
      reject(new DOMException('aborted', 'AbortError'))
    }
    signal.addEventListener('abort', onAbort, { once: true })
  })
}

export default async (req: Request, _ctx: Context) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }

  let prompt = ''
  try {
    const body = await req.json()
    if (typeof body?.prompt === 'string') prompt = body.prompt.slice(0, 4000).trim()
  } catch {}
  if (!prompt) {
    return Response.json({ error: 'prompt is required' }, { status: 400 })
  }

  const encoder = new TextEncoder()
  const signal = req.signal

  const plan = pickPlan(prompt)

  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: object) => emit(controller, encoder, e)
      const startedAt = Date.now()

      try {
        send({ type: 'meta', model: MODEL_NAME, startedAt, label: plan.label, icon: plan.icon })
        send({ type: 'agent', text: plan.intent })

        await sleep(450, signal)

        send({
          type: 'plan',
          tasks: plan.tasks.map((t) => ({
            id: t.id,
            title: t.title,
            detail: t.detail,
            critical: !!t.critical,
          })),
        })
        send({
          type: 'log',
          kind: 'plan',
          text: `Plan ready · ${plan.label} · ${plan.tasks.length} tasks`,
        })

        await sleep(350, signal)

        for (let i = 0; i < plan.tasks.length; i++) {
          const t = plan.tasks[i]
          send({ type: 'task_start', id: t.id, index: i })
          send({
            type: 'log',
            kind: 'tool',
            text: `[${i + 1}/${plan.tasks.length}] ${t.title}${t.critical ? ' · critical' : ''}`,
          })

          const taskStart = Date.now()
          for (const line of t.logs) {
            const wait = Math.max(0, line.delayMs - (Date.now() - taskStart))
            await sleep(wait, signal)
            send({ type: 'log', kind: line.kind, text: line.text })
          }
          const remaining = t.durationMs - (Date.now() - taskStart)
          if (remaining > 0) await sleep(remaining, signal)

          send({ type: 'task_done', id: t.id, durationMs: Date.now() - taskStart })
        }

        send({ type: 'agent', text: plan.closing })
        send({ type: 'done', durationMs: Date.now() - startedAt })
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') {
          try {
            send({ type: 'log', kind: 'error', text: 'Run cancelled by user.' })
            send({ type: 'cancelled' })
          } catch {}
        } else {
          try {
            send({ type: 'log', kind: 'error', text: `Internal error: ${(err as Error)?.message || 'unknown'}` })
            send({ type: 'error', message: (err as Error)?.message || 'unknown' })
          } catch {}
        }
      } finally {
        try {
          controller.close()
        } catch {}
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  })
}

export const config = {
  path: '/agent/run',
}
