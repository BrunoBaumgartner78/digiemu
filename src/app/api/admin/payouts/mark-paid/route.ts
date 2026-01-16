import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user?.id || user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const payoutId = String(form.get("payoutId") ?? "").trim();
  const returnTo = String(form.get("returnTo") ?? "").trim();

  if (!payoutId) {
    return NextResponse.json({ message: "payoutId fehlt" }, { status: 400 });
  }

  const payout = await prisma.payout.update({
    where: { id: payoutId },
    data: { status: "PAID" } as any,
  });

  // Fix: ensure correct precedence when computing redirect URL
  const vendorId = (payout as any)?.vendorId as string | undefined;
  const redirectUrl = returnTo || (vendorId ? `/admin/payouts/vendor/${vendorId}` : "/admin/payouts");

  return NextResponse.redirect(new URL(redirectUrl, req.url));
}
