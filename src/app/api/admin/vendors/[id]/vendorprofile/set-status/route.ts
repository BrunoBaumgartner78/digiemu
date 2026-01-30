import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/guards/authz";
import { prisma } from "@/lib/prisma";
import { isRecord, getStringProp, getErrorMessage } from "@/lib/guards";
import type { VendorStatus } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const maybe = await requireAdminApi();
  if (maybe instanceof NextResponse) return NextResponse.json({ message: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });

  const userId = (params?.id ?? "").toString();
  const bodyUnknown = await _req.json().catch(() => null);
  const nextStatus = (isRecord(bodyUnknown) ? (getStringProp(bodyUnknown, "status") ?? "") : "").toUpperCase();

  if (!userId) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  if (!["PENDING", "APPROVED", "BLOCKED"].includes(nextStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    await prisma.vendorProfile.upsert({
      where: { userId },
      update: { status: nextStatus as VendorStatus },
      create: {
        userId,
        displayName: null,
        slug: `vendor-${userId.slice(0, 8)}`,
        isPublic: false,
        status: nextStatus as VendorStatus,
      },
    });

    return NextResponse.json({ ok: true }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (e: unknown) {
    console.error("[admin-vendorprofile-set-status]", getErrorMessage(e));
    return NextResponse.json({ message: getErrorMessage(e) }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
