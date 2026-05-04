import type { Context } from '@netlify/functions'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

type ChatMessage = { role: 'user' | 'assistant'; content: string }

const SYSTEM_PROMPT_CHAT =
  'You are NVR, a helpful, concise AI assistant. Answer clearly using markdown when useful. Keep responses focused and friendly.'

const SYSTEM_PROMPT_AGENT = `You are NVR Agent, an autonomous AI agent that solves tasks by laying out a clear, executable plan before doing anything.

For every user request, respond in this exact structure:

**Goal**
A one-sentence restatement of what the user wants.

**Plan**
A numbered list of 4-7 ordered, concrete steps. Each step starts with a verb (e.g., "Inspect…", "Patch…", "Run…", "Verify…"). Each step is one short line.

**Execution**
For each step in the plan, narrate what an engineer or agent would do:
Step 1 — <title>
- action: <what is being done>
- result: <what comes out of it>

Repeat for every step. Use realistic shell commands, file paths, or tool calls when relevant.

**Result**
A short summary of the final outcome and what to do next.

Use markdown. Be specific, not generic. If the request is conversational rather than a task, still produce a Goal/Plan/Execution/Result framing — short steps are fine.`

export default async (req: Request, _context: Context) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }

  let messages: ChatMessage[] = []
  let agentMode = false
  try {
    const body = await req.json()
    agentMode = body?.agentMode === true
    if (Array.isArray(body?.messages)) {
      messages = body.messages
        .filter(
          (m: unknown): m is ChatMessage =>
            !!m &&
            typeof m === 'object' &&
            (((m as ChatMessage).role === 'user') || ((m as ChatMessage).role === 'assistant')) &&
            typeof (m as ChatMessage).content === 'string',
        )
        .map((m) => ({ role: m.role, content: m.content.slice(0, 8000) }))
    } else if (typeof body?.message === 'string') {
      messages = [{ role: 'user', content: body.message.slice(0, 8000) }]
    }
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!messages.length || messages[messages.length - 1].role !== 'user') {
    return Response.json({ error: 'A trailing user message is required' }, { status: 400 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      {
        error:
          'ANTHROPIC_API_KEY is not configured. Add it in Netlify → Site settings → Environment variables.',
      },
      { status: 500 },
    )
  }

  const encoder = new TextEncoder()
  const system = agentMode ? SYSTEM_PROMPT_AGENT : SYSTEM_PROMPT_CHAT

  try {
    const stream = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: agentMode ? 2048 : 1024,
      system,
      messages,
      stream: true,
    })

    return new Response(
      new ReadableStream({
        async start(controller) {
          try {
            for await (const event of stream) {
              if (
                event.type === 'content_block_delta' &&
                event.delta.type === 'text_delta' &&
                event.delta.text
              ) {
                controller.enqueue(encoder.encode(event.delta.text))
              }
            }
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Stream error'
            controller.enqueue(encoder.encode(`\n\n[error: ${msg}]`))
          } finally {
            controller.close()
          }
        },
      }),
      {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          'X-Accel-Buffering': 'no',
        },
      },
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Chat failed'
    const status = /401|unauthorized/i.test(msg) ? 401 : /429|rate/i.test(msg) ? 429 : 502
    return Response.json({ error: msg }, { status })
  }
}

export const config = {
  path: '/api/chat',
}
