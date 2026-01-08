// Minimal in-memory sliding-window rate limiter.
// Not suitable for multi-instance production; replace with Redis/Upstash in prod.
type WindowEntry = number[]; // timestamps (ms)

const windows = new Map<string, WindowEntry>();

function nowMs() {
  return Date.now();
}

export function keyFromReq(ip: string, suffix: string) {
  return `rl:${ip}:${suffix}`;
}

export function cleanupWindow(key: string, windowMs: number) {
  const arr = windows.get(key) ?? [];
  const cutoff = nowMs() - windowMs;
  const filtered = arr.filter((t) => t >= cutoff);
  windows.set(key, filtered);
  return filtered.length;
}

export function incrementAndCheck(key: string, windowMs: number, maxHits: number) {
  const cutoff = nowMs() - windowMs;
  const arr = windows.get(key) ?? [];
  const filtered = arr.filter((t) => t >= cutoff);
  filtered.push(nowMs());
  windows.set(key, filtered);
  const allowed = filtered.length <= maxHits;
  let retryAfter = 0;
  if (!allowed) {
    // retry after when the oldest timestamp exits the window
    const oldest = filtered[0] ?? nowMs();
    retryAfter = Math.ceil((cutoff + windowMs - oldest) / 1000);
    if (retryAfter < 1) retryAfter = 1;
  }
  return { allowed, retryAfter, remaining: Math.max(0, maxHits - filtered.length) };
}

export function getCount(key: string, windowMs: number) {
  return cleanupWindow(key, windowMs);
}

export default { keyFromReq, incrementAndCheck, getCount };
