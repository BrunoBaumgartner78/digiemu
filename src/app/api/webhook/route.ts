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
    return NextResponse.json({ error: "Webhook config error" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error("❌ Webhook signature verification failed:", err?.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const orderId = session.metadata?.orderId;
      if (!orderId) {
        console.warn("⚠️ checkout.session.completed without metadata.orderId");
        return NextResponse.json({ ok: true });
      }

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { product: { select: { fileUrl: true } } },
      });

      if (!order) {
        console.warn("⚠️ Order not found:", orderId);
        return NextResponse.json({ ok: true });
      }

      const fileUrl = order.product?.fileUrl ?? null;
      if (!fileUrl) {
        console.warn("⚠️ product.fileUrl missing for order:", orderId);
        // trotzdem PAID setzen, aber kein DownloadLink möglich
      }

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const maxDownloads = 3;

      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: "PAID",
            stripeSessionId: session.id,
          } as any,
        });

        if (fileUrl) {
          await tx.downloadLink.upsert({
            where: { orderId: order.id },
            create: {
              orderId: order.id,
              fileUrl: String(fileUrl),
              expiresAt,
              maxDownloads,
              downloadCount: 0,
              isActive: true,
            },
            update: {
              fileUrl: String(fileUrl),
              expiresAt,
              maxDownloads,
              isActive: true,
            },
          });
        }
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("❌ Webhook handler failed:", err?.message);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
