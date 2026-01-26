export type SearchParams = Record<string, string | string[] | undefined>;

export function spGet(sp: SearchParams, key: string): string | undefined {
  const v = sp[key];
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v[0];
  return undefined;
}

export function spGetInt(sp: SearchParams, key: string, fallback: number, min: number, max: number): number {
  const raw = spGet(sp, key);
  const n = raw ? Number(raw) : NaN;
  const val = Number.isFinite(n) ? Math.floor(n) : fallback;
  return Math.min(max, Math.max(min, val));
}

export function qs(sp: Record<string, string | undefined>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) if (v && v.trim()) p.set(k, v.trim());
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function safeDateTimeCH(d: Date | string) {
  try {
    const dt = typeof d === "string" ? new Date(d) : d;
    return dt.toLocaleString("de-CH");
  } catch {
    return String(d);
  }
}

export function formatCHF(priceCents: number) {
  const v = Number.isFinite(priceCents) ? priceCents : 0;
  return `${(v / 100).toFixed(2)} CHF`;
}

export const PRODUCT_STATUSES = ["DRAFT", "ACTIVE", "BLOCKED"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const VENDOR_STATUSES = ["PENDING", "APPROVED", "BLOCKED"] as const;
export type VendorStatus = (typeof VENDOR_STATUSES)[number];

export function normalizeEnum<T extends readonly string[]>(value: string, allowed: T): T[number] | "" {
  const v = (value ?? "").trim().toUpperCase();
  return (allowed as readonly string[]).includes(v) ? (v as any) : "";
}
