import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/guards/authz";
import { prisma } from "@/lib/prisma";
import { ProductStatus, VendorStatus, PayoutStatus, Role } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: Request) {
  const maybe = await requireAdminApi();
  if (maybe instanceof NextResponse) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const session = maybe;
  const userId = session.user.id;

  const form = await _req.formData();
  const vendorId = String(form.get("vendorId") ?? "").trim();
  const returnTo = String(form.get("returnTo") ?? "").trim();

  if (!vendorId) {
    return NextResponse.json({ message: "vendorId fehlt" }, { status: 400 });
  }

  // ✅ Guard: Gibt es schon einen Pending-Payout? Dann wiederverwenden.
  const existingPending = await prisma.payout.findFirst({
    where: { vendorId, status: PayoutStatus.PENDING },
    orderBy: { createdAt: "desc" },
  });

  if (existingPending) {
    const redirectUrl = returnTo || `/admin/payouts/vendor/${vendorId}`;
    return NextResponse.redirect(new URL(redirectUrl, _req.url));
  }

  // Pending berechnen (wie in deiner Page)
  const vendor = await prisma.user.findUnique({
    where: { id: vendorId },
    include: {
      products: { include: { orders: { select: { vendorEarningsCents: true } } } },
      payouts: true,
    },
  });

  if (!vendor) {
    return NextResponse.json({ message: "Vendor nicht gefunden" }, { status: 404 });
  }

  // 4. Vendor-Earnings berechnen (nur bezahlte/abgeschlossene Orders)
  const orders = await prisma.order.findMany({
    where: { status: { in: ["PAID", "COMPLETED"] }, product: { vendorId: vendor.id } },
    select: { amountCents: true, vendorEarningsCents: true, platformEarningsCents: true },
  });

  const splitVendorFallback = (order: { amountCents?: number; vendorEarningsCents?: number | null; platformEarningsCents?: number | null }) => {
    const amount = order.amountCents ?? 0;
    const v = order.vendorEarningsCents ?? 0;
    const p = order.platformEarningsCents ?? 0;
    if (v === 0 && p === 0 && amount > 0) {
      const platform = Math.round(amount * 0.2);
      const vendorShare = amount - platform;
      return vendorShare;
    }
    return v;
  };

  const totalEarnings = orders.reduce((sum, o) => sum + splitVendorFallback(o as any), 0);

  // bereits ausgezahlt
  const alreadyPaid = vendor.payouts
    .filter((p) => p.status === PayoutStatus.PAID)
    .reduce((acc, p) => acc + p.amountCents, 0);

  // bereits angefragt (PENDING reserviert Geld)
  const pendingRequested = vendor.payouts
    .filter((p) => p.status === PayoutStatus.PENDING)
    .reduce((acc, p) => acc + p.amountCents, 0);

  const pendingAmount = Math.max(totalEarnings - alreadyPaid - pendingRequested, 0);

  if (pendingAmount <= 0) {
    return NextResponse.json(
      { error: "No pending payout amount for this vendor." },
      { status: 409 }
    );
  }

  try {
    await prisma.payout.create({
      data: {
        vendorId,
        amountCents: pendingAmount,
        status: PayoutStatus.PENDING,
      },
    });
  } catch (e: unknown) {
    // If the partial unique index triggers under concurrency,
    // just redirect back (another request created the pending payout).
    const redirectUrl = returnTo || `/admin/payouts/vendor/${vendorId}`;
    return NextResponse.redirect(new URL(redirectUrl, _req.url));
  }

  const redirectUrl = returnTo || `/admin/payouts/vendor/${vendorId}`;
  return NextResponse.redirect(new URL(redirectUrl, _req.url));
}
