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

// Response guards for fetch results
export function isOkResponse(obj: unknown): obj is { ok: true } {
  return isRecord(obj) && obj.ok === true;
}

export function isErrorResponse(obj: unknown): obj is { message: string } {
  return isRecord(obj) && typeof (obj as any).message === "string";
}
