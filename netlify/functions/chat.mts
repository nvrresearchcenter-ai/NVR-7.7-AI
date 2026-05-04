import type { Context } from '@netlify/functions'
import OpenAI from 'openai'

const openai = new OpenAI()

type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string }

const SYSTEM_PROMPT =
  "You are NVR 7.7 — a helpful, concise AI assistant. Answer clearly using markdown when useful. Keep responses focused and friendly."

export default async (req: Request, _context: Context) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }

  let messages: ChatMessage[] = []
  try {
    const body = await req.json()
    if (Array.isArray(body?.messages)) {
      messages = body.messages
        .filter(
          (m: unknown): m is ChatMessage =>
            !!m &&
            typeof m === 'object' &&
            ((m as ChatMessage).role === 'user' || (m as ChatMessage).role === 'assistant') &&
            typeof (m as ChatMessage).content === 'string',
        )
        .map((m) => ({ role: m.role, content: m.content.slice(0, 8000) }))
    } else if (typeof body?.message === 'string') {
      messages = [{ role: 'user', content: body.message }]
    }
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!messages.length || messages[messages.length - 1].role !== 'user') {
    return Response.json({ error: 'A trailing user message is required' }, { status: 400 })
  }

  const encoder = new TextEncoder()

  try {
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      stream: true,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
    })

    return new Response(
      new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              const delta = chunk.choices[0]?.delta?.content
              if (delta) controller.enqueue(encoder.encode(delta))
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
