// src/app/api/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    console.error("❌ Webhook Secret oder Signatur fehlt");
    return NextResponse.json(
      { error: "Webhook config error" },
      { status: 500 }
    );
  }

  const rawBody = await req.arrayBuffer();
  const bodyBuffer = Buffer.from(rawBody);

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(bodyBuffer, sig, webhookSecret);
  } catch (err: any) {
    console.error("❌ Stripe Webhook Signature Error:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const productId       = session.metadata?.productId;
    const buyerId         = session.metadata?.buyerId;
    const stripeSessionId = session.id;
    const amount          = session.amount_total ?? 0;

    console.log("📦 Webhook Session:", {
      productId,
      buyerId,
      stripeSessionId,
      amount,
    });

    if (!productId || !buyerId) {
      console.warn("⚠️ Metadata fehlt:", session.metadata);
      return NextResponse.json({ received: true });
    }

    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { fileUrl: true },
      });

      const order = await prisma.order.upsert({
        where: { stripeSessionId },
        update: {
          status: "PAID",
          amountCents: amount,
        },
        create: {
          productId,
          buyerId,
          stripeSessionId,
          status: "PAID",
          amountCents: amount,
        },
      });

      console.log("✅ Order gespeichert:", order.id);

      if (product?.fileUrl) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await prisma.downloadLink.upsert({
          where: { orderId: order.id },
          update: {
            fileUrl: product.fileUrl,
            expiresAt,
          },
          create: {
            orderId: order.id,
            fileUrl: product.fileUrl,
            expiresAt,
          },
        });

        console.log("📥 Download-Link erstellt/aktualisiert:", order.id);
      } else {
        console.warn("⚠️ Produkt hat keine fileUrl:", productId);
      }
    } catch (err) {
      console.error("❌ Fehler beim Speichern von Order/DownloadLink:", err);
      return NextResponse.json({ received: true });
    }
  }

  return NextResponse.json({ received: true });
}
