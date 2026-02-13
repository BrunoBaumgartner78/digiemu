import { headers } from "next/headers";

/**
 * Runtime-safe base URL resolver for Server Components.
 * Supports Headers-like and plain-object returns from next/headers().
 */
export function getBaseUrl() {
  const h = headers() as unknown;

  const get = (key: string): string | null => {
    if (!h) return null;
    if (typeof (h as any).get === "function") return (h as any).get(key);
    const obj = h as Record<string, unknown>;
    return (obj[key] as string) ?? (obj[key.toLowerCase()] as string) ?? null;
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
