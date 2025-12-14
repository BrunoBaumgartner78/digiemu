import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const env = process.env.NODE_ENV === "production" ? "prod" : "dev";

  try {
    // 1) DB reachable?
    await prisma.$queryRaw`SELECT 1`;

    // 2) Critical table exists? (Order)
    const rows = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'Order'
      ) AS exists
    `;
    const orderTableExists = rows?.[0]?.exists ?? false;

    return NextResponse.json(
      {
        ok: orderTableExists,
        timestamp: new Date().toISOString(),
        env,
        db: "ok",
        tables: {
          Order: orderTableExists ? "ok" : "missing",
        },
      },
      { status: orderTableExists ? 200 : 500 }
    );
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        timestamp: new Date().toISOString(),
        env,
        db: "down",
        error: e?.message ?? String(e),
      },
      { status: 500 }
    );
  }
}
