// src/lib/errors.ts
export function getErrorMessage(e: unknown, fallback = "Unbekannter Fehler"): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  try {
    return JSON.stringify(e);
  } catch {
    return fallback;
  }
}

// Alias, falls du bereits toErrorMessage importierst
export const toErrorMessage = getErrorMessage;
