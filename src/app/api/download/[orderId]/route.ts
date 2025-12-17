// src/app/api/download/[orderId]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ orderId: string }> };

function isPrefetch(req: Request) {
  const purpose = (req.headers.get("purpose") || req.headers.get("sec-purpose") || "").toLowerCase();
  const fetchMode = (req.headers.get("sec-fetch-mode") || "").toLowerCase();
  return purpose.includes("prefetch") || fetchMode === "prefetch";
}

export async function HEAD() {
  return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}

export async function GET(req: Request, ctx: Ctx) {
  const { orderId } = await ctx.params;

  if (isPrefetch(req)) {
    return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  }

  const session = await getServerSession(auth);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { downloadLink: true },
  });

  if (!order || order.buyerId !== userId) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  if (order.status !== "PAID") {
    return NextResponse.json({ error: "NOT_PAID" }, { status: 409 });
  }

  const link = order.downloadLink;
  if (!link?.fileUrl) return NextResponse.json({ error: "NO_LINK" }, { status: 404 });

  const now = new Date();
  if (!link.isActive) return NextResponse.json({ error: "INACTIVE" }, { status: 410 });
  if (link.expiresAt.getTime() < now.getTime()) return NextResponse.json({ error: "EXPIRED" }, { status: 410 });
  if (link.downloadCount >= link.maxDownloads) return NextResponse.json({ error: "DOWNLOAD_LIMIT_REACHED" }, { status: 429 });

  // ✅ zählen bei "echtem" GET (nicht Prefetch). Das reicht.
  const updated = await prisma.downloadLink.updateMany({
    where: {
      orderId: order.id,
      isActive: true,
      downloadCount: { lt: link.maxDownloads },
      expiresAt: { gt: now },
    },
    data: { downloadCount: { increment: 1 } },
  });

  if (updated.count !== 1) {
    return NextResponse.json({ error: "DOWNLOAD_NOT_ALLOWED" }, { status: 429 });
  }

  return NextResponse.redirect(link.fileUrl, {
    status: 303,
    headers: { "Cache-Control": "no-store" },
  });
}
