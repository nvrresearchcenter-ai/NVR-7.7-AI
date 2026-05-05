import { Router } from "express";
import {
  checkAndIncrementChat, checkAndIncrementImage,
  findUserById, type Plan,
} from "../lib/db.js";
import { optionalAuth } from "../middlewares/authMiddleware.js";
import { getOpenAIClient, config } from "../lib/config.js";
import { braveWebSearch, needsWebSearch } from "./tools.js";
import { loadMemory, saveMemory } from "../lib/memory.js";

const router = Router();

function resolveIdentity(req: import("express").Request): { id: string; plan: Plan } {
  if (req.authUser) return { id: req.authUser.id, plan: req.authUser.plan };
  const sessionId = (req.headers["x-nvr-session"] as string) || "anon";
  return { id: `session:${sessionId}`, plan: "free" };
}

// ─── System Prompt Builder ────────────────────────────────────────────────────

function buildSystemPrompt(mode: string, assistantMode: string): string {

  // ── Core identity block (shared by all modes) ──────────────────────────────
  const identity = `
IDENTITY:
You are NVR 7.7 AI — a high-power, intelligent AI system built by NVR 7.7 Technology and Research Centre L.T.D.

Your CIO and lead architect is:
  Mohammad Shakil Mia (also written: Mohammad Shakil Mia)
  Title : Senior Executive AI Engineer | Chief Information Officer (CIO), NVR AI
  Focus : Radar network systems · Satellite systems · Laser technology ·
          Private key security · Advanced AI & software engineering
  Location: Bangladesh, Dhaka, Asia

IDENTITY RESPONSES:
- If the user asks "Who created you?" or "Who made you?" or similar:
  → "I was developed by NVR 7.7 Technology and Research Centre L.T.D. under the leadership of CIO Mohammad Shakil Mia, Senior Executive AI Engineer."
- If the user asks about your country or origin:
  → "I am an AI system developed in Bangladesh, designed and deployed for global use."
- Never claim to be ChatGPT, Claude, Gemini, or any other AI brand.`.trim();

  // ── Language intelligence ──────────────────────────────────────────────────
  const language = `
LANGUAGE INTELLIGENCE:
- Detect the user's language automatically from their message.
- Always reply in the exact same language the user writes in — no exceptions.
- Supported languages: English, Bengali (Bangla), Arabic, Hindi, Persian, Chinese, and all others.
- If the user writes in Bangla, reply fully in Bangla with correct, natural grammar.
- If the user writes in broken or grammatically incorrect text:
  1. Silently understand their intent.
  2. Write a corrected clean version of their sentence.
  3. Then answer clearly.`.trim();

  // ── Personality & style ────────────────────────────────────────────────────
  const personality = `
PERSONALITY & STYLE:
- Speak naturally like a world-class expert — not a rigid bot.
- Use proper punctuation: commas, full stops, paragraph breaks.
- Use emoji only when it genuinely adds clarity (1–2 max per reply). Never overuse.
- Be concise for simple questions. Be detailed and structured for complex ones.
- Always be professional, warm, and clear.`.trim();

  // ── Response quality ───────────────────────────────────────────────────────
  const quality = `
RESPONSE QUALITY:
- Analyze the user's question deeply before answering (internal reasoning first, output second).
- For project / code / business tasks:
    1. Brief explanation (what and why)
    2. Numbered steps or checklist
    3. Summary block → ✅ What is done | 🔧 What is working | ➡️ Next step
- For simple questions: give a direct, clear answer without padding.
- Use headings and bullet points only when they genuinely improve readability.`.trim();

  // ── Memory awareness ───────────────────────────────────────────────────────
  const memory = `
MEMORY & CONTEXT:
- You have access to this user's previous conversation history (injected above as prior messages).
- Use that history to recall preferences, project context, and prior decisions.
- If the user references something from an earlier conversation, use memory to answer precisely.
- If no prior history exists, treat this as a fresh conversation.`.trim();

  // ── Tool / app recommendations ─────────────────────────────────────────────
  const tools = `
TOOL & APP RECOMMENDATIONS:
- When the user asks about design, coding, hosting, AI, business, payment, domain, or mobile apps:
  → Suggest 3–5 useful tools/apps/platforms.
  → For each: name | what it does | why it helps.`.trim();

  // ── Agent capabilities ─────────────────────────────────────────────────────
  const agent = `
AGENT CAPABILITIES:
- When asked about tools/apps: list 3–5 with name + description + value.
- When asked for a project plan: break it into numbered phases with deliverables.
- When asked to write code: provide complete, working code with clear explanations.
- For risky actions (deploy / delete / payment / database changes / server config):
  → ALWAYS ask the user for explicit permission before proceeding.
  → State exactly what will happen and ask: "Shall I proceed?"`.trim();

  // ── Safety ─────────────────────────────────────────────────────────────────
  const safety = `
SECURITY RULES:
- Never expose API keys, secrets, tokens, or passwords — not even partially.
- Never store or reveal sensitive data from the frontend.
- All sensitive operations must go through the backend only.`.trim();

  // ── Combined base prompt ───────────────────────────────────────────────────
  const base = [identity, language, personality, quality, memory, tools, agent, safety].join("\n\n");

  // ── Agent mode override ────────────────────────────────────────────────────
  if (mode === "agent") {
    return `${base}

CURRENT MODE: Full Agent Mode
You are operating as NVR 7.7 Agent — a high-power autonomous coding and system engineer.
- Build, debug, scan, deploy, and guide with precision.
- Give step-by-step instructions and explain each action clearly.
- After completing each task, say: "✅ Work completed. Tell me the next task, sir."
- Ask permission before any deploy, delete, database, payment, or secrets operation.
- Never expose API keys or sensitive data.`;
  }

  // ── Assistant mode variants ────────────────────────────────────────────────
  switch (assistantMode) {
    case "coding":
      return `${base}

CURRENT MODE: Coding Help
You are an expert software engineer and debugger.
- Analyze code deeply. Provide complete, working solutions.
- Use properly formatted code blocks with language tags.
- Explain each step clearly so the user understands.
- Suggest better libraries, frameworks, or approaches when relevant — include name and why.
- For bug fixes: explain the root cause, then show the fix.
- End complex coding answers with: ✅ What was fixed | 🔧 How it works | ➡️ Next recommended step.`;

    case "business":
      return `${base}

CURRENT MODE: Business Help
You are a world-class business strategist, advisor, and entrepreneur mentor.
- Provide professional, structured business advice with clear headings.
- For business plans: include Executive Summary, Problem, Solution, Target Market, Revenue Model, Marketing Strategy, and Next Steps.
- Suggest relevant business tools and platforms (payment, hosting, marketing, analytics, CRM) — include name and what each does.
- Be realistic, actionable, and strategic.`;

    case "promptBuilder":
      return `${base}

CURRENT MODE: Prompt Builder
You are an expert AI prompt engineer.
- Help users craft powerful, effective prompts for any AI tool: ChatGPT, Claude, Midjourney, DALL-E, Stable Diffusion, Gemini, etc.
- Ask clarifying questions if the user's goal is unclear.
- Deliver the finished prompt in a clear code block.
- Explain what each part of the prompt does and why it works.
- Offer variations (creative vs. professional, short vs. detailed).`;

    case "imageLogo":
      return `${base}

CURRENT MODE: Image & Logo Ideas
You are a creative AI art director and visual designer.
- Help users generate ideas for images, logos, brand visuals, and creative concepts.
- Provide vivid, detailed image generation prompts usable with DALL-E, Midjourney, or Stable Diffusion.
- Suggest color palettes, typography styles, mood/aesthetic direction.
- For logos: ask about brand values, target audience, industry, and preferred style before giving ideas.
- Format prompts in code blocks for easy copying.`;

    case "agentPlanning":
      return `${base}

CURRENT MODE: Agent Planning
You are an expert AI project planner, system architect, and launch strategist.
- Break down complex projects into clear, numbered, actionable plans.
- Use checklists, timelines, and milestone markers.
- Identify risks and blockers proactively.
- Suggest the best tools for each phase (development, hosting, monitoring, payments, etc.).
- End every plan with: ✅ What is complete | 🔄 What is in progress | ➡️ Immediate next action.`;

    default:
      return base;
  }
}

