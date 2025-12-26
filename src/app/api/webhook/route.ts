

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { sendPurchaseEmail } from "@/lib/email";
import { LEGAL } from "@/lib/legal";

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
      const stripeSessionId = session.id;

      const metadata = (session.metadata ?? {}) as Record<string, string>;
      const productId = metadata.productId ?? metadata.product_id ?? metadata.product;
      const digitalConsent = metadata.digitalConsent === "true";

      const email =
        session.customer_details?.email ??
        (session.customer_email as string | undefined) ??
        metadata.email;

      if (!productId) {
        console.error("❌ Missing productId in session metadata for session:", stripeSessionId);
        return NextResponse.json({ received: true }, { status: 200 });
      }

      if (!email) {
        console.error("❌ Missing buyer email for session:", stripeSessionId);
        return NextResponse.json({ received: true }, { status: 200 });
      }

      if (!digitalConsent) {
        console.warn("❌ Missing digitalConsent=true in session metadata:", stripeSessionId);
        // Continue without failing Stripe; log for manual review
      }

      // Ensure buyer exists
      let buyer = await prisma.user.findUnique({ where: { email } });
      if (!buyer) {
        buyer = await prisma.user.create({ data: { email, role: "BUYER" } });
      }

      // Amount in cents from Stripe
      const amount =
        (session.amount_total as number) ??
        (session.amount_subtotal as number) ??
        0;

      // Earnings
      const vendorEarnings = Math.round(amount * 0.8);
      const platformEarnings = amount - vendorEarnings;

      // Load product
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: {
          id: true,
          fileUrl: true,
          title: true,
          priceCents: true,
          vendorId: true,
          vendorProfileId: true,
        },
      });

      if (!product) {
        console.error("❌ Product not found for id:", productId);
        return NextResponse.json({ received: true }, { status: 200 });
      }

      // Transaction: make idempotent
      const txResult = await prisma.$transaction(async (tx) => {
        const existing = await tx.order.findUnique({
          where: { stripeSessionId },
          select: { id: true, status: true, buyerId: true, productId: true },
        });

        // Determine if we should count this sale now:
        // - no existing order -> yes
        // - existing order but not PAID -> yes (status transition)
        // - existing order already PAID -> NO (idempotent)
        const shouldCountSale = !existing || existing.status !== "PAID";

        const order = await tx.order.upsert({
          where: { stripeSessionId },
          update: {
            status: "PAID",
            vendorEarningsCents: vendorEarnings,
            platformEarningsCents: platformEarnings,
            amountCents: amount,
            buyerId: buyer.id,
            productId,
          },
          create: {
            stripeSessionId,
            buyerId: buyer.id,
            productId,
            amountCents: amount,
            status: "PAID",
            vendorEarningsCents: vendorEarnings,
            platformEarningsCents: platformEarnings,
          },
          select: { id: true },
        });

        // Create DL only once
        const existingDl = await tx.downloadLink.findUnique({
          where: { orderId: order.id },
          select: { id: true },
        });

        let createdDl = false;
        if (!existingDl) {
          const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
          await tx.downloadLink.create({
            data: {
              orderId: order.id,
              fileUrl: product.fileUrl,
              expiresAt,
              maxDownloads: 3,
              isActive: true,
            },
          });
          createdDl = true;
        }

        // Resolve vendorProfileId (ensure exists)
        let vendorProfileId = product.vendorProfileId;
        if (!vendorProfileId) {
          const vp = await tx.vendorProfile.upsert({
            where: { userId: product.vendorId },
            create: { userId: product.vendorId },
            update: {},
            select: { id: true },
          });
          vendorProfileId = vp.id;
        }

        // Update counters only once
        if (shouldCountSale && vendorProfileId) {
          const activeProductsCount = await tx.product.count({
            where: { vendorId: product.vendorId, isActive: true, status: "ACTIVE" },
          });

          await tx.vendorProfile.update({
            where: { id: vendorProfileId },
            data: {
              totalSales: { increment: 1 },
              // ✅ Vendor revenue should be vendorEarnings (80%), not gross amount
              totalRevenueCents: { increment: vendorEarnings },
              activeProductsCount,
              lastSaleAt: new Date(),
            },
          });
        }

        return { orderId: order.id, createdDl, shouldCountSale };
      });

      // --- Email idempotency guard (best-effort) ---
      const emailKey = `purchase_email_sent:${stripeSessionId}`;
      const alreadySent = await prisma.auditLog.findFirst({
        where: { action: emailKey },
        select: { id: true },
      });
      if (alreadySent) {
        console.log("📧 purchase email already sent for session:", stripeSessionId);
      }

      // Send confirmation email once (idempotent)
      if (!alreadySent) {
        try {
          const base = process.env.APP_BASE_URL?.replace(/\/+$/, "") ?? "";
          const downloadUrl = base ? `${base}/download/${txResult.orderId}` : `/download/${txResult.orderId}`;
          await sendPurchaseEmail(email, {
            orderId: txResult.orderId,
            productTitle: product.title ?? "Dein Produkt",
            downloadUrl,
            amountCents: amount,
          });
          await prisma.auditLog.create({
            data: {
              actorId: buyer.id,
              action: emailKey,
              targetType: "Order",
              targetId: txResult.orderId,
              meta: { email },
            },
          });
        } catch (e: any) {
          console.error("❌ Failed to send purchase email:", e?.message ?? e);
        }
      }
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
