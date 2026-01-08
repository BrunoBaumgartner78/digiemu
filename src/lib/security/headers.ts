// src/lib/security/headers.ts
import type { NextResponse } from "next/server";

export function applySecurityHeaders(res: NextResponse) {
  // Minimal CSP: lock down framing; keep rest permissive to avoid breaking behaviour.
  // This V1 focuses on preventing clickjacking via frame-ancestors.
  // Safely merge frame-ancestors into any existing CSP without overwriting other directives.
  const existingCsp = res.headers.get("Content-Security-Policy");
  const required = "frame-ancestors 'none'";
  if (existingCsp && existingCsp.trim().length > 0) {
    // If there's already a frame-ancestors directive, replace it. Otherwise append.
    if (/frame-ancestors\s+[^;]+/i.test(existingCsp)) {
      const updated = existingCsp.replace(/frame-ancestors\s+[^;]+/i, required);
      res.headers.set("Content-Security-Policy", updated);
    } else {
      let updated = existingCsp.trim();
      if (!updated.endsWith(";")) updated += ";";
      updated = `${updated} ${required};`;
      res.headers.set("Content-Security-Policy", updated);
    }
  } else {
    res.headers.set("Content-Security-Policy", `${required};`);
  }
  // Legacy header for older user agents
  res.headers.set("X-Frame-Options", "DENY");

  // Hardening
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Narrow feature permissions to opt-out device APIs (safe default)
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  // HSTS: only emit in production where HTTPS is enforced
  if (process.env.NODE_ENV === "production") {
    res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  return res;
}

export default {} as const;
