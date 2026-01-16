// src/lib/rateLimit.ts
// Lightweight in-memory sliding-window rate limiter for MVP/GO.

type Entry = { timestamps: number[] };
const STORE = new Map<string, Entry>();

export function rateLimitCheck(key: string, limit = 20, windowMs = 60_000) {
  const now = Date.now();
  const windowStart = now - windowMs;
  let e = STORE.get(key);
  if (!e) {
    e = { timestamps: [] };
    STORE.set(key, e);
  }

  // prune old
  e.timestamps = e.timestamps.filter((t) => t > windowStart);

  if (e.timestamps.length >= limit) {
    const earliest = e.timestamps[0];
    const retryAfterMs = windowMs - (now - earliest);
    return { allowed: false, retryAfter: Math.ceil(retryAfterMs / 1000) };
  }

  e.timestamps.push(now);
  return { allowed: true, remaining: Math.max(0, limit - e.timestamps.length) };
}

export function keyFromReq(req: Request | any, suffix = "") {
  // Try headers commonly set by proxies
  const xff = req.headers?.get?.("x-forwarded-for") || req.headers?.get?.("x-real-ip");
  const ip = typeof xff === "string" ? String(xff).split(",")[0].trim() : "unknown";
  const ua = req.headers?.get?.("user-agent") || "ua";
  return `${ip}:${ua}:${suffix}`;
}
