// src/app/api/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";


export const dynamic = "force-dynamic";

// ✅ Einheitlich mit Stripe CLI API Version (und deiner aktuellen CLI-Ausgabe)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-11-17.clover",
});

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // ✅ Sofort sehen ob Route getroffen wird + ob Config stimmt
  console.log("🔔 /api/webhook HIT", {
    hasSig: !!sig,
    hasSecret: !!webhookSecret,
  });

  if (!sig || !webhookSecret) {
    console.error("❌ Webhook Secret oder Signatur fehlt");
    return NextResponse.json({ error: "Webhook config error" }, { status: 500 });
  }

  const rawBody = await req.arrayBuffer();
  const bodyBuffer = Buffer.from(rawBody);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(bodyBuffer, sig, webhookSecret);
  } catch (err: any) {
    console.error("❌ Stripe Webhook Signature Error:", err?.message ?? err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log("✅ Stripe event verified:", event.type);

  // ✅ Wir verarbeiten nur das, was wir brauchen
  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  const productId = session.metadata?.productId ?? null;
  const buyerId = session.metadata?.buyerId ?? null;
  const stripeSessionId = session.id;
  const amount = session.amount_total ?? 0;

  console.log("📦 checkout.session.completed", {
    productId,
    buyerId,
    stripeSessionId,
    amount,
    paymentStatus: session.payment_status,
    mode: session.mode,
  });

  if (!productId || !buyerId) {
    console.warn("⚠️ Metadata fehlt:", session.metadata);
    return NextResponse.json({ received: true });
  }

  try {
    // ✅ Produkt holen (nur was wir brauchen)
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { fileUrl: true },
    });

    // ✅ Order upsert (idempotent)
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
      select: { id: true },
    });

    console.log("✅ Order gespeichert:", order.id);

    // ✅ Wenn fileUrl fehlt, können wir keinen DownloadLink anlegen
    if (!product?.fileUrl) {
      console.warn("⚠️ Produkt hat keine fileUrl:", productId);
      return NextResponse.json({ received: true });
    }

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // ✅ DownloadLink upsert (idempotent)
    await prisma.downloadLink.upsert({
      where: { orderId: order.id },
      update: { fileUrl: product.fileUrl, expiresAt },
      create: { orderId: order.id, fileUrl: product.fileUrl, expiresAt },
    });

    console.log("📥 Download-Link erstellt/aktualisiert:", order.id);

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("❌ Fehler beim Speichern von Order/DownloadLink:", err);
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
