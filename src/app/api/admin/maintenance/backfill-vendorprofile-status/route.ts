import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const result = await prisma.vendorProfile.updateMany({
      // TypeScript/Prisma enums are strict; cast null to any for this one-time backfill.
      where: { status: null as any },
      data: { status: "PENDING" },
    });

    return NextResponse.json({ ok: true, updatedCount: result.count }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (e: any) {
    console.error("[admin-backfill-vendorprofile-status]", e);
    return NextResponse.json({ message: e?.message ?? "Server error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
