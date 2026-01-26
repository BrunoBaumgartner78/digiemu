export type SearchParams = Record<string, string | string[] | undefined>;

export function spGet(sp: SearchParams, key: string): string | undefined {
  const v = sp[key];
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v[0];
  return undefined;
}

export function clampInt(
  raw: unknown,
  fallback: number,
  min: number,
  max: number
): number {
  const n = typeof raw === "string" ? Number(raw) : typeof raw === "number" ? raw : NaN;
  if (!Number.isFinite(n)) return fallback;
  const x = Math.floor(n);
  if (x < min) return min;
  if (x > max) return max;
  return x;
}

export function spGetInt(
  sp: SearchParams,
  key: string,
  fallback: number,
  min: number,
  max: number
): number {
  return clampInt(spGet(sp, key), fallback, min, max);
}

export function spGetEnum(
  sp: SearchParams,
  key: string,
  allowed: Set<string>
): string {
  const raw = (spGet(sp, key) ?? "").trim().toUpperCase();
  return allowed.has(raw) ? raw : "";
}

export function qs(obj: Record<string, string | undefined>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) {
    if (v && v.trim()) p.set(k, v.trim());
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function safeDateTimeCH(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("de-CH");
}

export function formatCHF(priceCents: number) {
  const n = Number(priceCents);
  const v = Number.isFinite(n) ? n : 0;
  return `${(v / 100).toFixed(2)} CHF`;
}
