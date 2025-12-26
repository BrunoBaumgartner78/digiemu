import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ orderId: string }> };

function json(status: number, body: any) {
  return NextResponse.json(body, { status });
}

export async function GET(req: NextRequest, ctx: Ctx) {
  const { orderId } = await ctx.params;
  const oid = String(orderId ?? "").trim();
  if (!oid) return json(400, { ok: false, error: "missing_order_id" });

  const session = await getServerSession(auth);
  const userId = ((session?.user as any)?.id as string | undefined) ?? null;
  const role = ((session?.user as any)?.role as string | undefined) ?? null;
  const isAdmin = role === "ADMIN";

  const order = await prisma.order.findUnique({
    where: { id: oid },
    select: {
      id: true,
      buyerId: true,
      status: true,
      productId: true,
      product: { select: { vendorId: true, title: true } },
      downloadLink: {
        select: {
          id: true,
          orderId: true,
          fileUrl: true,
          expiresAt: true,
          downloadCount: true,
          maxDownloads: true,
          isActive: true,
        },
      },
    },
  });

  if (!order) return json(404, { ok: false, error: "order_not_found" });

  const isBuyer = !!userId && userId === order.buyerId;
  const isVendor = !!userId && userId === order.product.vendorId;
  if (!isAdmin && !isBuyer && !isVendor) {
    return json(403, { ok: false, error: "forbidden" });
  }

  if (!["PAID", "paid", "COMPLETED", "completed"].includes(String(order.status))) {
    return json(409, { ok: false, error: "order_not_paid" });
  }

  const dl = order.downloadLink;
  if (!dl) return json(404, { ok: false, error: "download_link_missing" });
  if (!dl.isActive) return json(410, { ok: false, error: "download_inactive" });

  const now = Date.now();
  const exp = new Date(dl.expiresAt).getTime();
  if (Number.isFinite(exp) && now > exp) {
    return json(410, { ok: false, error: "download_expired", expiresAt: dl.expiresAt });
  }

  const remaining = (dl.maxDownloads ?? 0) - (dl.downloadCount ?? 0);
  if (remaining <= 0) {
    return json(429, { ok: false, error: "download_limit_reached", maxDownloads: dl.maxDownloads });
  }

  const updated = await prisma.downloadLink.updateMany({
    where: {
      id: dl.id,
      isActive: true,
      expiresAt: { gt: new Date() },
      downloadCount: { lt: dl.maxDownloads },
    },
    data: { downloadCount: { increment: 1 } },
  });

  if (updated.count !== 1) return json(429, { ok: false, error: "download_limit_race" });

  return NextResponse.redirect(dl.fileUrl, 302);
}
