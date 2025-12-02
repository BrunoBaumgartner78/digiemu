import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Zählt die Einträge in der Tabelle "User" direkt in Postgres
    const result = await prisma.$queryRawUnsafe<{ count: number }[]>(
      `SELECT COUNT(*)::int AS count FROM "User";`
    );

    const count = result[0]?.count ?? 0;

    return NextResponse.json({ ok: true, users: count });
  } catch (error) {
    console.error("Debug users error:", error);
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 }
    );
  }
}
