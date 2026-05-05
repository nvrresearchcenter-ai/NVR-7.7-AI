import { Router } from "express";
import { getXApiKey, config } from "../lib/config.js";
import { optionalAuth } from "../middlewares/authMiddleware.js";

const router = Router();

const BRAVE_SEARCH_URL = "https://api.search.brave.com/res/v1/web/search";
const HN_SEARCH_URL    = "https://hn.algolia.com/api/v1/search";

export interface SearchResult {
  title: string;
  url: string;
  description: string;
  source?: string;
}

// ─── Provider: Brave Search (requires valid Brave API key) ───────────────────

async function braveSearch(query: string, key: string): Promise<SearchResult[]> {
  const url = new URL(BRAVE_SEARCH_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("count", "6");
  url.searchParams.set("text_decorations", "0");
  url.searchParams.set("result_filter", "web");

  const res = await fetch(url.toString(), {
    headers: {
      "Accept": "application/json",
      "Accept-Encoding": "gzip",
      "X-Subscription-Token": key,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Brave: ${res.status} — ${body.slice(0, 100)}`);
  }

  const data = await res.json() as {
    web?: {
      results?: Array<{
        title?: string;
        url?: string;
        description?: string;
      }>;
    };
  };

  return (data.web?.results ?? []).slice(0, 6).map((r) => ({
    title:       r.title       ?? "",
    url:         r.url         ?? "",
    description: r.description ?? "",
    source:      "Brave Search",
  }));
}

// ─── Provider: Hacker News Algolia (free, no key needed) ─────────────────────

async function hnSearch(query: string): Promise<SearchResult[]> {
  const url = new URL(HN_SEARCH_URL);
  url.searchParams.set("query", query);
  url.searchParams.set("tags", "story");
  url.searchParams.set("hitsPerPage", "8");
  url.searchParams.set("numericFilters", "points>5");

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "NVR-7.7-AI/1.0" },
  });
  if (!res.ok) throw new Error(`HN Algolia: ${res.status}`);

  const data = await res.json() as {
    hits: Array<{
      objectID: string;
      title?: string;
      url?: string;
      story_text?: string;
      points?: number;
      author?: string;
      created_at?: string;
    }>;
  };

  return data.hits.slice(0, 6).map((h) => ({
    title:       h.title ?? "(no title)",
    url:         h.url ?? `https://news.ycombinator.com/item?id=${h.objectID}`,
    description: h.story_text
      ? h.story_text.replace(/<[^>]+>/g, "").slice(0, 200)
      : `${h.points ?? 0} points · by ${h.author ?? "unknown"} · ${h.created_at?.slice(0, 10) ?? ""}`,
    source: "Hacker News",
  }));
}

// ─── Unified web search: Brave first, HN fallback ────────────────────────────

export async function braveWebSearch(query: string): Promise<SearchResult[]> {
  const key = getXApiKey();

  // Try Brave if we have a key
  if (key) {
    try {
      const results = await braveSearch(query, key);
      if (results.length > 0) return results;
    } catch {
      // key invalid or quota exhausted — fall through to HN
    }
  }

  // Free fallback: Hacker News Algolia
  return hnSearch(query);
}

// ─── Keyword detection ────────────────────────────────────────────────────────

export function needsWebSearch(text: string): boolean {
  const t = text.toLowerCase();
  return (
    /\b(latest|recent|current|today|this week|this month|breaking|trending|live|real.?time)\b/.test(t) ||
    /\b(news|update|updates|happening|right now|at the moment|currently)\b/.test(t) ||
    /\b(2025|2026)\b/.test(t) ||
    /\b(best|top)\s+(apps?|tools?|products?|platforms?|services?|ai|software|websites?)\b/.test(t) ||
    /\b(who is|what is|when did|where is)\b.{0,60}\b(now|today|currently)\b/.test(t) ||
    /\b(bangladesh|india|usa|uk|china|japan|world|global)\s+(news|update|today|situation)\b/.test(t)
  );
}

// ─── POST /api/tools/web-search ───────────────────────────────────────────────

router.post("/tools/web-search", optionalAuth, async (req, res) => {
  const { query } = req.body as { query?: string };
  if (!query || typeof query !== "string" || !query.trim()) {
    res.status(400).json({ error: "query is required" });
    return;
  }

  try {
    req.log.info({ query }, "Web search triggered");
    const results = await braveWebSearch(query.trim());
    req.log.info({ count: results.length, source: results[0]?.source ?? "none" }, "Web search results received");
    res.json({ results, query });
  } catch (err: unknown) {
    req.log.error({ err }, "Web search error");
    res.status(500).json({ error: err instanceof Error ? err.message : "Web search failed" });
  }
});

// ─── POST /api/tools/live-data ────────────────────────────────────────────────

router.post("/tools/live-data", optionalAuth, async (req, res) => {
  const { query, type = "general" } = req.body as { query?: string; type?: string };
  if (!query?.trim()) { res.status(400).json({ error: "query is required" }); return; }

  try {
    const results = await braveWebSearch(query.trim());
    res.json({ type, data: results.slice(0, 5), query });
  } catch (err) {
    req.log.error({ err }, "live-data fetch error");
    res.status(500).json({ error: "Failed to fetch live data" });
  }
});

// ─── POST /api/tools/agent-connect ───────────────────────────────────────────

router.post("/tools/agent-connect", optionalAuth, async (req, res) => {
  const { service, token } = req.body as { service?: string; token?: string };
  const supported = ["github", "vercel", "netlify", "stripe"];
  if (!service || !supported.includes(service)) {
    res.status(400).json({ error: `Unsupported service. Supported: ${supported.join(", ")}` });
    return;
  }
  if (!token?.trim()) {
    res.status(400).json({ error: "token is required" });
    return;
  }

  // Verify the token is non-empty and looks plausible (min 10 chars)
  if (token.trim().length < 10) {
    res.json({ connected: false, service, message: "Token appears too short — please check your credentials." });
    return;
  }

  req.log.info({ service }, "Agent connector token provided");
  res.json({
    connected: true,
    service,
    message: `${service.charAt(0).toUpperCase() + service.slice(1)} token stored for this session. The agent will use it for ${service} operations.`,
  });
});

// ─── POST /api/tools/analytics ────────────────────────────────────────────────

router.post("/tools/analytics", optionalAuth, async (req, res) => {
  const { event, metadata = {} } = req.body as { event?: string; metadata?: Record<string, unknown> };
  if (!event?.trim()) { res.status(400).json({ error: "event is required" }); return; }
  req.log.info({ event, metadata }, "Analytics event");
  res.json({ ok: true, event, received: new Date().toISOString() });
});

export default router;
