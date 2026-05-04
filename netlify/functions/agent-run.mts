import type { Context } from '@netlify/functions'
import OpenAI from 'openai'

const openai = new OpenAI()

const MODEL_NAME = 'NVR 9.9 Ultra Super Agent'

type LogKind = 'info' | 'tool' | 'shell' | 'result' | 'error' | 'plan' | 'agent'

type AIPlan = {
  label: string
  intent: string
  closing: string
  tasks: {
    title: string
    detail: string
    critical?: boolean
    logs?: { kind: LogKind; text: string }[]
  }[]
}

const PLANNER_PROMPT = `You are an autonomous engineering agent. The user gives you a task. You return a structured execution plan in strict JSON.

Rules:
- Output ONLY JSON matching the schema below. No prose, no markdown fences.
- Plan 4–6 ordered tasks. Each task should be a real, actionable step toward the goal.
- For each task, include 2–4 short "logs" lines that narrate what is happening (tool calls, shell snippets, intermediate results).
- "kind" for each log MUST be one of: "info", "tool", "shell", "result", "error", "plan", "agent".
- Mark "critical": true on at most 1–2 high-impact tasks (deploys, prod changes, irreversible writes).
- "label" is a 2–4 word run title.
- "intent" is one sentence stating what you will do.
- "closing" is one sentence stating the outcome and any follow-up suggestion.

Schema:
{
  "label": string,
  "intent": string,
  "closing": string,
  "tasks": [
    {
      "title": string,
      "detail": string,
      "critical": boolean,
      "logs": [{ "kind": "info"|"tool"|"shell"|"result"|"error"|"plan"|"agent", "text": string }]
    }
  ]
}`

function rid() {
  return Math.random().toString(36).slice(2, 10)
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

function fallbackPlan(prompt: string, reason: string): AIPlan {
  return {
    label: 'General task',
    intent: `I'll restate the goal, plan ordered actions, and narrate as I work. (${reason})`,
    closing: 'Done. Want me to dig deeper anywhere?',
    tasks: [
      {
        title: 'Understand the task',
        detail: 'Restate goal and identify constraints.',
        critical: false,
        logs: [
          { kind: 'agent', text: `Restating: "${prompt.slice(0, 96)}${prompt.length > 96 ? '…' : ''}"` },
          { kind: 'result', text: 'goal locked' },
        ],
      },
      {
        title: 'Plan an approach',
        detail: 'Break into ordered actions.',
        critical: false,
        logs: [
          { kind: 'tool', text: 'drafting plan' },
          { kind: 'result', text: '✓ steps queued' },
        ],
      },
      {
        title: 'Execute step-by-step',
        detail: 'Run actions in order, validating each.',
        critical: true,
        logs: [
          { kind: 'tool', text: 'executing actions' },
          { kind: 'result', text: '✓ executed' },
        ],
      },
      {
        title: 'Deliver final result',
        detail: 'Package and surface key takeaways.',
        critical: false,
        logs: [
          { kind: 'agent', text: 'Result is ready.' },
          { kind: 'result', text: '✓ delivered' },
        ],
      },
    ],
  }
}

async function generatePlan(prompt: string): Promise<{ plan: AIPlan; warning?: string }> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: PLANNER_PROMPT },
        { role: 'user', content: prompt },
      ],
    })
    const text = completion.choices[0]?.message?.content || '{}'
    const parsed = JSON.parse(text) as AIPlan
    if (!Array.isArray(parsed?.tasks) || parsed.tasks.length === 0) {
      return { plan: fallbackPlan(prompt, 'AI returned no tasks'), warning: 'AI returned no tasks; using fallback.' }
    }
    return { plan: parsed }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'AI planner failed'
    return { plan: fallbackPlan(prompt, msg), warning: msg }
  }
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

  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: object) => emit(controller, encoder, e)
      const startedAt = Date.now()

      try {
        send({ type: 'meta', model: MODEL_NAME, startedAt, label: 'Planning…', icon: 'sparkle' })
        send({ type: 'agent', text: 'Reading the request and breaking it down…' })

        const { plan, warning } = await generatePlan(prompt)
        if (warning) send({ type: 'log', kind: 'error', text: warning })

        const tasks = plan.tasks.map((t) => ({ ...t, id: rid() }))

        send({ type: 'meta', model: MODEL_NAME, startedAt, label: plan.label, icon: 'sparkle' })
        send({ type: 'agent', text: plan.intent })

        await sleep(250, signal)

        send({
          type: 'plan',
          tasks: tasks.map((t) => ({
            id: t.id,
            title: t.title,
            detail: t.detail,
            critical: !!t.critical,
          })),
        })
        send({
          type: 'log',
          kind: 'plan',
          text: `Plan ready · ${plan.label} · ${tasks.length} tasks`,
        })

        await sleep(300, signal)

        for (let i = 0; i < tasks.length; i++) {
          const t = tasks[i]
          send({ type: 'task_start', id: t.id, index: i })
          send({
            type: 'log',
            kind: 'tool',
            text: `[${i + 1}/${tasks.length}] ${t.title}${t.critical ? ' · critical' : ''}`,
          })

          const taskStart = Date.now()
          const logs = (t.logs || []).slice(0, 6)
          const perLog = logs.length > 0 ? Math.max(180, Math.floor(1400 / logs.length)) : 0
          for (const line of logs) {
            await sleep(perLog, signal)
            send({ type: 'log', kind: line.kind, text: line.text })
          }
          if (logs.length === 0) await sleep(700, signal)
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
            send({
              type: 'log',
              kind: 'error',
              text: `Internal error: ${(err as Error)?.message || 'unknown'}`,
            })
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
  path: '/api/agent',
}
