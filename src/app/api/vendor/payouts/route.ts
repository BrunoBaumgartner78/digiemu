import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireVendorApi } from "@/lib/guards/authz";
import type { Prisma } from "@/generated/prisma";

export async function GET(_req: Request) {
  const maybe = await requireVendorApi();
  if (maybe instanceof NextResponse) return maybe;
  const session = maybe;
  const userId = session.user.id;

  const vendor = await prisma.vendorProfile.findUnique({ where: { userId } });
  if (!vendor) return NextResponse.json({ ok: false, error: "No VendorProfile" }, { status: 403 });

  const url = new URL(_req.url);
  const range = url.searchParams.get("range") ?? "30";

  const where: Prisma.PayoutWhereInput = { vendorId: userId };
  if (range !== "all") {
    const days = Number(range) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    where.createdAt = { gte: since };
  }

  const payouts = await prisma.payout.findMany({ where, orderBy: { createdAt: "desc" } });

  // Summary aggregates (mirror vendor dashboard logic)
  const paidLikeStatuses = ["PAID", "paid", "COMPLETED", "completed", "SUCCESS", "success"];

  // totalEarnings: sum vendorEarningsCents from paid orders
  const orderItemAggregateFn = (prisma as unknown as { orderItem?: { aggregate?: unknown } }).orderItem?.aggregate;
  const hasOrderItemAggregate = typeof orderItemAggregateFn === "function";
  let totalEarnings = 0;

  if (hasOrderItemAggregate) {
    type OrderItemAggregateFn = (args: {
      _sum?: { vendorEarningsCents?: true };
      where?: unknown;
    }) => Promise<{ _sum?: { vendorEarningsCents?: number } } | null>;

    const agg = await (orderItemAggregateFn as OrderItemAggregateFn)({
      _sum: { vendorEarningsCents: true },
      where: { vendorId: session.user.id, order: { status: { in: paidLikeStatuses } } },
    });
    totalEarnings = agg?._sum?.vendorEarningsCents ?? 0;
  } else {
    const agg = await prisma.order.aggregate({
      _sum: { vendorEarningsCents: true },
      where: { product: { vendorId: session.user.id }, status: { in: paidLikeStatuses } },
    });
    totalEarnings = agg._sum.vendorEarningsCents ?? 0;
  }

  const paidAgg = await prisma.payout.aggregate({ _sum: { amountCents: true }, where: { vendorId: session.user.id, status: "PAID" } });
  const alreadyPaid = paidAgg._sum.amountCents ?? 0;

  const pendingAgg = await prisma.payout.aggregate({ _sum: { amountCents: true }, where: { vendorId: session.user.id, status: "PENDING" } });
  const pendingRequested = pendingAgg._sum.amountCents ?? 0;

  const available = Math.max(totalEarnings - alreadyPaid - pendingRequested, 0);

  return NextResponse.json({ ok: true, payouts, summary: { totalEarnings, alreadyPaid, pendingRequested, available } });
}
