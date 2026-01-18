import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request) {
  const startedAt = Date.now();

  // Public minimal healthcheck: do not return 403 for missing/invalid tokens.
  // Keep token around for logging or advanced checks, but always respond with 200 unless DB fails.
  const token = process.env.HEALTHCHECK_TOKEN?.trim();
  const provided = _req.headers.get("x-health-token")?.trim();
  if (token && (!provided || provided !== token)) {
    // token mismatch — do not block; continue to perform health checks but note mismatch in logs
    console.warn("healthcheck token mismatch");
  }

  const env = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    DIRECT_URL: !!process.env.DIRECT_URL,
    STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
    FIREBASE_PROJECT_ID: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      status: "healthy",
      env,
      latencyMs: Date.now() - startedAt,
      ts: new Date().toISOString(),
    });
  } catch (_e) {
    console.error("healthcheck failed", _e);
    return NextResponse.json(
      { ok: false, status: "unhealthy", env, latencyMs: Date.now() - startedAt, ts: new Date().toISOString() },
      { status: 500 }
    );
  }
}
