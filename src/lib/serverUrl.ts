import { headers } from "next/headers";

/**
 * Runtime-safe base URL resolver for Server Components.
 * Supports Headers-like and plain-object returns from next/headers().
 */
export function getBaseUrl() {
  const h: any = headers();

  const get = (key: string): string | null => {
    if (!h) return null;
    if (typeof h.get === "function") return h.get(key);
    return h[key] ?? h[key.toLowerCase()] ?? null;
  };

  const proto =
    get("x-forwarded-proto") ??
    get("X-Forwarded-Proto") ??
    "http";

  const host =
    get("x-forwarded-host") ??
    get("X-Forwarded-Host") ??
    get("host") ??
    get("Host");

  return host ? `${proto}://${host}` : "http://localhost:3000";
}
