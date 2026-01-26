// src/lib/utils/safeJson.ts
export function safeJsonParse<T>(input: unknown, fallback: T): T {
  if (input == null) return fallback;
  if (typeof input !== "string") return fallback;

  const s = input.trim();
  if (!s) return fallback;

  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

