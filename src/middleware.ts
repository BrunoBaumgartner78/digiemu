import { NextResponse, type NextRequest } from "next/server";
import { applySecurityHeaders } from "@/lib/security/headers";

export function middleware(_req: NextRequest) {
  const res = NextResponse.next();
  applySecurityHeaders(res as unknown as NextResponse);
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
