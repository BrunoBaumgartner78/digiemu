import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null) as
      | { vendorProfileId?: string; productId?: string; source?: string }
      | null;

    const vendorProfileId = body?.vendorProfileId?.trim();
    if (!vendorProfileId) {
      return NextResponse.json({ error: "MISSING_VENDOR" }, { status: 400 });
    }

    // If you already have AuditLog, reuse it:
    await prisma.auditLog.create({
      data: {
        actorId: "system", // optional; if you want real users later, pass from session
        action: "SELLER_PROFILE_CLICK",
        targetType: "VENDOR_PROFILE",
        targetId: vendorProfileId,
        meta: {
          productId: body?.productId ?? null,
          source: body?.source ?? "unknown",
          ts: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
  }
}
