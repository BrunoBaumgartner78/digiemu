import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toErrorMessage } from "@/lib/errors";

function maskUrl(url?: string) {
  if (!url) return "";
  try {
    const u = new URL(url);
    if (u.password) u.password = "****";
    if (u.username) u.username = "****";
    return u.toString();
  } catch {
    return "[invalid url]";
  }
}

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const isMock = url.searchParams.get("mock") === "true";

  const dbUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;

  if (isMock) {
    const env = process.env.NODE_ENV || "development";
    if (env === "production") {
      return NextResponse.json({ ok: false, error: "mock disabled in production" }, { status: 404 });
    }
    return NextResponse.json({
      ok: true,
      mock: true,
      env,
      databaseUrlSet: !!dbUrl,
      directUrlSet: !!directUrl,
      databaseUrlMasked: maskUrl(dbUrl),
      directUrlMasked: maskUrl(directUrl),
      note: "Mock response (no prisma connect). Remove when DB is available.",
    });
  }

  try {
    await prisma.$connect();
    const result = await prisma.$queryRaw`SELECT 1 as ok`;
    await prisma.$disconnect();

    return NextResponse.json({
      ok: true,
      env: process.env.NODE_ENV ?? null,
      databaseUrlSet: !!dbUrl,
      directUrlSet: !!directUrl,
      databaseUrlMasked: maskUrl(dbUrl),
      directUrlMasked: maskUrl(directUrl),
      query: result,
    });
  } catch (e: unknown) {
    const code = (e as any)?.code ?? null
    return NextResponse.json(
      {
        ok: false,
        env: process.env.NODE_ENV ?? null,
        databaseUrlSet: !!dbUrl,
        directUrlSet: !!directUrl,
        databaseUrlMasked: maskUrl(dbUrl),
        directUrlMasked: maskUrl(directUrl),
        error: toErrorMessage(e),
        code,
      },
      { status: 500 }
    );
  }
}
