import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/guards/authz";
import { prisma } from "@/lib/prisma";
import { PayoutStatus } from "@/generated/prisma";

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

  const totalEarnings = vendor.products
    .flatMap((p) => p.orders.map((o) => o.vendorEarningsCents ?? 0))
    .reduce((a, b) => a + b, 0);

  // Wichtig: alreadyPaid = PAID + optional PENDING? -> NEIN, nur PAID
  const alreadyPaid = vendor.payouts
    .filter((p) => p.status === PayoutStatus.PAID)
    .reduce((sum, p) => sum + p.amountCents, 0);

  const pendingAmount = Math.max(totalEarnings - alreadyPaid, 0);

  if (pendingAmount <= 0) {
    return NextResponse.json({ message: "Kein ausstehender Betrag" }, { status: 400 });
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
