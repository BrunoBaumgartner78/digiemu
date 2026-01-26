import { cookies } from "next/headers";
import { getBaseUrl } from "@/lib/serverUrl";

/**
 * Server-side fetch that forwards user cookies (NextAuth/session).
 * Use for Server Components calling internal /api routes.
 */
export async function serverFetch(path: string, init?: RequestInit) {
  const base = getBaseUrl();
  const url = path.startsWith("http") ? path : `${base}${path}`;

  // cookies() returns a Headers-like object with toString()
  let cookie = "";
  try {
    cookie = cookies().toString() || "";
  } catch {
    // ignore
  }

  const hdrs = new Headers(init?.headers as HeadersInit | undefined);
  if (cookie) hdrs.set("cookie", cookie);

  if (init?.body && !hdrs.has("content-type")) {
    hdrs.set("content-type", "application/json");
  }

  return fetch(url, {
    ...init,
    headers: hdrs,
    cache: "no-store",
  });
}
