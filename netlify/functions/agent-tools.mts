import type { Context } from '@netlify/functions'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

type Tool = 'scan' | 'fix' | 'suggest'

const SYSTEM_PROMPTS: Record<Tool, string> = {
  scan: `You are NVR Project Scanner, an AI code auditor. You receive a list of project files (filename + contents). Audit them for: bugs, security issues, type errors, dead code, missing error handling, performance problems, and style inconsistencies.

Respond ONLY with valid JSON (no markdown, no commentary outside the JSON) matching:
{
  "summary": "<one sentence headline>",
  "stats": { "files": <int>, "issues": <int>, "critical": <int>, "warnings": <int>, "info": <int> },
  "findings": [
    {
      "id": "<short kebab-case id>",
      "severity": "critical" | "warning" | "info",
      "file": "<path>",
      "line": <int or null>,
      "title": "<short title>",
      "description": "<one or two sentences>",
      "suggestion": "<concrete fix in one sentence>"
    }
  ]
}

Be specific. Cite real lines. If a file looks fine, do not invent issues for it. Limit to the most important 8 findings.`,
  fix: `You are NVR Code Fix Agent. The user gives you a snippet of broken code and (optionally) the error message they saw. Diagnose the root cause and produce a corrected version.

Respond ONLY with valid JSON (no markdown, no commentary outside the JSON) matching:
{
  "diagnosis": "<one paragraph explaining the root cause>",
  "language": "<best guess: typescript, javascript, python, go, rust, etc.>",
  "fixed_code": "<the full corrected code, ready to paste>",
  "changes": ["<short bullet describing change 1>", "<short bullet describing change 2>"],
  "verification": "<one sentence: how to verify the fix works>"
}

Make the smallest correct change. Preserve the user's style. Do not invent imports they didn't have unless required.`,
  suggest: `You are NVR Terminal Command Advisor. The user describes a goal in plain English. You suggest the safest, most idiomatic terminal command(s) to accomplish it.

Respond ONLY with valid JSON (no markdown, no commentary outside the JSON) matching:
{
  "intent": "<one-line restatement of the user's goal>",
  "commands": [
    {
      "command": "<the actual command to run>",
      "shell": "bash" | "zsh" | "powershell" | "fish",
      "explanation": "<one sentence on what it does>",
      "danger": "safe" | "caution" | "destructive",
      "notes": "<optional caveat or null>"
    }
  ],
  "alternatives": ["<optional alternative one-liner>", "..."]
}

Order commands from simplest/safest to most powerful. Mark anything that touches the network, deletes files, or needs sudo with at least "caution". Mark rm -rf, force-pushes, drops, or anything irreversible as "destructive".`,
}

const MAX_TOKENS: Record<Tool, number> = {
  scan: 3000,
  fix: 2400,
  suggest: 1400,
}

function userPrompt(tool: Tool, payload: any): string {
  if (tool === 'scan') {
    const files: { path: string; content: string }[] = Array.isArray(payload?.files)
      ? payload.files
      : []
    const trimmed = files
      .slice(0, 25)
      .map((f) => `--- FILE: ${f.path} ---\n${(f.content || '').slice(0, 8000)}`)
      .join('\n\n')
    return `Audit the following project files and return findings as JSON.\n\n${trimmed}`
  }
  if (tool === 'fix') {
    const code = String(payload?.code || '').slice(0, 12000)
    const error = String(payload?.error || '').slice(0, 2000)
    const lang = String(payload?.language || 'auto')
    return `Language hint: ${lang}\n\nBroken code:\n\`\`\`\n${code}\n\`\`\`\n\nError or symptom (may be empty):\n${error || '(none provided — diagnose from the code)'}`
  }
  // suggest
  const goal = String(payload?.goal || '').slice(0, 2000)
  const ctx = String(payload?.context || '').slice(0, 1000)
  return `Goal: ${goal}\n\nContext (optional): ${ctx || '(none)'}`
}

function extractJson(text: string): any {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const raw = fenced ? fenced[1] : text
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON object found in model output')
  return JSON.parse(raw.slice(start, end + 1))
}

export default async (req: Request, _ctx: Context) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  }

  let tool: Tool | null = null
  let payload: any = null
  try {
    const body = await req.json()
    if (body?.tool === 'scan' || body?.tool === 'fix' || body?.tool === 'suggest') {
      tool = body.tool
      payload = body.payload ?? {}
    }
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!tool) {
    return Response.json(
      { error: 'tool must be one of: scan, fix, suggest' },
      { status: 400 },
    )
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

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: MAX_TOKENS[tool],
      system: SYSTEM_PROMPTS[tool],
      messages: [{ role: 'user', content: userPrompt(tool, payload) }],
    })

    const text = msg.content
      .filter((b): b is { type: 'text'; text: string } => b.type === 'text')
      .map((b) => b.text)
      .join('\n')

    let parsed: any
    try {
      parsed = extractJson(text)
    } catch {
      return Response.json(
        { error: 'Model returned unparseable output', raw: text.slice(0, 800) },
        { status: 502 },
      )
    }

    return Response.json({ tool, result: parsed })
  } catch (err) {
    const m = err instanceof Error ? err.message : 'Tool call failed'
    const status = /401|unauthorized/i.test(m) ? 401 : /429|rate/i.test(m) ? 429 : 502
    return Response.json({ error: m }, { status })
  }
}

export const config = {
  path: '/api/agent-tools',
}
