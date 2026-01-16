// src/app/api/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20" as any,
});

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = (process.env.STRIPE_WEBHOOK_SECRET ?? "").trim();

  if (!sig || !webhookSecret) {
    return NextResponse.json(
      { message: "Missing stripe-signature or STRIPE_WEBHOOK_SECRET" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    const buf = Buffer.from(await req.arrayBuffer());
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err: any) {
    console.error("❌ Webhook signature verification failed:", err?.message);
    return NextResponse.json(
      { message: `Webhook Error: ${err?.message ?? "Invalid signature"}` },
      { status: 400 }
    );
  }

  // ✅ Log damit du sicher siehst, ob Webhook ankommt
  console.log("✅ Webhook received:", event.type);

  // ✅ Idempotency guard: Stripe kann das gleiche Event mehrfach senden.
  // Wir "claimen" event.id in der DB. Wenn bereits vorhanden, ist das Event dupliziert.
  try {
    await prisma.stripeWebhookEvent.create({
      data: {
        eventId: event.id,
        type: event.type,
      },
    });
  } catch (e: any) {
    // Prisma unique violation => already processed
    // P2002 = Unique constraint failed
    if (e?.code === "P2002") {
      console.log("↩️ Duplicate webhook event ignored:", event.id, event.type);
      return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
    }
    console.error("❌ stripeWebhookEvent.create failed:", e);
    return NextResponse.json({ received: true }, { status: 200 });
  }

  try {
    if (event.type !== "checkout.session.completed") {
      // already guarded; acknowledge
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const eventSession = event.data.object as Stripe.Checkout.Session;

    // ✅ Session frisch holen (stabiler als event.data.object)
    const session = await stripe.checkout.sessions.retrieve(eventSession.id);

    const stripeSessionId = session.id;

    // Optional: Extra-Safety (sollte bei completed eigentlich paid sein)
    if (session.payment_status !== "paid") {
      console.warn("⚠ checkout.session.completed but payment_status != paid:", {
        stripeSessionId,
        payment_status: session.payment_status,
      });
      // trotzdem 200 zurückgeben, Stripe soll nicht dauernd retryen
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // 1) Order via stripeSessionId
    let order = await prisma.order.findUnique({
      where: { stripeSessionId },
      include: { product: true },
    });

    // 2) Fallback via metadata.orderId
    const metaOrderId = session.metadata?.orderId ? String(session.metadata.orderId) : null;
    if (!order && metaOrderId) {
      order = await prisma.order.findUnique({
        where: { id: metaOrderId },
        include: { product: true },
      });
    }

    if (!order) {
      console.error("❌ Order not found for session:", stripeSessionId, "metadata:", session.metadata);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    if (!order.product?.fileUrl) {
      console.error("❌ Product fileUrl missing; cannot create downloadLink.", {
        orderId: order.id,
        productId: order.productId,
      });
      // Order kann trotzdem auf PAID gesetzt werden (je nach Geschmack)
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "PAID" },
      });
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // ✅ Idempotent + atomar
    await prisma.$transaction(async (tx) => {
      // 1) DownloadLink nur anlegen, falls nicht vorhanden
      const existing = await tx.downloadLink.findUnique({
        where: { orderId: order!.id },
      });

      if (!existing) {
        const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

        await tx.downloadLink.create({
          data: {
            orderId: order!.id,
            fileUrl: order!.product.fileUrl,
            expiresAt,
            maxDownloads: 3,
            isActive: true,
          },
        });
      }

      // 2) Earnings + Order PAID
      const amount = order!.amountCents ?? 0;
      const vendorEarnings = Math.round(amount * 0.8);
      const platformEarnings = amount - vendorEarnings;

      await tx.order.update({
        where: { id: order!.id },
        data: {
          status: "PAID",
          vendorEarningsCents: vendorEarnings,
          platformEarningsCents: platformEarnings,
        },
      });
    });

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err: any) {
    console.error("❌ Webhook handler error:", err);
    return NextResponse.json(
      { message: err?.message ?? "Webhook handler failed" },
      { status: 500 }
    );
  }
}
