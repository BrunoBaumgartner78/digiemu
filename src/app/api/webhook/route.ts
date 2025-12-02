import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature")!;
  const textBody = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      textBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("❌ Webhook signature error:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;

    const productId = session.metadata.productId;
    const buyerId = session.metadata.userId;

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      console.error("❌ Produkt fehlt in Webhook");
      return NextResponse.json({ received: true });
    }

    // Bestellung speichern
    const order = await prisma.order.create({
      data: {
        buyerId,
        productId,
        stripeSessionId: session.id,
        amountCents: session.amount_total,
        status: "COMPLETED",
      },
    });

    // Download-Link erzeugen (7 Tage gültig)
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
