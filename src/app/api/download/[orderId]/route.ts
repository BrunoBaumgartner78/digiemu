import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, ctx: { params: Promise<{ orderId: string }> }) {
  const session = await getServerSession(auth);
  const userId = (session?.user as any)?.id as string | undefined;

  if (!userId) {
    return NextResponse.redirect(new URL("/auth/login", req.url), { status: 303 });
  }

  const { orderId } = await ctx.params;
  const id = String(orderId || "").trim();
  if (!id) return NextResponse.json({ error: "orderId required" }, { status: 400 });

  const order = await prisma.order.findUnique({
    where: { id },
    include: { downloadLink: true },
  });

  if (!order) return NextResponse.json({ error: "ORDER_NOT_FOUND" }, { status: 404 });
  if (order.buyerId !== userId) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const dl = order.downloadLink;
  if (!dl || !dl.isActive) return NextResponse.json({ error: "DOWNLOAD_NOT_READY" }, { status: 409 });

  const now = new Date();
  if (dl.expiresAt < now) return NextResponse.json({ error: "DOWNLOAD_EXPIRED" }, { status: 410 });
  if (dl.downloadCount >= dl.maxDownloads) return NextResponse.json({ error: "DOWNLOAD_LIMIT" }, { status: 429 });

  // Zähler erhöhen (atomar)
  await prisma.downloadLink.update({
    where: { id: dl.id },
    data: { downloadCount: { increment: 1 } },
  });

  // Browser download: redirect zur fileUrl
  return NextResponse.redirect(dl.fileUrl, { status: 302 });
}