// ─── POST /api/chat ───────────────────────────────────────────────────────────

router.post("/chat", optionalAuth, async (req, res) => {
  const { id, plan } = resolveIdentity(req);
  const check = checkAndIncrementChat(id, plan);

  if (!check.allowed) {
    if (check.reason === "limit_reached") {
      const hours = Math.ceil(check.resetIn / 3600000);
      res.status(429).json({
        error: `Free limit reached. Try again in ${hours}h or upgrade your plan.`,
        reason: "limit_reached", resetIn: check.resetIn, upgrade_required: plan === "free",
      });
      return;
    }
    if (check.reason === "cooldown") {
      const mins = Math.ceil((check.cooldownUntil - Date.now()) / 60000);
      res.status(429).json({
        error: `Heavy usage detected. Please wait ${mins} minute${mins !== 1 ? "s" : ""}.`,
        reason: "cooldown", cooldownUntil: check.cooldownUntil,
      });
      return;
    }
    if (check.reason === "monthly_limit") {
      res.status(429).json({
        error: "Monthly limit reached. Please upgrade to continue.",
        reason: "monthly_limit", upgrade_required: true,
      });
      return;
    }
  }

  try {
    const { messages, mode, assistantMode } = req.body as {
      messages: { role: "user" | "assistant" | "system"; content: string }[];
      mode?: string;
      assistantMode?: string;
    };
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "messages array is required" }); return;
    }

    if (!config.aiChatEnabled) {
      res.status(503).json({ error: "OPENAI_API_KEY_MISSING — AI chat is not configured." }); return;
    }

    const systemPrompt = buildSystemPrompt(mode ?? "chat", assistantMode ?? "normal");

    // ── Load persistent memory ────────────────────────────────────────────────
    const memoryMessages = loadMemory(id);
    req.log.info({ identity: id, memoryCount: memoryMessages.length }, "Memory loaded");

    // Inject historical context: memory first, then current session messages.
    // Deduplicate: if current messages already start with the same content as
    // memory tail, skip to avoid double-injecting the same turns.
    const allMessages = [...memoryMessages, ...messages];

    // ── Web search augmentation ───────────────────────────────────────────────
    let webSearchUsed = false;
    let searchContext = "";

    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    const userText = lastUserMsg?.content ?? "";

    if (config.xapiConfigured && needsWebSearch(userText)) {
      try {
        req.log.info({ query: userText.slice(0, 100) }, "Web search triggered");
        const results = await braveWebSearch(userText.slice(0, 200));
        if (results.length > 0) {
          req.log.info({ count: results.length }, "Web search results received");
          webSearchUsed = true;
          searchContext = [
            `\n\n── LIVE WEB SEARCH RESULTS (retrieved just now) ──`,
            `Query: "${userText.slice(0, 100)}"`,
            results.map((r, i) =>
              `${i + 1}. ${r.title}\n   ${r.description}\n   Source: ${r.url}`
            ).join("\n\n"),
            `──────────────────────────────────────────────────`,
            `Use the above live results to give an accurate, up-to-date answer.`,
            `Cite sources inline where helpful (e.g. "According to [Source Name]...").`,
          ].join("\n");
        }
      } catch (searchErr: unknown) {
        req.log.warn({ err: searchErr }, "Web search failed, falling back to AI-only");
      }
    }

    const finalSystemPrompt = searchContext
      ? `${systemPrompt}${searchContext}`
      : systemPrompt;

    // ── OpenAI call ───────────────────────────────────────────────────────────
    const completion = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: finalSystemPrompt }, ...allMessages],
      max_tokens: 2048,
    });

    const reply = completion.choices[0]?.message?.content ?? "";

    // ── Persist memory ────────────────────────────────────────────────────────
    if (userText && reply) {
      saveMemory(id, userText, reply);
    }

    res.json({ reply, webSearchUsed });
  } catch (err: unknown) {
    req.log.error({ err }, "Chat error");
    res.status(500).json({ error: err instanceof Error ? err.message : "Unknown error" });
  }
});

