import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const startedAt = Date.now();

  const token = process.env.HEALTHCHECK_TOKEN?.trim();
  if (token) {
    const provided = req.headers.get("x-health-token")?.trim();
    if (!provided || provided !== token) {
      return NextResponse.json({ ok: false, status: "forbidden" }, { status: 403 });
    }
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
  } catch (e) {
    console.error("healthcheck failed", e);
    return NextResponse.json(
      { ok: false, status: "unhealthy", env, latencyMs: Date.now() - startedAt, ts: new Date().toISOString() },
      { status: 500 }
    );
  }
}
