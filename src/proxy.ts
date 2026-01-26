// proxy.ts (oder src/proxy.ts – dort wo sie bei dir liegt)
import { NextResponse } from "next/server";

export function proxy() {
  const res = NextResponse.next();

  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.headers.set("Content-Security-Policy", "frame-ancestors 'none';");

  return res;
}

// ✅ exclude /api completely
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
