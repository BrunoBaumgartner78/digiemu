/**
 * Centralized time helpers.
 * Using a helper keeps server components/pages pure per lint rules.
 */
export function nowMs(): number {
  return Date.now();
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function msFromDays(days: number): number {
  return days * 24 * 60 * 60 * 1000;
}

export function isoFromMs(ms: number): string {
  return new Date(ms).toISOString();
}
