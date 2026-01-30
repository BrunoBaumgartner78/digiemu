export type SearchParams = Record<string, string | string[] | undefined>;

type FieldSpec = {
  key: string;
  default?: any;
  min?: number;
  max?: number;
};

type SpecMap = Record<string, FieldSpec>;

function spGet(sp: SearchParams, key: string): string | undefined {
  const v = sp[key];
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v[0];
  return undefined;
}

import { buildQueryString as _buildQueryString } from "@/lib/buildQueryString";

export function parseAdminListParams(
  sp: SearchParams,
  spec: SpecMap
): { [key: string]: any; buildQueryString: (overrides: Record<string, string | undefined>) => string } {
  const out: Record<string, any> = {};
  for (const [name, f] of Object.entries(spec)) {
    const raw = spGet(sp, f.key);
    if (f.default !== undefined && typeof f.default === "number") {
      let n = raw ? Number(raw) : Number.NaN;
      if (!Number.isFinite(n)) n = f.default;
      n = Math.floor(n);
      if (typeof f.min === "number") n = Math.max(f.min, n);
      if (typeof f.max === "number") n = Math.min(f.max, n);
      out[name] = n;
    } else {
      out[name] = raw ?? f.default ?? "";
    }
  }

  function buildQueryString(overrides: Record<string, string | undefined>) {
    // Map current parsed values to their query param keys
    const base: Record<string, string> = {};
    for (const [name, v] of Object.entries(out)) {
      const paramKey = spec[name]?.key ?? name;
      if (v === undefined || v === null || v === "") continue;
      base[paramKey] = String(v);
    }

    // Apply overrides (these overrides are expected to use the query param keys)
    for (const [k, v] of Object.entries(overrides)) {
      if (v === undefined || v === null || v === "") delete base[k];
      else base[k] = v;
    }

    // Use shared buildQueryString util (returns string without leading '?')
    return _buildQueryString(base);
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

export function formatMoney(cents: number, currency = "CHF") {
  const v = Number.isFinite(cents) ? cents : Number(cents || 0);
  return `${(v / 100).toFixed(2)} ${currency}`;
}

export function formatMoneyFromCents(cents: number, currency: string = "CHF") {
  const v = Number.isFinite(cents) ? cents : Number(cents || 0);
  return `${(v / 100).toFixed(2)} ${currency}`;
}

// no default export
