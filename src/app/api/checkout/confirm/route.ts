import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";



export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ ready: false, reason: "MISSING_SESSION_ID" }, { status: 400 });
  }

  // 1) Stripe Session check
  const sClient = getStripe();
  const s = await sClient.checkout.sessions.retrieve(sessionId);

  // payment_status ist i.d.R. "paid" wenn ok
  if (s.payment_status !== "paid") {
    return NextResponse.json({ ready: false, reason: "NOT_PAID_YET" }, { status: 200 });
  }

  // 2) Order suchen
  const order = await prisma.order.findUnique({
    where: { stripeSessionId: sessionId },
    select: { id: true, status: true },
  });

  if (!order) {
    // Webhook ist noch nicht da → wir warten weiter (oder du erstellst hier eine Order, wenn du willst)
    return NextResponse.json({ ready: false, reason: "ORDER_NOT_READY" }, { status: 200 });
  }

  // optional: wenn du willst, dass success erst bei PAID weiterleitet:
  if (order.status !== "PAID") {
    return NextResponse.json({ ready: false, reason: "ORDER_NOT_MARKED_PAID" }, { status: 200 });
  }

  return NextResponse.json({ ready: true, orderId: order.id }, { status: 200 });
}
