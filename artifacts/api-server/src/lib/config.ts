import OpenAI from "openai";
import { logger } from "./logger.js";

// ─── Read secrets (never logged) ────────────────────────────────────────────
const OPENAI_API_KEY        = process.env["OPENAI_API_KEY"]        ?? "";
const XAPI_KEY              = process.env["XAPI_KEY"]              ?? "";
const CLOUDFLARE_API_TOKEN  = process.env["CLOUDFLARE_API_TOKEN"]  ?? "";
const GITHUB_TOKEN          = process.env["GITHUB_TOKEN"]          ?? "";

// ─── Config flags ────────────────────────────────────────────────────────────
export const config = {
  openaiConfigured:       Boolean(OPENAI_API_KEY),
  xapiConfigured:         Boolean(XAPI_KEY),
  cloudflareConfigured:   Boolean(CLOUDFLARE_API_TOKEN),
  githubConfigured:       Boolean(GITHUB_TOKEN),
  aiChatEnabled:          Boolean(OPENAI_API_KEY),
  externalToolsEnabled:   Boolean(XAPI_KEY),
  cloudflareEnabled:      Boolean(CLOUDFLARE_API_TOKEN),
  githubEnabled:          Boolean(GITHUB_TOKEN),
} as const;

// ─── Startup logs (values never printed) ─────────────────────────────────────
if (config.openaiConfigured) {
  logger.info("OpenAI configured");
} else {
  logger.error("OPENAI_API_KEY_MISSING — AI chat and image generation are disabled");
}

if (config.xapiConfigured) {
  logger.info("XAPI configured — external tools enabled");
} else {
  logger.info("XAPI_KEY not set — external tools disabled");
}

if (config.cloudflareConfigured) {
  logger.info("Cloudflare configured — DNS automation and domain tools enabled");
} else {
  logger.warn("CLOUDFLARE_API_TOKEN not set — Cloudflare DNS tools disabled");
}

if (config.githubConfigured) {
  logger.info("GitHub configured — repo management and push tools enabled");
} else {
  logger.warn("GITHUB_TOKEN not set — GitHub tools disabled");
}

// ─── Singleton OpenAI client ──────────────────────────────────────────────────
let _openaiClient: OpenAI | null = null;

/**
 * Returns the shared OpenAI client.
 * Throws `OPENAI_API_KEY_MISSING` if the key is not configured — callers
 * should catch this and return a 503 to the client.
 */
export function getOpenAIClient(): OpenAI {
  if (!config.openaiConfigured) {
    throw new Error("OPENAI_API_KEY_MISSING");
  }
  if (!_openaiClient) {
    _openaiClient = new OpenAI({ apiKey: OPENAI_API_KEY });
  }
  return _openaiClient;
}

/**
 * Returns the XAPI key string for use in external tool requests,
 * or null if the key is not configured.
 * Never log or expose the returned value.
 */
export function getXApiKey(): string | null {
  return config.xapiConfigured ? XAPI_KEY : null;
}

/**
 * Returns the Cloudflare API token for use in Cloudflare API requests,
 * or null if not configured.
 * Never log or expose the returned value.
 */
export function getCloudflareToken(): string | null {
  return config.cloudflareConfigured ? CLOUDFLARE_API_TOKEN : null;
}

/**
 * Returns the GitHub Personal Access Token for use in GitHub API requests,
 * or null if not configured.
 * Never log or expose the returned value.
 */
export function getGitHubToken(): string | null {
  return config.githubConfigured ? GITHUB_TOKEN : null;
}
