export type Plan = "free" | "spark" | "pro" | "agent" | "super";

interface Session {
  plan: Plan;
  chatCount: number;
  imageCount: number;
  sessionChatCount: number;
  lastFreeReset: number;
  lastMonthlyReset: number;
  cooldownUntil: number;
}

const TWELVE_HOURS = 12 * 60 * 60 * 1000;
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

export const PLAN_LIMITS = {
  free:  { chat: 20,   image: 2,   cooldownMs: 0,          monthlyChat: Infinity, monthlyImage: Infinity },
  spark: { chat: 500,  image: 50,  cooldownMs: 30 * 60000, monthlyChat: 500,      monthlyImage: 50 },
  pro:   { chat: 5000, image: 100, cooldownMs: 20 * 60000, monthlyChat: 5000,     monthlyImage: 100 },
  agent: { chat: 9999, image: 500, cooldownMs: 0,          monthlyChat: 9999,     monthlyImage: 500 },
  super: { chat: 9999, image: 999, cooldownMs: 0,          monthlyChat: 9999,     monthlyImage: 999 },
};

const HEAVY_USE_THRESHOLD: Record<Plan, number> = {
  free: 999, spark: 80, pro: 150, agent: 999, super: 999,
};

const store = new Map<string, Session>();

function getOrCreate(sessionId: string): Session {
  if (!store.has(sessionId)) {
    store.set(sessionId, {
      plan: "free",
      chatCount: 0,
      imageCount: 0,
      sessionChatCount: 0,
      lastFreeReset: Date.now(),
      lastMonthlyReset: Date.now(),
      cooldownUntil: 0,
    });
  }
  const s = store.get(sessionId)!;

  const now = Date.now();
  if (s.plan === "free" && now - s.lastFreeReset >= TWELVE_HOURS) {
    s.chatCount = 0;
    s.imageCount = 0;
    s.lastFreeReset = now;
  }
  if (s.plan !== "free" && now - s.lastMonthlyReset >= THIRTY_DAYS) {
    s.chatCount = 0;
    s.imageCount = 0;
    s.sessionChatCount = 0;
    s.lastMonthlyReset = now;
  }
  return s;
}

export function getSession(sessionId: string): Session {
  return getOrCreate(sessionId);
}

export function setPlan(sessionId: string, plan: Plan): void {
  const s = getOrCreate(sessionId);
  s.plan = plan;
  s.chatCount = 0;
  s.imageCount = 0;
  s.sessionChatCount = 0;
  s.lastFreeReset = Date.now();
  s.lastMonthlyReset = Date.now();
  s.cooldownUntil = 0;
}

export type ChatCheckResult =
  | { allowed: true }
  | { allowed: false; reason: "limit_reached"; resetIn: number; plan: Plan }
  | { allowed: false; reason: "cooldown"; cooldownUntil: number; plan: Plan }
  | { allowed: false; reason: "monthly_limit"; plan: Plan };

export function checkAndIncrementChat(sessionId: string): ChatCheckResult {
  const s = getOrCreate(sessionId);
  const now = Date.now();
  const limits = PLAN_LIMITS[s.plan];

  if (s.cooldownUntil > now) {
    return { allowed: false, reason: "cooldown", cooldownUntil: s.cooldownUntil, plan: s.plan };
  }

  if (s.plan === "free") {
    if (s.chatCount >= limits.chat) {
      const resetIn = TWELVE_HOURS - (now - s.lastFreeReset);
      return { allowed: false, reason: "limit_reached", resetIn: Math.max(0, resetIn), plan: s.plan };
    }
    s.chatCount++;
    s.sessionChatCount++;
    return { allowed: true };
  }

  if (s.chatCount >= limits.monthlyChat) {
    return { allowed: false, reason: "monthly_limit", plan: s.plan };
  }

  s.chatCount++;
  s.sessionChatCount++;

  if (s.sessionChatCount >= HEAVY_USE_THRESHOLD[s.plan] && limits.cooldownMs > 0) {
    s.cooldownUntil = now + limits.cooldownMs;
    s.sessionChatCount = 0;
  }

  return { allowed: true };
}

export type ImageCheckResult =
  | { allowed: true }
  | { allowed: false; reason: "limit_reached"; resetIn: number; plan: Plan }
  | { allowed: false; reason: "monthly_limit"; plan: Plan };

export function checkAndIncrementImage(sessionId: string): ImageCheckResult {
  const s = getOrCreate(sessionId);
  const now = Date.now();
  const limits = PLAN_LIMITS[s.plan];

  if (s.plan === "free") {
    if (s.imageCount >= limits.image) {
      const resetIn = TWELVE_HOURS - (now - s.lastFreeReset);
      return { allowed: false, reason: "limit_reached", resetIn: Math.max(0, resetIn), plan: s.plan };
    }
    s.imageCount++;
    return { allowed: true };
  }

  if (s.imageCount >= limits.monthlyImage) {
    return { allowed: false, reason: "monthly_limit", plan: s.plan };
  }
  s.imageCount++;
  return { allowed: true };
}

export function getUsageSummary(sessionId: string) {
  const s = getOrCreate(sessionId);
  const now = Date.now();
  const limits = PLAN_LIMITS[s.plan];
  return {
    plan: s.plan,
    chatCount: s.chatCount,
    imageCount: s.imageCount,
    chatLimit: limits.chat,
    imageLimit: limits.image,
    cooldownUntil: s.cooldownUntil,
    isCoolingDown: s.cooldownUntil > now,
    resetIn: s.plan === "free" ? Math.max(0, TWELVE_HOURS - (now - s.lastFreeReset)) : 0,
  };
}

const secretsStore = new Map<string, Record<string, string>>();

export function addSecret(sessionId: string, key: string, value: string): void {
  if (!secretsStore.has(sessionId)) secretsStore.set(sessionId, {});
  secretsStore.get(sessionId)![key] = value;
}

export function getSecretKeys(sessionId: string): string[] {
  return Object.keys(secretsStore.get(sessionId) ?? {});
}
