import type { Context } from '@netlify/functions'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

const SYSTEM_PROMPT = `You are a senior frontend engineer that returns a single, complete, ready-to-run code snippet for the user's request.

Rules:
- Return EXACTLY ONE fenced code block. No prose before or after.
- The opening fence must include the language identifier (e.g. \`\`\`tsx, \`\`\`jsx, \`\`\`html, \`\`\`css, \`\`\`js, \`\`\`python).
- Default to a self-contained, single-file component when the request implies React/JSX.
- For React components, default to a function component named after the request, use TailwindCSS classes for styling when appropriate, and export it as default.
- For HTML/CSS requests, return a complete <!doctype html> document.
- Do not invent imports from non-existent local paths. Prefer standard library / well-known packages only.
- Keep the code concise but production-quality: readable, accessible (aria-labels, semantic tags), and self-contained.
- Never wrap the answer in extra commentary, headings, or multiple code blocks.`

export default async (req: Request, _context: Context) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }

  let prompt: string
  try {
    const body = await req.json()
    prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : ''
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!prompt) {
    return Response.json({ error: 'Prompt is required' }, { status: 400 })
  }
  if (prompt.length > 4000) {
    return Response.json({ error: 'Prompt too long (max 4000 chars)' }, { status: 400 })
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim()

    const { code, language } = extractCode(text)

    return Response.json({
      code,
      language,
      raw: text,
      usage: message.usage,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Generation failed'
    return Response.json({ error: msg }, { status: 502 })
  }
}

function extractCode(text: string): { code: string; language: string } {
  const fence = text.match(/```([a-zA-Z0-9_+-]*)\n([\s\S]*?)```/)
  if (fence) {
    return {
      language: (fence[1] || 'text').toLowerCase(),
      code: fence[2].trim(),
    }
  }
  return { code: text, language: 'text' }
}

export const config = {
  path: '/api/generate',
}
