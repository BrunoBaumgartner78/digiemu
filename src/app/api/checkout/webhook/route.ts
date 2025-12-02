import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-11-17.clover" });

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const buf = await req.arrayBuffer();
  let event;
  try {
    event = stripe.webhooks.constructEvent(Buffer.from(buf), sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (_err) {
    return NextResponse.json({ ok: false, error: "Webhook Error" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const productId = session.metadata?.productId;
    const buyerId = session.metadata?.buyerId;
    const amountCents = session.amount_total;
    const stripeSessionId = session.id;
    // Produktdaten holen
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return NextResponse.json({ ok: false, error: "Product not found" }, { status: 404 });
    // Order speichern
    if (!buyerId || !productId) {
      return NextResponse.json({ ok: false, error: "Missing buyerId or productId" }, { status: 400 });
    }
    const order = await prisma.order.create({
      data: {
        buyerId,
        productId,
        amountCents: amountCents ?? 0,
        stripeSessionId,
        status: "COMPLETED",
      },
    });
    // DownloadLink mit Ablaufdatum (+7 Tage) speichern
    await prisma.downloadLink.create({
      data: {
        orderId: order.id,
        fileUrl: product.fileUrl,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  }

  return NextResponse.json({ received: true });
}
