export type SearchParams = Record<string, string | string[] | undefined>;

type FieldSpec = {
  key: string;
  default?: unknown;
  min?: number;
  max?: number;
};

type SpecMap = Record<string, FieldSpec>;

import { buildQueryString as _buildQueryString } from "@/lib/buildQueryString";

function spGet(sp: SearchParams, key: string): string | undefined {
  const v = sp[key];
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v[0];
  return undefined;
}


export function parseAdminListParams(
  sp: SearchParams,
  spec: SpecMap
): Record<string, unknown> & {
  buildQueryString: (overrides: Record<string, string | undefined>) => string;
} {
  const out: Record<string, unknown> = {};

  for (const [name, f] of Object.entries(spec)) {
    const raw = spGet(sp, f.key);

    // number fields
    if (typeof f.default === "number") {
      let n = raw ? Number(raw) : Number.NaN;
      if (!Number.isFinite(n)) n = f.default;
      n = Math.floor(n);
      if (typeof f.min === "number") n = Math.max(f.min, n);
      if (typeof f.max === "number") n = Math.min(f.max, n);
      out[name] = n;
      continue;
    }

    // string/other fields
    out[name] = (raw ?? f.default ?? "") as unknown;
  }

  function buildQueryString(overrides: Record<string, string | undefined>) {
    const base: Record<string, string> = {};

    // map parsed values → query keys
    for (const [name, v] of Object.entries(out)) {
      const paramKey = spec[name]?.key ?? name;
      if (v === undefined || v === null) continue;

      const s = String(v);
      if (!s.trim()) continue;

      base[paramKey] = s.trim();
    }

    // apply overrides (overrides use query param keys)
    for (const [k, v] of Object.entries(overrides)) {
      if (!v || !v.trim()) delete base[k];
      else base[k] = v.trim();
    }

    return _buildQueryString(base); // returns string without leading '?'
  }

  return { ...out, buildQueryString };
}

export function formatDateTime(d: Date | string) {
  try {
    const dt = typeof d === "string" ? new Date(d) : d;
    return dt.toLocaleString("de-CH");
  } catch {
    return String(d);
  }
}

export function formatMoneyFromCents(cents: number, currency: string = "CHF") {
  const v = Number.isFinite(cents) ? cents : Number(cents || 0);
  return `${(v / 100).toFixed(2)} ${currency}`;
}
