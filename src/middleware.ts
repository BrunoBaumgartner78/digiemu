import { NextResponse, type NextRequest } from "next/server";
import { applySecurityHeaders } from "@/lib/security/headers";
import rateLimit from "@/lib/security/rateLimit";

function getIp(req: NextRequest) {
  const xf = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip");
  if (xf && typeof xf === "string") return xf.split(",")[0].trim();
  return "unknown";
}

export function middleware(req: NextRequest) {
  // Basic rate-limiting for sensitive endpoints
  try {
    const pathname = req.nextUrl.pathname || "";
    const ip = getIp(req);

    if (pathname.startsWith("/api/auth")) {
      const key = rateLimit.keyFromReq(ip, "auth");
      const { allowed, retryAfter } = rateLimit.incrementAndCheck(key, 10 * 60 * 1000, Number(process.env.RL_LOGIN_PER_IP_10M ?? 10));
      if (!allowed) {
        return new NextResponse(JSON.stringify({ message: "Too Many Requests" }), { status: 429, headers: { "Retry-After": String(retryAfter), "Content-Type": "application/json" } });
      }
    }

    if (pathname.startsWith("/api/admin")) {
      const key = rateLimit.keyFromReq(ip, "admin");
      const { allowed, retryAfter } = rateLimit.incrementAndCheck(key, 60 * 1000, Number(process.env.RL_ADMIN_PER_IP_1M ?? 30));
      if (!allowed) {
        return new NextResponse(JSON.stringify({ message: "Too Many Requests" }), { status: 429, headers: { "Retry-After": String(retryAfter), "Content-Type": "application/json" } });
      }
    }

    if (pathname.startsWith("/api/download") || pathname.startsWith("/api/media")) {
      const key = rateLimit.keyFromReq(ip, "download");
      const { allowed, retryAfter } = rateLimit.incrementAndCheck(key, 60 * 1000, Number(process.env.RL_DOWNLOAD_PER_IP_1M ?? 60));
      if (!allowed) {
        return new NextResponse(JSON.stringify({ message: "Too Many Requests" }), { status: 429, headers: { "Retry-After": String(retryAfter), "Content-Type": "application/json" } });
      }
    }
  } catch (err) {
    // best-effort: do not block on rate limiter errors
    console.error("rateLimit middleware error", err);
  }

  const res = NextResponse.next();
  applySecurityHeaders(res as unknown as NextResponse);
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
