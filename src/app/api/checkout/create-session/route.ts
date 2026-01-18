// src/app/api/checkout/create-session/route.ts
import { NextRequest, NextResponse } from "next/server";
import type { Session } from "next-auth";
import { requireSessionApi } from "@/lib/guards/authz";
import { prisma } from "@/lib/prisma";
import { isRecord, getString, getErrorMessage } from "@/lib/guards";
import Stripe from "stripe";
import { rateLimitCheck, keyFromReq } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export function GET() {
  return new NextResponse("Method Not Allowed", { status: 405 });
}

export async function POST(_req: NextRequest) {
  // Rate limit: checkout creation per IP
  try {
    const key = keyFromReq(_req, "checkout_create");
    const rl = rateLimitCheck(key, 20, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "TOO_MANY_REQUESTS" }, { status: 429, headers: { "Retry-After": String(rl.retryAfter ?? 60) } });
    }
  } catch (_e: unknown) {
    console.warn("rateLimit check failed for checkout_create", getErrorMessage(_e));
  }
  const sessionOrResp = await requireSessionApi();
  if (sessionOrResp instanceof NextResponse) return sessionOrResp;
  const session = sessionOrResp as Session;
  const user = (session?.user as { id?: string; role?: string } | null) ?? null;
  const userId = user?.id as string | undefined;

  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body: unknown = await _req.json().catch(() => ({}));
  const productId = isRecord(body) ? (getString(body.productId) ?? undefined) : undefined;

  if (!productId) {
    return NextResponse.json({ error: "productId required" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      title: true,
      priceCents: true,
      vendorId: true,
      isActive: true,
      status: true,
      fileUrl: true,
    },
  });

  if (!product || !product.isActive || product.status !== "ACTIVE") {
    return NextResponse.json({ error: "PRODUCT_NOT_AVAILABLE" }, { status: 404 });
  }

  if (!product.fileUrl) {
    return NextResponse.json({ error: "PRODUCT_FILE_MISSING" }, { status: 409 });
  }

  const origin = _req.nextUrl.origin;

  // 1) Checkout Session zuerst erstellen (ohne orderId)
  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "chf",
          unit_amount: product.priceCents,
          product_data: { name: product.title },
        },
      },
    ],
    success_url: `${origin}/download/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/product/${product.id}?canceled=1`,
    metadata: {
      productId: product.id,
      buyerId: userId,
      vendorId: product.vendorId,
    },
  });

  // 2) Order anlegen MIT echter stripeSessionId (unique-safe)
  const order = await prisma.order.create({
    data: {
      buyerId: userId,
      productId: product.id,
      stripeSessionId: checkout.id, // ✅ wichtig
      status: "PENDING",
      amountCents: product.priceCents,
    },
    select: { id: true },
  });

  // 3) Stripe Session metadata nachträglich ergänzen (Webhook braucht orderId)
  await stripe.checkout.sessions.update(checkout.id, {
    metadata: {
      orderId: order.id,
      productId: product.id,
      buyerId: userId,
      vendorId: product.vendorId,
    },
  });

  return NextResponse.json({ url: checkout.url });
}