// ─── POST /api/image ──────────────────────────────────────────────────────────

router.post("/image", optionalAuth, async (req, res) => {
  const { id, plan } = resolveIdentity(req);
  const check = checkAndIncrementImage(id, plan);

  if (!check.allowed) {
    if (check.reason === "limit_reached") {
      const hours = Math.ceil(check.resetIn / 3600000);
      res.status(429).json({
        error: `Image limit reached. Try again in ${hours}h or upgrade.`,
        reason: "limit_reached", resetIn: check.resetIn,
      });
      return;
    }
    if (check.reason === "monthly_limit") {
      res.status(429).json({ error: "Monthly image limit reached. Please upgrade.", reason: "monthly_limit" });
      return;
    }
  }

  try {
    const { prompt } = req.body as { prompt?: string };
    if (!prompt) { res.status(400).json({ error: "prompt is required" }); return; }

    if (!config.aiChatEnabled) {
      res.status(503).json({ error: "OPENAI_API_KEY_MISSING — image generation is not configured." }); return;
    }

    const image = await getOpenAIClient().images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
    });

    const url = image.data?.[0]?.url;
    if (!url) { res.status(500).json({ error: "No image URL returned." }); return; }

    res.json({ url });
  } catch (err: unknown) {
    req.log.error({ err }, "Image generation error");
    res.status(500).json({ error: err instanceof Error ? err.message : "Image generation failed" });
  }
});

export default router;
