// src/app/api/admin/payouts/mark-paid/route.ts
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/guards/authz";
import { prisma } from "@/lib/prisma";
import { getStringProp, isRecord } from "@/lib/guards";
import { PayoutStatus } from "@prisma/client";
import { auditAdminMutation } from "@/lib/admin/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function readRequestBody(req: Request): Promise<{ payoutId: string }> {
  const ct = (req.headers.get("content-type") || "").toLowerCase();

  if (ct.includes("application/json")) {
    const json = await req.json().catch(() => null);
    return { payoutId: isRecord(json) ? (getStringProp(json, "payoutId") ?? "") : "" };
  }

  if (ct.includes("multipart/form-data") || ct.includes("application/x-www-form-urlencoded")) {
    const form = await req.formData().catch(() => null);
    return { payoutId: String(form?.get("payoutId") ?? "").trim() };
  }

  const json = await req.json().catch(() => null);
  return { payoutId: isRecord(json) ? (getStringProp(json, "payoutId") ?? "") : "" };
}

export async function POST(_req: Request) {
  const sessionOrResp = await requireAdminApi();
  if (sessionOrResp instanceof NextResponse) return sessionOrResp;
  const adminUserId = sessionOrResp.user.id;

  const { payoutId } = await readRequestBody(_req);

  if (!payoutId) {
    return NextResponse.json({ error: "Missing payoutId" }, { status: 400 });
  }

  const payout = await prisma.payout.findUnique({
    where: { id: payoutId },
    select: { id: true, status: true, paidAt: true },
  });

  if (!payout) {
    return NextResponse.json({ error: "Payout not found" }, { status: 404 });
  }

  // mark-paid must be idempotent.
  if (payout.status === PayoutStatus.PAID) {
    await auditAdminMutation({
      adminUserId,
      action: "ADMIN_PAYOUT_MARK_PAID_NOOP",
      entityType: "Payout",
      entityId: payout.id,
      before: { status: payout.status, paidAt: payout.paidAt?.toISOString() ?? null },
      after: { status: payout.status, paidAt: payout.paidAt?.toISOString() ?? null },
      note: "already paid",
      request: _req,
    });
    return NextResponse.json({
      ok: true,
      payoutId: payout.id,
      status: payout.status,
      alreadyPaid: true,
    });
  }

  if (payout.status === PayoutStatus.CANCELLED) {
    return NextResponse.json(
      {
        error: "Cancelled payouts cannot be marked as paid.",
        payoutId: payout.id,
        status: payout.status,
        alreadyPaid: false,
      },
      { status: 409 }
    );
  }

  if (payout.status !== PayoutStatus.PENDING) {
    return NextResponse.json(
      {
        error: `Unsupported payout status: ${payout.status}`,
        payoutId: payout.id,
        status: payout.status,
        alreadyPaid: false,
      },
      { status: 409 }
    );
  }

  const paidAt = new Date();
  const updateResult = await prisma.payout.updateMany({
    where: { id: payout.id, status: PayoutStatus.PENDING },
    data: { status: PayoutStatus.PAID, paidAt },
  });

  if (updateResult.count === 0) {
    const current = await prisma.payout.findUnique({
      where: { id: payout.id },
      select: { id: true, status: true, paidAt: true },
    });

    if (current?.status === PayoutStatus.PAID) {
      await auditAdminMutation({
        adminUserId,
        action: "ADMIN_PAYOUT_MARK_PAID_NOOP",
        entityType: "Payout",
        entityId: current.id,
        before: { status: payout.status, paidAt: payout.paidAt?.toISOString() ?? null },
        after: { status: current.status, paidAt: current.paidAt?.toISOString() ?? null },
        note: "state changed before update; payout already paid",
        request: _req,
      });
      return NextResponse.json({
        ok: true,
        payoutId: current.id,
        status: current.status,
        alreadyPaid: true,
      });
    }

    return NextResponse.json(
      {
        error: "Payout state changed before mark-paid could be applied.",
        payoutId: current?.id ?? payout.id,
        status: current?.status ?? payout.status,
        alreadyPaid: false,
      },
      { status: 409 }
    );
  }

  await auditAdminMutation({
    adminUserId,
    action: "ADMIN_PAYOUT_MARK_PAID",
    entityType: "Payout",
    entityId: payout.id,
    before: { status: payout.status, paidAt: payout.paidAt?.toISOString() ?? null },
    after: { status: PayoutStatus.PAID, paidAt: paidAt.toISOString() },
    request: _req,
  });

  return NextResponse.json({
    ok: true,
    payoutId: payout.id,
    status: PayoutStatus.PAID,
    alreadyPaid: false,
  });
}
