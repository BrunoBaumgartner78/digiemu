import { Prisma } from "@prisma/client";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isString(value: unknown): value is string {
  return typeof value === "string";
}

export function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.trim() !== "";
}

export function getString(value: unknown): string | null {
  return isString(value) ? value : null;
}

export function toString(value: unknown): string {
  if (isString(value)) return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

export function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function getNumber(value: unknown): number | null {
  return isNumber(value) ? value : null;
}

export function toNumber(value: unknown): number | null {
  if (isNumber(value)) return value;
  if (isString(value)) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function isArrayOfStrings(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => isString(v));
}

export function isIdLike(value: unknown): value is string {
  return isNonEmptyString(value);
}

// Basic extraction helpers
export function getBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (isString(value)) {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return null;
}

export function getId(value: unknown): string | null {
  return isIdLike(value) ? value : null;
}

// SearchParams / param helpers
export function parseSearchParams(value: unknown): URLSearchParams | null {
  if (value instanceof URLSearchParams) return value;
  if (isString(value)) return new URLSearchParams(value);
  return null;
}

export function getIdFromSearchParams(value: unknown, key = "id"): string | null {
  const params = parseSearchParams(value);
  if (!params) return null;
  const v = params.get(key);
  return v && v.trim() ? v : null;
}

export function parseParamToNumber(value: unknown): number | null {
  if (isNumber(value)) return value;
  if (isString(value)) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

// JSON / Prisma JsonValue guard
export function isJsonValue(v: unknown): v is Prisma.JsonValue {
  if (v === null) return true;
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return true;
  if (Array.isArray(v)) return v.every((x) => isJsonValue(x));
  if (isRecord(v)) return Object.values(v).every((x) => isJsonValue(x));
  return false;
}

export function safeStringifyJson(v: unknown): string {
  try {
    return JSON.stringify(v);
  } catch {
    return String(v ?? "");
  }
}

export function getStringArray(value: unknown): string[] | null {
  if (isArrayOfStrings(value)) return value;
  if (isString(value)) return [value];
  return null;
}

export function getOptionalNumber(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  return parseParamToNumber(value);
}

// Property extraction helpers
export function getStringProp(obj: unknown, key: string): string | null {
  if (!isRecord(obj)) return null;
  const v = (obj as Record<string, unknown>)[key];
  return isString(v) ? v : null;
}

export function getBooleanProp(obj: unknown, key: string): boolean | null {
  if (!isRecord(obj)) return null;
  const v = (obj as Record<string, unknown>)[key];
  return getBoolean(v);
}

export function getNumberProp(obj: unknown, key: string): number | null {
  if (!isRecord(obj)) return null;
  const v = (obj as Record<string, unknown>)[key];
  return getNumber(v);
}

// Response guards for fetch results
export function isOkResponse(obj: unknown): obj is { ok: true } {
  return isRecord(obj) && obj.ok === true;
}

export function isErrorResponse(obj: unknown): obj is { message: string } {
  return isRecord(obj) && isString((obj as Record<string, unknown>).message);
}

export function getErrorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (isRecord(e) && isString((e as Record<string, unknown>).message)) return (e as Record<string, unknown>).message as string;
  return String(e ?? "");
}
