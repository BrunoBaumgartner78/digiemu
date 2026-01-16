// src/lib/rateLimit.ts
// Lightweight in-memory sliding-window rate limiter for MVP/GO.

type Entry = { timestamps: number[] };
const STORE = new Map<string, Entry>();

// Global protective pruning threshold
const MAX_STORE_SIZE = 10_000;

export function rateLimitCheck(key: string, limit = 20, windowMs = 60_000) {
  const now = Date.now();
  const windowStart = now - windowMs;

  // simple global prune to avoid memory blowup
  if (STORE.size > MAX_STORE_SIZE) {
    for (const [k, v] of STORE) {
      v.timestamps = v.timestamps.filter((t) => t > windowStart);
      if (v.timestamps.length === 0) STORE.delete(k);
      if (STORE.size <= MAX_STORE_SIZE) break;
    }
  }

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
    return {
      allowed: false,
      retryAfter: Math.ceil(retryAfterMs / 1000),
      limit,
      windowMs,
    };
  }

  e.timestamps.push(now);
  return { allowed: true, remaining: Math.max(0, limit - e.timestamps.length), limit, windowMs };
}

export function keyFromReq(reqOrHeaders: Request | any, suffix = "", includeUa = false) {
  // Accept either a Next.js headers() object or Request
  const get = (obj: any, k: string) => obj?.get?.(k) ?? obj?.headers?.get?.(k) ?? undefined;

  const xff = get(reqOrHeaders, "x-forwarded-for") || get(reqOrHeaders, "x-real-ip");
  const ip = typeof xff === "string" ? String(xff).split(",")[0].trim() : "unknown";
  const ua = get(reqOrHeaders, "user-agent") || "ua";

  if (includeUa) return `${ip}:${ua}:${suffix}`;
  return `${ip}:${suffix}`;
}
