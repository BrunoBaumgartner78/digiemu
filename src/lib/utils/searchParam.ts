// src/lib/utils/searchParam.ts
export type SearchParams = Record<string, string | string[] | undefined>;

export function spGet(sp: SearchParams | undefined, key: string): string | undefined {
  const v = sp?.[key];
  if (Array.isArray(v)) return v[0];
  return v;
}

export function spGetInt(sp: SearchParams | undefined, key: string, fallback: number): number {
  const raw = spGet(sp, key);
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}
