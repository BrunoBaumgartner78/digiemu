import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/guards/authz";
import { prisma } from "@/lib/prisma";
import { ProductStatus, VendorStatus, PayoutStatus, Role } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: Request) {
  const maybe = await requireAdminApi();
  if (maybe instanceof NextResponse) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const _session = maybe;
  const __userId = _session.user.id;

  const form = await _req.formData();
  const payoutId = String(form.get("payoutId") ?? "").trim();
  const returnTo = String(form.get("returnTo") ?? "").trim();

  if (!payoutId) {
    return NextResponse.json({ message: "payoutId fehlt" }, { status: 400 });
  }

  const payout = await prisma.payout.update({
    where: { id: payoutId },
    data: { status: PayoutStatus.PAID },
  });

  // Fix: ensure correct precedence when computing redirect URL
  const vendorId = payout.vendorId as string | undefined;
  const redirectUrl = returnTo || (vendorId ? `/admin/payouts/vendor/${vendorId}` : "/admin/payouts");

  return NextResponse.redirect(new URL(redirectUrl, _req.url));
}

