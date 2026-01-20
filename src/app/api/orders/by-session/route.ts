import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) return NextResponse.json({ ready: false, reason: "MISSING_SESSION_ID" }, { status: 400 });

  // Find order by stripeSessionId
  const order = await prisma.order.findUnique({
    where: { stripeSessionId: sessionId },
    select: { id: true, status: true, downloadLink: { select: { id: true } } },
  });

  if (!order) {
    return NextResponse.json({ ready: false, reason: "ORDER_NOT_READY" }, { status: 200 });
  }

  const hasDownload = !!order.downloadLink?.id;
  // Delivery is ready once COMPLETED and a download link exists
  const ready = order.status === "COMPLETED" && hasDownload;

  return NextResponse.json({ ready, orderId: order.id, status: order.status, hasDownload }, { status: 200 });
}
