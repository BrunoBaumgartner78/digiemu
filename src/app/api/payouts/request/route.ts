import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { requireVendorApi } from "@/lib/guards/authz";
import { prisma } from "@/lib/prisma";
import { splitVendorFallback } from "@/lib/payouts/splitVendorFallback";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const sessionOrResp = await requireVendorApi();
  if (sessionOrResp instanceof NextResponse) return sessionOrResp;
  const session = sessionOrResp as Session;
  const vendorId = session.user.id;

  // 1) Sum vendor earnings of PAID orders for this vendor
  const orders = await prisma.order.findMany({
    where: { status: { in: ["PAID", "COMPLETED"] }, product: { vendorId } },
    select: { amountCents: true, vendorEarningsCents: true, platformEarningsCents: true },
  });

  const totalEarnings = orders.reduce((sum, o) => sum + splitVendorFallback(o), 0);

  // 2) Sum already PAID payouts
  const paidAgg = await prisma.payout.aggregate({
    _sum: { amountCents: true },
    where: { vendorId, status: "PAID" },
  });
  const alreadyPaid = paidAgg._sum.amountCents ?? 0;

  // 3) Sum pending payout requests (lock money)
  const pendingAgg = await prisma.payout.aggregate({
    _sum: { amountCents: true },
    where: { vendorId, status: "PENDING" },
  });
  const pendingRequested = pendingAgg._sum.amountCents ?? 0;

  const available = Math.max(totalEarnings - alreadyPaid - pendingRequested, 0);

  if (available <= 0) {
    return NextResponse.json({ error: "No payout available", availableCents: 0 }, { status: 409 });
  }

  // Optional: only one open request at a time
  const open = await prisma.payout.findFirst({
    where: { vendorId, status: "PENDING" },
    select: { id: true, amountCents: true },
  });
  if (open) {
    return NextResponse.json(
      { error: "Pending request exists", pendingId: open.id, pendingCents: open.amountCents },
      { status: 409 }
    );
  }

  const payout = await prisma.payout.create({
    data: {
      vendorId,
      amountCents: available,
      status: "PENDING",
    },
  });

  return NextResponse.json({ ok: true, payoutId: payout.id, amountCents: payout.amountCents });
}
