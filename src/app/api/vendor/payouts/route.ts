import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "VENDOR") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const vendor = await prisma.vendorProfile.findUnique({ where: { userId: session.user.id } });
  if (!vendor) return NextResponse.json({ ok: false, error: "No VendorProfile" }, { status: 403 });

  const url = new URL(req.url);
  const range = url.searchParams.get("range") ?? "30";

  const where: any = { vendorId: session.user.id };
  if (range !== "all") {
    const days = Number(range) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    where.createdAt = { gte: since };
  }

  const payouts = await prisma.payout.findMany({ where, orderBy: { createdAt: "desc" } });

  // Summary aggregates (mirror vendor dashboard logic)
  const paidLikeStatuses = ["PAID", "paid", "COMPLETED", "completed", "SUCCESS", "success"];

  // totalEarnings: sum vendorEarningsCents from paid orders
  const hasOrderItemAggregate = typeof (prisma as any).orderItem?.aggregate === "function";
  let totalEarnings = 0;

  if (hasOrderItemAggregate) {
    const agg = await (prisma as any).orderItem.aggregate({
      _sum: { vendorEarningsCents: true },
      where: { vendorId: session.user.id, order: { status: { in: paidLikeStatuses } } },
    });
    totalEarnings = agg?._sum?.vendorEarningsCents ?? 0;
  } else {
    const agg = await prisma.order.aggregate({
      _sum: { vendorEarningsCents: true },
      where: { product: { vendorId: session.user.id }, status: { in: paidLikeStatuses as any } },
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
