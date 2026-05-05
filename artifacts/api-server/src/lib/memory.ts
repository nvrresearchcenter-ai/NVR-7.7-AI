import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR   = join(__dirname, "../../data");
const CONV_FILE  = join(DATA_DIR, "conversations.json");

const MAX_PER_USER  = 100; // max stored messages per identity
const MAX_INJECT    = 20;  // max messages injected as context into each request

export interface MemoryMessage {
  role: "user" | "assistant";
  content: string;
  ts: number;
}

type ConversationStore = Record<string, MemoryMessage[]>;

// ─── File I/O ──────────────────────────────────────────────────────────────

function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function readStore(): ConversationStore {
  ensureDataDir();
  if (!existsSync(CONV_FILE)) return {};
  try {
    return JSON.parse(readFileSync(CONV_FILE, "utf-8")) as ConversationStore;
  } catch {
    return {};
  }
}

function writeStore(store: ConversationStore): void {
  ensureDataDir();
  writeFileSync(CONV_FILE, JSON.stringify(store, null, 2), "utf-8");
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Returns the last MAX_INJECT messages stored for this identity,
 * formatted for injection into OpenAI messages array.
 */
export function loadMemory(
  identity: string,
): { role: "user" | "assistant"; content: string }[] {
  const store = readStore();
  const history = store[identity] ?? [];
  return history
    .slice(-MAX_INJECT)
    .map(({ role, content }) => ({ role, content }));
}

/**
 * Append a user+assistant exchange to persistent memory.
 * Enforces the MAX_PER_USER cap by dropping oldest messages.
 */
export function saveMemory(
  identity: string,
  userContent: string,
  assistantContent: string,
): void {
  const store = readStore();
  if (!store[identity]) store[identity] = [];
  const hist = store[identity];
  const now = Date.now();
  hist.push({ role: "user",      content: userContent,      ts: now });
  hist.push({ role: "assistant", content: assistantContent, ts: now });
  // Trim to cap
  if (hist.length > MAX_PER_USER) {
    store[identity] = hist.slice(hist.length - MAX_PER_USER);
  }
  writeStore(store);
}

/**
 * How many messages are stored for this identity.
 */
export function memoryStats(identity: string): { count: number } {
  const store = readStore();
  return { count: (store[identity] ?? []).length };
}

/**
 * Clear all memory for an identity (e.g. on explicit user request).
 */
export function clearMemory(identity: string): void {
  const store = readStore();
  delete store[identity];
  writeStore(store);
}
