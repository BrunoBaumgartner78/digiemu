import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  try {
    // Use a raw SQL update to set NULL statuses to PENDING without casting Prisma enums.
    // This is a one-time maintenance operation and avoids `as any` enum casts.
    const result = await prisma.$executeRaw`
      UPDATE "VendorProfile" SET status = 'PENDING' WHERE status IS NULL
    `;

    return NextResponse.json({ ok: true, updatedCount: Number(result) }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (e: unknown) {
    console.error("[admin-backfill-vendorprofile-status]", e);
    return NextResponse.json({ message: String(e) ?? "Server error" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
