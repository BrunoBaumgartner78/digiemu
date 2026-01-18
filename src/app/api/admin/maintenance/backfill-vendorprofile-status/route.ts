import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/guards/authz";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const maybe = await requireAdminApi();
  if (maybe instanceof NextResponse) return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  const session = maybe;

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
