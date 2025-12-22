import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-11-17.clover" as any,
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

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // Wichtig: wir können die Order auch OHNE metadata finden:
      const stripeSessionId = session.id;

      // Order finden
      const order = await prisma.order.findUnique({
        where: { stripeSessionId },
        include: { product: true },
      });

      if (!order) {
        console.error("❌ Order not found for session:", stripeSessionId);
        return NextResponse.json({ received: true }, { status: 200 });
      }

      // Idempotent: falls schon PAID + downloadLink existiert -> fertig
      const existing = await prisma.downloadLink.findUnique({ where: { orderId: order.id } });
      if (!existing) {
        // DownloadLink anlegen (48h Beispiel)
        const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

        await prisma.downloadLink.create({
          data: {
            orderId: order.id,
            fileUrl: order.product.fileUrl,
            expiresAt,
            maxDownloads: 3,
            isActive: true,
          },
        });
      }

      // Order auf PAID setzen + Earnings berechnen
      const amount = order.amountCents;
      const vendorEarnings = Math.round(amount * 0.8);
      const platformEarnings = amount - vendorEarnings;

      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "PAID",
          vendorEarningsCents: vendorEarnings,
          platformEarningsCents: platformEarnings,
        },
      });
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err: any) {
    console.error("❌ Webhook handler error:", err);
    return NextResponse.json(
      { message: err?.message ?? "Webhook handler failed" },
      { status: 500 }
    );
  }
}
